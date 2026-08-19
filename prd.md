# Product Requirements Document

## Product

Idojuan Laundry and Dry Cleaning Services website and admin dashboard.

## Problem

The business needs a simple online presence where customers can learn about the laundry service, view current prices, find the location, and send messages. Staff also need a protected admin area to keep prices up to date and review customer inquiries without editing code.

## Goals

- Present the laundry business clearly to customers.
- Show current male and female laundry prices from a database.
- Let customers send inquiries through a contact form.
- Give admins a secure way to manage prices.
- Give admins a secure way to review and delete customer messages.
- Prevent public admin account creation.
- Support deployment on Netlify and Vercel.

## Non-Goals

- Online payment processing.
- Customer accounts.
- Order tracking.
- Pickup scheduling.
- Inventory management.
- Multi-branch management.
- Staff workflow tracking beyond the informational process timeline.

## Users

### Customer

A customer wants to:

- Understand the laundry and dry-cleaning services.
- Check price information.
- Contact the business.
- Find the physical location.

### Admin

An admin wants to:

- Log in securely.
- Add price-list items.
- Separate male and female pricing.
- Delete incorrect price-list items.
- Clear old price data when needed.
- Read customer messages.
- Delete handled messages.
- Reset their password if needed.

## Public Website Requirements

### Homepage Content

The public homepage must include:

- Business name.
- Short service introduction.
- About section.
- Reasons to choose the business.
- Mission statement.
- Laundry process/system explanation.
- Pricing section.
- Contact section.
- Footer with copyright and admin link.

### Navigation

The public header must link to:

- Home
- About
- System
- Pricing
- Contact

On small screens, navigation must be accessible through a menu toggle.

### Pricing Display

The pricing section must:

- Display male and female price lists separately.
- Read data from the Supabase `prices` table.
- Show serial number, clothes, ironing price, washing price, and gender.
- Format prices with `NGN`.
- Show an empty state when no items are found.
- Refresh periodically so admin changes appear without a full page reload.

### Contact Form

The contact form must collect:

- Name
- Email
- Message

The form must:

- Require all fields.
- Submit to `/api/contact`.
- Show success feedback after successful submission.
- Clear fields after successful submission.
- Avoid storing invalid or empty submissions.

## Admin Requirements

### Authentication

Admins must:

- Log in with Supabase Auth email and password.
- Be redirected away from the admin dashboard if not authenticated.
- Have a matching row in `public.users`.
- Have `role = 'admin'`.
- Be able to log out.

Non-admin authenticated users must not be allowed into the dashboard.

### Password Reset

Admins must be able to request password reset from `login.html`.

New passwords must:

- Be at least 8 characters.
- Include uppercase letters.
- Include lowercase letters.
- Include a number.
- Include a special character.
- Match the confirmation field.

### Signup Lockdown

Public signup must be disabled.

Requirements:

- `/signup` redirects to `/login.html`.
- `/signup.html` redirects to `/login.html`.
- If opened directly, signup UI explains that public admin signup is disabled.
- Admin users should be created in Supabase dashboard or through a verified server-side process.

### Price Management

Admin must be able to:

- Add a male price item.
- Add a female price item.
- Enter cloth type.
- Enter ironing price.
- Enter washing price.
- View all price items by gender.
- Delete a single price item.
- Clear all male prices.
- Clear all female prices.

Price data must be stored in the `prices` table.

### Message Management

Admin must be able to:

- View customer messages.
- See message name, email, message body, and creation date.
- Delete a single message.
- Clear all messages.

Message data must be stored in the `messages` table.

## API Requirements

### Contact Endpoint

Endpoint:

- `POST /api/contact`

Request JSON:

```json
{
  "name": "Customer Name",
  "email": "customer@example.com",
  "message": "Message text"
}
```

Validation:

- `name` is required.
- `email` is required.
- `message` is required.
- `email` must match a basic email format.
- `name` is limited to 80 characters.
- `email` is limited to 120 characters.
- `message` is limited to 2000 characters.
- Whitespace is normalized.

Rate limiting:

- Maximum 3 submissions per IP per 10 minutes.

Success response:

```json
{
  "success": true
}
```

Error responses:

- `400` for missing fields or invalid input.
- `405` for non-POST requests.
- `429` for rate-limited clients.
- `502` when Supabase insertion fails.

## Data Requirements

### Prices

Each price item must store:

- Unique ID.
- Cloth type.
- Ironing price.
- Washing price.
- Gender.
- Optional creation timestamp.

### Messages

Each customer message must store:

- Unique ID.
- Name.
- Email.
- Message body.
- Creation timestamp.

### Users

Each app user profile must store:

- Unique ID.
- Username.
- Email.
- Role.

The `role` field controls admin access.

## Security Requirements

- Supabase RLS must be enabled for `prices`, `messages`, and `users`.
- Anonymous users may read prices.
- Anonymous users may insert messages.
- Anonymous users may not read messages.
- Anonymous users may not modify prices.
- Only admins may insert, update, or delete prices.
- Only admins may read or delete messages.
- Authenticated users may read their own user profile.
- Admins may read user profiles.
- Service-role keys must only be used server-side.
- Public pages must only use Supabase publishable anon credentials.
- Deployment must include security headers from `netlify.toml` or `vercel.json`.

## Success Metrics

- Customers can view current prices without contacting staff.
- Customers can submit a contact message successfully.
- Admins can update price lists without code changes.
- Admins can access messages without database dashboard access.
- Public signup remains inaccessible.
- Unauthorized users cannot manage price or message data.

## Future Enhancements

- Add booking or pickup scheduling.
- Add WhatsApp click-to-chat.
- Add admin edit action for existing price rows.
- Add confirmation before destructive admin actions.
- Add audit log for admin changes.
- Add loading and error UI for Supabase requests.
- Replace polling with Supabase realtime or manual refresh.
- Add automated tests for contact endpoint validation.
