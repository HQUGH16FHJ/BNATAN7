# Release Process

## Versioning

The project uses semantic versions:

```text
MAJOR.MINOR.PATCH
```

- MAJOR: incompatible product or architecture changes
- MINOR: new user-facing features
- PATCH: fixes, documentation, security, or cache updates

## Release Checklist

1. Confirm the version in `README.md`, `CHANGELOG.md`, and `sw.js`.
2. Run desktop, tablet, mobile, WeChat, and Edge checks.
3. Confirm no unintended console errors or horizontal overflow.
4. Confirm login, VIP, registration, API, and data behavior is unchanged.
5. Build the frontend-only, full repository, and patch packages.
6. Record SHA-256 hashes.
7. Create the Git tag and GitHub Release.
8. Attach all release assets.
9. Verify the release page and repository homepage.

## Current Release

```text
v4.0.4
```

## Release Assets

- `BNATAN7-v4.0.4-frontend-only.zip`
- `BNATAN7-v4.0.4-motion-sites.zip`
- `BNATAN7-v4.0.4-motion-sites.patch`

## Rollback

Keep the previous stable release and deployment package until the new version has been verified in production.
