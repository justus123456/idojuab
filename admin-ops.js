(function () {
  'use strict';
  const db = window.supabaseClient;
  if (!db) return;
  const state = { prices: [], customers: [], orders: [], items: [], messages: [], admins: [], settings: {}, faqs: [], payments: [], staff: [] };
  const el = (id) => document.getElementById(id);
  const money = (n) => `NGN ${Number(n || 0).toLocaleString('en-NG')}`;
  const text = (id, value) => { if (el(id)) el(id).textContent = value; };
  const message = (value, error) => { let node = el('ops-feedback'); if (!node) { node = document.createElement('p'); node.id = 'ops-feedback'; node.className = 'admin-feedback'; el('dashboard')?.prepend(node); } node.textContent = value; node.dataset.error = error ? 'true' : 'false'; };
  const makeUuid = () => globalThis.crypto?.randomUUID?.() || ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, (c) => (c ^ globalThis.crypto?.getRandomValues?.(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  async function profile() { const { data } = await db.auth.getSession(); const email = data.session?.user.email; if (!email) return { session: null, profile: null }; const result = await db.from('users').select('id,email').ilike('email', email).maybeSingle(); return { session: data.session, profile: result.data }; }
  async function audit(action, type, id, oldValue, newValue) { const current = await profile(); await db.from('audit_logs').insert({ admin_id: current.profile?.id || null, admin_email: current.session?.user.email, action, entity_type: type, entity_id: String(id || ''), old_value: oldValue || null, new_value: newValue || null }); }
  async function load() {
    const results = await Promise.all([
      db.from('prices').select('*').order('id'), db.from('customers').select('*').order('created_at', { ascending: false }),
      db.from('orders').select('*, customers(full_name, phone)').order('created_at', { ascending: false }), db.from('order_items').select('*').order('created_at'),
      db.from('messages').select('*').order('id', { ascending: false }), db.from('users').select('id,username,email,role,created_via,created_at').order('created_at', { ascending: false }), db.from('business_settings').select('*'), db.from('faqs').select('*').order('sort_order'), db.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100), db.from('payments').select('*, orders(ticket_number, customers(full_name))').order('created_at', { ascending: false }), db.from('staff_profiles').select('*')
    ]);
    const required = results.slice(0, 9).find((result) => result.error);
    if (required) throw required.error;
    const unavailable = [];
    if (results[9].error) unavailable.push('Payment Ledger');
    if (results[10].error) unavailable.push('Staff Roles');
    state.prices = results[0].data || []; state.customers = results[1].data || []; state.orders = results[2].data || []; state.items = results[3].data || [];
    state.messages = results[4].data || []; state.admins = results[5].data || [];
    state.settings = Object.fromEntries((results[6].data || []).map((r) => [r.key, r.value])); state.faqs = results[7].data || []; state.payments = results[9].data || []; state.staff = results[10].data || [];
    render(results[8].data || []); fillPriceSelect();
    if (unavailable.length) message(unavailable.join(' and ') + ' need the latest Supabase SQL setup before they can load.', true);
  }
  function render(audits) {
    const now = new Date(), day = new Date(now.getFullYear(), now.getMonth(), now.getDate()), month = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = state.orders.filter((o) => new Date(o.created_at) >= day), monthly = state.orders.filter((o) => new Date(o.created_at) >= month);
    const pending = state.orders.filter((o) => !['collected', 'cancelled'].includes(o.status)); const outstanding = state.orders.reduce((sum, o) => sum + Math.max(0, Number(o.total) - Number(o.amount_paid)), 0);
    text('metric-total-orders', state.orders.length); text('metric-pending-orders', pending.length); text('metric-ready-orders', state.orders.filter((o) => o.status === 'ready').length); text('metric-outstanding', money(outstanding)); text('metric-today-orders', today.length); text('metric-revenue-today', money(today.reduce((n, o) => n + Number(o.amount_paid), 0))); text('metric-revenue-month', money(monthly.reduce((n, o) => n + Number(o.amount_paid), 0))); text('metric-customers', state.customers.length);
    renderCustomers(); renderOrders(); renderDashboard(); renderRecords(); renderPayments(); renderReports(); renderSettings(); renderAdmins(); renderStaff(); renderSecurity(); renderFaqs(); renderAudits(audits);
    renderPopularServices();
  }
  function rowValues(row, values) { values.forEach((value) => { const cell = row.insertCell(); cell.textContent = String(value ?? ''); }); }
  function openDialog(id) { const dialog = el(id); if (dialog?.showModal) dialog.showModal(); }
  function closeDialog(id) { const dialog = el(id); if (dialog?.open) dialog.close(); }
  function detailRow(container, label, value) { const row = document.createElement('p'); const strong = document.createElement('strong'); strong.textContent = `${label}: `; row.append(strong, document.createTextNode(value)); container.appendChild(row); }
  function showCustomer(customer) {
    const panel = el('record-dialog-content'); if (!panel) return; panel.textContent = '';
    const heading = document.createElement('div'); heading.className = 'dialog-heading'; const title = document.createElement('h2'); title.textContent = customer.full_name; const close = document.createElement('button'); close.type = 'button'; close.className = 'dialog-close'; close.textContent = 'Close'; close.onclick = () => closeDialog('record-dialog'); heading.append(title, close); panel.appendChild(heading);
    detailRow(panel, 'Phone', customer.phone); detailRow(panel, 'Email', customer.email || 'Not recorded'); detailRow(panel, 'Notes', customer.notes || 'None');
    const history = state.orders.filter((order) => order.customer_id === customer.id); const subtitle = document.createElement('h3'); subtitle.textContent = `Order history (${history.length})`; panel.appendChild(subtitle);
    if (!history.length) { const empty = document.createElement('p'); empty.textContent = 'No orders recorded for this customer yet.'; panel.appendChild(empty); }
    history.slice(0, 10).forEach((order) => { const button = document.createElement('button'); button.type = 'button'; button.className = 'detail-link'; button.textContent = `${order.ticket_number} - ${order.status} - ${money(order.total)}`; button.onclick = () => showOrder(order); panel.appendChild(button); }); openDialog('record-dialog');
  }
  function showOrder(order) {
    const panel = el('record-dialog-content'); if (!panel) return; panel.textContent = '';
    const heading = document.createElement('div'); heading.className = 'dialog-heading'; const title = document.createElement('h2'); title.textContent = order.ticket_number; const close = document.createElement('button'); close.type = 'button'; close.className = 'dialog-close'; close.textContent = 'Close'; close.onclick = () => closeDialog('record-dialog'); heading.append(title, close); panel.appendChild(heading);
    detailRow(panel, 'Customer', order.customers?.full_name || 'Not recorded'); detailRow(panel, 'Status', order.status); detailRow(panel, 'Total', money(order.total)); detailRow(panel, 'Amount paid', money(order.amount_paid)); detailRow(panel, 'Balance', money(Math.max(0, Number(order.total) - Number(order.amount_paid)))); detailRow(panel, 'Expected collection', order.expected_collection_at ? new Date(order.expected_collection_at).toLocaleString() : 'Not set'); detailRow(panel, 'Notes', order.notes || 'None');
    const subtitle = document.createElement('h3'); subtitle.textContent = 'Items'; panel.appendChild(subtitle); const items = state.items.filter((item) => item.order_id === order.id);
    if (!items.length) { const empty = document.createElement('p'); empty.textContent = 'No item details recorded.'; panel.appendChild(empty); }
    items.forEach((item) => detailRow(panel, item.item_name, `${item.quantity} x ${money(item.unit_price)} (${item.service_type})`)); openDialog('record-dialog');
  }
  async function saveCustomer(row) {
    const result = await db.rpc('save_customer_record', { p_full_name: row.full_name, p_phone: row.phone, p_email: row.email, p_address: row.address, p_notes: row.notes });
    if (!result.error || result.error.code !== 'PGRST202') return result;
    const existing = await db.from('customers').select('id').eq('phone', row.phone).order('created_at', { ascending: true }).limit(1);
    if (existing.error) return existing;
    const existingId = existing.data?.[0]?.id;
    if (existingId) return db.from('customers').update(row).eq('id', existingId);
    return db.from('customers').insert(row);
  }
  function renderCustomers() {
    const body = el('customers-table-body'); if (!body) return; body.textContent = '';
    const q = (el('customer-search')?.value || '').toLowerCase();
    const returningOnly = Boolean(el('customer-returning-only')?.checked);
    state.customers.filter((c) => `${c.full_name} ${c.phone} ${c.email}`.toLowerCase().includes(q) && (!returningOnly || Number(c.total_orders) > 1)).forEach((c) => {
      const row = body.insertRow(); rowValues(row, [c.full_name, c.phone, c.email, c.total_orders, c.notes]); const action = row.insertCell(); const button = document.createElement('button'); button.type = 'button'; button.className = 'detail-link'; button.textContent = 'View'; button.onclick = () => showCustomer(c); action.appendChild(button);
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
      const cell = row.insertCell(); const view = document.createElement('button'); view.type = 'button'; view.className = 'detail-link'; view.textContent = 'View'; view.onclick = () => showOrder(o); cell.appendChild(view); const select = document.createElement('select'); ['received','washing','ironing','packaging','ready','collected','cancelled'].forEach((status) => select.add(new Option(status, status))); select.value = o.status;
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
  function renderPopularServices() { const list = el('popular-services'); if (!list) return; const popular = {}; state.items.forEach((item) => { const record = popular[item.item_name] || { quantity: 0, revenue: 0 }; record.quantity += Number(item.quantity); record.revenue += Number(item.line_total); popular[item.item_name] = record; }); list.textContent = ''; Object.entries(popular).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).forEach(([name, value]) => { const row = document.createElement('p'); row.textContent = name + " - " + value.quantity + " item(s) - " + money(value.revenue); list.appendChild(row); }); }
  function renderDashboard() {
    const alerts = el('dashboard-alerts');
    if (alerts) { alerts.textContent = ''; const items = [
      `${state.orders.filter((o) => o.status === 'ready').length} order(s) ready for collection`,
      `${state.orders.filter((o) => Number(o.total || 0) > Number(o.amount_paid || 0)).length} order(s) with an outstanding balance`,
      `${state.messages.filter((m) => !m.is_replied).length} unread customer message(s)`
    ]; items.forEach((value) => { const li = document.createElement('li'); li.textContent = value; alerts.appendChild(li); }); }
    ['received', 'washing', 'ironing', 'packaging', 'ready', 'collected'].forEach((status) => text(`pipeline-${status}`, state.orders.filter((order) => order.status === status).length));
    const chart = el('revenue-chart');
    if (chart) { chart.textContent = ''; const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); date.setHours(0, 0, 0, 0); return date; }); const values = days.map((date) => state.orders.filter((order) => { const created = new Date(order.created_at); return created >= date && created < new Date(date.getTime() + 86400000); }).reduce((sum, order) => sum + Number(order.amount_paid || 0), 0)); const highest = Math.max(...values, 1); values.forEach((value, index) => { const bar = document.createElement('div'); bar.innerHTML = `<span>${days[index].toLocaleDateString('en-NG', { weekday: 'short' })}</span><i style="height:${Math.max(8, Math.round((value / highest) * 100))}%"></i><b>${money(value)}</b>`; chart.appendChild(bar); }); }    const body = el('dashboard-orders-body'); if (!body) return; body.textContent = '';
    state.orders.slice(0, 5).forEach((o) => { const row = body.insertRow(); rowValues(row, [o.ticket_number, o.customers?.full_name || '', o.status, o.payment_status, money(o.total), new Date(o.created_at).toLocaleDateString()]); });
  }
  function renderRecords() {
    text('record-customer-count', state.customers.length); text('record-order-count', state.orders.length); text('record-collected-count', state.orders.filter((order) => order.status === 'collected').length);
    const body = el('records-orders-body'); if (!body) return; body.textContent = '';
    state.orders.slice(0, 20).forEach((order) => { const row = body.insertRow(); rowValues(row, [order.ticket_number, order.customers?.full_name || '-', order.status, money(order.total), new Date(order.created_at).toLocaleDateString()]); const cell = row.insertCell(); const button = document.createElement('button'); button.type = 'button'; button.className = 'detail-link'; button.textContent = 'View'; button.onclick = () => showOrder(order); cell.appendChild(button); });
  }
  function renderPayments() {
    const select = el('payment-order-select'); if (select) { select.textContent = ''; state.orders.filter((order) => Number(order.total) > Number(order.amount_paid)).forEach((order) => select.add(new Option(`${order.ticket_number} - ${order.customers?.full_name || 'Customer'} (${money(Number(order.total) - Number(order.amount_paid))} due)`, order.id))); }
    const body = el('payments-table-body'); if (!body) return; body.textContent = '';
    state.payments.slice(0, 100).forEach((payment) => { const row = body.insertRow(); rowValues(row, [new Date(payment.created_at).toLocaleString(), payment.orders?.ticket_number || '-', payment.orders?.customers?.full_name || '-', money(payment.amount), payment.payment_method, payment.recorded_by || '-']); });
  }
  function renderReports() {
    const paid = state.orders.reduce((sum, order) => sum + Number(order.amount_paid || 0), 0); const total = state.orders.reduce((sum, order) => sum + Number(order.total || 0), 0); const outstanding = Math.max(0, total - paid);
    text('report-paid-revenue', money(paid)); text('report-outstanding', money(outstanding)); text('report-average-order', money(state.orders.length ? total / state.orders.length : 0)); text('report-returning-customers', state.customers.filter((customer) => Number(customer.total_orders) > 1).length);
    const methodNode = el('report-payment-methods'); if (methodNode) { methodNode.textContent = ''; const methods = {}; state.payments.forEach((payment) => { methods[payment.payment_method] = (methods[payment.payment_method] || 0) + Number(payment.amount || 0); }); Object.entries(methods).forEach(([method, amount]) => { const row = document.createElement('p'); row.textContent = `${method}: ${money(amount)}`; methodNode.appendChild(row); }); if (!Object.keys(methods).length) methodNode.textContent = 'No ledger payments recorded yet.'; }
    const serviceNode = el('report-services'); if (serviceNode) { serviceNode.textContent = ''; const items = {}; state.items.forEach((item) => { items[item.item_name] = (items[item.item_name] || 0) + Number(item.line_total || 0); }); Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([name, amount]) => { const row = document.createElement('p'); row.textContent = `${name}: ${money(amount)}`; serviceNode.appendChild(row); }); if (!Object.keys(items).length) serviceNode.textContent = 'No order items recorded yet.'; }
  }
  function renderStaff() {
    const body = el('staff-table-body'); if (!body) return; body.textContent = ''; const profiles = new Map(state.staff.map((profile) => [String(profile.user_id), profile]));
    state.admins.filter((admin) => admin.role === 'admin').forEach((admin) => { const profile = profiles.get(String(admin.id)); const row = body.insertRow(); rowValues(row, [admin.username || '-', admin.email, profile?.operational_role || 'manager']); const cell = row.insertCell(); const select = document.createElement('select'); ['owner', 'manager', 'secretary', 'laundry_staff'].forEach((role) => select.add(new Option(role.replaceAll('_', ' '), role))); select.value = profile?.operational_role || 'manager'; select.onchange = () => saveStaffRole(admin, select.value); cell.appendChild(select); });
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
  async function renderSecurity() { const { data, error } = await db.auth.getSession(); text('security-session-email', error ? 'Session unavailable' : data.session?.user.email || 'No active session'); }
  function renderFaqs() { const body = el('faq-table-body'); if (!body) return; body.textContent = ''; state.faqs.forEach((f) => { const row = body.insertRow(); rowValues(row, [f.question, f.answer, f.sort_order, f.is_active ? 'Active' : 'Hidden']); const cell = row.insertCell(); const button = document.createElement('button'); button.textContent = f.is_active ? 'Hide' : 'Show'; button.onclick = () => saveFaq(f, { is_active: !f.is_active }); cell.appendChild(button); }); }
  function renderAudits(rows) { const body = el('audit-table-body'); if (!body) return; body.textContent = ''; rows.forEach((a) => { const row = body.insertRow(); rowValues(row, [new Date(a.created_at).toLocaleString(), a.admin_email, a.action, a.entity_type, a.entity_id]); }); }
  function fillPriceSelect() {
    const select = el('order-price-select');
    const note = el('order-price-note');
    if (!select) return;
    const prices = state.prices
      .filter((price) => price.id && String(price.cloth_type || '').trim() && Number.isFinite(Number(price.washing_price)) && Number.isFinite(Number(price.ironing_price)))
      .sort((a, b) => String(a.cloth_type).localeCompare(String(b.cloth_type)) || Number(a.id) - Number(b.id));
    const counts = prices.reduce((map, price) => map.set(String(price.cloth_type).toLowerCase(), (map.get(String(price.cloth_type).toLowerCase()) || 0) + 1), new Map());
    select.textContent = '';
    select.add(new Option(prices.length ? 'Select an item' : 'No price items available', ''));
    prices.forEach((price) => {
      const name = String(price.cloth_type);
      const duplicateLabel = counts.get(name.toLowerCase()) > 1 ? ` - price row ${price.id}` : '';
      select.add(new Option(`${name}${duplicateLabel} - washing ${money(price.washing_price)}, ironing ${money(price.ironing_price)}`, price.id));
    });
    if (prices.length) select.value = String(prices[0].id);
    select.disabled = prices.length === 0;
    const duplicateCount = prices.filter((price) => counts.get(String(price.cloth_type).toLowerCase()) > 1).length;
    if (note) note.textContent = prices.length
      ? `${prices.length} saved price item${prices.length === 1 ? '' : 's'} available.${duplicateCount ? ` ${duplicateCount} rows share a name; remove old duplicates in Prices.` : ''}`
      : 'Add a valid item under Prices before creating an order.';
  }
  function totals() { const subtotal = (state.pending || []).reduce((n, i) => n + i.line_total, 0), discount = Number(el('order-discount')?.value || 0), total = Math.max(0, subtotal - discount), paid = Number(el('order-paid')?.value || 0); text('order-subtotal', money(subtotal)); text('order-total', money(total)); text('order-payment-status', paid >= total && total ? 'paid' : paid ? 'partial' : 'unpaid'); return { subtotal, discount, total, paid }; }
  function renderPending() { const list = el('order-item-list'); if (!list) return; list.textContent = ''; (state.pending || []).forEach((i, index) => { const li = document.createElement('li'); li.textContent = `${i.item_name} x ${i.quantity} = ${money(i.line_total)}`; const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Remove'; button.onclick = () => { state.pending.splice(index, 1); renderPending(); totals(); }; li.appendChild(button); list.appendChild(li); }); }  async function updateOrder(order, changes) { if (changes.status === 'collected') { const current = await profile(); changes.collected_by = current.profile?.id || null; } const { error } = await db.from('orders').update(changes).eq('id', order.id); if (error) return message(error.message, true); await audit('Updated order', 'order', order.id, order, changes); await load(); message('Order updated.'); }
  async function deleteOrder(order) {
    const confirmed = window.confirm(`Delete order ${order.ticket_number}? This cannot be undone.`);
    if (!confirmed) return;
    const { error } = await db.from('orders').delete().eq('id', order.id);
    if (error) return message(error.message, true);
    await audit('Deleted order', 'order', order.id, { ticket_number: order.ticket_number, total: order.total }, null);
    await load(); message(`Order ${order.ticket_number} deleted.`);
  }  async function recordPayment(order, amount) {
    const outstanding = Math.max(0, Number(order.total || 0) - Number(order.amount_paid || 0));
    if (!Number.isFinite(amount) || amount <= 0 || amount > outstanding) return message(`Enter an amount up to ${money(outstanding)}.`, true);
    const current = await profile(); const payment = await db.from('payments').insert({ order_id: order.id, amount, payment_method: 'cash', recorded_by: current.profile?.id || null });
    if (payment.error) return message(payment.error.message, true);
    const amountPaid = Number(order.amount_paid || 0) + amount; const changes = { amount_paid: amountPaid, payment_status: amountPaid >= Number(order.total || 0) ? 'paid' : 'partial' };
    const { error } = await db.from('orders').update(changes).eq('id', order.id); if (error) return message(error.message, true);
    await audit('Recorded payment', 'payment', order.id, null, { amount, payment_method: 'cash' }); await load(); message(`Payment of ${money(amount)} recorded.`);
  }  async function saveStaffRole(admin, role) { const { error } = await db.from('staff_profiles').upsert({ user_id: admin.id, operational_role: role }); if (error) return message(error.message, true); await audit('Updated staff role', 'staff_profile', admin.id, null, { role }); await load(); message('Staff role updated.'); }
  async function recordLedgerPayment() { const order = state.orders.find((entry) => entry.id === el('payment-order-select')?.value); const amount = Number(el('payment-amount')?.value || 0); const method = el('payment-method')?.value || 'cash'; if (!order) return message('Choose an order with an outstanding balance.', true); const outstanding = Math.max(0, Number(order.total) - Number(order.amount_paid)); if (!Number.isFinite(amount) || amount <= 0 || amount > outstanding) return message(`Enter an amount up to ${money(outstanding)}.`, true); const current = await profile(); const payment = await db.from('payments').insert({ order_id: order.id, amount, payment_method: method, recorded_by: current.profile?.id || null }); if (payment.error) return message(payment.error.message, true); const amountPaid = Number(order.amount_paid) + amount; const update = await db.from('orders').update({ amount_paid: amountPaid, payment_status: amountPaid >= Number(order.total) ? 'paid' : 'partial' }).eq('id', order.id); if (update.error) return message(update.error.message, true); await audit('Recorded ledger payment', 'payment', order.id, null, { amount, method }); el('payment-amount').value = ''; await load(); message(`Payment of ${money(amount)} recorded.`); }
  async function notifyCustomer(order) {
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
  function exportCsv(filename, rows) {
    if (!rows.length) return message('Nothing to export.');
    const escapeCell = (value) => {
      let cell = String(value ?? '');
      if (/^[=+\-@]/.test(cell)) cell = `'${cell}`;
      return `"${cell.replaceAll('"', '""')}"`;
    };
    const keys = Object.keys(rows[0]);
    const csv = [keys.map(escapeCell).join(','), ...rows.map((row) => keys.map((key) => escapeCell(row[key])).join(','))].join(String.fromCharCode(10));
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = filename; link.click(); URL.revokeObjectURL(link.href);
  }  function bind() {
    state.pending = [];    el('open-customer-form')?.addEventListener('click', () => openDialog('customer-dialog'));
    el('open-order-form')?.addEventListener('click', async () => {
      state.pending = [];
      renderPending();
      totals();
      try { await load(); } catch (error) { message(error.message || 'Could not refresh the price list.', true); }
      openDialog('order-dialog');
    });
    document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => closeDialog(button.dataset.closeDialog)));
    document.querySelectorAll('.workspace-dialog').forEach((dialog) => dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); }));
    el('customer-search')?.addEventListener('input', renderCustomers); el('customer-returning-only')?.addEventListener('change', renderCustomers); el('order-search')?.addEventListener('input', renderOrders); el('order-status-filter')?.addEventListener('change', renderOrders); el('order-balance-only')?.addEventListener('change', renderOrders); el('price-search')?.addEventListener('input', filterPriceRows); el('refresh-operations')?.addEventListener('click', () => load().then(() => message('Data refreshed.')).catch((error) => message(error.message, true))); window.addEventListener('admin-data-refresh', () => load().catch((error) => message('Audit log could not refresh: ' + error.message, true))); el('order-discount')?.addEventListener('input', totals); el('order-paid')?.addEventListener('input', totals);
    el('add-order-item')?.addEventListener('click', () => {
      const select = el('order-price-select');
      const feedback = el('order-item-feedback');
      const price = state.prices.find((entry) => String(entry.id) === String(select?.value || ''));
      if (!price) { const detail = 'Choose an item from the price list first.'; if (feedback) { feedback.textContent = detail; feedback.dataset.error = 'true'; } message(detail, true); return; }
      const quantity = Math.max(1, Number(el('order-item-qty').value || 1));
      const service = el('order-service-type').value;
      const unit = Number(service === 'ironing' ? price.ironing_price : price.washing_price);
      if (!Number.isFinite(unit)) return message('This price row has an invalid service price.', true);
      state.pending.push({ price_id: price.id, item_name: price.cloth_type, service_type: service, quantity, unit_price: unit, line_total: unit * quantity });
      renderPending(); totals();
      if (feedback) { feedback.textContent = `${price.cloth_type} added.`; feedback.dataset.error = 'false'; }
    });
    el('customer-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const feedback = el('customer-feedback');
      const row = { full_name: el('customer-name').value.trim(), phone: el('customer-phone').value.trim(), email: el('customer-email').value.trim().toLowerCase() || null, address: el('customer-address').value.trim() || null, notes: el('customer-notes').value.trim() || null };
      if (!row.full_name || !row.phone) { if (feedback) { feedback.textContent = 'Full name and phone are required.'; feedback.dataset.error = 'true'; } return; }
      const submitButton = event.submitter;
      if (submitButton) submitButton.disabled = true;
      try {
        const { error } = await saveCustomer(row);
        if (error) { const detail = 'Could not save customer: ' + error.message; if (feedback) { feedback.textContent = detail; feedback.dataset.error = 'true'; } message(detail, true); return; }
        if (feedback) { feedback.textContent = 'Customer saved.'; feedback.dataset.error = 'false'; }
        event.target.reset(); closeDialog('customer-dialog');
        try { await load(); } catch (refreshError) { message('Customer saved, but the list could not refresh: ' + refreshError.message, true); }
        message('Customer saved.');
      } catch (error) {
        const detail = 'Could not save customer: ' + (error.message || 'Unknown error');
        if (feedback) { feedback.textContent = detail; feedback.dataset.error = 'true'; }
        message(detail, true);
      } finally { if (submitButton) submitButton.disabled = false; }
    });
    el('order-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const feedback = el('order-feedback');
      const fail = (detail) => { if (feedback) { feedback.textContent = detail; feedback.dataset.error = 'true'; } message(detail, true); };
      if (state.creatingOrder) return;
      if (!state.pending.length) return fail('Add at least one item first.');
      state.creatingOrder = true;
      const submitButton = event.submitter;
      if (submitButton) submitButton.disabled = true;
      try {
        const t = totals();
        const customerPayload = { full_name: el('order-customer-name').value.trim(), phone: el('order-customer-phone').value.trim(), email: el('order-customer-email').value.trim().toLowerCase() || null };
        if (!customerPayload.full_name || !customerPayload.phone) return fail('Customer name and phone are required.');
        const customerWrite = await saveCustomer(customerPayload);
        if (customerWrite.error) return fail('Could not save the customer: ' + customerWrite.error.message);
        let customerId = customerWrite.data;
        if (!customerId) { const customerRead = await db.from('customers').select('id').eq('phone', customerPayload.phone).order('created_at', { ascending: true }).limit(1); if (customerRead.error || !customerRead.data?.[0]?.id) return fail('Customer could not be loaded: ' + (customerRead.error?.message || 'no customer ID returned')); customerId = customerRead.data[0].id; }
        const ticket = `LD-${makeUuid().replaceAll('-', '').slice(0, 8).toUpperCase()}`;
        const submissionKey = makeUuid();
        const orderWrite = await db.rpc('create_walk_in_order', { p_customer_id: customerId, p_ticket_number: ticket, p_submission_key: submissionKey, p_subtotal: t.subtotal, p_discount: t.discount, p_total: t.total, p_amount_paid: t.paid, p_expected_collection_at: el('order-collection-date').value ? new Date(el('order-collection-date').value).toISOString() : new Date(Date.now() + Math.max(1, Number(state.settings.default_turnaround_hours || 48)) * 60 * 60 * 1000).toISOString(), p_notes: el('order-notes').value.trim(), p_items: state.pending });
        if (orderWrite.error || !orderWrite.data) return fail(orderWrite.error?.message || 'Order could not be created. Run the latest operations SQL in Supabase.');
        const orderId = orderWrite.data;
        event.target.reset(); state.pending = []; renderPending(); closeDialog('order-dialog');
        try { await load(); } catch (refreshError) { message('Order created, but the list could not refresh: ' + refreshError.message, true); }
        message(`Order ${ticket} created.`);
      } catch (error) { fail('Could not create order: ' + (error.message || 'Unknown error')); }
      finally { state.creatingOrder = false; if (submitButton) submitButton.disabled = false; }
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
    el('record-ledger-payment')?.addEventListener('click', recordLedgerPayment);
    el('export-orders-report')?.addEventListener('click', () => exportCsv('orders-report.csv', state.orders.map((order) => ({ ticket_number: order.ticket_number, customer: order.customers?.full_name || '', status: order.status, total: order.total, amount_paid: order.amount_paid, outstanding: Math.max(0, Number(order.total) - Number(order.amount_paid)), created_at: order.created_at })))); el('export-payments-report')?.addEventListener('click', () => exportCsv('payments-report.csv', state.payments.map((payment) => ({ date: payment.created_at, ticket_number: payment.orders?.ticket_number || '', customer: payment.orders?.customers?.full_name || '', amount: payment.amount, payment_method: payment.payment_method, recorded_by: payment.recorded_by || '' })))); el('export-customers-report')?.addEventListener('click', () => exportCsv('customers-report.csv', state.customers.map((customer) => ({ full_name: customer.full_name, phone: customer.phone, email: customer.email || '', total_orders: customer.total_orders, created_at: customer.created_at }))));
    el('refresh-dashboard')?.addEventListener('click', () => load().then(() => message('Dashboard refreshed.')).catch((error) => message(error.message, true)));
    document.querySelectorAll('[data-pipeline-status]').forEach((button) => button.addEventListener('click', () => { const filter = el('order-status-filter'); if (filter) filter.value = button.dataset.pipelineStatus; window.location.hash = 'orders'; renderOrders(); }));
    document.querySelectorAll('[data-dashboard-page]').forEach((link) => link.addEventListener('click', () => { window.location.hash = link.dataset.dashboardPage; }));        const exportStamp = new Date().toISOString().slice(0, 10);
    el('export-prices')?.addEventListener('click', () => exportCsv(`prices-${exportStamp}.csv`, state.prices.map((price) => ({ item: price.cloth_type, washing_price: price.washing_price, ironing_price: price.ironing_price, gender: price.gender }))));
    el('export-orders')?.addEventListener('click', () => exportCsv(`orders-${exportStamp}.csv`, state.orders.map((order) => ({ ticket_number: order.ticket_number, customer: order.customers?.full_name || '', phone: order.customers?.phone || '', status: order.status, total: order.total, amount_paid: order.amount_paid, outstanding: Math.max(0, Number(order.total) - Number(order.amount_paid)), payment_status: order.payment_status, expected_collection: order.expected_collection_at || '', created_at: order.created_at, notes: order.notes || '' }))));
    el('export-customers')?.addEventListener('click', () => exportCsv(`customers-${exportStamp}.csv`, state.customers.map((customer) => ({ full_name: customer.full_name, phone: customer.phone, email: customer.email || '', total_orders: customer.total_orders, address: customer.address || '', notes: customer.notes || '', created_at: customer.created_at }))));
    el('export-revenue')?.addEventListener('click', () => exportCsv(`revenue-${exportStamp}.csv`, state.orders.map((order) => ({ ticket_number: order.ticket_number, customer: order.customers?.full_name || '', date: order.created_at, total: order.total, amount_paid: order.amount_paid, outstanding: Math.max(0, Number(order.total) - Number(order.amount_paid)), status: order.status }))));
    el('export-messages')?.addEventListener('click', async () => { const result = await db.from('messages').select('id,name,email,message,is_replied,created_at').order('id', { ascending: false }); if (result.error) return message('Messages could not be exported: ' + result.error.message, true); exportCsv(`messages-${exportStamp}.csv`, result.data || []); });
  }
  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('[data-current-year]').forEach((node) => { node.textContent = String(new Date().getFullYear()); });
    bind();
    text('security-session-email', 'Checking session...');
    let sessionResult;
    try {
      sessionResult = await Promise.race([
        db.auth.getSession(),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error('Session check timed out. Please refresh and sign in again.')), 8000))
      ]);
    } catch (error) {
      text('security-session-email', 'Session unavailable');
      message(error.message, true);
      return;
    }
    if (!sessionResult.data?.session) {
      text('security-session-email', 'No active session');
      window.location.href = 'login.html';
      return;
    }
    await renderSecurity();
    try { await load(); } catch (error) { message('Admin data could not load. Run the latest Supabase SQL setup, then refresh. Details: ' + error.message, true); }
  });
})();
