# Design System

## Direction

绊谈 uses a deep, warm-dark interface with aurora blue, amber, coral, and emerald accents. The design language balances a calm reading surface with expressive motion at key entry points.

## Principles

- Brand first: every major surface should feel recognizably 绊谈.
- Motion with purpose: movement should explain hierarchy, state, or navigation.
- Dense but readable: tool pages prioritize scanning and fast access.
- Familiar controls: buttons, selects, switches, and dialogs retain native expectations.
- Calm fallback: visual effects must preserve a usable static fallback.

## Color Roles

| Role | Color |
|---|---|
| Background | `#0a0805` |
| Primary text | `#fff7ed` |
| Secondary text | `#d6c7b8` |
| Amber accent | `#f59e0b` |
| Aurora blue | `#38bdf8` |
| Coral accent | `#fb7185` |
| Success | `#34d399` |

## Type Scale

- Page title: 32-48px
- Section heading: 20-32px
- Card title: 14-18px
- Body: 13-16px
- Metadata: 10-12px

## Radius and Spacing

- Small control: 8-12px
- Standard card: 16-20px
- Large archive panel: 20-28px
- Section spacing: 40-72px

## Motion

- Entrances use exponential ease-out
- Hover effects should communicate state
- Mobile must avoid automatic horizontal page overflow
- `prefers-reduced-motion` must remain functional
- Continuous background effects should not block reading

## Accessibility

- Keyboard focus must remain visible
- Color cannot be the only state indicator
- Interactive controls need accessible names
- Overlay dialogs must be dismissible
- Text and controls must remain readable on mobile
