# Rules

## Business Rules

- Idojuan Laundry does not offer pickup or delivery.
- Customers drop off and collect items in-store.
- Prices are split by Male and Female categories.
- Prices are displayed in NGN.
- Public prices are loaded from Supabase.

## Public Website Rules

- Show pricing, estimator, FAQ, directions, hours, phone, WhatsApp, and contact form.
- The estimator must reuse already-loaded price data and make no extra API call.
- Contact submissions go to `/api/contact`.
- Public form data must be rendered safely with `textContent` if displayed later.

## Admin Rules

- Admin pages require Supabase Auth plus `users.role = 'admin'`.
- Public signup is disabled.
- Admins can add/delete prices and read/delete messages.
- Clear-all actions require confirmation.
- New admins are created only through OTP invitation.

## OTP Rules

- Only an existing admin can request an invite.
- OTP is 6 numeric digits, generated server-side with secure randomness.
- OTP is stored only as salted hash.
- OTP expires after 10 minutes.
- OTP is single-use.
- OTP locks after 5 verification attempts.
- Invite requests are rate-limited per admin and candidate email.
- Verify requests are rate-limited per OTP and IP.
- OTP and service keys never go to browser code.

## Netlify Rules

- `netlify.toml` maps `/api/contact`, `/api/admin-invite-request`, and `/api/admin-invite-verify` to edge functions.
- Required environment variables are documented in `.env.example`.
- Run `scripts/supabase-security.sql` before deploying.
