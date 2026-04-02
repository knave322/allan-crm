// ============================================================
// modules/claims.js — 🏥 理赔管理模块
// ⚠️  请勿修改此文件。标签/状态请在 config.js 修改
// ============================================================

const ClaimsModule = (() => {

  let _data = [];
  let _currentPage = 1;
  let _filterStatus = '';
  let _filterSearch = '';
  let _filterType   = '';

  // ── 渲染主页面 ────────────────────────────────────────────
  async function render() {
    document.getElementById('page-content').innerHTML = `
      <!-- 理赔统计 -->
      <div class="stats-grid" id="claims-stats"></div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🏥 理赔管理</div>
          <button class="btn btn-primary" onclick="ClaimsModule.openAddModal()">
            ＋ 新增理赔记录
          </button>
        </div>

        <!-- 筛选 -->
        <div class="filter-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="cl-search" placeholder="搜索客户姓名 / 理赔编号 / 保险公司..."
              oninput="ClaimsModule.onSearch(this.value)" />
          </div>
          <select id="cl-status-filter" onchange="ClaimsModule.onFilter(this.value)" style="width:auto;min-width:140px">
            <option value="">全部状态</option>
            ${UI.buildStatusOptions(CONFIG.CLAIM_STATUS)}
          </select>
          <select id="cl-type-filter" onchange="ClaimsModule.onType(this.value)" style="width:auto;min-width:160px">
            <option value="">全部理赔类别</option>
            ${CONFIG.CLAIM_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>

        <!-- 表格 -->
        <div id="claims-table-wrap">
          <div class="loading-overlay"><div class="spinner"></div><span>加载理赔记录...</span></div>
        </div>
      </div>`;

    await loadData();
  }

  // ── 加载数据 ──────────────────────────────────────────────
  async function loadData() {
    try {
      const res = await API.getClaims();
      _data = res.data || [];
      renderStats();
      renderTable();
    } catch (e) {
      document.getElementById('claims-table-wrap').innerHTML =
        UI.emptyState('⚠️', '无法加载理赔数据', '请检查 config.js 中的 API_URL 设置');
    }
  }

  // ── 统计卡片 ──────────────────────────────────────────────
  function renderStats() {
    const stats = getStats();
    const el = document.getElementById('claims-stats');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue">🏥</div>
        <div class="stat-info">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">总理赔记录</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">🔄</div>
        <div class="stat-info">
          <div class="stat-value">${stats.processing}</div>
          <div class="stat-label">审核中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div class="stat-info">
          <div class="stat-value">${stats.approved}</div>
          <div class="stat-label">已批准</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">💰</div>
        <div class="stat-info">
          <div class="stat-value">${UI.currency(stats.totalAmount)}</div>
          <div class="stat-label">总理赔金额</div>
        </div>
      </div>`;
  }

  // ── 渲染表格 ──────────────────────────────────────────────
  function renderTable() {
    const filtered = filterData();
    const total    = filtered.length;
    const paged    = filtered.slice(
      (_currentPage - 1) * CONFIG.PAGE_SIZE,
      _currentPage * CONFIG.PAGE_SIZE
    );

    const wrap = document.getElementById('claims-table-wrap');
    if (!wrap) return;

    if (paged.length === 0) {
      wrap.innerHTML = UI.emptyState('🏥', '没有找到理赔记录', '点击右上角「新增理赔记录」开始添加');
      return;
    }

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>客户姓名</th>
              <th>理赔编号</th>
              <th>保险公司</th>
              <th>理赔类别</th>
              <th>理赔金额</th>
              <th>提交日期</th>
              <th>最后更新</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${paged.map(row => renderRow(row)).join('')}
          </tbody>
        </table>
      </div>
      ${UI.renderPagination(total, _currentPage, CONFIG.PAGE_SIZE, (p) => {
        _currentPage = p;
        renderTable();
      })}`;
  }

  function renderRow(row) {
    return `<tr>
      <td>
        <div class="flex-center gap-8">
          <div class="avatar">${UI.avatarText(row.client_name)}</div>
          <div>
            <div class="fw-500">${row.client_name || '—'}</div>
            <div class="td-muted">${row.policy_number || ''}</div>
          </div>
        </div>
      </td>
      <td class="td-muted">${row.claim_number || '—'}</td>
      <td>${row.insurer || '—'}</td>
      <td class="td-muted">${row.claim_type || '—'}</td>
      <td class="amount fw-600">${row.claim_amount ? UI.currency(row.claim_amount) : '—'}</td>
      <td class="td-muted">${UI.formatDate(row.submit_date)}</td>
      <td class="td-muted">${UI.formatDate(row.last_update)}</td>
      <td>${UI.statusBadge(CONFIG.CLAIM_STATUS, row.status)}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm" onclick="ClaimsModule.viewDetail('${row.id}')" title="查看详情">👁️</button>
          <button class="btn btn-outline btn-sm" onclick="ClaimsModule.openEditModal('${row.id}')" title="编辑">✏️</button>
          <button class="btn btn-outline btn-sm" onclick="ClaimsModule.confirmDelete('${row.id}')" style="color:var(--danger)" title="删除">🗑️</button>
        </div>
      </td>
    </tr>`;
  }

  // ── 筛选 ──────────────────────────────────────────────────
  function filterData() {
    return _data.filter(row => {
      const s = _filterSearch.toLowerCase();
      const matchSearch = !s ||
        (row.client_name  || '').toLowerCase().includes(s) ||
        (row.claim_number || '').toLowerCase().includes(s) ||
        (row.insurer      || '').toLowerCase().includes(s);
      const matchStatus = !_filterStatus || row.status === _filterStatus;
      const matchType   = !_filterType   || row.claim_type === _filterType;
      return matchSearch && matchStatus && matchType;
    });
  }

  function onSearch(v) { _filterSearch = v; _currentPage = 1; renderTable(); }
  function onFilter(v) { _filterStatus = v; _currentPage = 1; renderTable(); }
  function onType(v)   { _filterType   = v; _currentPage = 1; renderTable(); }

  // ── 详情弹窗 ──────────────────────────────────────────────
  function viewDetail(id) {
    const row = _data.find(r => String(r.id) === String(id));
    if (!row) return;
    const html = `
      <div class="timeline">
        <div class="tl-item">
          <div class="tl-dot">📋</div>
          <div class="tl-body">
            <div class="tl-title">理赔提交</div>
            <div class="tl-meta">${UI.formatDate(row.submit_date)}</div>
          </div>
        </div>
        ${row.status !== 'draft' && row.status !== 'submitted' ? `
        <div class="tl-item">
          <div class="tl-dot">🔄</div>
          <div class="tl-body">
            <div class="tl-title">保险公司审核中</div>
            <div class="tl-meta">最后更新：${UI.formatDate(row.last_update)}</div>
          </div>
        </div>` : ''}
        ${row.status === 'approved' || row.status === 'paid_out' ? `
        <div class="tl-item">
          <div class="tl-dot">✅</div>
          <div class="tl-body">
            <div class="tl-title">理赔批准</div>
            <div class="tl-meta">批准金额：${UI.currency(row.approved_amount || row.claim_amount)}</div>
          </div>
        </div>` : ''}
        ${row.status === 'paid_out' ? `
        <div class="tl-item">
          <div class="tl-dot">💰</div>
          <div class="tl-body">
            <div class="tl-title">赔款已发放</div>
            <div class="tl-meta">发放金额：${UI.currency(row.paid_amount || row.approved_amount)}</div>
          </div>
        </div>` : ''}
        ${row.status === 'rejected' ? `
        <div class="tl-item">
          <div class="tl-dot">❌</div>
          <div class="tl-body">
            <div class="tl-title">理赔被拒</div>
            <div class="tl-note">${row.rejection_reason || '原因未记录'}</div>
          </div>
        </div>` : ''}
      </div>
      <hr style="border-color:var(--border);margin:16px 0"/>
      <div class="form-grid">
        <div><div class="form-label">客户</div><div>${row.client_name}</div></div>
        <div><div class="form-label">保单号</div><div>${row.policy_number || '—'}</div></div>
        <div><div class="form-label">保险公司</div><div>${row.insurer || '—'}</div></div>
        <div><div class="form-label">理赔类别</div><div>${row.claim_type || '—'}</div></div>
        <div><div class="form-label">申请金额</div><div class="fw-600">${UI.currency(row.claim_amount)}</div></div>
        <div><div class="form-label">当前状态</div><div>${UI.statusBadge(CONFIG.CLAIM_STATUS, row.status)}</div></div>
      </div>
      ${row.notes ? `<div class="mt-16"><div class="form-label">备注</div>
        <div class="tl-note">${row.notes}</div></div>` : ''}`;

    Modal.open(`理赔详情 — ${row.client_name}`, html, [
      { label: '编辑', class: 'btn-outline', fn: () => { Modal.close(); openEditModal(id); } },
      { label: '关闭', class: 'btn-primary', fn: () => Modal.close() }
    ]);
  }

  // ── 表单 ──────────────────────────────────────────────────
  function buildForm(data = {}) {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">客户姓名 <span class="required">*</span></label>
          <input type="text" id="f-client-name" value="${data.client_name || ''}" placeholder="例：李美琪" />
        </div>
        <div class="form-group">
          <label class="form-label">保单号</label>
          <input type="text" id="f-policy-number" value="${data.policy_number || ''}" placeholder="例：AIA-2023-001" />
        </div>
        <div class="form-group">
          <label class="form-label">理赔编号</label>
          <input type="text" id="f-claim-number" value="${data.claim_number || ''}" placeholder="由保险公司提供" />
        </div>
        <div class="form-group">
          <label class="form-label">保险公司 <span class="required">*</span></label>
          <select id="f-insurer">
            <option value="">-- 请选择 --</option>
            ${UI.buildOptions(CONFIG.INSURERS, data.insurer)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">理赔类别 <span class="required">*</span></label>
          <select id="f-claim-type">
            <option value="">-- 请选择 --</option>
            ${UI.buildOptions(CONFIG.CLAIM_TYPES, data.claim_type)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">申请金额 (RM)</label>
          <input type="number" id="f-claim-amount" value="${data.claim_amount || ''}" placeholder="0.00" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">提交日期 <span class="required">*</span></label>
          <input type="date" id="f-submit-date" value="${data.submit_date || new Date().toISOString().slice(0,10)}" />
        </div>
        <div class="form-group">
          <label class="form-label">最后更新日期</label>
          <input type="date" id="f-last-update" value="${data.last_update || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">状态</label>
          <select id="f-status">
            ${UI.buildStatusOptions(CONFIG.CLAIM_STATUS, data.status || 'submitted')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">已批准金额 (RM)</label>
          <input type="number" id="f-approved-amount" value="${data.approved_amount || ''}" placeholder="0.00" step="0.01" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">拒绝原因（如被拒）</label>
        <input type="text" id="f-rejection" value="${data.rejection_reason || ''}" placeholder="填写保险公司的拒绝理由" />
      </div>
      <div class="form-group">
        <label class="form-label">备注 / 跟进说明</label>
        <textarea id="f-notes">${data.notes || ''}</textarea>
      </div>`;
  }

  function getFormData() {
    const clientName = document.getElementById('f-client-name').value.trim();
    const insurer    = document.getElementById('f-insurer').value;
    const claimType  = document.getElementById('f-claim-type').value;
    const submitDate = document.getElementById('f-submit-date').value;

    if (!clientName) { UI.toast('请填写客户姓名', 'warning'); return null; }
    if (!insurer)    { UI.toast('请选择保险公司', 'warning'); return null; }
    if (!claimType)  { UI.toast('请选择理赔类别', 'warning'); return null; }
    if (!submitDate) { UI.toast('请填写提交日期', 'warning'); return null; }

    return {
      client_name:      clientName,
      policy_number:    document.getElementById('f-policy-number').value.trim(),
      claim_number:     document.getElementById('f-claim-number').value.trim(),
      insurer,
      claim_type:       claimType,
      claim_amount:     parseFloat(document.getElementById('f-claim-amount').value) || 0,
      submit_date:      submitDate,
      last_update:      document.getElementById('f-last-update').value,
      status:           document.getElementById('f-status').value,
      approved_amount:  parseFloat(document.getElementById('f-approved-amount').value) || 0,
      rejection_reason: document.getElementById('f-rejection').value.trim(),
      notes:            document.getElementById('f-notes').value.trim()
    };
  }

  // ── 新增 ──────────────────────────────────────────────────
  function openAddModal() {
    Modal.open('新增理赔记录', buildForm(), [
      { label: '取消', class: 'btn-outline', fn: () => Modal.close() },
      { label: '💾 保存', class: 'btn-primary', fn: saveAdd }
    ]);
  }

  async function saveAdd() {
    const data = getFormData();
    if (!data) return;
    try {
      await API.addClaim(data);
      Modal.close();
      UI.toast('理赔记录已添加！', 'success');
      await loadData();
    } catch (e) {
      UI.toast('保存失败：' + e.message, 'error');
    }
  }

  // ── 编辑 ──────────────────────────────────────────────────
  function openEditModal(id) {
    const row = _data.find(r => String(r.id) === String(id));
    if (!row) return;
    Modal.open('编辑理赔记录', buildForm(row), [
      { label: '取消', class: 'btn-outline', fn: () => Modal.close() },
      { label: '💾 保存修改', class: 'btn-primary', fn: () => saveEdit(id) }
    ]);
  }

  async function saveEdit(id) {
    const data = getFormData();
    if (!data) return;
    try {
      await API.updateClaim(id, data);
      Modal.close();
      UI.toast('理赔记录已更新！', 'success');
      await loadData();
    } catch (e) {
      UI.toast('更新失败：' + e.message, 'error');
    }
  }

  // ── 删除 ──────────────────────────────────────────────────
  function confirmDelete(id) {
    UI.confirm('确定要删除这条理赔记录吗？此操作无法撤销。', () => deleteRecord(id));
  }

  async function deleteRecord(id) {
    try {
      await API.deleteClaim(id);
      UI.toast('记录已删除', 'success');
      await loadData();
    } catch (e) {
      UI.toast('删除失败', 'error');
    }
  }

  // ── 统计 ──────────────────────────────────────────────────
  function getStats() {
    const processing = _data.filter(r => r.status === 'processing' || r.status === 'submitted').length;
    const approved   = _data.filter(r => r.status === 'approved' || r.status === 'paid_out').length;
    const totalAmt   = _data.reduce((s, r) => s + (parseFloat(r.claim_amount) || 0), 0);
    return { total: _data.length, processing, approved, totalAmount: totalAmt };
  }

  // ── 导出 CSV ──────────────────────────────────────────────
  function exportCSV() {
    UI.exportToCSV(filterData().map(r => ({
      '客户姓名': r.client_name,
      '保单号':   r.policy_number,
      '理赔编号': r.claim_number,
      '保险公司': r.insurer,
      '理赔类别': r.claim_type,
      '申请金额': r.claim_amount,
      '批准金额': r.approved_amount,
      '提交日期': r.submit_date,
      '最后更新': r.last_update,
      '状态':     CONFIG.CLAIM_STATUS[r.status]?.label || r.status,
      '备注':     r.notes
    })), 'Claims');
  }

  return {
    render, loadData, exportCSV, getStats, viewDetail,
    openAddModal, openEditModal, confirmDelete,
    onSearch, onFilter, onType
  };

})();
