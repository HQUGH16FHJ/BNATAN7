# Architecture

## Overview

绊谈 · 万能枢纽 is a static-first web application with an optional hosted backend boundary for authentication, VIP, AI proxy, and user data.

The frontend is intentionally framework-free so that pages remain deployable as static files.

## Frontend Layers

| Layer | Responsibility |
|---|---|
| Page shell | `index.html`, `landing.html`, `about.html`, `changelog.html`, `license.html`, `404.html` |
| Core experience | `experience-v4.js` and `experience-v4.css` |
| Motion and visual effects | `reactbits-v4.*`, `uiverse-v4.*`, `advanced-motion-v4.*` |
| Interaction details | `ui-interactions-v4.*` |
| Profile system | `profile-center.*` |
| Mascot states | `mascot-state.*` |
| Legacy tools | `legacy-tools.js` |
| Archive pages | `archive-v5.*` |
| Confirmation UI | `confirm-dialog.*` |

## Runtime Boundaries

The frontend may depend on backend services for:

- Registration and login
- User profile and VIP status
- AI proxy requests
- Announcements and usage records
- Cloud content synchronization

Those services are separate from the static visual implementation. Frontend changes must not silently alter their contracts.

## Content Flow

1. The browser loads a static HTML page.
2. Shared CSS and JavaScript enhance navigation, search, motion, and responsive behavior.
3. Authenticated pages may request backend APIs.
4. Local preferences are stored in browser storage.
5. External tools open in a new tab and keep users on the original page context.

## Caching

`sw.js` defines the PWA cache. When changing JavaScript or CSS:

1. Update the installed asset names or query version.
2. Increase `CACHE_NAME`.
3. Verify that old cached scripts are removed.
4. Test in a private window and mobile browsers.

## Security Boundary

Never place secrets in:

- HTML
- CSS
- Client JavaScript
- Service Worker files
- Git history

API credentials must stay on the server side.
