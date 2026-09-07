const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function normalizeTicket(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "").slice(0, 30);
}

function formatFirstName(fullName) {
  return String(fullName || "Customer").trim().split(/\s+/)[0] || "Customer";
}

async function supabaseFetch(path, options = {}) {
  return fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });
}

export default async (request) => {
  if (request.method !== "GET") {
    return jsonResponse(405, { error: "Method not allowed." });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Order status configuration is missing.");
    return jsonResponse(500, { error: "Order status is not configured." });
  }

  const ticket = normalizeTicket(new URL(request.url).searchParams.get("ticket"));
  if (!ticket) {
    return jsonResponse(400, { error: "Ticket number is required." });
  }

  const params = new URLSearchParams({
    select: "ticket_number,status,total,amount_paid,payment_status,expected_collection_at,ready_at,collected_at,customers(full_name)",
    ticket_number: `eq.${ticket}`,
    limit: "1",
  });

  const response = await supabaseFetch(`/rest/v1/orders?${params.toString()}`);
  if (!response.ok) {
    console.error("Order status lookup failed:", response.status, await response.text().catch(() => ""));
    return jsonResponse(502, { error: "Order status lookup failed." });
  }

  const rows = await response.json();
  const order = rows[0];
  if (!order) {
    return jsonResponse(404, { error: "No order found for that ticket number." });
  }

  const total = Number(order.total || 0);
  const paid = Number(order.amount_paid || 0);

  return jsonResponse(200, {
    ticketNumber: order.ticket_number,
    customerName: formatFirstName(order.customers?.full_name),
    status: order.status,
    total,
    amountPaid: paid,
    outstandingBalance: Math.max(total - paid, 0),
    paymentStatus: order.payment_status,
    expectedCollectionAt: order.expected_collection_at,
    readyAt: order.ready_at,
    collectedAt: order.collected_at,
  });
};
