# Schema

## Database Provider

Supabase Postgres stores application data. Supabase Auth stores login accounts.

## Tables

- `public.prices`: public price list rows.
- `public.messages`: customer contact messages.
- `public.users`: app profile and role records for Supabase Auth users.
- `public.admin_otp_requests`: service-role-only OTP invite state.
- `public.admin_invite_audit`: invite/audit events, admin-readable.
- `public.contact_rate_limits`: service-role-only contact rate-limit events.

Run `scripts/supabase-security.sql` in Supabase to create/update these tables and RLS policies.

## `public.prices`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint identity | Primary key. |
| `cloth_type` | text | Clothing item name. |
| `ironing_price` | numeric | NGN ironing price, must be >= 0. |
| `washing_price` | numeric | NGN washing price, must be >= 0. |
| `gender` | text | `Male` or `Female`. |
| `created_at` | timestamptz | Defaults to `now()`. |

## `public.messages`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint identity | Primary key. |
| `name` | text | Customer name, max 80 characters. |
| `email` | text | Customer email, max 120 characters. |
| `message` | text | Customer message, max 2000 characters. |
| `created_at` | timestamptz | Defaults to `now()`. |

## `public.users`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint identity | Existing profile identifier. Admin authorization matches the profile email to Supabase Auth. |
| `username` | text | Optional display name. |
| `email` | text | Unique; must match Supabase Auth email. |
| `role` | text | `admin` or `user`. |
| `created_via` | text | `otp_invite` for OTP-created admins. |
| `invited_by` | uuid | Existing admin who invited the user. |
| `created_at` | timestamptz | Defaults to `now()`. |

## `public.admin_otp_requests`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, defaults to `gen_random_uuid()`. |
| `candidate_email` | text | Lowercased invited email. |
| `otp_hash` | text | SHA-256 hash of email, OTP, salt, and server pepper. |
| `otp_salt` | text | Random salt used for OTP hash. |
| `invited_by` | uuid | Inviting admin user id. |
| `attempts` | integer | Defaults to 0. |
| `max_attempts` | integer | Defaults to 5. |
| `expires_at` | timestamptz | 10 minutes after issue. |
| `used_at` | timestamptz | Set after successful verification. |
| `invalidated_at` | timestamptz | Set when superseded or locked. |
| `requested_ip` | text | Invite request IP. |
| `created_at` | timestamptz | Defaults to `now()`. |

## `public.admin_invite_audit`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint identity | Primary key. |
| `event_type` | text | Invite event name. |
| `candidate_email` | text | Candidate email. |
| `inviting_admin_id` | uuid | Inviting admin where relevant. |
| `ip_address` | text | Caller IP. |
| `outcome_detail` | text | Internal detail. |
| `created_at` | timestamptz | Defaults to `now()`. |

## `public.contact_rate_limits`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | bigint identity | Primary key. |
| `ip_hash` | text | Hashed caller IP. |
| `created_at` | timestamptz | Defaults to `now()`. |

## RLS Summary

| Table | Public Read | Public Insert | Admin Read | Admin Write | Service Role |
| --- | --- | --- | --- | --- | --- |
| `prices` | Yes | No | Yes | Yes | Yes |
| `messages` | No | Yes | Yes | Delete only | Yes |
| `users` | Own profile only | No | Yes | No client writes | Yes |
| `admin_otp_requests` | No | No | No direct access | No direct access | Yes |
| `admin_invite_audit` | No | No | Yes | No client writes | Yes |
| `contact_rate_limits` | No | No | No direct access | No direct access | Yes |

## Operations Tables

The operational extension uses `customers`, `orders`, `order_items`, `business_settings`, `faqs`, and `audit_logs`. Admin-only operational tables are protected by RLS. Public users may read only active FAQs and safe business settings. Order totals are calculated from item quantity and snapshot unit price; collection and payment state are recorded on the order.