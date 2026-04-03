// modules/claims.js — Claims Management

const ClaimsModule = (() => {
  let _data = [], _currentPage = 1, _filterStatus = '', _filterSearch = '';

  async function render() {
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">🏥 Claims Management</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="ClaimsModule.exportCSV()">📥 Export CSV</button>
            <button class="btn btn-primary" onclick="ClaimsModule.openAddModal()">+ Add Claim</button>
          </div>
        </div>
        <div class="filters-bar">
          <input class="search-input" type="text" id="claims-search" placeholder="Search client / claim no / insurer..."
            oninput="ClaimsModule.onSearch(this.value)" />
          <select class="form-control" onchange="ClaimsModule.onFilter(this.value)" style="width:auto">
            <option value="">All Status</option>
            ${CONFIG.CLAIM_STATUS.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
          </select>
        </div>
        <div id="claims-table-wrap">
          <div class="loading-overlay"><div class="spinner"></div><span>Loading claim records...</span></div>
        </div>
      </div>`;
    await loadData();
  }

  async function loadData() {
    try {
      const res = await API.get('getClaims');
      _data = Array.isArray(res) ? res : (res.data || []);
      renderTable();
    } catch (e) {
      document.getElementById('claims-table-wrap').innerHTML = `
        <div class="empty-state"><div class="empty-icon">⚠️</div>
        <div class="empty-title">Could not load claims data</div>
        <div class="empty-sub">${e.message}</div></div>`;
    }
  }

  function filterData() {
    return _data.filter(r =>
      (!_filterSearch || [r.client_name, r.claim_number, r.insurer].some(v => (v||'').toLowerCase().includes(_filterSearch.toLowerCase()))) &&
      (!_filterStatus || r.status === _filterStatus)
    );
  }

  function renderTable() {
    const filtered = filterData();
    const paged = UI.paginate(filtered, _currentPage, CONFIG.PAGE_SIZE);
    const wrap = document.getElementById('claims-table-wrap');
    if (!wrap) return;

    if (!paged.items.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">🏥</div><div class="empty-title">No claim records found</div><div class="empty-sub">Click "Add Claim" to get started</div></div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Client</th><th>Claim No.</th><th>Insurer</th><th>Type</th>
            <th>Claim Amount</th><th>Submit Date</th><th>Last Update</th>
            <th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>${paged.items.map(r => renderRow(r)).join('')}</tbody>
        </table>
      </div>
      ${UI.paginationHTML(paged, 'ClaimsModule.goPage')}`;
  }

  function renderRow(r) {
    const initials = (r.client_name||'?').substring(0,2).toUpperCase();
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--success);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${initials}</div>
        <span style="font-weight:500">${r.client_name||'—'}</span>
      </div></td>
      <td style="color:var(--text-muted);font-size:12px">${r.claim_number||'—'}</td>
      <td>${r.insurer||'—'}</td>
      <td>${r.claim_type||'—'}</td>
      <td style="font-weight:600">${r.claim_amount ? UI.currency(r.claim_amount) : '—'}</td>
      <td style="color:var(--text-muted)">${UI.date(r.submit_date)}</td>
      <td style="color:var(--text-muted)">${UI.date(r.last_update)}</td>
      <td>${UI.badge(r.status, CONFIG.CLAIM_STATUS)}</td>
      <td><div style="display:flex;gap:4px">
        <button class="btn btn-outline btn-sm" onclick="ClaimsModule.openDetail('${r.id}')" title="View Details">👁️</button>
        <button class="btn btn-outline btn-sm" onclick="ClaimsModule.openEditModal('${r.id}')" title="Edit">✏️</button>
        <button class="btn btn-danger btn-sm" onclick="ClaimsModule.confirmDelete('${r.id}')" title="Delete">🗑️</button>
      </div></td>
    </tr>`;
  }

  function goPage(p) { _currentPage = p; renderTable(); }
  function onSearch(v) { _filterSearch = v; _currentPage = 1; renderTable(); }
  function onFilter(v) { _filterStatus = v; _currentPage = 1; renderTable(); }

  function openDetail(id) {
    const r = _data.find(x => String(x.id) === String(id)); if (!r) return;
    UI.showModal(`Claim: ${r.client_name}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        ${[['Client', r.client_name], ['Claim No.', r.claim_number], ['Insurer', r.insurer],
           ['Type', r.claim_type], ['Status', UI.badge(r.status, CONFIG.CLAIM_STATUS)],
           ['Claim Amount', r.claim_amount ? UI.currency(r.claim_amount) : '—'],
           ['Approved', r.approved_amount ? UI.currency(r.approved_amount) : '—'],
           ['Paid Out', r.paid_amount ? UI.currency(r.paid_amount) : '—'],
           ['Submit Date', UI.date(r.submit_date)], ['Last Update', UI.date(r.last_update)]
          ].map(([l,v]) => `<div style="background:var(--bg-base);padding:10px;border-radius:6px;border:1px solid var(--border)">
            <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">${l}</div>
            <div style="font-size:13.5px;font-weight:500">${v||'—'}</div>
          </div>`).join('')}
      </div>
      ${r.notes ? `<div style="background:var(--bg-base);padding:12px;border-radius:6px;border:1px solid var(--border)">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Notes</div>
        <div style="font-size:13px;color:var(--text-secondary);line-height:1.6">${r.notes}</div>
      </div>` : ''}
      ${r.rejection_reason ? `<div style="background:#fee2e2;padding:12px;border-radius:6px;margin-top:8px">
        <div style="font-size:11px;color:var(--danger);margin-bottom:4px;font-weight:600">Rejection Reason</div>
        <div style="font-size:13px;color:#991b1b">${r.rejection_reason}</div>
      </div>` : ''}`,
      `<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>
       <button class="btn btn-primary" onclick="UI.closeModal();ClaimsModule.openEditModal('${r.id}')">Edit</button>`);
  }

  function buildForm(d = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client Name *</label>
          <input class="form-control" type="text" id="f-client-name" value="${d.client_name||''}" placeholder="Client full name" />
        </div>
        <div class="form-group">
          <label class="form-label">Policy Number</label>
          <input class="form-control" type="text" id="f-policy-number" value="${d.policy_number||''}" placeholder="Policy number" />
        </div>
        <div class="form-group">
          <label class="form-label">Claim Number</label>
          <input class="form-control" type="text" id="f-claim-number" value="${d.claim_number||''}" placeholder="Claim reference number" />
        </div>
        <div class="form-group">
          <label class="form-label">Insurer *</label>
          <select class="form-control" id="f-insurer">
            <option value="">-- Select --</option>
            ${CONFIG.INSURERS.map(i => `<option value="${i}"${d.insurer===i?' selected':''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Claim Type</label>
          <select class="form-control" id="f-claim-type">
            <option value="">-- Select --</option>
            ${CONFIG.CLAIM_TYPES.map(t => `<option value="${t}"${d.claim_type===t?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="f-status">
            ${CONFIG.CLAIM_STATUS.map(s => `<option value="${s.value}"${(d.status||'draft')===s.value?' selected':''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Claim Amount (${CONFIG.SYSTEM.currency})</label>
          <input class="form-control" type="number" id="f-claim-amount" value="${d.claim_amount||''}" placeholder="0.00" step="0.01" />
        </div>
        <div class="form-group">
          <label class="form-label">Approved Amount</label>
          <input class="form-control" type="number" id="f-approved-amount" value="${d.approved_amount||''}" placeholder="0.00" step="0.01" />
        </div>
        <div class="form-group">
          <label class="form-label">Submit Date</label>
          <input class="form-control" type="date" id="f-submit-date" value="${d.submit_date||''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Last Update</label>
          <input class="form-control" type="date" id="f-last-update" value="${d.last_update||new Date().toISOString().slice(0,10)}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Rejection Reason</label>
        <input class="form-control" type="text" id="f-rejection" value="${d.rejection_reason||''}" placeholder="If rejected, state reason" />
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-control" id="f-notes" placeholder="Any additional notes...">${d.notes||''}</textarea>
      </div>`;
  }

  function getFormData() {
    const clientName = document.getElementById('f-client-name').value.trim();
    const insurer    = document.getElementById('f-insurer').value;
    if (!clientName) { UI.toast('Please enter client name', 'warning'); return null; }
    if (!insurer)    { UI.toast('Please select insurer', 'warning'); return null; }
    return {
      client_name:      clientName,
      policy_number:    document.getElementById('f-policy-number').value.trim(),
      claim_number:     document.getElementById('f-claim-number').value.trim(),
      insurer,
      claim_type:       document.getElementById('f-claim-type').value,
      status:           document.getElementById('f-status').value,
      claim_amount:     parseFloat(document.getElementById('f-claim-amount').value)||0,
      approved_amount:  parseFloat(document.getElementById('f-approved-amount').value)||0,
      submit_date:      document.getElementById('f-submit-date').value,
      last_update:      document.getElementById('f-last-update').value,
      rejection_reason: document.getElementById('f-rejection').value.trim(),
      notes:            document.getElementById('f-notes').value.trim()
    };
  }

  function openAddModal() {
    UI.showModal('Add Claim Record', buildForm(),
      `<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="ClaimsModule.saveAdd()">💾 Save</button>`);
  }

  async function saveAdd() {
    const data = getFormData(); if (!data) return;
    try {
      await API.post('addClaim', data);
      UI.closeModal(); UI.toast('Claim record added! ✅', 'success'); await loadData();
    } catch (e) { UI.toast('Save failed: ' + e.message, 'error'); }
  }

  function openEditModal(id) {
    const row = _data.find(r => String(r.id) === String(id)); if (!row) return;
    UI.showModal('Edit Claim Record', buildForm(row),
      `<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="ClaimsModule.saveEdit('${id}')">💾 Save Changes</button>`);
  }

  async function saveEdit(id) {
    const data = getFormData(); if (!data) return;
    try {
      await API.post('updateClaim', { id, ...data });
      UI.closeModal(); UI.toast('Claim record updated! ✅', 'success'); await loadData();
    } catch (e) { UI.toast('Update failed: ' + e.message, 'error'); }
  }

  function confirmDelete(id) {
    UI.confirm('Delete this claim record? This cannot be undone.', () => deleteRecord(id));
  }

  async function deleteRecord(id) {
    try {
      await API.post('deleteClaim', { id });
      UI.toast('Record deleted', 'success'); await loadData();
    } catch (e) { UI.toast('Delete failed', 'error'); }
  }

  function exportCSV() {
    UI.exportCSV(filterData().map(r => ({
      'Client': r.client_name, 'Policy No': r.policy_number,
      'Claim No': r.claim_number, 'Insurer': r.insurer,
      'Type': r.claim_type, 'Claim Amount': r.claim_amount,
      'Approved': r.approved_amount, 'Submit Date': r.submit_date,
      'Status': (CONFIG.CLAIM_STATUS.find(s=>s.value===r.status)||{label:r.status}).label,
      'Notes': r.notes
    })), 'Claims');
  }

  return { render, loadData, exportCSV, openAddModal, openEditModal, openDetail, saveAdd, saveEdit, confirmDelete, goPage, onSearch, onFilter };
})();
