# Contributing

Thank you for helping improve 绊谈 · 万能枢纽.

This repository is released under the Bantan Proprietary License. Contributions do not grant permission to copy, redistribute, commercialize, or remove branding from the project.

## Before Contributing

1. Read the [LICENSE](./LICENSE).
2. Search existing issues before opening a new one.
3. Use an issue to describe significant changes before writing a large patch.
4. Do not modify backend, VIP, registration, API, KV, or user-data behavior unless the task explicitly requires it.

## Pull Requests

A pull request should:

- Focus on one clear problem
- Explain the user-visible behavior change
- List affected pages and files
- Include desktop, tablet, and mobile verification
- Avoid unrelated formatting or generated-file churn
- Preserve the existing brand and visual language
- Include screenshots for visual changes
- State whether the change affects the backend or user data

## Local Verification

At minimum, verify:

- No JavaScript errors on changed pages
- No unintended horizontal overflow
- Keyboard navigation still works
- Reduced-motion mode remains usable
- PWA cache updates do not serve stale scripts
- Existing login and routing behavior is unchanged

## Commit Messages

Use concise, action-oriented messages:

```text
Add archive reading progress
Fix mobile overflow in tool cards
Update changelog and license links
```

## Reporting Problems

- Bugs: use the Bug Report issue template
- Feature requests: use the Feature Request issue template
- Security issues: follow [SECURITY.md](./SECURITY.md)

Please read [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) before participating.
