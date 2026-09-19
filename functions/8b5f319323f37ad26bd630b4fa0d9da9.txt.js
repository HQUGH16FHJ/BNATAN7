export async function onRequestGet() {
  return new Response('1b15c01aa7f26d7612d511fb589ad104a3bf1fc9\n', {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
      'access-control-allow-origin': '*',
      'x-content-type-options': 'nosniff'
    }
  });
}
