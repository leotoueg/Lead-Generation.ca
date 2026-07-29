from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
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
GOOGLE_CALENDAR_ID = os.environ.get('GOOGLE_CALENDAR_ID', '').strip()
GOOGLE_SERVICE_ACCOUNT_JSON = os.environ.get('GOOGLE_SERVICE_ACCOUNT_JSON', '').strip()

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


def _create_google_event(booking: "Booking") -> Optional[str]:
    """Create an event in the owner's Google Calendar via a service account.
    Returns the event id, or None if not configured / on failure."""
    if not (GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_CALENDAR_ID):
        return None
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build

        info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/calendar"]
        )
        service = build("calendar", "v3", credentials=creds, cache_discovery=False)

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
        }
        event = service.events().insert(calendarId=GOOGLE_CALENDAR_ID, body=body).execute()
        return event.get("id")
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
    booking.google_event_id = await asyncio.to_thread(_create_google_event, booking)

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
