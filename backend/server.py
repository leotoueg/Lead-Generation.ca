from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse, HTMLResponse
import os
import asyncio
import logging
import time as _time
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date, time
from zoneinfo import ZoneInfo
from urllib.parse import urlencode
import requests


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------- Booking / Google Calendar configuration ----------
BOOKING_TZ = os.environ.get('BOOKING_TIMEZONE', 'America/Toronto')
SLOT_HOURS = [10, 14, 16]              # 10 AM, 2 PM, 4 PM (business timezone)
BOOKING_MAX_BUSINESS_DAYS = 4          # bookable window: next 4 business days
GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID', 'primary').strip() or 'primary'
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '').strip()
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '').strip()
GOOGLE_REFRESH_TOKEN = os.environ.get('GOOGLE_REFRESH_TOKEN', '').strip()
PUBLIC_BASE_URL = os.environ.get('PUBLIC_BASE_URL', '').strip().rstrip('/')
LEAD_WEBHOOK_URL = os.environ.get('LEAD_WEBHOOK_URL', '').strip()
WEBHOOK_DEBUG = os.environ.get('WEBHOOK_DEBUG', '').lower() in ('1', 'true', 'yes')

GOOGLE_OAUTH_SCOPES = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email"
GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_FREEBUSY_ENDPOINT = "https://www.googleapis.com/calendar/v3/freeBusy"

app = FastAPI(title="Lead-Generation.ca API")
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

# In-memory access-token cache (avoids refreshing on every request)
_token_cache = {"access_token": None, "expiry": 0.0}
# Last webhook attempt (for debugging/verification when WEBHOOK_DEBUG is on)
_last_webhook = {}


# ---------- Models ----------
class BookingCreate(BaseModel):
    name: str
    email: EmailStr
    company: str
    phone: str
    service: str
    notes: Optional[str] = ""
    date: str   # YYYY-MM-DD (business timezone)
    time: str   # HH:MM 24h (business timezone), one of the allowed slots


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    company: str
    phone: str
    service: str
    notes: str = ""
    date: str
    time: str
    timezone: str = BOOKING_TZ
    google_event_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------- Time helpers ----------
def _tz():
    try:
        return ZoneInfo(BOOKING_TZ)
    except Exception:
        return ZoneInfo("America/Toronto")


def _slot_label(hour: int) -> str:
    suffix = "AM" if hour < 12 else "PM"
    h12 = hour % 12 or 12
    return f"{h12}:00 {suffix}"


def _upcoming_business_days() -> List[date]:
    """Next N business days (Mon-Fri) starting tomorrow, in the business timezone."""
    tz = _tz()
    today = datetime.now(tz).date()
    days: List[date] = []
    d = today + timedelta(days=1)
    while len(days) < BOOKING_MAX_BUSINESS_DAYS:
        if d.weekday() < 5:
            days.append(d)
        d += timedelta(days=1)
    return days


def _appt_strings(date_str: str, time_str: str):
    """Return (start_datetime, 'Friday, July 31, 2026', '4:00 PM')."""
    tz = _tz()
    y, mo, d = map(int, date_str.split("-"))
    hh, mm = map(int, time_str.split(":"))
    start = datetime(y, mo, d, hh, mm, tzinfo=tz)
    nice_date = start.strftime("%A, %B %-d, %Y")
    suffix = "AM" if hh < 12 else "PM"
    nice_time = f"{hh % 12 or 12}:{mm:02d} {suffix}"
    return start, nice_date, nice_time


# ---------- CRM webhook (fires first, before the calendar step) ----------
def _webhook_payload(b: "Booking") -> dict:
    start, nice_date, nice_time = _appt_strings(b.date, b.time)
    parts = b.name.strip().split()
    first = parts[0] if parts else b.name
    last = " ".join(parts[1:]) if len(parts) > 1 else ""
    return {
        "first_name": first,
        "last_name": last,
        "full_name": b.name,
        "email": b.email,
        "phone": b.phone,
        "company": b.company,
        "industry": b.service,
        "notes": b.notes or "",
        "appointment_date": nice_date,
        "appointment_time": nice_time,
        "appointment_timezone": BOOKING_TZ,
        "appointment_start_iso": start.isoformat(),
        "appointment_when": f"{nice_date} at {nice_time} ({BOOKING_TZ})",
        "source": "Lead-Generation.ca",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }


def _fire_webhook(payload: dict):
    """Best-effort POST to the CRM webhook. Never blocks the booking on failure."""
    if not LEAD_WEBHOOK_URL:
        _last_webhook.clear()
        _last_webhook.update({"configured": False, "payload": payload})
        return
    try:
        r = requests.post(LEAD_WEBHOOK_URL, json=payload, timeout=10)
        _last_webhook.clear()
        _last_webhook.update({
            "configured": True,
            "status": r.status_code,
            "ok": r.ok,
            "payload": payload,
            "at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as exc:  # noqa: BLE001
        logger.warning("CRM webhook post failed: %s", exc)
        _last_webhook.clear()
        _last_webhook.update({"configured": True, "status": None, "error": str(exc), "payload": payload})


# ---------- Google Calendar (OAuth, refresh-token based, no DB) ----------
def _calendar_ready() -> bool:
    return bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and GOOGLE_REFRESH_TOKEN)


def _oauth_redirect_uri() -> str:
    return f"{PUBLIC_BASE_URL}/api/oauth/calendar/callback"


def _refresh_access_token() -> str:
    resp = requests.post(GOOGLE_TOKEN_ENDPOINT, data={
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": GOOGLE_REFRESH_TOKEN,
        "grant_type": "refresh_token",
    }, timeout=15)
    resp.raise_for_status()
    tok = resp.json()
    _token_cache["access_token"] = tok["access_token"]
    _token_cache["expiry"] = _time.time() + int(tok.get("expires_in", 3600)) - 60
    return _token_cache["access_token"]


def _get_access_token() -> Optional[str]:
    if not _calendar_ready():
        return None
    if _token_cache["access_token"] and _time.time() < _token_cache["expiry"]:
        return _token_cache["access_token"]
    try:
        return _refresh_access_token()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Google token refresh failed: %s", exc)
        return None


def _get_busy(access_token: str, time_min_utc: datetime, time_max_utc: datetime):
    """Return list of (start, end) busy intervals (UTC-aware) from the calendar."""
    resp = requests.post(
        GOOGLE_FREEBUSY_ENDPOINT,
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        json={
            "timeMin": time_min_utc.isoformat(),
            "timeMax": time_max_utc.isoformat(),
            "items": [{"id": GOOGLE_CALENDAR_ID}],
        },
        timeout=15,
    )
    resp.raise_for_status()
    cals = resp.json().get("calendars", {})
    cal = cals.get(GOOGLE_CALENDAR_ID) or (next(iter(cals.values()), {}) if cals else {})
    intervals = []
    for b in cal.get("busy", []):
        intervals.append((
            datetime.fromisoformat(b["start"].replace("Z", "+00:00")),
            datetime.fromisoformat(b["end"].replace("Z", "+00:00")),
        ))
    return intervals


def _overlaps(slot_start: datetime, slot_end: datetime, busy) -> bool:
    return any(slot_start < be and slot_end > bs for bs, be in busy)


def _insert_calendar_event(access_token: str, booking: "Booking") -> Optional[str]:
    hh, mm = map(int, booking.time.split(":"))
    y, mo, d = map(int, booking.date.split("-"))
    tz = _tz()
    start_dt = datetime(y, mo, d, hh, mm, tzinfo=tz)
    end_dt = start_dt + timedelta(hours=1)
    body = {
        "summary": f"Strategy Call — {booking.company}",
        "description": (
            f"Name: {booking.name}\n"
            f"Company: {booking.company}\n"
            f"Email: {booking.email}\n"
            f"Phone: {booking.phone}\n"
            f"Service: {booking.service}\n"
            f"Notes: {booking.notes or '-'}"
        ),
        "start": {"dateTime": start_dt.isoformat(), "timeZone": BOOKING_TZ},
        "end": {"dateTime": end_dt.isoformat(), "timeZone": BOOKING_TZ},
        "attendees": [{"email": booking.email, "displayName": booking.name}],
        "reminders": {"useDefault": True},
    }
    resp = requests.post(
        f"https://www.googleapis.com/calendar/v3/calendars/{GOOGLE_CALENDAR_ID}/events",
        params={"sendUpdates": "all"},
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        json=body,
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("id")


def _slot_bounds_utc(date_str: str, hour: int):
    tz = _tz()
    y, mo, d = map(int, date_str.split("-"))
    start = datetime(y, mo, d, hour, 0, tzinfo=tz)
    end = start + timedelta(hours=1)
    return start.astimezone(timezone.utc), end.astimezone(timezone.utc)


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Lead-Generation.ca API"}


@api_router.get("/booking/availability")
async def booking_availability():
    tz = _tz()
    now = datetime.now(tz)
    days = _upcoming_business_days()

    busy = []
    if _calendar_ready():
        token = await asyncio.to_thread(_get_access_token)
        if token:
            win_start = datetime(days[0].year, days[0].month, days[0].day, 0, 0, tzinfo=tz).astimezone(timezone.utc)
            win_end = datetime(days[-1].year, days[-1].month, days[-1].day, 23, 59, tzinfo=tz).astimezone(timezone.utc)
            try:
                busy = await asyncio.to_thread(_get_busy, token, win_start, win_end)
            except Exception as exc:  # noqa: BLE001
                logger.warning("freeBusy query failed: %s", exc)

    result = []
    for d in days:
        slots = []
        for hour in SLOT_HOURS:
            slot_start = datetime(d.year, d.month, d.day, hour, 0, tzinfo=tz)
            slot_end = slot_start + timedelta(hours=1)
            is_busy = _overlaps(slot_start.astimezone(timezone.utc), slot_end.astimezone(timezone.utc), busy)
            slots.append({
                "time": f"{hour:02d}:00",
                "label": _slot_label(hour),
                "available": slot_start > now and not is_busy,
            })
        result.append({
            "date": d.isoformat(),
            "weekday": d.strftime("%a"),
            "day": d.strftime("%d"),
            "month": d.strftime("%b"),
            "label": d.strftime("%A, %B %-d"),
            "slots": slots,
        })
    return {"timezone": BOOKING_TZ, "days": result}


@api_router.post("/booking", response_model=Booking)
async def create_booking(input: BookingCreate):
    # Validate the requested slot is one we offer and inside the window
    valid_dates = {d.isoformat() for d in _upcoming_business_days()}
    valid_times = {f"{h:02d}:00" for h in SLOT_HOURS}
    if input.date not in valid_dates or input.time not in valid_times:
        raise HTTPException(status_code=400, detail="That time slot is not available.")

    tz = _tz()
    y, mo, d = map(int, input.date.split("-"))
    hh, _mm = map(int, input.time.split(":"))
    if datetime(y, mo, d, hh, 0, tzinfo=tz) <= datetime.now(tz):
        raise HTTPException(status_code=400, detail="That time slot has already passed.")

    booking = Booking(**input.model_dump())

    # Webhook-first: send the lead to the CRM before the calendar step, so the
    # lead is captured even if the Google Calendar API is down or misconfigured.
    await asyncio.to_thread(_fire_webhook, _webhook_payload(booking))

    if not _calendar_ready():
        raise HTTPException(status_code=503, detail="Booking is temporarily unavailable. Please try again shortly.")

    token = await asyncio.to_thread(_get_access_token)
    if not token:
        raise HTTPException(status_code=503, detail="Booking is temporarily unavailable. Please try again shortly.")

    # Re-check the calendar right before booking to prevent overlaps
    start_utc, end_utc = _slot_bounds_utc(input.date, hh)
    try:
        busy = await asyncio.to_thread(_get_busy, token, start_utc, end_utc)
    except Exception as exc:  # noqa: BLE001
        logger.warning("freeBusy recheck failed: %s", exc)
        busy = []
    if _overlaps(start_utc, end_utc, busy):
        raise HTTPException(status_code=409, detail="That time slot was just booked. Please choose another.")

    try:
        booking.google_event_id = await asyncio.to_thread(_insert_calendar_event, token, booking)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Calendar event creation failed: %s", exc)
        raise HTTPException(status_code=502, detail="Couldn't create your booking. Please try again.")

    if not booking.google_event_id:
        raise HTTPException(status_code=502, detail="Couldn't create your booking. Please try again.")
    return booking


@api_router.get("/booking/last-webhook")
async def last_webhook():
    if not WEBHOOK_DEBUG:
        raise HTTPException(status_code=404, detail="Not found")
    return _last_webhook or {"configured": bool(LEAD_WEBHOOK_URL), "note": "no webhook fired yet"}


# ---------- Google Calendar OAuth (owner connects once) ----------
@api_router.get("/oauth/calendar/login")
async def calendar_login():
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and PUBLIC_BASE_URL):
        raise HTTPException(status_code=503, detail="Google Calendar is not configured yet.")
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": _oauth_redirect_uri(),
        "response_type": "code",
        "scope": GOOGLE_OAUTH_SCOPES,
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    return RedirectResponse(f"{GOOGLE_AUTH_ENDPOINT}?{urlencode(params)}")


@api_router.get("/oauth/calendar/callback")
async def calendar_callback(code: Optional[str] = None, error: Optional[str] = None):
    global GOOGLE_REFRESH_TOKEN
    if error or not code:
        return HTMLResponse(f"<h2>Authorization failed.</h2><p>{error or 'No code returned.'}</p>", status_code=400)

    token_resp = await asyncio.to_thread(lambda: requests.post(GOOGLE_TOKEN_ENDPOINT, data={
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": _oauth_redirect_uri(),
        "grant_type": "authorization_code",
    }, timeout=15).json())

    refresh_token = token_resp.get("refresh_token")
    if not refresh_token:
        return HTMLResponse(
            "<div style='font-family:sans-serif;background:#0a0a0a;color:#fff;padding:40px'>"
            "<h2>⚠️ No refresh token returned.</h2>"
            "<p>This usually means the app was already authorized. Go to your Google Account → "
            "Security → Third-party access, remove this app, then try connecting again.</p></div>",
            status_code=400,
        )

    email = None
    try:
        user = await asyncio.to_thread(lambda: requests.get(
            GOOGLE_USERINFO_ENDPOINT,
            headers={"Authorization": f"Bearer {token_resp['access_token']}"}, timeout=15,
        ).json())
        email = user.get("email")
    except Exception:  # noqa: BLE001
        pass

    # Make the running instance work immediately
    GOOGLE_REFRESH_TOKEN = refresh_token
    _token_cache["access_token"] = token_resp.get("access_token")
    _token_cache["expiry"] = _time.time() + int(token_resp.get("expires_in", 3600)) - 60

    return HTMLResponse(
        "<div style='font-family:sans-serif;background:#0a0a0a;color:#fff;padding:48px;max-width:760px;margin:auto'>"
        f"<h2>✅ Google Calendar connected{f' as {email}' if email else ''}</h2>"
        "<p style='opacity:.75'>Copy the refresh token below and add it as an environment variable named "
        "<b>GOOGLE_REFRESH_TOKEN</b> on your server, then redeploy/restart. This keeps you connected permanently "
        "(the site is already working for this session).</p>"
        "<p style='opacity:.75'>GOOGLE_REFRESH_TOKEN =</p>"
        f"<textarea readonly style='width:100%;height:90px;background:#111;color:#0f0;border:1px solid #333;"
        f"border-radius:8px;padding:12px;font-family:monospace'>{refresh_token}</textarea>"
        "<p style='opacity:.5;margin-top:24px'>Keep this value secret — treat it like a password. You can close this tab.</p>"
        "</div>"
    )


@api_router.get("/oauth/calendar/status")
async def calendar_status():
    configured = bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and PUBLIC_BASE_URL)
    connected = _calendar_ready()
    token_ok = False
    if connected:
        token = await asyncio.to_thread(_get_access_token)
        token_ok = bool(token)
    return {"configured": configured, "connected": connected, "token_ok": token_ok}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
