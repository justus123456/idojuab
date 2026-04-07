const SUPABASE_URL = 'https://wkknfeknvunhugrabvpl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KthcrJ7DN8r8dLIMugqE7w_m6W-H6G2';
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}

function normalizeText(value, maxLength) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return request.headers.get('x-nf-client-connection-ip') || 'unknown';
}

export default async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed.' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse(400, { error: 'Invalid JSON payload.' });
  }

  const name = normalizeText(payload?.name, 80);
  const email = normalizeText(payload?.email, 120).toLowerCase();
  const message = normalizeText(payload?.message, 2000);

  if (!name || !email || !message) {
    return jsonResponse(400, { error: 'Name, email, and message are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(400, { error: 'A valid email is required.' });
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const rateLimitStore = globalThis.__contactRateLimitStore || new Map();
  const recentRequests = (rateLimitStore.get(ip) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return jsonResponse(429, { error: 'Too many messages sent. Please try again later.' });
  }

  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);
  globalThis.__contactRateLimitStore = rateLimitStore;

  const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: 'return=minimal'
    },
    body: JSON.stringify({ name, email, message })
  });

  if (!response.ok) {
    return jsonResponse(502, { error: 'Message submission failed.' });
  }

  return jsonResponse(200, { success: true });
};
