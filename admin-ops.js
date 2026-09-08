(function () {
  'use strict';
  const db = window.supabaseClient;
  if (!db) return;
  const state = { prices: [], customers: [], orders: [], items: [], messages: [], admins: [], settings: {}, faqs: [] };
  const el = (id) => document.getElementById(id);
  const money = (n) => `NGN ${Number(n || 0).toLocaleString('en-NG')}`;
  const text = (id, value) => { if (el(id)) el(id).textContent = value; };
  const message = (value, error) => { let node = el('ops-feedback'); if (!node) { node = document.createElement('p'); node.id = 'ops-feedback'; node.className = 'admin-feedback'; el('dashboard')?.prepend(node); } node.textContent = value; node.dataset.error = error ? 'true' : 'false'; };
  async function profile() { const { data } = await db.auth.getSession(); const email = data.session?.user.email; if (!email) return { session: null, profile: null }; const result = await db.from('users').select('id,email').eq('email', email).maybeSingle(); return { session: data.session, profile: result.data }; }
  async function audit(action, type, id, oldValue, newValue) { const current = await profile(); await db.from('audit_logs').insert({ admin_id: current.profile?.id || null, admin_email: current.session?.user.email, action, entity_type: type, entity_id: String(id || ''), old_value: oldValue || null, new_value: newValue || null }); }
  async function load() {
    const results = await Promise.all([
      db.from('prices').select('*').order('id'), db.from('customers').select('*').order('created_at', { ascending: false }),
      db.from('orders').select('*, customers(full_name, phone)').order('created_at', { ascending: false }), db.from('order_items').select('*').order('created_at'),
      db.from('messages').select('*').order('id', { ascending: false }), db.from('users').select('id,username,email,role,created_via,created_at').order('created_at', { ascending: false }), db.from('business_settings').select('*'), db.from('faqs').select('*').order('sort_order'), db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100)
    ]);
    const bad = results.find((r) => r.error); if (bad) throw bad.error;
    state.prices = results[0].data || []; state.customers = results[1].data || []; state.orders = results[2].data || []; state.items = results[3].data || [];
    state.messages = results[4].data || []; state.admins = results[5].data || [];
    state.settings = Object.fromEntries((results[6].data || []).map((r) => [r.key, r.value])); state.faqs = results[7].data || [];
    render(results[8].data || []); fillPriceSelect();
  }
  function render(audits) {
    text('metric-prices', state.prices.length); text('metric-messages', state.messages.filter((m) => !m.is_replied).length);
    const now = new Date(), day = new Date(now.getFullYear(), now.getMonth(), now.getDate()), month = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = state.orders.filter((o) => new Date(o.created_at) >= day), monthly = state.orders.filter((o) => new Date(o.created_at) >= month);
    text('metric-today-orders', today.length); text('metric-ready-orders', state.orders.filter((o) => o.status === 'ready').length);
    text('metric-revenue-today', money(today.reduce((n, o) => n + Number(o.total), 0))); text('metric-revenue-month', money(monthly.reduce((n, o) => n + Number(o.total), 0)));
    renderCustomers(); renderOrders(); renderDashboard(); renderSettings(); renderAdmins(); renderSecurity(); renderFaqs(); renderAudits(audits);
    const popular = {}; state.items.forEach((i) => { popular[i.item_name] = (popular[i.item_name] || 0) + Number(i.quantity); }); const list = el('popular-services');
    if (list) { list.textContent = ''; Object.entries(popular).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([name, qty]) => { const li = document.createElement('li'); li.textContent = `${name}: ${qty} items`; list.appendChild(li); }); }
  }
  function rowValues(row, values) { values.forEach((value) => { const cell = row.insertCell(); cell.textContent = String(value ?? ''); }); }
  function renderCustomers() {
    const body = el('customers-table-body'); if (!body) return; body.textContent = '';
    const q = (el('customer-search')?.value || '').toLowerCase();
    const returningOnly = Boolean(el('customer-returning-only')?.checked);
    state.customers.filter((c) => `${c.full_name} ${c.phone} ${c.email}`.toLowerCase().includes(q) && (!returningOnly || Number(c.total_orders) > 1)).forEach((c) => {
      const row = body.insertRow(); rowValues(row, [c.full_name, c.phone, c.email, c.total_orders, c.notes]);
    });
  }
  function renderOrders() {
    const body = el('orders-table-body'); if (!body) return; body.textContent = '';
    const q = (el('order-search')?.value || '').toLowerCase();
    const statusFilter = el('order-status-filter')?.value || '';
    const balanceOnly = Boolean(el('order-balance-only')?.checked);
    state.orders.filter((o) => {
      const balance = Number(o.total || 0) - Number(o.amount_paid || 0);
      return `${o.ticket_number} ${o.customers?.full_name} ${o.customers?.phone} ${o.status}`.toLowerCase().includes(q) && (!statusFilter || o.status === statusFilter) && (!balanceOnly || balance > 0);
    }).forEach((o) => {
      const row = body.insertRow(); rowValues(row, [o.ticket_number, o.customers?.full_name, o.customers?.phone, o.status, money(o.total), money(Number(o.total) - Number(o.amount_paid)), o.payment_status, o.expected_collection_at ? new Date(o.expected_collection_at).toLocaleString() : '', o.notes || '-']);
      const cell = row.insertCell(); const select = document.createElement('select'); ['received','washing','ironing','packaging','ready','collected','cancelled'].forEach((status) => select.add(new Option(status, status))); select.value = o.status;
      select.onchange = () => updateOrder(o, { status: select.value, ready_at: select.value === 'ready' ? new Date().toISOString() : o.ready_at, collected_at: select.value === 'collected' ? new Date().toISOString() : o.collected_at, amount_paid: select.value === 'collected' ? o.total : o.amount_paid, payment_status: select.value === 'collected' ? 'paid' : o.payment_status }); cell.appendChild(select);
      const balance = Math.max(0, Number(o.total || 0) - Number(o.amount_paid || 0));
      if (balance > 0) {
        const paymentInput = document.createElement('input'); paymentInput.type = 'number'; paymentInput.min = '1'; paymentInput.max = String(balance); paymentInput.step = '0.01'; paymentInput.placeholder = 'Payment'; paymentInput.className = 'payment-input';
        const paymentButton = document.createElement('button'); paymentButton.type = 'button'; paymentButton.textContent = 'Record payment'; paymentButton.onclick = () => recordPayment(o, Number(paymentInput.value));
        cell.append(paymentInput, paymentButton);
      }
      const notify = document.createElement('button'); notify.type = 'button'; notify.textContent = 'Notify Customer'; notify.onclick = () => notifyCustomer(o); cell.appendChild(notify);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete-order'; remove.textContent = 'Delete order'; remove.onclick = () => deleteOrder(o); cell.appendChild(remove);
    });
  }
  function renderDashboard() {
    const alerts = el('dashboard-alerts');
    if (alerts) { alerts.textContent = ''; const items = [
      `${state.orders.filter((o) => o.status === 'ready').length} order(s) ready for collection`,
      `${state.orders.filter((o) => Number(o.total || 0) > Number(o.amount_paid || 0)).length} order(s) with an outstanding balance`,
      `${state.messages.filter((m) => !m.is_replied).length} unread customer message(s)`
    ]; items.forEach((value) => { const li = document.createElement('li'); li.textContent = value; alerts.appendChild(li); }); }
    const body = el('dashboard-orders-body'); if (!body) return; body.textContent = '';
    state.orders.slice(0, 5).forEach((o) => { const row = body.insertRow(); rowValues(row, [o.ticket_number, o.customers?.full_name || '', o.status, money(o.total), new Date(o.created_at).toLocaleDateString()]); });
  }
  function renderSettings() {
    const fields = {
      'setting-hours': 'business_hours', 'setting-payment': 'payment_instructions', 'setting-whatsapp': 'whatsapp_number',
      'setting-business-name': 'business_name', 'setting-address': 'business_address', 'setting-email': 'business_email',
      'setting-phone': 'business_phone', 'setting-map-url': 'business_map_url', 'setting-turnaround-hours': 'default_turnaround_hours',
      'setting-ready-template': 'ready_notification_template'
    };
    Object.entries(fields).forEach(([id, key]) => { if (el(id)) el(id).value = state.settings[key] || ''; });
  }
  function renderAdmins() {
    const body = el('admin-table-body'); if (!body) return; body.textContent = '';
    state.admins.filter((admin) => admin.role === 'admin').forEach((admin) => { const row = body.insertRow(); rowValues(row, [admin.username || '-', admin.email, admin.role, admin.created_via || 'legacy', admin.created_at ? new Date(admin.created_at).toLocaleDateString() : '-']); });
  }
  async function renderSecurity() { const current = await profile(); text('security-session-email', current.session?.user.email || 'No active session'); }
  function renderFaqs() { const body = el('faq-table-body'); if (!body) return; body.textContent = ''; state.faqs.forEach((f) => { const row = body.insertRow(); rowValues(row, [f.question, f.answer, f.sort_order, f.is_active ? 'Active' : 'Hidden']); const cell = row.insertCell(); const button = document.createElement('button'); button.textContent = f.is_active ? 'Hide' : 'Show'; button.onclick = () => saveFaq(f, { is_active: !f.is_active }); cell.appendChild(button); }); }
  function renderAudits(rows) { const body = el('audit-table-body'); if (!body) return; body.textContent = ''; rows.forEach((a) => { const row = body.insertRow(); rowValues(row, [new Date(a.created_at).toLocaleString(), a.admin_email, a.action, a.entity_type, a.entity_id]); }); }
  function fillPriceSelect() { const select = el('order-price-select'); if (!select) return; select.textContent = ''; state.prices.forEach((p) => select.add(new Option(`${p.cloth_type} - ${money(p.washing_price)}`, p.id))); }
  function totals() { const subtotal = (state.pending || []).reduce((n, i) => n + i.line_total, 0), discount = Number(el('order-discount')?.value || 0), total = Math.max(0, subtotal - discount), paid = Number(el('order-paid')?.value || 0); text('order-subtotal', money(subtotal)); text('order-total', money(total)); text('order-payment-status', paid >= total && total ? 'paid' : paid ? 'partial' : 'unpaid'); return { subtotal, discount, total, paid }; }
  function renderPending() { const list = el('order-item-list'); if (!list) return; list.textContent = ''; (state.pending || []).forEach((i, index) => { const li = document.createElement('li'); li.textContent = `${i.item_name} x ${i.quantity} = ${money(i.line_total)}`; const button = document.createElement('button'); button.textContent = 'Remove'; button.onclick = () => { state.pending.splice(index, 1); renderPending(); totals(); }; li.appendChild(button); list.appendChild(li); }); }  async function updateOrder(order, changes) { if (changes.status === 'collected') { const current = await profile(); changes.collected_by = current.profile?.id || null; } const { error } = await db.from('orders').update(changes).eq('id', order.id); if (error) return message(error.message, true); await audit('Updated order', 'order', order.id, order, changes); await load(); message('Order updated.'); }
  async function deleteOrder(order) {
    const confirmed = window.confirm(`Delete order ${order.ticket_number}? This cannot be undone.`);
    if (!confirmed) return;
    const { error } = await db.from('orders').delete().eq('id', order.id);
    if (error) return message(error.message, true);
    await audit('Deleted order', 'order', order.id, { ticket_number: order.ticket_number, total: order.total }, null);
    await load(); message(`Order ${order.ticket_number} deleted.`);
  }  async function recordPayment(order, amount) {
    const outstanding = Math.max(0, Number(order.total || 0) - Number(order.amount_paid || 0));
    if (!Number.isFinite(amount) || amount <= 0) return message('Enter a valid payment amount.', true);
    if (amount > outstanding) return message(`Payment cannot exceed the outstanding balance of ${money(outstanding)}.`, true);
    const amountPaid = Number(order.amount_paid || 0) + amount;
    const changes = { amount_paid: amountPaid, payment_status: amountPaid >= Number(order.total || 0) ? 'paid' : 'partial' };
    const { error } = await db.from('orders').update(changes).eq('id', order.id);
    if (error) return message(error.message, true);
    await audit('Recorded payment', 'order', order.id, { amount_paid: order.amount_paid, payment_status: order.payment_status }, changes);
    await load(); message(`Payment of ${money(amount)} recorded.`);
  }  async function notifyCustomer(order) {
    const balance = Math.max(0, Number(order.total) - Number(order.amount_paid));
    const template = state.settings.ready_notification_template || 'Hello {{customer_name}}, your laundry order {{ticket_number}} is ready for collection. Your outstanding balance is {{outstanding_balance}}. You can collect during {{business_hours}}.';
    const note = template
      .replaceAll('{{customer_name}}', order.customers?.full_name || 'Customer')
      .replaceAll('{{ticket_number}}', order.ticket_number)
      .replaceAll('{{outstanding_balance}}', money(balance))
      .replaceAll('{{business_hours}}', state.settings.business_hours || 'our business hours');
    try {
      await navigator.clipboard.writeText(note);
      message('Notification copied. Paste it into WhatsApp.');
    } catch {
      window.prompt('Copy notification:', note);
    }
  }  async function saveFaq(faq, changes) { const { error } = await db.from('faqs').update(changes).eq('id', faq.id); if (error) return message(error.message, true); await audit('Updated FAQ', 'faq', faq.id, faq, changes); await load(); }
  function exportCsv(filename, rows) { if (!rows.length) return message('Nothing to export.'); const keys = Object.keys(rows[0]); const csv = [keys.join(','), ...rows.map((r) => keys.map((k) => String(r[k] ?? '').replaceAll(',', ' ')).join(','))].join(String.fromCharCode(10)); const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = filename; link.click(); URL.revokeObjectURL(link.href); }
  function filterPriceRows() {
    const query = (el('price-search')?.value || '').trim().toLowerCase();
    document.querySelectorAll('#pricing .dat tr, #pricing-female .dats tr').forEach((row) => { row.hidden = Boolean(query) && !row.textContent.toLowerCase().includes(query); });
  }  function bind() {
    state.pending = [];
    el('customer-search')?.addEventListener('input', renderCustomers); el('customer-returning-only')?.addEventListener('change', renderCustomers); el('order-search')?.addEventListener('input', renderOrders); el('order-status-filter')?.addEventListener('change', renderOrders); el('order-balance-only')?.addEventListener('change', renderOrders); el('price-search')?.addEventListener('input', filterPriceRows); el('refresh-operations')?.addEventListener('click', () => load().then(() => message('Data refreshed.')).catch((error) => message(error.message, true))); el('order-discount')?.addEventListener('input', totals); el('order-paid')?.addEventListener('input', totals);
    el('add-order-item')?.addEventListener('click', () => { const price = state.prices.find((p) => String(p.id) === el('order-price-select').value); if (!price) return; const quantity = Math.max(1, Number(el('order-item-qty').value || 1)), service = el('order-service-type').value, unit = Number(service === 'ironing' ? price.ironing_price : price.washing_price); state.pending.push({ price_id: price.id, item_name: price.cloth_type, service_type: service, quantity, unit_price: unit, line_total: unit * quantity }); renderPending(); totals(); });
    el('customer-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const row = { full_name: el('customer-name').value.trim(), phone: el('customer-phone').value.trim(), email: el('customer-email').value.trim().toLowerCase() || null, address: el('customer-address').value.trim() || null, notes: el('customer-notes').value.trim() || null }; const { error } = await db.from('customers').upsert(row, { onConflict: 'phone' }); if (error) return message(error.message, true); event.target.reset(); await load(); message('Customer saved.'); });
    el('order-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!state.pending.length) return message('Add at least one item first.', true);
      const t = totals();
      const customerPayload = {
        full_name: el('order-customer-name').value.trim(),
        phone: el('order-customer-phone').value.trim(),
        email: el('order-customer-email').value.trim().toLowerCase() || null
      };
      const customerWrite = await db.from('customers').upsert(customerPayload, { onConflict: 'phone' });
      if (customerWrite.error) return message(customerWrite.error.message, true);
      const customerRead = await db.from('customers').select('id').eq('phone', customerPayload.phone).maybeSingle();
      if (customerRead.error || !customerRead.data?.id) return message('Customer could not be loaded. Confirm the operations SQL and admin RLS policies are installed.', true);
      const ticket = `LD-${Date.now().toString().slice(-6)}`;
      const current = await profile();
      const orderWrite = await db.from('orders').insert({
        ticket_number: ticket, customer_id: customerRead.data.id, subtotal: t.subtotal, discount: t.discount,
        total: t.total, amount_paid: t.paid, payment_status: t.paid >= t.total ? 'paid' : t.paid ? 'partial' : 'unpaid',
        created_by: current.profile?.id || null,
        expected_collection_at: el('order-collection-date').value ? new Date(el('order-collection-date').value).toISOString() : new Date(Date.now() + Math.max(1, Number(state.settings.default_turnaround_hours || 48)) * 60 * 60 * 1000).toISOString(),
        notes: el('order-notes').value.trim()
      }).select().maybeSingle();
      if (orderWrite.error || !orderWrite.data?.id) return message(orderWrite.error?.message || 'Order could not be created. Check the operations SQL and RLS policies.', true);
      const items = state.pending.map((item) => ({ ...item, order_id: orderWrite.data.id }));
      const itemsWrite = await db.from('order_items').insert(items);
      if (itemsWrite.error) return message(itemsWrite.error.message, true);
      await audit('Created order', 'order', orderWrite.data.id, null, { ticket_number: ticket, total: t.total });
      event.target.reset(); state.pending = []; renderPending(); await load(); message(`Order ${ticket} created.`);
    });
    el('settings-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const rows = [
        ['business_hours', el('setting-hours').value], ['payment_instructions', el('setting-payment').value], ['whatsapp_number', el('setting-whatsapp').value],
        ['business_name', el('setting-business-name').value], ['business_address', el('setting-address').value], ['business_email', el('setting-email').value],
        ['business_phone', el('setting-phone').value], ['business_map_url', el('setting-map-url').value], ['default_turnaround_hours', el('setting-turnaround-hours').value],
        ['ready_notification_template', el('setting-ready-template').value]
      ];
      for (const [key, value] of rows) { const result = await db.from('business_settings').upsert({ key, value }); if (result.error) return message(result.error.message, true); }
      await audit('Updated business settings', 'settings', 'business_settings', null, Object.fromEntries(rows)); await load(); message('Settings saved.');
    });
    el('faq-form')?.addEventListener('submit', async (event) => { event.preventDefault(); const { error } = await db.from('faqs').insert({ question: el('faq-question').value.trim(), answer: el('faq-answer').value.trim(), sort_order: Number(el('faq-order').value || 0) }); if (error) return message(error.message, true); event.target.reset(); await load(); message('FAQ added.'); });
    if (el('onboarding-link')) el('onboarding-link').value = window.location.origin + '/admin-onboarding.html'; el('copy-onboarding-link')?.addEventListener('click', async () => { const link = el('onboarding-link')?.value; if (!link) return; try { await navigator.clipboard.writeText(link); message('Onboarding link copied.'); } catch { window.prompt('Copy onboarding link:', link); } });
    el('export-prices')?.addEventListener('click', () => exportCsv('prices.csv', state.prices)); el('export-orders')?.addEventListener('click', () => exportCsv('orders.csv', state.orders)); el('export-messages')?.addEventListener('click', async () => { const { data } = await db.from('messages').select('*').order('id', { ascending: false }); exportCsv('messages.csv', data || []); });
  }
  document.addEventListener('DOMContentLoaded', async () => { const { data } = await db.auth.getSession(); if (!data.session) return; bind(); try { await load(); } catch (error) { message(`Operations data could not load: ${error.message}`, true); } });
})();
