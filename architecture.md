# Architecture

## Overview

Idojuan Laundry and Dry Cleaning Services is a static website with a small admin dashboard and Supabase-backed data storage. The public site shows business information, pricing, location details, and a contact form. The admin area lets authorized users manage price-list entries and customer messages.

The application is built mostly with plain HTML, CSS, and browser JavaScript. Supabase provides authentication, database storage, and row-level security. The contact form is routed through a serverless endpoint so public users do not write directly from page code without validation and rate limiting.

## Runtime Surfaces

### Public Website

- Entry page: `index.html`
- Script: `laundry.js`
- Styles: `css/laundry.css`
- Purpose: present business content, show live price data, and submit contact messages.

The public page contains:

- Fixed header and mobile navigation.
- Hero section for the laundry service.
- About section with service value proposition.
- Process/system timeline.
- Male and female price tables populated from Supabase.
- Contact form posting to `/api/contact`.
- Embedded Google Map.
- Google Analytics tag.

### Admin Login

- Page: `login.html`
- Script: `login.js`
- Styles: `css/login.css`
- Purpose: authenticate administrators through Supabase Auth and verify admin role in the `users` table.

Login flow:

1. User enters email and password.
2. Browser calls `supabase.auth.signInWithPassword`.
3. Browser queries `public.users` by matching email.
4. User is allowed into `admin.html` only when `role = 'admin'`.
5. Non-admin users are signed out and shown an access error.

Password reset flow:

1. Admin enters email on the login page.
2. Browser calls `supabase.auth.resetPasswordForEmail`.
3. Reset link returns to `/login.html` with a Supabase recovery hash.
4. `login.js` detects `type=recovery`.
5. Admin enters and confirms a new password.
6. Browser enforces basic password strength before calling `supabase.auth.updateUser`.

### Disabled Signup

- Page: `signup.html`
- Script: `signup.js`
- Config note: `signup-config.js`
- Purpose: explicitly prevent public admin creation.

Both Netlify and Vercel redirect `/signup` and `/signup.html` to `login.html`. The page itself also states that public admin signup is disabled.

### Admin Dashboard

- Page: `admin.html`
- Script: `admin.js`
- Styles: `css/admin.css`
- Purpose: manage price-list rows and customer messages.

Admin dashboard capabilities:

- Verify active Supabase session.
- Verify matching `users.role = 'admin'`.
- Add male price entries.
- Add female price entries.
- View price entries by gender.
- Delete individual price entries.
- Clear all male price entries.
- Clear all female price entries.
- View customer messages.
- Delete individual messages.
- Clear all messages.
- Log out of Supabase Auth.

## Backend and Data Services

### Supabase Browser Client

- Browser config: `supabase-config.js`
- Uses Supabase CDN script from `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`.
- Creates `window.supabaseClient`.
- Uses the project URL and publishable anon key.

This client is used by:

- `laundry.js` for reading `prices`.
- `login.js` for authentication and profile role checks.
- `admin.js` for authenticated admin data operations.
- `signup.js` only for displaying disabled-signup messaging.

### Serverless Contact Endpoint

There are two contact endpoint implementations:

- Vercel-style function: `api/contact.js`
- Netlify Edge Function: `netlify/edge-functions/contact.js`

Both expose the same logical endpoint:

- Route: `/api/contact`
- Method: `POST`
- Payload: `{ name, email, message }`
- Response success: `{ success: true }`

Validation behavior:

- Rejects non-POST methods with `405`.
- Requires valid JSON in Netlify Edge version.
- Normalizes whitespace.
- Limits name to 80 characters.
- Limits email to 120 characters.
- Limits message to 2000 characters.
- Lowercases email.
- Requires a simple valid email pattern.
- Rate limits each IP to 3 messages per 10 minutes.

Persistence behavior:

- Inserts accepted contact messages into the `messages` table.

Implementation difference:

- `api/contact.js` imports a service-role Supabase client from `api/supabaseClient.js`.
- `netlify/edge-functions/contact.js` writes through Supabase REST using the public anon key and depends on Supabase RLS allowing inserts into `messages`.

## Deployment

### Netlify

- Config: `netlify.toml`
- Publish directory: project root (`.`)
- Edge function route: `/api/contact`
- Signup redirects: `/signup` and `/signup.html` redirect to `/login.html`
- Security headers are applied to all routes.

### Vercel

- Config: `vercel.json`
- Clean URLs disabled.
- Signup redirects match Netlify behavior.
- Security headers are applied to all routes.
- `api/contact.js` supports Vercel serverless deployment.

## Security Architecture

### Authentication

Supabase Auth handles administrator sign-in, sign-out, and password recovery. The app does not implement its own password database.

### Authorization

Admin authorization is role-based:

- Authenticated user email must match a row in `public.users`.
- That row must have `role = 'admin'`.
- Client-side checks redirect unauthorized users.
- Supabase RLS policies enforce table-level access.

### Row-Level Security

Security SQL lives in `scripts/supabase-security.sql`.

Policies:

- Anyone can read `prices`.
- Only admins can insert, update, or delete `prices`.
- Anonymous and authenticated users can insert `messages`.
- Only admins can read or delete `messages`.
- Authenticated users can read their own `users` row.
- Admins can read all `users` rows.

The SQL defines `public.is_admin()` as a stable security-definer function that checks whether `auth.email()` belongs to a `users` row with `role = 'admin'`.

### HTTP Security Headers

Both Netlify and Vercel set:

- Content Security Policy.
- Referrer Policy.
- `X-Content-Type-Options: nosniff`.
- `X-Frame-Options: DENY`.
- Permissions Policy disabling camera, microphone, and geolocation.
- HSTS.
- Cross-Origin Opener Policy.
- Cross-Origin Resource Policy.

## Data Flow

### Price List Read Flow

1. Public page loads `supabase-config.js`.
2. `laundry.js` reads all rows from `prices`.
3. Rows are ordered by `id`.
4. Data is normalized from snake_case database fields into camelCase local objects.
5. Male prices render into `.dat`.
6. Female prices render into `.datd`.
7. The page polls every 5 seconds for updates.

### Admin Price Management Flow

1. Admin opens `admin.html`.
2. `admin.js` requires an active Supabase session.
3. `admin.js` verifies `users.role = 'admin'`.
4. Admin adds price rows through the male or female forms.
5. Rows are inserted into `prices` with `cloth_type`, `ironing_price`, `washing_price`, and `gender`.
6. Admin can delete one row by `id` or clear rows by gender.
7. Tables are refreshed after changes.

### Contact Message Flow

1. Visitor fills name, email, and message on `index.html`.
2. `laundry.js` posts JSON to `/api/contact`.
3. Serverless function validates, normalizes, and rate limits the request.
4. Function inserts into `messages`.
5. Public page clears the form and shows a success message.
6. Admin dashboard reads messages from `messages`.
7. Admin can delete one message or clear all messages.

## External Dependencies

Runtime browser services:

- Supabase JS CDN.
- AOS animation library CDN.
- Font Awesome local files under `fonts/`.
- Google Fonts imported in CSS.
- Google Maps embed.
- Google Analytics.

Node dependencies:

- `@supabase/supabase-js`
- `dotenv`
- `express`
- `express-rate-limit`
- `cookie-parser`
- `cors`
- `bcrypt`
- `jsonwebtoken`

Not all installed Node dependencies are currently used by the static frontend. Some appear to support earlier or future server-side work.

## File Map

- `index.html`: public website shell and sections.
- `laundry.js`: public interactions, price rendering, contact form submission.
- `supabase-config.js`: browser Supabase client creation.
- `login.html`: admin login and reset-password UI.
- `login.js`: Supabase Auth login, role verification, password recovery.
- `signup.html`: disabled signup page.
- `signup.js`: disabled signup message behavior.
- `signup-config.js`: disabled signup note.
- `admin.html`: admin dashboard UI.
- `admin.js`: admin authorization, price CRUD, message reading and deletion.
- `api/supabaseClient.js`: server-side Supabase client using service role key.
- `api/contact.js`: Vercel-style contact API handler.
- `netlify/edge-functions/contact.js`: Netlify Edge contact API handler.
- `scripts/supabase-security.sql`: Supabase RLS policies.
- `netlify.toml`: Netlify routing, edge function, redirects, headers.
- `vercel.json`: Vercel redirects and headers.
- `css/laundry.css`: public website styles.
- `css/admin.css`: admin dashboard styles.
- `css/login.css`: login and disabled-signup styles.
- `images/`: local brand, hero, and content images.
- `fonts/`: local Font Awesome font files and CSS.

## Current Risks and Improvement Areas

- The browser Supabase config exposes a publishable anon key, which is normal for Supabase, but all sensitive operations must remain protected by RLS.
- `api/supabaseClient.js` exits the process if service-role config is missing, which is useful locally but can be harsh in serverless environments.
- Contact handling exists in both Vercel and Netlify forms; keep behavior synchronized when changing validation.
- The public page polls prices every 5 seconds, which is simple but can create unnecessary reads as traffic grows.
- Some text shows mojibake characters, especially currency and apostrophes, suggesting encoding cleanup is needed.
- Admin destructive actions do not ask for confirmation before clearing rows.
- Client-side admin checks are good for navigation, but Supabase RLS remains the real protection and must stay enabled.
