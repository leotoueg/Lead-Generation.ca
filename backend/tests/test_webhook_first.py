"""Tests for CRM webhook-first booking flow on Lead-Generation.ca."""
import os
import re
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://cherry-tree-agency.preview.emergentagent.com").rstrip("/")


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def availability(api):
    r = api.get(f"{BASE_URL}/api/booking/availability")
    assert r.status_code == 200, r.text
    return r.json()


# ---------- Sanity ----------
class TestSanity:
    def test_root(self, api):
        r = api.get(f"{BASE_URL}/api/")
        assert r.status_code == 200
        assert r.json() == {"message": "Lead-Generation.ca API"}

    def test_availability_shape(self, availability):
        assert availability.get("timezone") == "America/Toronto"
        days = availability.get("days", [])
        assert len(days) == 4, f"expected 4 business days, got {len(days)}"
        for d in days:
            assert len(d["slots"]) == 3
            times = [s["time"] for s in d["slots"]]
            assert times == ["10:00", "14:00", "16:00"]

    def test_calendar_status_configured(self, api):
        r = api.get(f"{BASE_URL}/api/oauth/calendar/status")
        assert r.status_code == 200
        data = r.json()
        assert data.get("configured") is True, data


# ---------- Webhook-first flow ----------
class TestWebhookFirst:
    def _first_available_date(self, availability):
        for d in availability["days"]:
            slot = next((s for s in d["slots"] if s["time"] == "14:00" and s["available"]), None)
            if slot:
                return d["date"]
        # fallback: first day even if unavailable to still test ordering
        return availability["days"][0]["date"]

    def test_booking_returns_503_and_webhook_fired_first(self, api, availability):
        booking_date = self._first_available_date(availability)
        payload = {
            "name": "Marcus Bennett",
            "email": "marcus@bennettroofing.com",
            "company": "Bennett Roofing Co.",
            "phone": "6475550142",
            "service": "Roofing",
            "notes": "qa",
            "date": booking_date,
            "time": "14:00",
        }
        r = api.post(f"{BASE_URL}/api/booking", json=payload)
        assert r.status_code == 503, f"expected 503 (calendar not connected preview), got {r.status_code}: {r.text}"

        # Immediately fetch last webhook
        rw = api.get(f"{BASE_URL}/api/booking/last-webhook")
        assert rw.status_code == 200, rw.text
        data = rw.json()
        assert data.get("configured") is True
        assert data.get("status") == 200
        assert data.get("ok") is True
        assert "payload" in data and isinstance(data["payload"], dict)

        p = data["payload"]
        # Field formatting
        assert p["first_name"] == "Marcus"
        assert p["last_name"] == "Bennett"
        assert p["full_name"] == "Marcus Bennett"
        assert p["email"] == "marcus@bennettroofing.com"
        assert p["phone"] == "6475550142"
        assert p["company"] == "Bennett Roofing Co."
        assert p["industry"] == "Roofing"
        assert p["notes"] == "qa"
        assert p["appointment_timezone"] == "America/Toronto"
        assert p["source"] == "Lead-Generation.ca"
        assert "submitted_at" in p and "T" in p["submitted_at"]

        # Human-readable date like "Thursday, July 30, 2026"
        assert re.match(r"^[A-Z][a-z]+day, [A-Z][a-z]+ \d{1,2}, \d{4}$", p["appointment_date"]), p["appointment_date"]
        # Time like "2:00 PM"
        assert p["appointment_time"] == "2:00 PM", p["appointment_time"]
        # ISO with -04:00 or -05:00 offset (Toronto)
        assert re.search(r"[-+]\d{2}:\d{2}$", p["appointment_start_iso"]), p["appointment_start_iso"]
        assert p["appointment_start_iso"].startswith(booking_date + "T14:00:00")
        # combined "when" string
        assert p["appointment_when"] == f"{p['appointment_date']} at {p['appointment_time']} (America/Toronto)"


# ---------- Validation before webhook ----------
class TestValidationBeforeWebhook:
    def test_invalid_time_returns_400_and_does_not_fire_webhook(self, api, availability):
        # First do a valid booking to record a known last-webhook state
        booking_date = availability["days"][0]["date"]
        good = {
            "name": "Sentinel User",
            "email": "sentinel@example.com",
            "company": "Sentinel Co",
            "phone": "6475550000",
            "service": "Marker",
            "notes": "marker",
            "date": booking_date,
            "time": "14:00",
        }
        api.post(f"{BASE_URL}/api/booking", json=good)  # 503 expected, records webhook
        before = api.get(f"{BASE_URL}/api/booking/last-webhook").json()
        assert before.get("payload", {}).get("industry") == "Marker"

        # Now invalid time
        bad = dict(good, time="11:30", service="ShouldNotFire")
        r = api.post(f"{BASE_URL}/api/booking", json=bad)
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text}"

        after = api.get(f"{BASE_URL}/api/booking/last-webhook").json()
        # last_webhook should be unchanged (still marker)
        assert after.get("payload", {}).get("industry") == "Marker", (
            "webhook fired for invalid slot — validation should happen BEFORE webhook"
        )

    def test_invalid_date_returns_400(self, api):
        payload = {
            "name": "Past Person",
            "email": "past@example.com",
            "company": "Past Co",
            "phone": "0000000000",
            "service": "X",
            "notes": "",
            "date": "2000-01-03",  # far past
            "time": "14:00",
        }
        r = requests.post(f"{BASE_URL}/api/booking", json=payload)
        assert r.status_code == 400, r.text


# ---------- last-webhook endpoint ----------
class TestLastWebhookEndpoint:
    def test_last_webhook_available_because_debug_on(self, api):
        r = api.get(f"{BASE_URL}/api/booking/last-webhook")
        assert r.status_code == 200, r.text
