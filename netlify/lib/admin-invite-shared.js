export const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
export const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
export const OTP_PEPPER = Deno.env.get("OTP_PEPPER") || "";
export const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
export const OTP_EMAIL_FROM = Deno.env.get("OTP_EMAIL_FROM") || "Idojuan Laundry <onboarding@resend.dev>";
export const SITE_URL = Deno.env.get("SITE_URL") || Deno.env.get("DEPLOY_PRIME_URL") || Deno.env.get("URL") || "";

export function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function normalizeEmail(value) {
  return String(value || "").replace(/\s+/g, "").trim().toLowerCase().slice(0, 120);
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getClientIp(request) {
  return request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-real-ip") || "unknown";
}

export function requireServerConfig() {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (!SUPABASE_ANON_KEY) missing.push("SUPABASE_ANON_KEY");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!OTP_PEPPER) missing.push("OTP_PEPPER");
  if (!RESEND_API_KEY) missing.push("RESEND_API_KEY");

  if (missing.length > 0) {
    console.error(`Server invite configuration is missing: ${missing.join(", ")}`);
    return "Server invite configuration is missing.";
  }

  return "";
}

export async function supabaseFetch(path, options = {}, serviceRole = true) {
  const key = serviceRole ? SUPABASE_SERVICE_ROLE_KEY : SUPABASE_ANON_KEY;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
    ...(options.headers || {}),
  };

  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers,
  });
}

export async function getCallerUser(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  return response.json();
}

export async function getAdminProfile(email) {
  const response = await supabaseFetch(
    `/rest/v1/users?select=id,email,role&email=eq.${encodeURIComponent(email)}&limit=1`,
  );

  if (!response.ok) return null;
  const rows = await response.json();
  const profile = rows[0];
  return profile?.role === "admin" ? profile : null;
}

export function generateOtp() {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);
  return String(values[0] % 1000000).padStart(6, "0");
}

export async function hashOtp(email, otp, salt) {
  const encoder = new TextEncoder();
  const payload = encoder.encode(`${email}:${otp}:${salt}:${OTP_PEPPER}`);
  const digest = await crypto.subtle.digest("SHA-256", payload);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function randomSalt() {
  const values = new Uint8Array(16);
  crypto.getRandomValues(values);
  return Array.from(values).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function validatePasswordStrength(value) {
  if (value.length < 8) return false;
  return /[A-Z]/.test(value) && /[a-z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export async function writeAudit(eventType, details) {
  await supabaseFetch("/rest/v1/admin_invite_audit", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      event_type: eventType,
      candidate_email: details.candidateEmail,
      inviting_admin_id: details.invitingAdminId || null,
      ip_address: details.ipAddress || null,
      outcome_detail: details.outcomeDetail || null,
    }),
  }).catch(() => {});
}

export async function sendOtpEmail(candidateEmail, otp) {
  const siteUrl = SITE_URL.replace(/\/$/, "");
  const onboardingUrl = `${siteUrl}/admin-onboarding.html?email=${encodeURIComponent(candidateEmail)}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: OTP_EMAIL_FROM,
      to: candidateEmail,
      subject: "Your Idojuan Laundry admin setup code",
      text: `Your Idojuan Laundry admin setup code is ${otp}. It expires in 10 minutes. Open ${onboardingUrl} to finish setup.`,
    }),
  });
  if (!response.ok) console.error("Resend OTP delivery failed:", response.status, await response.text().catch(() => ""));
  return response.ok;
}