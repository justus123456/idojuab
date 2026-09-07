# Architecture

## Overview

Idojuan Laundry is a static laundry and dry cleaning website with a small admin dashboard. Supabase provides authentication and database storage. Netlify is the primary host and Netlify Edge Functions provide the deployed APIs.

The business has no pickup or delivery fleet. The public website is therefore built around reducing friction before an in-store visit: pricing, cost estimation, opening status, directions, phone/WhatsApp contact, FAQ, and contact messages.

Companion documents:

- `design.md`: visual and interaction rules.
- `prd.md`: product requirements.
- `rules.md`: business, security, and implementation rules.
- `schema.md`: expected Supabase schema.
- `security.md`: threat model and mitigations.
- `admin-provisioning.md`: OTP admin creation flow.

## Main Components

### Public Website

- `index.html`: public page with home, about, system, pricing, FAQ, and contact sections.
- `laundry.js`: sticky header, open/closed status, price polling, price estimator, FAQ accordion, contact form, copy address, WhatsApp estimate, and scroll-to-top behavior.
- `css/laundry.css`: public styling and responsive rules.
- Prices load from Supabase `prices` every 5 seconds.
- Contact messages submit to `POST /api/contact`.

### Admin Dashboard

- `admin.html`: admin dashboard for prices, messages, and admin invites.
- `admin.js`: requires Supabase session and `users.role = 'admin'`, then manages price/message actions and invite requests.
- `css/admin.css`: admin layout and invite feedback styles.

### Admin Provisioning

- `admin-invite.html` / `admin-invite.js`: admin-only invitation page.
- `admin-onboarding.html` / `admin-onboarding.js`: candidate OTP/password setup page.
- `netlify/edge-functions/admin-invite-request.js`: authenticated admin invite endpoint.
- `netlify/edge-functions/admin-invite-verify.js`: OTP verification and admin creation endpoint.
- `netlify/edge-functions/admin-invite-shared.js`: shared Supabase, OTP, audit, and email helpers.

### Netlify APIs

- `/api/contact`: validates and stores customer messages with durable rate limiting.
- `/api/admin-invite-request`: verifies caller admin status, rate-limits invite requests, hashes OTP, stores invite state, and emails the OTP.
- `/api/admin-invite-verify`: validates OTP/password, enforces attempt limits, creates the Supabase Auth user and `users` admin row, marks OTP used, and writes audit logs.

## Deployment

`netlify.toml` publishes the project root and maps all three API routes to Netlify Edge Functions. Required Netlify environment variables are listed in `.env.example`.

## In-Store Operations Extension

The application now supports customer records, walk-in orders, ticket numbers, item quantities, calculated subtotals/discounts/totals, payment balances, processing statuses, expected collection dates, and collection confirmation. Customers can check a ticket through `GET /api/order-status?ticket=...`; the endpoint exposes status and balance only and never exposes private customer fields.

Admins can search customers and orders, change order status, copy a ready-for-collection WhatsApp message, mark messages as replied, export prices/messages/orders as CSV, manage public hours/payment instructions/FAQs, and review an audit log. This remains an in-store workflow and does not imply pickup or delivery.