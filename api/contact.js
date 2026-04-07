import supabase from './supabaseClient.js';

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;
const rateLimitStore = new Map();

function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(JSON.stringify(body));
}

function normalizeText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const recentRequests = (rateLimitStore.get(ip) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(ip, recentRequests);
    return true;
  }

  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  const name = normalizeText(req.body?.name, 80);
  const email = normalizeText(req.body?.email, 120).toLowerCase();
  const message = normalizeText(req.body?.message, 2000);

  if (!name || !email || !message) {
    sendJson(res, 400, { error: 'Name, email, and message are required.' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    sendJson(res, 400, { error: 'A valid email is required.' });
    return;
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    sendJson(res, 429, { error: 'Too many messages sent. Please try again later.' });
    return;
  }

  const { error } = await supabase
    .from('messages')
    .insert({ name, email, message });

  if (error) {
    console.error('Contact submission failed:', error);
    sendJson(res, 502, { error: 'Message submission failed.' });
    return;
  }

  sendJson(res, 200, { success: true });
}
