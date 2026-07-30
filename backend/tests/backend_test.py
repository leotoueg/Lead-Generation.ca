"""Backend tests for Lead-Generation.ca OAuth + booking endpoints (no DB)."""
import os
from urllib.parse import urlparse, parse_qs

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://cherry-tree-agency.preview.emergentagent.com").rstrip("/")
EXPECTED_REDIRECT_URI = "https://cherry-tree-agency.preview.emergentagent.com/api/oauth/calendar/callback"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Root ----------
def test_root(client):
    r = client.get(f"{BASE_URL}/api/")
    assert r.status_code == 200
    assert r.json() == {"message": "Lead-Generation.ca API"}


# ---------- OAuth login redirect ----------
def test_oauth_login_redirect(client):
    r = client.get(f"{BASE_URL}/api/oauth/calendar/login", allow_redirects=False)
    assert 300 <= r.status_code < 400, f"expected 3xx, got {r.status_code}"
    loc = r.headers.get("location", "")
    assert loc.startswith("https://accounts.google.com/o/oauth2/v2/auth"), loc
    parsed = urlparse(loc)
    qs = parse_qs(parsed.query)
    assert qs.get("response_type") == ["code"]
    assert qs.get("client_id") and qs["client_id"][0]
    assert qs.get("redirect_uri") == [EXPECTED_REDIRECT_URI], qs.get("redirect_uri")
    scope = qs.get("scope", [""])[0]
    assert "https://www.googleapis.com/auth/calendar" in scope, scope


# ---------- OAuth status ----------
def test_oauth_status(client):
    r = client.get(f"{BASE_URL}/api/oauth/calendar/status")
    assert r.status_code == 200
    data = r.json()
    assert data == {"configured": True, "connected": False, "token_ok": False}, data


# ---------- Availability ----------
def test_booking_availability(client):
    r = client.get(f"{BASE_URL}/api/booking/availability")
    assert r.status_code == 200
    data = r.json()
    assert "timezone" in data and data["timezone"]
    assert "days" in data and isinstance(data["days"], list)
    assert len(data["days"]) == 4
    for day in data["days"]:
        assert len(day["slots"]) == 3
        times = [s["time"] for s in day["slots"]]
        assert times == ["10:00", "14:00", "16:00"], times
        for s in day["slots"]:
            assert "label" in s and "available" in s
        # weekday must be Mon-Fri
        from datetime import date
        y, mo, d = map(int, day["date"].split("-"))
        assert date(y, mo, d).weekday() < 5


# ---------- Booking creation (503 expected: calendar disconnected) ----------
def _sample_payload(client, offered=True, future=True):
    r = client.get(f"{BASE_URL}/api/booking/availability")
    data = r.json()
    day = data["days"][0]
    slot_time = "10:00" if offered else "11:00"
    slot_date = day["date"] if future else "2020-01-01"
    return {
        "name": "TEST User",
        "email": "test@example.com",
        "company": "TEST Co",
        "phone": "555-0100",
        "service": "SEO",
        "notes": "TEST",
        "date": slot_date,
        "time": slot_time,
    }


def test_booking_valid_slot_returns_503(client):
    payload = _sample_payload(client, offered=True, future=True)
    r = client.post(f"{BASE_URL}/api/booking", json=payload)
    assert r.status_code == 503, (r.status_code, r.text)
    detail = r.json().get("detail", "").lower()
    assert "temporarily unavailable" in detail or "unavailable" in detail


def test_booking_invalid_time_returns_400(client):
    payload = _sample_payload(client, offered=False, future=True)
    r = client.post(f"{BASE_URL}/api/booking", json=payload)
    assert r.status_code == 400, (r.status_code, r.text)


def test_booking_past_date_returns_400(client):
    payload = _sample_payload(client, offered=True, future=False)
    r = client.post(f"{BASE_URL}/api/booking", json=payload)
    assert r.status_code == 400, (r.status_code, r.text)
