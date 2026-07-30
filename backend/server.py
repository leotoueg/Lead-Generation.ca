from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse, HTMLResponse
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta, date, time
from zoneinfo import ZoneInfo
import requests


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Optional outbound webhook for lead notifications (configured later by owner)
LEAD_WEBHOOK_URL = os.environ.get('LEAD_WEBHOOK_URL', '').strip()

# ---------- Booking configuration ----------
BOOKING_TZ = os.environ.get('BOOKING_TIMEZONE', 'America/Toronto')
SLOT_HOURS = [10, 14, 16]            # 10 AM, 2 PM, 4 PM
BOOKING_MAX_BUSINESS_DAYS = 4         # bookable up to 4 business days ahead
GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID', 'primary').strip() or 'primary'
GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '').strip()
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET', '').strip()
PUBLIC_BASE_URL = os.environ.get('PUBLIC_BASE_URL', '').strip().rstrip('/')
GOOGLE_OAUTH_SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email"
GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v2/userinfo"


def _oauth_redirect_uri() -> str:
    return f"{PUBLIC_BASE_URL}/api/oauth/calendar/callback"

# Create the main app without a prefix
app = FastAPI(title="Cherry Tree Agency API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class LeadCreate(BaseModel):
    owner_name: str
    company_name: str
    email: EmailStr
    phone: str
    service_offered: str
    annual_revenue: str
    postal_code: str
    website: Optional[str] = ""
    notes: Optional[str] = ""


class Lead(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_name: str
    company_name: str
    email: str
    phone: str
    service_offered: str
    annual_revenue: str
    postal_code: str
    website: str = ""
    notes: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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


# ---------- Helpers ----------
def _forward_to_webhook(payload: dict):
    """Fire-and-forget forward of a lead to the configured webhook URL."""
    if not LEAD_WEBHOOK_URL:
        return
    try:
        requests.post(LEAD_WEBHOOK_URL, json=payload, timeout=8)
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).warning("Webhook forward failed: %s", exc)


# ---------- Booking helpers ----------
def _slot_label(hour: int) -> str:
    dt = time(hour, 0)
    suffix = "AM" if hour < 12 else "PM"
    h12 = hour % 12 or 12
    return f"{h12}:00 {suffix}"


def _tz():
    try:
        return ZoneInfo(BOOKING_TZ)
    except Exception:
        return ZoneInfo("America/Toronto")


def _upcoming_business_days() -> List[date]:
    """Next N business days (Mon-Fri) starting tomorrow, in the business timezone."""
    tz = _tz()
    today = datetime.now(tz).date()
    days: List[date] = []
    d = today + timedelta(days=1)
    while len(days) < BOOKING_MAX_BUSINESS_DAYS:
        if d.weekday() < 5:  # Mon=0 ... Fri=4
            days.append(d)
        d += timedelta(days=1)
    return days


async def _booked_set(date_strs: List[str]) -> set:
    docs = await db.bookings.find(
        {"date": {"$in": date_strs}}, {"_id": 0, "date": 1, "time": 1}
    ).to_list(1000)
    return {(doc["date"], doc["time"]) for doc in docs}


async def _get_stored_tokens() -> Optional[dict]:
    return await db.oauth_tokens.find_one({"provider": "google_calendar"}, {"_id": 0})


async def _save_tokens(data: dict):
    data["provider"] = "google_calendar"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.oauth_tokens.update_one(
        {"provider": "google_calendar"}, {"$set": data}, upsert=True
    )


def _refresh_access_token(refresh_token: str) -> dict:
    """Exchange a refresh token for a new access token (sync)."""
    resp = requests.post(GOOGLE_TOKEN_ENDPOINT, data={
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }, timeout=15)
    resp.raise_for_status()
    return resp.json()


async def _get_valid_access_token() -> Optional[str]:
    """Return a fresh access token for the connected Google account, or None."""
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET):
        return None
    tokens = await _get_stored_tokens()
    if not tokens or not tokens.get("refresh_token"):
        return None

    expiry = tokens.get("expiry")
    now = datetime.now(timezone.utc)
    if expiry:
        try:
            exp_dt = datetime.fromisoformat(expiry)
            if exp_dt > now + timedelta(seconds=60) and tokens.get("access_token"):
                return tokens["access_token"]
        except Exception:  # noqa: BLE001
            pass

    # refresh
    try:
        new_tok = await asyncio.to_thread(_refresh_access_token, tokens["refresh_token"])
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).warning("Token refresh failed: %s", exc)
        return None

    access_token = new_tok.get("access_token")
    expires_in = int(new_tok.get("expires_in", 3600))
    await _save_tokens({
        "access_token": access_token,
        "expiry": (now + timedelta(seconds=expires_in)).isoformat(),
        # keep existing refresh_token; Google may not resend it
        "refresh_token": new_tok.get("refresh_token", tokens["refresh_token"]),
    })
    return access_token


def _insert_calendar_event(access_token: str, booking: "Booking") -> Optional[str]:
    """Create the event via the Calendar REST API with attendee + invite (sync)."""
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


async def _create_google_event(booking: "Booking") -> Optional[str]:
    """Create a calendar event for a booking, or None if not connected / on failure."""
    access_token = await _get_valid_access_token()
    if not access_token:
        return None
    try:
        return await asyncio.to_thread(_insert_calendar_event, access_token, booking)
    except Exception as exc:  # noqa: BLE001
        logging.getLogger(__name__).warning("Google Calendar event creation failed: %s", exc)
        return None


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Cherry Tree Agency API"}


@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_obj = StatusCheck(**input.model_dump())
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.status_checks.insert_one(doc)
    return status_obj


@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


@api_router.post("/leads", response_model=Lead)
async def create_lead(input: LeadCreate):
    lead = Lead(**input.model_dump())
    doc = lead.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.leads.insert_one(doc)

    # Forward to owner's webhook without blocking the response
    if LEAD_WEBHOOK_URL:
        asyncio.create_task(asyncio.to_thread(_forward_to_webhook, doc))

    return lead


@api_router.get("/leads", response_model=List[Lead])
async def get_leads():
    leads = await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for lead in leads:
        if isinstance(lead['created_at'], str):
            lead['created_at'] = datetime.fromisoformat(lead['created_at'])
    return leads


@api_router.get("/booking/availability")
async def booking_availability():
    tz = _tz()
    now = datetime.now(tz)
    days = _upcoming_business_days()
    date_strs = [d.isoformat() for d in days]
    booked = await _booked_set(date_strs)

    result = []
    for d in days:
        slots = []
        for hour in SLOT_HOURS:
            slot_dt = datetime(d.year, d.month, d.day, hour, 0, tzinfo=tz)
            key = (d.isoformat(), f"{hour:02d}:00")
            available = slot_dt > now and key not in booked
            slots.append({
                "time": f"{hour:02d}:00",
                "label": _slot_label(hour),
                "available": available,
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
    # Validate the slot is one we offer and within the bookable window
    valid_dates = {d.isoformat() for d in _upcoming_business_days()}
    valid_times = {f"{h:02d}:00" for h in SLOT_HOURS}
    if input.date not in valid_dates or input.time not in valid_times:
        raise HTTPException(status_code=400, detail="That time slot is not available.")

    tz = _tz()
    y, mo, d = map(int, input.date.split("-"))
    hh, _ = map(int, input.time.split(":"))
    if datetime(y, mo, d, hh, 0, tzinfo=tz) <= datetime.now(tz):
        raise HTTPException(status_code=400, detail="That time slot has already passed.")

    # Prevent double booking
    existing = await db.bookings.find_one({"date": input.date, "time": input.time})
    if existing:
        raise HTTPException(status_code=409, detail="That time slot was just booked. Please choose another.")

    booking = Booking(**input.model_dump())
    booking.google_event_id = await _create_google_event(booking)

    doc = booking.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.bookings.insert_one(doc)
    return booking


@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for b in bookings:
        if isinstance(b['created_at'], str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
    return bookings


# ---------- Google Calendar OAuth (owner connects once) ----------
@api_router.get("/oauth/calendar/login")
async def calendar_login():
    if not (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and PUBLIC_BASE_URL):
        raise HTTPException(status_code=503, detail="Google Calendar is not configured yet.")
    from urllib.parse import urlencode
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
    if error or not code:
        return HTMLResponse(f"<h2>Google authorization failed.</h2><p>{error or 'No code returned.'}</p>", status_code=400)

    token_resp = await asyncio.to_thread(lambda: requests.post(GOOGLE_TOKEN_ENDPOINT, data={
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": _oauth_redirect_uri(),
        "grant_type": "authorization_code",
    }, timeout=15).json())

    if "access_token" not in token_resp:
        return HTMLResponse(f"<h2>Token exchange failed.</h2><pre>{json.dumps(token_resp)}</pre>", status_code=400)

    # Identify the connected account
    email = None
    try:
        user = await asyncio.to_thread(lambda: requests.get(
            GOOGLE_USERINFO_ENDPOINT,
            headers={"Authorization": f"Bearer {token_resp['access_token']}"}, timeout=15,
        ).json())
        email = user.get("email")
    except Exception:  # noqa: BLE001
        pass

    expires_in = int(token_resp.get("expires_in", 3600))
    save = {
        "access_token": token_resp["access_token"],
        "expiry": (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat(),
        "scope": token_resp.get("scope", GOOGLE_OAUTH_SCOPES),
        "email": email,
    }
    if token_resp.get("refresh_token"):
        save["refresh_token"] = token_resp["refresh_token"]
    await _save_tokens(save)

    return HTMLResponse(
        f"<div style='font-family:sans-serif;background:#0a0a0a;color:#fff;padding:48px;text-align:center'>"
        f"<h2>✅ Google Calendar connected{f' as {email}' if email else ''}</h2>"
        f"<p style='opacity:.7'>Bookings will now be created on your calendar with invites sent to prospects. You can close this tab.</p>"
        f"</div>"
    )


@api_router.get("/oauth/calendar/status")
async def calendar_status():
    tokens = await _get_stored_tokens()
    configured = bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET and PUBLIC_BASE_URL)
    return {
        "configured": configured,
        "connected": bool(tokens and tokens.get("refresh_token")),
        "email": tokens.get("email") if tokens else None,
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
