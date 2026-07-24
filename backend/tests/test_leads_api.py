"""Backend tests for Cherry Tree Agency lead capture endpoints."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback: read from frontend .env to test the same URL the user sees
    env_path = "/app/frontend/.env"
    with open(env_path) as fh:
        for line in fh:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip()
                break

BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --------------- Health ---------------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert "message" in data
        assert "Cherry Tree" in data["message"]


VALID_PAYLOAD = {
    "owner_name": "TEST_John Smith",
    "company_name": "TEST_Smith Roofing Co.",
    "email": "test_john@example.com",
    "phone": "(555) 123-4567",
    "service_offered": "Roofing",
    "annual_revenue": "$2M – $5M",
    "postal_code": "90210",
    "website": "https://smithroofing.example",
    "notes": "TEST notes",
}


# --------------- Leads: Create / List ---------------
class TestLeads:
    created_id = None

    def test_create_lead_valid(self, client):
        r = client.post(f"{API}/leads", json=VALID_PAYLOAD)
        assert r.status_code == 200, r.text
        data = r.json()
        # Structure & values
        assert "id" in data and isinstance(data["id"], str) and len(data["id"]) > 0
        assert "created_at" in data
        assert data["owner_name"] == VALID_PAYLOAD["owner_name"]
        assert data["company_name"] == VALID_PAYLOAD["company_name"]
        assert data["email"] == VALID_PAYLOAD["email"]
        assert data["phone"] == VALID_PAYLOAD["phone"]
        assert data["service_offered"] == VALID_PAYLOAD["service_offered"]
        assert data["annual_revenue"] == VALID_PAYLOAD["annual_revenue"]
        assert data["postal_code"] == VALID_PAYLOAD["postal_code"]
        assert data["website"] == VALID_PAYLOAD["website"]
        assert data["notes"] == VALID_PAYLOAD["notes"]
        TestLeads.created_id = data["id"]

    def test_create_lead_invalid_email(self, client):
        payload = dict(VALID_PAYLOAD)
        payload["email"] = "not-an-email"
        payload["owner_name"] = "TEST_invalid_email"
        r = client.post(f"{API}/leads", json=payload)
        assert r.status_code == 422, r.text

    def test_create_lead_missing_required(self, client):
        payload = {"owner_name": "TEST_missing"}  # missing many fields
        r = client.post(f"{API}/leads", json=payload)
        assert r.status_code == 422, r.text

    def test_create_lead_missing_single_field(self, client):
        payload = dict(VALID_PAYLOAD)
        payload.pop("phone")  # required
        r = client.post(f"{API}/leads", json=payload)
        assert r.status_code == 422, r.text

    def test_get_leads_contains_created(self, client):
        assert TestLeads.created_id is not None, "Prerequisite create failed"
        r = client.get(f"{API}/leads")
        assert r.status_code == 200
        leads = r.json()
        assert isinstance(leads, list)
        assert len(leads) > 0
        ids = [l["id"] for l in leads]
        assert TestLeads.created_id in ids

        # Verify newest first: created_at should be non-increasing
        timestamps = [l["created_at"] for l in leads]
        assert timestamps == sorted(timestamps, reverse=True), "Leads not sorted newest first"

    def test_create_optional_fields_default(self, client):
        payload = {
            "owner_name": "TEST_optional",
            "company_name": "TEST_Co",
            "email": "test_opt@example.com",
            "phone": "555-0000",
            "service_offered": "HVAC",
            "annual_revenue": "$1M – $2M",
            "postal_code": "12345",
        }
        r = client.post(f"{API}/leads", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["website"] == ""
        assert data["notes"] == ""
        assert data["service_offered"] == "HVAC"
