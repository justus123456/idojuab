# Design

## Product Identity

The product is a local laundry and dry-cleaning service in Kubwa, Abuja. The design should feel practical, trustworthy, and service-oriented. It uses real laundry imagery, clear pricing tables, direct contact information, and a simple administrative interface.

Brand name used in the UI:

- Idojuan Laundry
- Idojuan Laundry and Dry Cleaning Services

Business details shown on the public page:

- Address: Mosque shop 7 beside Ogab Services, Gado Nasko road 2/1, Kubwa, Abuja 901101, Federal Capital Territory
- Email: Idoresltd@yahoo.com
- Phone: 08063894359, 08036303555

## Visual Direction

The current design uses a clean neutral palette:

- Primary dark: `rgb(31, 31, 31)` and `rgba(31, 31, 31, 0.9)`
- Light surfaces: `#f5f5f5`, `#eff0f4`, `#ddd`
- Supporting text: `#4d4d4d`
- Muted gray: `rgba(172, 172, 172)`
- Success feedback: translucent green

The public website leans on large photography and glass-like cards in the process timeline. The admin and login screens are more utilitarian, with gray surfaces, simple inputs, tables, and dark action buttons.

## Typography

Public website:

- Font: Montserrat from Google Fonts.
- Global text uses `font-weight: 500`.
- All text is globally capitalized through CSS `text-transform: capitalize`.
- Hero heading is large and centered.
- Section headings use `.titleText`.

Admin and login:

- Font: Poppins from Google Fonts.
- Admin text is generally heavier, with `font-weight: 700`.
- Login form uses compact labels and field text.

Design note:

- Global capitalization affects emails, user-entered message text, and table content. If preserving exact casing becomes important, avoid applying `text-transform: capitalize` globally.

## Public Website Layout

### Header

The public header is fixed at the top of the page. It contains:

- Logo text: `Idojuan laundry`
- Navigation links: home, about, system, pricing, contact
- Mobile menu toggle icon

The header changes on scroll:

- Smaller padding.
- Light background.
- Shadow.
- Dark logo and nav text.

### Hero

The hero section:

- Fills at least one viewport height.
- Uses `images/pexels-karolina-grabowska-4959880.jpg` as a full-cover background.
- Centers headline, descriptive copy, and a pricing call-to-action.
- Includes an off-screen `h1` for SEO/accessibility naming.

### About

The about section:

- Uses a two-column layout on desktop.
- Alternates image and text placement.
- Describes the company, reasons to choose it, and the mission.
- Hides about-section images on smaller screens.

### System Timeline

The system section:

- Uses a laundry-room background image.
- Presents operational stages as timeline items.
- Shows alternating left and right timeline cards on desktop.
- Collapses into centered stacked items on mobile.

Stages:

- Administration
- Washing stage
- Drying stage
- Ironing stage
- Packaging stage

### Pricing

The pricing UI:

- Has separate sections for male and female clothing.
- Uses tables with columns for serial number, clothes, ironing price, washing price, and gender.
- Reads live values from Supabase.
- Displays prices with `NGN`.
- Shows an empty state when no rows exist.

### Contact

The contact section:

- Uses a two-column desktop layout.
- Left side: contact form.
- Right side: embedded Google Map.
- Bottom row: address, email, and phone details.
- Shows a temporary success message after a valid submission.

## Admin Dashboard Layout

The admin dashboard is designed as an operational panel.

Desktop layout:

- A fixed vertical sidebar on the left.
- Logo at top.
- Navigation links to product, pricing, and messages.
- Logout button near the bottom.
- Main content centered in the remaining page space.

Mobile layout:

- Header becomes horizontal and compact.
- Navigation links shrink.
- Forms stack more tightly.
- Tables expand to full width when needed.

Admin sections:

- Male product entry form.
- Female product entry form.
- Male price table with delete and clear actions.
- Female price table with delete and clear actions.
- Message table with delete and clear actions.

## Login and Signup Layout

Login screen:

- Centered compact panel.
- Email field.
- Password field.
- Password visibility toggle.
- Login button.
- Forgot password link.
- Inline error or success messaging.

Password reset state:

- Reuses the same panel.
- New password field.
- Confirm password field.
- Password visibility toggle.
- Password strength helper text.
- Update password action.

Signup screen:

- Uses the login styling.
- Shows that public admin signup is disabled.
- Links back to login.

## Components

### Buttons

Common button treatment:

- Dark background.
- Light text.
- 5px border radius.
- Hover changes to a softer gray.
- Uppercase text in many contexts.

Button types:

- Public CTA: `.btn-1`
- Contact submit: `.btn`
- Admin submit: `.but`
- Admin navigation button: `.buts`
- Clear buttons: `.clear`
- Logout: `#logout`, `#log`

### Tables

Tables are central to the pricing and admin experience.

Current table behavior:

- Light gray header row.
- Center-aligned table cells.
- Scrollable container with a max height.
- Empty-state row generated when no data exists.

### Forms

Form patterns:

- Native `required` fields in HTML.
- JavaScript validation for contact and login flows.
- Text inputs trimmed before use.
- Contact message normalized and rate limited server-side.

## Responsive Behavior

Breakpoints currently target:

- `991px`
- `768px`
- `425px`
- `320px`

Public site:

- Header padding reduces.
- Mobile navigation becomes a full-screen overlay.
- About columns collapse.
- System timeline loses the center vertical line.
- Pricing tables become full width.
- Contact form and map stack.

Admin:

- Sidebar becomes top navigation under tablet width.
- Tables become wider relative to viewport.
- Forms stack on smaller phones.

Login:

- Login panel centers at tablet width.
- Width increases to 80 to 100 percent depending on viewport.
- Password visibility button stacks under narrow fields.

## Motion and Interaction

Motion currently includes:

- A 3-second preloader animation on public page load.
- Header transition on scroll.
- AOS scroll animations.
- Button hover scale effects in admin forms.
- Mobile menu slide-in transition.

Interaction principles:

- Keep public interactions lightweight and clear.
- Keep admin actions fast and table-focused.
- Use empty states instead of leaving blank table bodies.
- Show feedback after successful contact form submission.

## Accessibility Notes

Existing accessibility strengths:

- Viewport meta tags are present.
- Form fields have labels on login and admin pages.
- Contact map has a title.
- Public page includes a hidden `h1`.
- Images include lazy loading in several places.

Recommended improvements:

- Add meaningful `alt` text to content images.
- Avoid relying on CSS capitalization for actual content meaning.
- Ensure icon-only buttons have accessible labels.
- Add confirmation dialogs for destructive admin clear actions.
- Ensure success and error messages are announced to screen readers.
- Review contrast for success message and hero text over images.

## Design Improvements Backlog

- Clean corrupted characters in public content and structured data.
- Make price tables easier to scan on small screens.
- Add loading states while prices and messages are being fetched.
- Add confirmation modals before clearing tables.
- Use one consistent font family unless there is a deliberate reason to separate public and admin typography.
- Normalize button naming and styling across CSS files.
- Improve admin dashboard spacing so desktop and mobile feel equally intentional.
