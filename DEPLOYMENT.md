# Deployment

## Static Deployment

The frontend can be deployed to any static host, including GitHub Pages, Cloudflare Pages, Netlify, Vercel, or a traditional web server.

The complete frontend is currently delivered as:

```text
BNATAN7-v4.0.5-frontend-only.zip
```

No build command is required for the static files.

## Required Files

Ensure these files are deployed together:

```text
index.html
landing.html
about.html
changelog.html
license.html
404.html
sw.js
manifest.json
robots.txt
sitemap.xml
llms.txt
LICENSE
```

Also deploy the matching CSS, JavaScript, SVG, PNG, ICO, and JSON assets from the same release.

## Cache Versioning

Before deployment, confirm:

- `sw.js` uses the latest `CACHE_NAME`
- Versioned script and stylesheet URLs match the release
- The old Service Worker does not return stale mobile navigation or UI
- WeChat and Android Edge are tested after deployment

## GitHub Pages

The included workflow can deploy the static repository to GitHub Pages.

Before relying on it:

1. Open repository Settings.
2. Select Pages.
3. Set the source to GitHub Actions.
4. Run the deployment workflow.
5. Verify the published URL and custom domain.

## Cloudflare

When deploying through Cloudflare:

- Preserve relative asset paths
- Purge cache after replacing `sw.js`
- Keep the Worker and frontend deployment boundaries separate
- Never expose `ADMIN_TOKEN`, API keys, or KV credentials in frontend files

## Release Checklist

- [ ] Desktop checked
- [ ] Tablet checked
- [ ] iPhone checked
- [ ] Android Edge checked
- [ ] WeChat checked
- [ ] No horizontal overflow
- [ ] No unintended console errors
- [ ] Login and routing unchanged
- [ ] PWA cache refreshed
- [ ] `llms.txt` and `LICENSE` accessible
- [ ] Rollback package retained
