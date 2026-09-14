'use strict';

// The embedded player also ships desktop-only cloud music and updater panels.
// Give their two startup probes an offline answer so the static website opens
// cleanly while local tracks, uploads and audio visualisation keep working.
const nativeFetch = window.fetch.bind(window);
window.fetch = function(input, options) {
  const request = input instanceof Request ? input : null;
  const method = String(options?.method || request?.method || 'GET').toUpperCase();
  const url = new URL(request?.url || String(input), location.href);
  if (method === 'GET' && url.origin === location.origin) {
    if (url.pathname === '/api/playlists') {
      return Promise.resolve(new Response(JSON.stringify({ playlists: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    if (url.pathname === '/api/update/latest') {
      return Promise.resolve(new Response(JSON.stringify({ configured: false, updateAvailable: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
  }
  return nativeFetch(input, options);
};
