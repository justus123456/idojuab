import {
  generateOtp,
  getAdminProfile,
  getCallerUser,
  getClientIp,
  hashOtp,
  isValidEmail,
  jsonResponse,
  normalizeEmail,
  randomSalt,
  requireServerConfig,
  sendOtpEmail,
  supabaseFetch,
  writeAudit,
} from "./admin-invite-shared.js";

const GENERIC_SUCCESS = { success: true, message: "Invite sent if the request is eligible." };

async function countRecentInvites(filter, sinceIso) {
  const response = await supabaseFetch(`/rest/v1/admin_otp_requests?select=id&${filter}&created_at=gte.${encodeURIComponent(sinceIso)}`);
  if (!response.ok) return 0;
  const rows = await response.json();
  return rows.length;
}

export default async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  const configError = requireServerConfig();
  if (configError) return jsonResponse(500, { error: configError });

  const ipAddress = getClientIp(request);
  const caller = await getCallerUser(request);
  if (!caller?.email) {
    return jsonResponse(403, { error: "Invite request is not allowed." });
  }

  const admin = await getAdminProfile(caller.email);
  if (!admin) {
    return jsonResponse(403, { error: "Invite request is not allowed." });
  }

  let payload;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse(400, { error: "Invalid JSON payload." });
  }

  const candidateEmail = normalizeEmail(payload?.email);
  if (!isValidEmail(candidateEmail)) {
    return jsonResponse(400, { error: "A valid candidate email is required." });
  }

  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const adminCount = await countRecentInvites(`invited_by=eq.${encodeURIComponent(admin.id)}`, hourAgo);
  const emailCount = await countRecentInvites(`candidate_email=eq.${encodeURIComponent(candidateEmail)}`, dayAgo);

  if (adminCount >= 5 || emailCount >= 3) {
    await writeAudit("invite_rate_limited", {
      candidateEmail,
      invitingAdminId: admin.id,
      ipAddress,
      outcomeDetail: "request_limit",
    });
    return jsonResponse(429, { error: "Too many requests. Please try again later." });
  }

  await supabaseFetch(`/rest/v1/admin_otp_requests?candidate_email=eq.${encodeURIComponent(candidateEmail)}&used_at=is.null&invalidated_at=is.null`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ invalidated_at: now.toISOString() }),
  });

  const otp = generateOtp();
  const salt = randomSalt();
  const otpHash = await hashOtp(candidateEmail, otp, salt);
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

  const insertResponse = await supabaseFetch("/rest/v1/admin_otp_requests", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      candidate_email: candidateEmail,
      otp_hash: otpHash,
      otp_salt: salt,
      invited_by: admin.id,
      expires_at: expiresAt,
      requested_ip: ipAddress,
    }),
  });

  if (!insertResponse.ok) {
    await writeAudit("invite_verify_failure", {
      candidateEmail,
      invitingAdminId: admin.id,
      ipAddress,
      outcomeDetail: "otp_insert_failed",
    });
    return jsonResponse(502, { error: "Invite request failed." });
  }

  const emailSent = await sendOtpEmail(candidateEmail, otp);
  await writeAudit("invite_requested", {
    candidateEmail,
    invitingAdminId: admin.id,
    ipAddress,
    outcomeDetail: emailSent ? "email_sent" : "email_failed",
  });

  if (!emailSent) {
    return jsonResponse(502, { error: "Invite email could not be sent." });
  }

  return jsonResponse(200, GENERIC_SUCCESS);
};
