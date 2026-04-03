// modules/servicing.js — Service Records

const ServicingModule = (() => {
  let _data = [], _currentPage = 1, _filterStatus = '', _filterSearch = '';

  async function render() {
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">🔧 Service Records</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="ServicingModule.exportCSV()">📥 Export CSV</button>
            <button class="btn btn-primary" onclick="ServicingModule.openAddModal()">+ Add Service Record</button>
          </div>
        </div>
        <div class="filters-bar">
          <input class="search-input" type="text" id="svc-search" placeholder="Search client / service type..."
            oninput="ServicingModule.onSearch(this.value)" />
          <select class="form-control" onchange="ServicingModule.onFilter(this.value)" style="width:auto">
            <option value="">All Status</option>
            ${CONFIG.SERVICE_STATUS.map(s => `<option value="${s.value}">${s.label}</option>`).join('')}
          </select>
        </div>
        <div id="svc-table-wrap">
          <div class="loading-overlay"><div class="spinner"></div><span>Loading service records...</span></div>
        </div>
      </div>`;
    await loadData();
  }

  async function loadData() {
    try {
      const res = await API.get('getServicing');
      _data = Array.isArray(res) ? res : (res.data || []);
      renderTable();
    } catch (e) {
      document.getElementById('svc-table-wrap').innerHTML = `
        <div class="empty-state"><div class="empty-icon">⚠️</div>
        <div class="empty-title">Could not load service data</div>
        <div class="empty-sub">${e.message}</div></div>`;
    }
  }

  function filterData() {
    return _data.filter(r =>
      (!_filterSearch || [r.client_name, r.service_type, r.summary].some(v => (v||'').toLowerCase().includes(_filterSearch.toLowerCase()))) &&
      (!_filterStatus || r.status === _filterStatus)
    );
  }

  function renderTable() {
    const filtered = filterData();
    const paged = UI.paginate(filtered, _currentPage, CONFIG.PAGE_SIZE);
    const wrap = document.getElementById('svc-table-wrap');
    if (!wrap) return;

    if (!paged.items.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">🔧</div><div class="empty-title">No service records found</div><div class="empty-sub">Click "Add Service Record" to get started</div></div>`;
      return;
    }

    wrap.innerHTML = `
      <div class="table-container">
        <table>
          <thead><tr>
            <th>Client</th><th>Service Date</th><th>Service Type</th>
            <th>Summary</th><th>Next Follow-up</th><th>Handled By</th>
            <th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>${paged.items.map(r => renderRow(r)).join('')}</tbody>
        </table>
      </div>
      ${UI.paginationHTML(paged, 'ServicingModule.goPage')}`;
  }

  function renderRow(r) {
    const initials = (r.client_name||'?').substring(0,2).toUpperCase();
    const days = UI.daysUntil(r.next_followup);
    const followupStyle = days !== null && days < 0 ? 'color:var(--danger);font-weight:600'
      : days !== null && days <= 7 ? 'color:var(--warning);font-weight:500' : '';
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--purple);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${initials}</div>
        <span style="font-weight:500">${r.client_name||'—'}</span>
      </div></td>
      <td style="color:var(--text-muted)">${UI.date(r.service_date)}</td>
      <td>${r.service_type||'—'}</td>
      <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-secondary);font-size:12px">${r.summary||'—'}</td>
      <td style="${followupStyle}">${UI.date(r.next_followup)}</td>
      <td style="color:var(--text-muted)">${r.handled_by||'—'}</td>
      <td>${UI.badge(r.status, CONFIG.SERVICE_STATUS)}</td>
      <td><div style="display:flex;gap:4px">
        <button class="btn btn-outline btn-sm" onclick="ServicingModule.openEditModal('${r.id}')" title="Edit">✏️</button>
        <button class="btn btn-success btn-sm" onclick="ServicingModule.markCompleted('${r.id}')" title="Mark Completed">✅</button>
        <button class="btn btn-danger btn-sm" onclick="ServicingModule.confirmDelete('${r.id}')" title="Delete">🗑️</button>
      </div></td>
    </tr>`;
  }

  function goPage(p) { _currentPage = p; renderTable(); }
  function onSearch(v) { _filterSearch = v; _currentPage = 1; renderTable(); }
  function onFilter(v) { _filterStatus = v; _currentPage = 1; renderTable(); }

  function buildForm(d = {}) {
    return `
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Client Name *</label>
          <input class="form-control" type="text" id="f-client-name" value="${d.client_name||''}" placeholder="Client full name" />
        </div>
        <div class="form-group">
          <label class="form-label">Service Date *</label>
          <input class="form-control" type="date" id="f-service-date" value="${d.service_date||new Date().toISOString().slice(0,10)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Service Type *</label>
          <select class="form-control" id="f-service-type">
            <option value="">-- Select --</option>
            ${CONFIG.SERVICE_TYPES.map(t => `<option value="${t}"${d.service_type===t?' selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Status</label>
          <select class="form-control" id="f-status">
            ${CONFIG.SERVICE_STATUS.map(s => `<option value="${s.value}"${(d.status||'scheduled')===s.value?' selected':''}>${s.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Next Follow-up Date</label>
          <input class="form-control" type="date" id="f-next-followup" value="${d.next_followup||''}" />
        </div>
        <div class="form-group">
          <label class="form-label">Handled By</label>
          <input class="form-control" type="text" id="f-handled-by" value="${d.handled_by||CONFIG.SYSTEM.advisor}" placeholder="Advisor name" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Summary *</label>
        <textarea class="form-control" id="f-summary" placeholder="What was discussed / done...">${d.summary||''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Action Plan</label>
        <textarea class="form-control" id="f-action-plan" placeholder="Next steps / action items...">${d.action_plan||''}</textarea>
      </div>`;
  }

  function getFormData() {
    const clientName  = document.getElementById('f-client-name').value.trim();
    const serviceDate = document.getElementById('f-service-date').value;
    const serviceType = document.getElementById('f-service-type').value;
    const summary     = document.getElementById('f-summary').value.trim();
    if (!clientName)  { UI.toast('Please enter client name', 'warning'); return null; }
    if (!serviceDate) { UI.toast('Please select service date', 'warning'); return null; }
    if (!serviceType) { UI.toast('Please select service type', 'warning'); return null; }
    if (!summary)     { UI.toast('Please enter a summary', 'warning'); return null; }
    return {
      client_name:   clientName, service_date: serviceDate,
      service_type:  serviceType, summary,
      action_plan:   document.getElementById('f-action-plan').value.trim(),
      next_followup: document.getElementById('f-next-followup').value,
      status:        document.getElementById('f-status').value,
      handled_by:    document.getElementById('f-handled-by').value.trim()
    };
  }

  function openAddModal() {
    UI.showModal('Add Service Record', buildForm(),
      `<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="ServicingModule.saveAdd()">💾 Save</button>`);
  }

  async function saveAdd() {
    const data = getFormData(); if (!data) return;
    try {
      await API.post('addServicing', data);
      UI.closeModal(); UI.toast('Service record added! ✅', 'success'); await loadData();
    } catch (e) { UI.toast('Save failed: ' + e.message, 'error'); }
  }

  function openEditModal(id) {
    const row = _data.find(r => String(r.id) === String(id)); if (!row) return;
    UI.showModal('Edit Service Record', buildForm(row),
      `<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
       <button class="btn btn-primary" onclick="ServicingModule.saveEdit('${id}')">💾 Save Changes</button>`);
  }

  async function saveEdit(id) {
    const data = getFormData(); if (!data) return;
    try {
      await API.post('updateServicing', { id, ...data });
      UI.closeModal(); UI.toast('Service record updated! ✅', 'success'); await loadData();
    } catch (e) { UI.toast('Update failed: ' + e.message, 'error'); }
  }

  async function markCompleted(id) {
    try {
      await API.post('updateServicing', { id, status: 'completed' });
      UI.toast('Marked as Completed ✅', 'success'); await loadData();
    } catch (e) { UI.toast('Action failed', 'error'); }
  }

  function confirmDelete(id) {
    UI.confirm('Delete this service record? This cannot be undone.', () => deleteRecord(id));
  }

  async function deleteRecord(id) {
    try {
      await API.post('deleteServicing', { id });
      UI.toast('Record deleted', 'success'); await loadData();
    } catch (e) { UI.toast('Delete failed', 'error'); }
  }

  function exportCSV() {
    UI.exportCSV(filterData().map(r => ({
      'Client': r.client_name, 'Service Date': r.service_date,
      'Service Type': r.service_type, 'Summary': r.summary,
      'Action Plan': r.action_plan, 'Next Follow-up': r.next_followup,
      'Handled By': r.handled_by,
      'Status': (CONFIG.SERVICE_STATUS.find(s=>s.value===r.status)||{label:r.status}).label
    })), 'Servicing');
  }

  return { render, loadData, exportCSV, openAddModal, openEditModal, saveAdd, saveEdit, markCompleted, confirmDelete, goPage, onSearch, onFilter };
})();
