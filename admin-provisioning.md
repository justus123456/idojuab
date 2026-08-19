# Admin Provisioning: OTP-Based Account Creation

## Purpose

Admin accounts are created through a rate-limited OTP invitation flow initiated by an existing admin. Public signup remains disabled.

## Flow

1. Existing admin opens `admin-invite.html` or the Invite panel in `admin.html`.
2. Admin submits the candidate email.
3. `/api/admin-invite-request` verifies the admin session and role.
4. The endpoint rate-limits the request, invalidates prior unused OTPs for the candidate, generates a 6-digit OTP, hashes it with a salt and server pepper, stores it in `admin_otp_requests`, and sends the OTP email.
5. Candidate opens `admin-onboarding.html`, enters email, OTP, and password.
6. `/api/admin-invite-verify` validates the OTP, expiry, attempt count, and password strength.
7. On success it creates the Supabase Auth user, inserts `public.users.role = 'admin'`, marks the OTP used, and writes an audit row.

## Required Netlify Variables

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OTP_PEPPER`
- `RATE_LIMIT_PEPPER`
- `RESEND_API_KEY` for real email delivery
- `OTP_EMAIL_FROM`
- `URL`

If `RESEND_API_KEY` is missing, the OTP is written to Netlify function logs for testing only.

## Rate Limits

- 5 invite requests per inviting admin per hour.
- 3 invite requests per candidate email per 24 hours.
- 5 verification attempts per OTP.
- 10 verification attempts per IP per hour.

## Rollout Checklist

- [ ] Run `scripts/supabase-security.sql` in Supabase.
- [ ] Set Netlify environment variables.
- [ ] Configure the email sender/provider.
- [ ] Create or confirm the first existing admin manually as a one-time bootstrap step.
- [ ] Deploy to Netlify and test invite request and onboarding.
