# GitHub Operations

This checklist keeps the public repository readable, verifiable and safe to maintain.

## Repository About

- Description: short product summary with the primary official domain.
- Website: `https://bantan.online/`
- Topics: `bantan`, `online-tools`, `ai-tools`, `rights`, `pwa`, `cloudflare-pages`
- Social preview: use the branded `og-image.png` or a current repository preview image.

## Required Checks

- `Site quality`
- `Verify official site codes`
- `CodeQL`
- `Dependency review` for pull requests

## Release Assets

When a GitHub Release is published, `Build release assets` adds:

- Full `.tar.gz` archive
- Full `.zip` archive
- `SHA256SUMS.txt`

## Branch Protection

Protect `main` with:

- Require pull requests before merging
- Require status checks to pass
- Block force pushes
- Block branch deletion
