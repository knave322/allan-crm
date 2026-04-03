// modules/payments.js — Payment Tracker

const PaymentsModule = (() => {
  let _data = [], _currentPage = 1, _filterStatus = '', _filterSearch = '', _filterInsurer = '';

  async function render() {
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">💳 Payment Tracker</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="PaymentsModule.exportCSV()">📥 Export CSV</button>
            <button class="btn btn-primary" onclick="PaymentsModule.openAddModal()">+ Add Payment</button>
          </div>
        </div>
        <div class="filters-bar">
          <input class="search-input" type="text" id="pay-search" placeholder="Search client / policy / insurer..."
            oninput="PaymentsModule.onSearch(this.value)" />
          <select class="form-control" id="pay-status" onchange="PaymentsModule.onFilter(this.value)" style="width:auto">
            <option value="">All Status</option>
            ${CONFIG.PAYMENT_STATUS.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
          </select>
          <select class="form-control" id="pay-insurer" onchange="PaymentsModule.onInsurer(this.value)" style="width:auto">
            <option value="">All Insurers</option>
            ${CONFIG.INSURERS.map(i => `<option value="${i}">${i}</option>`).join('')}
          </select>
        </div>
        <div id="payments-table-wrap">
          <div class="loading-overlay"><div class="spinner"></div><span>Loading payment records...</span></div>
        </div>
      </div>`;
    await loadData();
  }

  async function loadData() {
    try {
      const res = await API.get('getPayments');
      _data = Array.isArray(res) ? res : (res.data || []);
      renderTable();
    } catch (e) {
      document.getElementById('payments-table-wrap').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Could not load payment data</div>
          <div class="empty-sub">${e.message}</div>
        </div>`;
    }
  }

  function filterData() {
    return _data.filter(r =>
      (!_filterSearch || [r.client_name, r.policy_number, r.insurer].some(v => (v||'').toLowerCase().includes(_filterSearch.toLowerCase()))) &&
      (!_filterStatus  || r.status  === _filterStatus) &&
      (!_filterInsurer || r.insurer === _filterInsurer)
    );
  }

  function renderTable() {
    const filtered = filterData();
    const paged = UI.paginate(filtered, _currentPage, CONFIG.PAGE_SIZE);
    const wrap = document.getElementById('payments-table-wrap');
    if (!wrap) return;

    if (!paged.items.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">No payment records found</div><div class="empty-sub">Click "Add Payment" to get started</div></div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Client</th><th>Policy No.</th><th>Insurer</th>
            <th>Premium</th><th>Frequency</th><th>Next Due Date</th>
            <th>Status</th><th>Notes</th><th>Actions</th>
          </tr></thead>
          <tbody>${paged.items.map(row => renderRow(row)).join('')}</tbody>
        </table>
      </div>
      ${UI.paginationHTML(paged, 'PaymentsModule.goPage')}`;
  }

  function renderRow(r) {
    const days = UI.daysUntil(r.next_due_date);
    const dueStyle = days !== null && days <= CONFIG.REMINDERS.payment_due_danger_days
      ? 'color:var(--danger);font-weight:600'
      : days !== null && days <= CONFIG.REMINDERS.payment_due_warning_days
      ? 'color:var(--warning);font-weight:500' : '';
    const initials = (r.client_name||'?').substring(0,2).toUpperCase();
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${initials}</div>
        <span style="font-weight:500">${r.client_name||'—'}</span>
      </div></td>
      <td style="color:var(--text-muted)">${r.policy_number||'—'}</td>
      <td>${r.insurer||'—'}</td>
      <td style="font-weight:600">${UI.currency(r.premium)}</td>
      <td style="color:var(--text-muted)">${r.frequency||'—'}</td>
      <td style="${dueStyle}">${UI.date(r.next_due_date)}${days !== null ? `<br><small style="font-weight:normal;font-size:11px">${days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `in ${days}d`}</small>` : ''}</td>
      <td>${UI.badge(r.status, CONFIG.PAYMENT_STATUS)}</td>
      <td style="color:var(--text-muted);font-size:12px;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.notes||'—'}</td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="btn btn-outline btn-sm" onclick="PaymentsModule.openEditModal('${r.id}')" title="Edit">✏️</button>
          <button class="btn btn-success btn-sm" onclick="PaymentsModule.markPaid('${r.id}')" title="Mark as Paid">✅</button>
          <button class="btn btn-danger btn-sm" onclick="PaymentsModule.confirmDelete('${r.id}')" title="Delete">🗑️</button>
        </div>
      </td>
    </tr>`;
  }

  function goPage(p) { _currentPage = p; renderTable(); }
  function onSearch(v) { _filterSearch = v; _currentPage = 1; renderTable(); }
  function onFilter(v) { _filterStatus = v; _currentPage = 1; renderTable(); }
  function onInsurer(v) { _filterInsurer = v; _currentPage = 1; renderTable(); }

  function buildForm(d = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client Name *</label>
          <input class="form-control" type="text" id="f-client-name" value="${d.client_name||''}" placeholder="e.g. Ahmad bin Ali" />
        </div>
        <div class="form-group">
          <label class="form-label">Policy Number</label>
          <input class="form-control" type="text" id="f-policy-number" value="${d.policy_number||''}" placeholder="e.g. AIA-2024-001234" />
        </div>
        <div class="form-group">
          <label class="form-label">Insurer *</label>
          <select class="form-control" id="f-insurer">
            <option value="">-- Select --</option>
            ${CONFIG.INSURERS.map(i => `<option value="${i}"${d.insurer===i?' selected':''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Product Name</label>
          <input class="form-control" type="text" id="f-product" value="${d.product_name||''}" placeholder="e.g. AIA A-Life Legacy" />
        </div>
        <div class="form-group">
          <label class="form-label">Premium (${CONFIG.SYSTEM.currency}) *</label>
          <input class="form-control" type="number" id="f-premium" value="${d.premium||''}" placeholder="0.00" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">Frequency</label>
          <select class="form-control" id="f-frequency">
            <option value="">-- Select --</option>
            ${CONFIG.PAYMENT_FREQUENCIES.map(f => `<option value="${f}"${d.frequency===f?' selected':''}>${f}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Next Due Date *</label>
          <input class="form-control" type="date" id="f-due-date" value="${d.next_due_date||''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="f-status">
            ${CONFIG.PAYMENT_STATUS.map(s => `<option value="${s.value}"${(d.status||'pending')===s.value?' selected':''}>${s.label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="f-notes" placeholder="Any additional notes...">${d.notes||''}</textarea>
      </div>`;
  }

  function getFormData() {
    const clientName = document.getElementById('f-client-name').value.trim();
    const insurer    = document.getElementById('f-insurer').value;
    const premium    = document.getElementById('f-premium').value;
    const dueDate    = document.getElementById('f-due-date').value;
    if (!clientName) { UI.toast('Please enter client name', 'warning'); return null; }
    if (!insurer)    { UI.toast('Please select insurer', 'warning'); return null; }
    if (!premium)    { UI.toast('Please enter premium amount', 'warning'); return null; }
    if (!dueDate)    { UI.toast('Please select next due date', 'warning'); return null; }
    return {
      client_name:   clientName,
      policy_number: document.getElementById('f-policy-number').value.trim(),
      insurer, premium: parseFloat(premium),
      frequency:     document.getElementById('f-frequency').value,
      next_due_date: dueDate,
      status:        document.getElementById('f-status').value,
      product_name:  document.getElementById('f-product').value.trim(),
      notes:         document.getElementById('f-notes').value.trim()
    };
  }

  function openAddModal() {
    UI.showModal('Add Payment Record', buildForm(),
      `<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="PaymentsModule.saveAdd()">💾 Save</button>`);
  }

  async function saveAdd() {
    const data = getFormData(); if (!data) return;
    try {
      await API.post('addPayment', data);
      UI.closeModal(); UI.toast('Payment record added! ✅', 'success'); await loadData();
    } catch (e) { UI.toast('Save failed: ' + e.message, 'error'); }
  }

  function openEditModal(id) {
    const row = _data.find(r => String(r.id) === String(id)); if (!row) return;
    UI.showModal('Edit Payment Record', buildForm(row),
      `<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="PaymentsModule.saveEdit('${id}')">💾 Save Changes</button>`);
  }

  async function saveEdit(id) {
    const data = getFormData(); if (!data) return;
    try {
      await API.post('updatePayment', { id, ...data });
      UI.closeModal(); UI.toast('Payment record updated! ✅', 'success'); await loadData();
    } catch (e) { UI.toast('Update failed: ' + e.message, 'error'); }
  }

  async function markPaid(id) {
    try {
      await API.post('updatePayment', { id, status: 'paid' });
      UI.toast('Marked as Paid ✅', 'success'); await loadData();
    } catch (e) { UI.toast('Action failed', 'error'); }
  }

  function confirmDelete(id) {
    UI.confirm('Delete this payment record? This cannot be undone.', () => deleteRecord(id));
  }

  async function deleteRecord(id) {
    try {
      await API.post('deletePayment', { id });
      UI.toast('Record deleted', 'success'); await loadData();
    } catch (e) { UI.toast('Delete failed', 'error'); }
  }

  function exportCSV() {
    UI.exportCSV(filterData().map(r => ({
      'Client': r.client_name, 'Policy No': r.policy_number,
      'Insurer': r.insurer, 'Product': r.product_name,
      'Premium': r.premium, 'Frequency': r.frequency,
      'Next Due Date': r.next_due_date,
      'Status': (CONFIG.PAYMENT_STATUS.find(s=>s.value===r.status)||{label:r.status}).label,
      'Notes': r.notes
    })), 'Payments');
  }

  return { render, loadData, exportCSV, openAddModal, openEditModal, saveAdd, saveEdit, markPaid, confirmDelete, goPage, onSearch, onFilter, onInsurer };
})();
