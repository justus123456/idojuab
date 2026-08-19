# Rules

## Business Rules

- Public users can browse all public website sections without logging in.
- Public users can view price lists.
- Public users can submit contact messages.
- Public users cannot create admin accounts.
- Public users cannot access the admin dashboard.
- Public users cannot read submitted customer messages.
- Public users cannot add, update, or delete prices.
- Admins manage all pricing information.
- Admins manage customer messages.
- Prices are separated into `Male` and `Female` categories.
- Contact messages are considered private operational data.

## Authentication Rules

- Admin login must use Supabase Auth.
- Admin access requires a valid active Supabase session.
- Admin access also requires a matching row in `public.users`.
- The matching user row must have `role = 'admin'`.
- If a user is authenticated but not an admin, the app must sign them out or redirect them away from admin tools.
- Admin logout must call `supabase.auth.signOut()`.
- Password reset must use Supabase Auth recovery flow.

## Signup Rules

- Public admin signup is disabled.
- `/signup` must redirect to `/login.html`.
- `/signup.html` must redirect to `/login.html`.
- If the signup page is reached, it must show a disabled-signup message.
- Admin accounts must be created through Supabase dashboard or a verified server-side workflow.

## Price Rules

- A price row must include:
  - Cloth type.
  - Ironing price.
  - Washing price.
  - Gender.
- Cloth type cannot be empty.
- Ironing price cannot be empty.
- Washing price cannot be empty.
- Gender must be either `Male` or `Female` in the current UI.
- Public price display must group rows by gender.
- Public price display must show an empty state when a gender has no items.
- Admins may delete individual price rows.
- Admins may clear all rows for one gender.

## Message Rules

- A contact submission must include name, email, and message.
- Name must be trimmed, whitespace-normalized, and limited to 80 characters.
- Email must be trimmed, whitespace-normalized, lowercased, and limited to 120 characters.
- Email must match a basic email format.
- Message must be trimmed, whitespace-normalized, and limited to 2000 characters.
- An IP address may submit at most 3 messages per 10 minutes.
- Accepted messages must be inserted into `messages`.
- Admins may read messages.
- Admins may delete individual messages.
- Admins may clear all messages.

## Database Access Rules

- RLS must be enabled on `public.prices`.
- RLS must be enabled on `public.messages`.
- RLS must be enabled on `public.users`.
- `prices` select is allowed for anonymous and authenticated users.
- `prices` insert is allowed only for authenticated admins.
- `prices` update is allowed only for authenticated admins.
- `prices` delete is allowed only for authenticated admins.
- `messages` insert is allowed for anonymous and authenticated users.
- `messages` select is allowed only for authenticated admins.
- `messages` delete is allowed only for authenticated admins.
- `users` select is allowed for a user's own profile or for admins.
- Admin checks are based on `public.is_admin()`.

## API Rules

- `/api/contact` only accepts `POST`.
- `/api/contact` must return JSON.
- `/api/contact` must set `Cache-Control: no-store`.
- Invalid methods return `405`.
- Missing or invalid fields return `400`.
- Rate-limited submissions return `429`.
- Supabase insertion failure returns `502`.
- Successful submissions return `200` with `{ "success": true }`.

## Security Rules

- Service-role keys must never be placed in browser JavaScript.
- Service-role keys must only be read from environment variables in server-side code.
- The browser may use a Supabase publishable anon key.
- All sensitive permissions must be enforced by Supabase RLS.
- Deployment must include the configured security headers.
- Signup routes must remain redirected unless a secure admin onboarding flow is implemented.
- Admin destructive actions should be limited to authenticated admins.

## UI Rules

- Public navigation must link to the matching page sections.
- Pricing tables must not remain blank when there is no data.
- Contact form should give visible success feedback after submission.
- Login errors should be visible near the login form.
- Admin dashboard must redirect unauthenticated users to `login.html`.
- Admin dashboard must refresh price and message lists after changes.
- Mobile layouts must remain usable at 425px and 320px widths.

## Deployment Rules

- Netlify must publish the project root.
- Netlify must route `/api/contact` to the edge contact function.
- Vercel must preserve signup redirects and security headers.
- Security headers in `netlify.toml` and `vercel.json` should stay aligned.
- Contact endpoint behavior should stay consistent between Netlify and Vercel implementations.

## Maintenance Rules

- Keep Supabase column names in snake_case.
- Normalize database rows in JavaScript when camelCase names are needed.
- Keep public and admin table renderers aligned when schema changes.
- Update `schema.md` when database columns or policies change.
- Update `prd.md` when product behavior changes.
- Update `architecture.md` when deployment, data flow, or authentication changes.
- Update `design.md` when layouts, visual system, or major interaction patterns change.
