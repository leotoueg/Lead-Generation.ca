# Lead-Generation.ca — Product Requirements (PRD)

## Original Problem Statement
Build an extremely high-converting, premium landing page for a done-for-you marketing agency serving established contractors ($1M+ revenue). Goal: get qualified contractors to watch the VSL and book a strategy call. Aesthetic between Apple/Stripe/Linear/Vercel. (Originally branded "Cherry Tree Agency"; rebranded to Lead-Generation.ca on 2026-06.)

## Brand & Design (as built)
- Dark / near-black (#050505) background. Monochrome premium palette: white wordmark logo, white→silver (#c2c6cd) gradient CTAs with black text, white/silver icons & accents. (Rebranded from royal-blue #285EE0 to black/white per owner's brand.)
- Display: CocoGoose Pro (local `/public/fonts/`). Body: Poppins (Google Fonts).
- White transparent wordmark logo at `/public/logo-white.png` (generated via PIL from owner's black-on-white upload).
- Offer: done-for-you paid ads, filmed ad creative, CRM automation, sales systems. NO organic social media management.
- Motion: framer-motion scroll reveals + micro-interactions, lenis smooth scroll, masked line-by-line hero reveal, parallax VSL, marquee trust bar.

## Architecture
- Frontend: React (CRA/craco), Tailwind, framer-motion, lenis, shadcn/ui. Components in `/app/frontend/src/components/site/`.
- Backend: FastAPI + MongoDB (motor). Routes prefixed `/api`.
- Lead flow: `POST /api/leads` stores in Mongo `leads` and (optionally) forwards to `LEAD_WEBHOOK_URL` env (currently empty — owner sets later). `GET /api/leads` lists.

## Implemented (2026-07-24)
- Hero w/ kinetic masked headline, VSL (lazy YouTube embed), dual CTAs, social proof row.
- Trust bar marquee, Why We're Different, 6-step Process timeline, 4 Video Testimonials w/ modal, 12-item Feature grid, Who This Is For, FAQ accordion, Appointment form (9 fields), Footer, mobile sticky CTA.
- Backend leads endpoint + optional webhook forwarding. SEO meta tags.
- Tested end-to-end: backend 100%, frontend 100% (iteration_1).

## Personas
- Established contractor owners ($1M–$25M+) in roofing, remodeling, HVAC, concrete, landscaping, etc., who want more profitable jobs without managing marketing themselves.

## Backlog / Next
- 2026-06: **Architecture change — booking is now calendar-as-truth, NO database.** Removed all MongoDB usage from backend. `GET /api/booking/availability` reads live Google Calendar free/busy (freeBusy API) and marks fixed slots (10/14/16, Mon–Fri, next 4 business days, America/Toronto) unavailable if busy or past. `POST /api/booking` re-checks free/busy then creates the event with attendee + `sendUpdates=all`. No bookings/leads/tokens stored in Mongo. Refresh token stored in env var `GOOGLE_REFRESH_TOKEN` (not DB); OAuth callback displays it for the owner to paste into env. If not connected: availability shows all slots open, booking returns 503. Endpoints: `/api/oauth/calendar/login|callback|status`.
- Deployment: backend → **Render** (see `/app/RENDER_DEPLOY.md` + `/app/render.yaml` Blueprint; no DB step). Frontend → Vercel with `REACT_APP_BACKEND_URL` = Render URL. Owner must connect calendar once and set `GOOGLE_REFRESH_TOKEN`. Update Google OAuth redirect URI + `PUBLIC_BASE_URL` per environment.
- 2026-06: Rebranded to Lead-Generation.ca — white wordmark logo, full monochrome (black/white/silver) redesign, updated SEO/footer, removed "organic social" copy.
- 2026-06: Industries set to Roofing / Bathroom Remodeling / Kitchen Remodeling / General Contractors (hero, booking form, FAQ). "Facebook Ads"→"Meta Ads"; added "YouTube Ads" to trust bar marquee.
- 2026-06: Testimonials now real videos via `VideoPlayer` (supports youtube|loom|vimeo|mp4). Live: Stephen Cruey (Loom), Clint Roberts/Prime Baths NM (mp4 at /public/testimonials/clint.mp4 + clint.jpg poster), Emilio Talavera/Roofing Monkeys (Vimeo 1214123088).
- 2026-06: Replaced lead form with custom sleek **BookingCalendar** (id="apply", all CTAs point here). Rules: 60-min slots at 10:00/14:00/16:00, Mon–Fri, next 4 business days, tz America/Toronto. Backend `/api/booking/availability`, `POST /api/booking` (double-booking prevention, slot validation), `GET /api/bookings`.
- 2026-06: Google Calendar via **OAuth** (owner one-time connect). Endpoints: `/api/oauth/calendar/login|callback|status`. Tokens stored in `db.oauth_tokens` (provider=google_calendar) with auto-refresh. On booking, creates event on GOOGLE_CALENDAR_ID (primary) with attendee + `sendUpdates=all` (Google invite emailed). Creds in backend/.env: GOOGLE_CLIENT_ID/SECRET, PUBLIC_BASE_URL, BOOKING_TIMEZONE. OWNER MUST VISIT /api/oauth/calendar/login ONCE to connect (toueg.leo@gmail.com).
- P1: On deploy, add production redirect URI in Google console + update PUBLIC_BASE_URL.
- 2026-06: Fixed production black-screen crash — `avail.days.find(...)` ran on undefined when a frontend-only deploy served the SPA HTML for `/api` calls (200, no `days`). Hardened all `.find/.map/.some` in BookingCalendar with `Array.isArray`/`?? []` guards; added `ErrorBoundary` (src/components/ErrorBoundary.jsx) wrapping `<App/>` in index.js so no single runtime error blacks out the site. Verified by testing_agent (iteration_2, 100% frontend) at desktop + 435px mobile, zero console errors. Prod build compiles clean.
- P2: Optional confirmation/notification emails on booking (Resend).
- P2: Simple admin view for bookings/leads; production CORS hardening.
