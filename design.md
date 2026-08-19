# Design

## Product Feel

Idojuan Laundry should feel clean, practical, and local-service focused. The site is not a delivery app; it helps customers decide, estimate, locate the shop, and contact the business before an in-store visit.

## Visual System

- Neutral grays, black text, light panels, and soft shadows.
- Public pages use Montserrat.
- Admin/login pages use Poppins.
- Buttons use dark neutral backgrounds with simple 5px radius.
- Photography should show real laundry/garment care context.

## Public UX

- Fixed header with anchor navigation and open/closed badge.
- Hero includes pricing CTA and WhatsApp CTA.
- About section explains the business and in-store service model.
- System section explains check-in, washing, drying, ironing, and packaging.
- Pricing includes dynamic tables plus a client-side estimator.
- FAQ uses accessible accordion buttons with `aria-expanded`.
- Contact includes visible labels, map, Get Directions, copy address, email, tap-to-call, WhatsApp, and hours.
- Footer includes admin link and working scroll-to-top button.

## Admin UX

- Dashboard keeps price management and message management simple.
- Invite Admin panel is available from dashboard navigation.
- Destructive clear-all actions require confirmation.
- Standalone invite and onboarding pages reuse the login card style.

## Responsive Behavior

- Mobile navigation uses the existing menu overlay.
- Price estimator stacks controls into one column.
- Contact form, map, and contact cards stack on mobile.
- Admin tables use wider responsive table containers.

## Accessibility Rules

- Use visible labels for forms.
- Use `textContent` for user data.
- Do not rely on color alone for open/closed status.
- Keep map iframe titled.
- Keep FAQ buttons keyboard accessible.
