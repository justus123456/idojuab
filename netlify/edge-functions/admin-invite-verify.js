import {
  getClientIp,
  hashOtp,
  isValidEmail,
  jsonResponse,
  normalizeEmail,
  requireServerConfig,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  supabaseFetch,
  validatePasswordStrength,
  writeAudit,
} from "../lib/admin-invite-shared.js";

const GENERIC_FAILURE = { error: "Invalid or expired code." };

async function getValidOtp(candidateEmail) {
  const params = new URLSearchParams({
    select: "id,candidate_email,otp_hash,otp_salt,invited_by,attempts,max_attempts,expires_at",
    candidate_email: `eq.${candidateEmail}`,
    used_at: "is.null",
    invalidated_at: "is.null",
    order: "created_at.desc",
    limit: "1",
  });
  const response = await supabaseFetch(`/rest/v1/admin_otp_requests?${params.toString()}`);
  if (!response.ok) return null;
  const rows = await response.json();
  const otp = rows[0];
  if (!otp || new Date(otp.expires_at).getTime() <= Date.now()) return null;
  if (Number(otp.attempts) >= Number(otp.max_attempts)) return null;
  return otp;
}

async function isIpVerificationLimited(ipAddress) {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    select: "id",
    ip_address: `eq.${ipAddress}`,
    created_at: `gte.${since}`,
  });
  const response = await supabaseFetch(`/rest/v1/admin_invite_audit?${params.toString()}`);
  if (!response.ok) return true;
  const rows = await response.json();
  return rows.length >= 10;
}

async function incrementAttempts(otp) {
  const attempts = Number(otp.attempts || 0) + 1;
  const body = attempts >= Number(otp.max_attempts)
    ? { attempts, invalidated_at: new Date().toISOString() }
    : { attempts };

  await supabaseFetch(`/rest/v1/admin_otp_requests?id=eq.${encodeURIComponent(otp.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(body),
  });

  return attempts;
}

async function createAuthUser(email, password) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
    }),
  });

  if (!response.ok) return null;
  return response.json();
}

async function deleteAuthUser(userId) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
  }).catch(() => {});
}

export default async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const configError = requireServerConfig();
  if (configError) return jsonResponse(500, { error: configError });

  const ipAddress = getClientIp(request);
  if (await isIpVerificationLimited(ipAddress)) {
    return jsonResponse(429, { error: "Too many requests. Please try again later." });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const candidateEmail = normalizeEmail(payload?.email);
  const otpValue = String(payload?.otp || "").trim();
  const password = String(payload?.password || "");

  if (!isValidEmail(candidateEmail) || !/^[0-9]{6}$/.test(otpValue) || !validatePasswordStrength(password)) {
    return jsonResponse(400, GENERIC_FAILURE);
  }

  const otp = await getValidOtp(candidateEmail);
  if (!otp) {
    await writeAudit("invite_verify_failure", {
      candidateEmail,
      ipAddress,
      outcomeDetail: "missing_or_expired",
    });
    return jsonResponse(400, GENERIC_FAILURE);
  }

  const attempts = await incrementAttempts(otp);
  if (attempts > Number(otp.max_attempts)) {
    await writeAudit("invite_verify_failure", {
      candidateEmail,
      invitingAdminId: otp.invited_by,
      ipAddress,
      outcomeDetail: "max_attempts",
    });
    return jsonResponse(400, GENERIC_FAILURE);
  }

  const expectedHash = await hashOtp(candidateEmail, otpValue, otp.otp_salt);
  if (expectedHash !== otp.otp_hash) {
    await writeAudit("invite_verify_failure", {
      candidateEmail,
      invitingAdminId: otp.invited_by,
      ipAddress,
      outcomeDetail: "wrong_code",
    });
    return jsonResponse(400, GENERIC_FAILURE);
  }

  const authUser = await createAuthUser(candidateEmail, password);
  const userId = authUser?.user?.id || authUser?.id;
  if (!userId) {
    await writeAudit("invite_verify_failure", {
      candidateEmail,
      invitingAdminId: otp.invited_by,
      ipAddress,
      outcomeDetail: "auth_create_failed",
    });
    return jsonResponse(502, { error: "Account could not be created." });
  }

  const profileResponse = await supabaseFetch("/rest/v1/users", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      email: candidateEmail,
      username: candidateEmail.split("@")[0],
      role: "admin",
      created_via: "otp_invite",
      invited_by: otp.invited_by,
    }),
  });

  if (!profileResponse.ok) {
    await deleteAuthUser(userId);
    await writeAudit("invite_verify_failure", {
      candidateEmail,
      invitingAdminId: otp.invited_by,
      ipAddress,
      outcomeDetail: "profile_insert_failed",
    });
    return jsonResponse(502, { error: "Account could not be created." });
  }

  await supabaseFetch(`/rest/v1/admin_otp_requests?id=eq.${encodeURIComponent(otp.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ used_at: new Date().toISOString() }),
  });

  await writeAudit("invite_verify_success", {
    candidateEmail,
    invitingAdminId: otp.invited_by,
    ipAddress,
    outcomeDetail: "admin_created",
  });

  return jsonResponse(200, { success: true });
};

