# Product Requirements Document

## Purpose

The site helps customers understand Idojuan Laundry services, estimate costs before visiting, get directions, and contact the business. It helps admins manage prices/messages and invite new admins securely.

## Operating Constraint

No pickup or delivery is offered. The product must support in-store drop-off and collection only.

## Public Requirements

- Public landing page with business description.
- Dynamic male/female price tables from Supabase.
- Client-side price estimator.
- WhatsApp CTA and estimate sharing.
- Tap-to-call phone links.
- Google Maps embed and Get Directions link.
- FAQ section answering common visit questions.
- Open/closed status from static hours.
- Contact form submitting to Netlify `/api/contact`.

## Admin Requirements

- Login through Supabase Auth.
- Role check through `public.users.role = 'admin'`.
- Add male/female price rows.
- Delete individual price rows.
- Clear price/message tables only after confirmation.
- View and delete contact messages.
- Invite new admins through OTP email flow.

## API Requirements

- `POST /api/contact`: validate, rate-limit, and store messages.
- `POST /api/admin-invite-request`: admin-only invite creation and OTP email.
- `POST /api/admin-invite-verify`: OTP verification and admin account creation.

## Success Metrics

- Customers can estimate cost and find the shop without contacting staff.
- Messages are stored successfully.
- Admins can manage prices without code changes.
- New admins cannot be created outside the OTP flow.
- RLS prevents public access to private tables.

## In-Store Operations Extension

The application now supports customer records, walk-in orders, ticket numbers, item quantities, calculated subtotals/discounts/totals, payment balances, processing statuses, expected collection dates, and collection confirmation. Customers can check a ticket through `GET /api/order-status?ticket=...`; the endpoint exposes status and balance only and never exposes private customer fields.

Admins can search customers and orders, change order status, copy a ready-for-collection WhatsApp message, mark messages as replied, export prices/messages/orders as CSV, manage public hours/payment instructions/FAQs, and review an audit log. This remains an in-store workflow and does not imply pickup or delivery.