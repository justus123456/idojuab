import {
  getAdminProfile,
  getCallerUser,
  isValidEmail,
  jsonResponse,
  normalizeEmail,
  supabaseFetch,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  RESEND_API_KEY,
  OTP_EMAIL_FROM,
} from "../lib/admin-invite-shared.js";

const REPLY_EMAIL_FROM = Deno.env.get("REPLY_EMAIL_FROM") || OTP_EMAIL_FROM;

export default async (request) => {
  if (request.method !== "POST") return jsonResponse(405, { error: "Method not allowed." });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RESEND_API_KEY) return jsonResponse(500, { error: "Email reply service is not configured." });

  const caller = await getCallerUser(request);
  const admin = caller?.email ? await getAdminProfile(caller.email) : null;
  if (!admin) return jsonResponse(403, { error: "Reply request is not allowed." });

  let body;
  try { body = await request.json(); } catch { return jsonResponse(400, { error: "Invalid reply data." }); }
  const messageId = Number(body?.messageId);
  const recipient = normalizeEmail(body?.email);
  const reply = String(body?.reply || "").trim().replace(/\s+/g, " ");
  if (!Number.isInteger(messageId) || messageId < 1 || !isValidEmail(recipient) || !reply || reply.length > 2000) return jsonResponse(400, { error: "Enter a valid email and a reply of up to 2,000 characters." });

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: REPLY_EMAIL_FROM,
      to: recipient,
      subject: "Reply from Idojuan Laundry",
      text: reply,
    }),
  });
  if (!emailResponse.ok) {
    console.error("Customer reply email failed:", emailResponse.status, await emailResponse.text().catch(() => ""));
    return jsonResponse(502, { error: "The email could not be sent." });
  }

  const timestamp = new Date().toISOString();
  await supabaseFetch(`/rest/v1/messages?id=eq.${messageId}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ is_replied: true }) });
  await supabaseFetch("/rest/v1/message_replies", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ message_id: messageId, recipient_email: recipient, reply_body: reply, sent_by: admin.id, sent_at: timestamp }) });
  await supabaseFetch("/rest/v1/audit_logs", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ admin_id: admin.id, admin_email: caller.email, action: "Sent customer email reply", entity_type: "message", entity_id: String(messageId), new_value: { recipient } }) });
  return jsonResponse(200, { success: true });
};