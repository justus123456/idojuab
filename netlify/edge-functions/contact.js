const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://wkknfeknvunhugrabvpl.supabase.co";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "sb_publishable_KthcrJ7DN8r8dLIMugqE7w_m6W-H6G2";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RATE_LIMIT_PEPPER = Deno.env.get("RATE_LIMIT_PEPPER") || Deno.env.get("OTP_PEPPER") || "";
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function normalizeText(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function getClientIp(request) {
  return request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-real-ip") || "unknown";
}

async function hashIp(ip) {
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${ip}:${RATE_LIMIT_PEPPER}`));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function supabaseFetch(path, options = {}, serviceRole = true) {
  const key = serviceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
}

async function isRateLimited(ipHash) {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const response = await supabaseFetch(`/rest/v1/contact_rate_limits?select=id&ip_hash=eq.${encodeURIComponent(ipHash)}&created_at=gte.${encodeURIComponent(since)}`);

  if (!response.ok) {
    console.error("Contact rate-limit check failed");
    return true;
  }

  const rows = await response.json();
  if (rows.length >= RATE_LIMIT_MAX_REQUESTS) return true;

  const insertResponse = await supabaseFetch("/rest/v1/contact_rate_limits", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ip_hash: ipHash }),
  });

  return !insertResponse.ok;
}

export default async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  if (!SUPABASE_SERVICE_ROLE_KEY || !RATE_LIMIT_PEPPER) {
    return jsonResponse(500, { error: "Contact service is not configured." });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const name = normalizeText(payload?.name, 80);
  const email = normalizeText(payload?.email, 120).toLowerCase();
  const message = normalizeText(payload?.message, 2000);

  if (!name || !email || !message) {
    return jsonResponse(400, { error: "Name, email, and message are required." });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse(400, { error: "A valid email is required." });
  }

  const ipHash = await hashIp(getClientIp(request));
  if (await isRateLimited(ipHash)) {
    return jsonResponse(429, { error: "Too many messages sent. Please try again later." });
  }

  const response = await supabaseFetch("/rest/v1/messages", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ name, email, message }),
  });

  if (!response.ok) {
    console.error("Contact submission failed");
    return jsonResponse(502, { error: "Message submission failed." });
  }

  return jsonResponse(200, { success: true });
};
