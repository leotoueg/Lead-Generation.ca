# Cherry Tree Agency — Product Requirements (PRD)

## Original Problem Statement
Build an extremely high-converting, premium landing page for Cherry Tree Agency — a done-for-you marketing agency for established contractors ($1M+ revenue). Goal: get qualified contractors to watch the VSL and book a strategy call. Aesthetic between Apple/Stripe/Linear/Vercel and a high-end consulting firm. Copy: Alex Hormozi meets Apple.

## Brand & Design (as built)
- Dark / near-black (#050505) background, royal blue (#2C5CE5) + cyan (#00E5FF) accent (matches user's real logo/brand — overrode the brief's "cherry red").
- Display: Anton (bold condensed uppercase). Body: Manrope.
- Transparent logo generated from uploaded asset at `/public/cherrytree-logo.png`.
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
- P1: Wire the real webhook URL (`LEAD_WEBHOOK_URL` in backend/.env) once owner provides it.
- P1: Replace placeholder VSL + testimonial videos with real YouTube/Vimeo IDs.
- P2: Optional email notification on new lead (Resend integration).
- P2: Simple admin view for leads; production CORS hardening; tighten field validation.
