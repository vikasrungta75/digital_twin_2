/**
 * src/setupProxy.js
 *
 * Routes:
 *   /iot-api/video/*  →  https://iot.ravity.io/api/v1/video/*
 *   /iot-api/*        →  https://iot.ravity.io/api/v3/*
 *
 * WHY TWO ROUTES:
 * iot.ravity.io returns 405 for POST /api/v3/video/live/start.
 * TurboHive video/command endpoints commonly live under /api/v1 while
 * data/query endpoints (devices, alerts, resources) are on /api/v3.
 *
 * The OPTIONS preflight is answered locally — iot.ravity.io does not
 * return CORS headers, so the browser would abort the request otherwise.
 *
 * Token is injected server-side. Restart dev server after changing .env.
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

const TOKEN = process.env.REACT_APP_IOT_TOKEN || '';

const proxyOpts = (pathPrefix) => ({
  target: 'https://iot.ravity.io',
  changeOrigin: true,
  secure: true,
  pathRewrite: { ['^/iot-api']: pathPrefix },
  onProxyReq: function (proxyReq) {
    if (TOKEN) proxyReq.setHeader('Authorization', 'Bearer ' + TOKEN);
    proxyReq.removeHeader('Origin');
    proxyReq.removeHeader('Referer');
  },
  onProxyRes: function (proxyRes, req) {
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    console.log('[IoT Proxy] ' + req.method + ' ' + req.url + ' → HTTP ' + proxyRes.statusCode);
  },
  onError: function (err, req, res) {
    console.error('[IoT Proxy Error]', req.method, req.url, err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'IoT proxy error: ' + err.message }));
  },
});

module.exports = function (app) {

  // ── Handle OPTIONS preflight locally (iot.ravity.io rejects OPTIONS) ─────────
  app.options('/iot-api/*', function (req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,Accept');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.sendStatus(200);
  });

  // ── Video/command endpoints → /api/v1 ────────────────────────────────────────
  // POST /api/v3/video/* returns 405 — TurboHive video commands live on /api/v1
  app.use('/iot-api/video', createProxyMiddleware(proxyOpts('/api/v1')));

  // ── All other IoT endpoints → /api/v3 ────────────────────────────────────────
  app.use('/iot-api', createProxyMiddleware(proxyOpts('/api/v3')));
};
