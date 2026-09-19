export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

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
    return context.env.ASSETS.fetch(assetRequest);
  }
  return context.next(assetRequest);
}
