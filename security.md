# Security

## High-Priority Controls

- Service role keys are server-side only in Netlify environment variables.
- Browser code only uses the Supabase anon key.
- Supabase RLS is enabled on `prices`, `messages`, `users`, `admin_otp_requests`, `admin_invite_audit`, and `contact_rate_limits`.
- `admin_otp_requests` and `contact_rate_limits` have no anon/authenticated policies; only service-role edge functions access them.
- Admin access requires Supabase Auth plus `public.users.role = 'admin'`.
- Public admin signup is disabled.
- OTPs are stored as salted hashes, never plaintext.
- OTPs expire after 10 minutes and lock after 5 attempts.
- Contact and OTP endpoints use server-side rate limiting.
- User-generated content is rendered with `textContent`, not unsanitized `innerHTML`.

## Main Risks

- RLS drift could expose tables through the public anon key.
- A leaked service role key bypasses all RLS.
- A weak OTP flow could create unauthorized admins.
- In-memory serverless rate limits reset on cold starts, so durable Supabase-backed logs are used.
- CDN scripts should remain pinned and protected with SRI where available.

## Deployment Notes

Run `scripts/supabase-security.sql` before deploying the OTP flow. Confirm Netlify environment variables are configured before testing `/api/contact`, `/api/admin-invite-request`, or `/api/admin-invite-verify`.
