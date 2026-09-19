export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    return context.next();
  }

  if (url.hostname !== 'rights.bantan.online') {
    return context.next();
  }

  const assetUrl = new URL(request.url);
  if (url.pathname.startsWith('/copyright/')) {
    assetUrl.pathname = url.pathname;
  } else if (url.pathname === '/' || url.pathname === '') {
    assetUrl.pathname = '/copyright/';
  } else {
    const cleanPath = url.pathname.replace(/\/+$/, '');
    const mappedPath = '/copyright' + cleanPath;
    assetUrl.pathname = /\.[a-z0-9]+$/i.test(cleanPath) ? mappedPath : mappedPath + '.html';
  }

  const assetRequest = new Request(assetUrl.toString(), request);
  if (context.env.ASSETS?.fetch) {
    const response = await context.env.ASSETS.fetch(assetRequest);
    if ([301, 302, 307, 308].includes(response.status)) {
      const location = response.headers.get('Location');
      if (location) {
        return context.env.ASSETS.fetch(new Request(new URL(location, request.url).toString(), request));
      }
    }
    return response;
  }
  return context.next(assetRequest);
}
