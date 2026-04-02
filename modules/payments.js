// ============================================================
// modules/payments.js — 💳 付款跟踪模块
// ⚠️  请勿修改此文件。标签/状态请在 config.js 修改
// ============================================================

const PaymentsModule = (() => {

  let _data = [];
  let _currentPage = 1;
  let _filterStatus = '';
  let _filterSearch = '';

  // ── 渲染主页面 ────────────────────────────────────────────
  async function render() {
    document.getElementById('page-content').innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="card-title">💳 付款跟踪</div>
          <button class="btn btn-primary" onclick="PaymentsModule.openAddModal()">
            ＋ 新增付款记录
          </button>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="pay-search" placeholder="搜索客户姓名 / 保单号 / 保险公司..." 
              oninput="PaymentsModule.onSearch(this.value)" />
          </div>
          <select id="pay-status-filter" onchange="PaymentsModule.onFilter(this.value)" style="width:auto;min-width:140px">
            <option value="">全部状态</option>
            ${UI.buildStatusOptions(CONFIG.PAYMENT_STATUS)}
          </select>
          <select id="pay-insurer-filter" onchange="PaymentsModule.onInsurer(this.value)" style="width:auto;min-width:140px">
            <option value="">全部保险公司</option>
            ${CONFIG.INSURERS.map(i => `<option value="${i}">${i}</option>`).join('')}
          </select>
        </div>

        <!-- 表格 -->
        <div id="payments-table-wrap">
          <div class="loading-overlay"><div class="spinner"></div><span>加载付款记录...</span></div>
        </div>
      </div>`;

    await loadData();
  }

  // ── 加载数据 ──────────────────────────────────────────────
  async function loadData() {
    try {
      const res = await API.getPayments();
      _data = res.data || [];
      renderTable();
    } catch (e) {
      document.getElementById('payments-table-wrap').innerHTML =
        UI.emptyState('⚠️', '无法加载付款数据', '请检查 config.js 中的 API_URL 是否正确');
    }
  }

  // ── 渲染表格 ──────────────────────────────────────────────
  function renderTable() {
    const filtered = filterData();
    const total    = filtered.length;
    const paged    = filtered.slice(
      (_currentPage - 1) * CONFIG.PAGE_SIZE,
      _currentPage * CONFIG.PAGE_SIZE
    );

    const wrap = document.getElementById('payments-table-wrap');
    if (!wrap) return;

    if (paged.length === 0) {
      wrap.innerHTML = UI.emptyState('💳', '没有找到付款记录', '点击右上角「新增付款记录」开始添加');
      return;
    }

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>客户姓名</th>
              <th>保单号</th>
              <th>保险公司</th>
              <th>保费 (RM)</th>
              <th>缴费频率</th>
              <th>下次付款日</th>
              <th>状态</th>
              <th>备注</th>
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
    const days     = UI.daysUntil(row.next_due_date);
    const isUrgent = days !== null && days <= CONFIG.REMINDERS.payment_due_danger_days;
    const isWarn   = days !== null && days <= CONFIG.REMINDERS.payment_due_warning_days;
    const dueStyle = isUrgent ? 'color:var(--danger);font-weight:600'
                   : isWarn   ? 'color:var(--warning);font-weight:500' : '';
    return `<tr>
      <td>
        <div class="flex-center gap-8">
          <div class="avatar">${UI.avatarText(row.client_name)}</div>
          <span class="fw-500">${row.client_name || '—'}</span>
        </div>
      </td>
      <td class="td-muted">${row.policy_number || '—'}</td>
      <td>${row.insurer || '—'}</td>
      <td class="amount">${UI.currency(row.premium)}</td>
      <td class="td-muted">${row.frequency || '—'}</td>
      <td style="${dueStyle}">
        ${UI.formatDate(row.next_due_date)}
        ${days !== null ? `<br><small>${UI.formatDateRelative(row.next_due_date)}</small>` : ''}
      </td>
      <td>${UI.statusBadge(CONFIG.PAYMENT_STATUS, row.status)}</td>
      <td class="td-muted fs-12">${row.notes || '—'}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm" onclick="PaymentsModule.openEditModal('${row.id}')">✏️</button>
          <button class="btn btn-outline btn-sm" onclick="PaymentsModule.markPaid('${row.id}')" title="标记为已付款">✅</button>
          <button class="btn btn-outline btn-sm" onclick="PaymentsModule.confirmDelete('${row.id}')" style="color:var(--danger)">🗑️</button>
        </div>
      </td>
    </tr>`;
  }

  // ── 筛选 ──────────────────────────────────────────────────
  function filterData() {
    return _data.filter(row => {
      const matchSearch = !_filterSearch ||
        (row.client_name || '').toLowerCase().includes(_filterSearch.toLowerCase()) ||
        (row.policy_number || '').toLowerCase().includes(_filterSearch.toLowerCase()) ||
        (row.insurer || '').toLowerCase().includes(_filterSearch.toLowerCase());
      const matchStatus  = !_filterStatus  || row.status === _filterStatus;
      const matchInsurer = !_filterInsurer || row.insurer === _filterInsurer;
      return matchSearch && matchStatus && matchInsurer;
    });
  }

  let _filterInsurer = '';
  function onSearch(v)  { _filterSearch = v; _currentPage = 1; renderTable(); }
  function onFilter(v)  { _filterStatus = v; _currentPage = 1; renderTable(); }
  function onInsurer(v) { _filterInsurer = v; _currentPage = 1; renderTable(); }

  // ── 表单 Modal ────────────────────────────────────────────
  function buildForm(data = {}) {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">客户姓名 <span class="required">*</span></label>
          <input type="text" id="f-client-name" value="${data.client_name || ''}" placeholder="例：陈大明" />
        </div>
        <div class="form-group">
          <label class="form-label">保单号</label>
          <input type="text" id="f-policy-number" value="${data.policy_number || ''}" placeholder="例：AIA-2024-001234" />
        </div>
        <div class="form-group">
          <label class="form-label">保险公司 <span class="required">*</span></label>
          <select id="f-insurer">
            <option value="">-- 请选择 --</option>
            ${UI.buildOptions(CONFIG.INSURERS, data.insurer)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">保费金额 (RM) <span class="required">*</span></label>
          <input type="number" id="f-premium" value="${data.premium || ''}" placeholder="0.00" step="0.01" min="0" />
        </div>
        <div class="form-group">
          <label class="form-label">缴费频率</label>
          <select id="f-frequency">
            <option value="">-- 请选择 --</option>
            ${UI.buildOptions(CONFIG.PAYMENT_FREQUENCIES, data.frequency)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">下次付款日期 <span class="required">*</span></label>
          <input type="date" id="f-due-date" value="${data.next_due_date || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">状态</label>
          <select id="f-status">
            ${UI.buildStatusOptions(CONFIG.PAYMENT_STATUS, data.status || 'pending')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">保单产品名称</label>
          <input type="text" id="f-product" value="${data.product_name || ''}" placeholder="例：AIA A-Life Legacy" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <textarea id="f-notes" placeholder="任何额外说明...">${data.notes || ''}</textarea>
      </div>`;
  }

  function getFormData() {
    const clientName = document.getElementById('f-client-name').value.trim();
    const insurer    = document.getElementById('f-insurer').value;
    const premium    = document.getElementById('f-premium').value;
    const dueDate    = document.getElementById('f-due-date').value;

    if (!clientName) { UI.toast('请填写客户姓名', 'warning'); return null; }
    if (!insurer)    { UI.toast('请选择保险公司', 'warning'); return null; }
    if (!premium)    { UI.toast('请填写保费金额', 'warning'); return null; }
    if (!dueDate)    { UI.toast('请选择下次付款日期', 'warning'); return null; }

    return {
      client_name:    clientName,
      policy_number:  document.getElementById('f-policy-number').value.trim(),
      insurer,
      premium:        parseFloat(premium),
      frequency:      document.getElementById('f-frequency').value,
      next_due_date:  dueDate,
      status:         document.getElementById('f-status').value,
      product_name:   document.getElementById('f-product').value.trim(),
      notes:          document.getElementById('f-notes').value.trim()
    };
  }

  // ── 新增 ──────────────────────────────────────────────────
  function openAddModal() {
    Modal.open('新增付款记录', buildForm(), [
      { label: '取消', class: 'btn-outline', fn: () => Modal.close() },
      { label: '💾 保存', class: 'btn-primary', fn: saveAdd }
    ]);
  }

  async function saveAdd() {
    const data = getFormData();
    if (!data) return;
    try {
      await API.addPayment(data);
      Modal.close();
      UI.toast('付款记录已添加！', 'success');
      await loadData();
    } catch (e) {
      UI.toast('保存失败：' + e.message, 'error');
    }
  }

  // ── 编辑 ──────────────────────────────────────────────────
  function openEditModal(id) {
    const row = _data.find(r => String(r.id) === String(id));
    if (!row) return;
    Modal.open('编辑付款记录', buildForm(row), [
      { label: '取消', class: 'btn-outline', fn: () => Modal.close() },
      { label: '💾 保存修改', class: 'btn-primary', fn: () => saveEdit(id) }
    ]);
  }

  async function saveEdit(id) {
    const data = getFormData();
    if (!data) return;
    try {
      await API.updatePayment(id, data);
      Modal.close();
      UI.toast('付款记录已更新！', 'success');
      await loadData();
    } catch (e) {
      UI.toast('更新失败：' + e.message, 'error');
    }
  }

  // ── 快速标记已付款 ────────────────────────────────────────
  async function markPaid(id) {
    try {
      await API.updatePayment(id, { status: 'paid' });
      UI.toast('已标记为「已付款」✅', 'success');
      await loadData();
    } catch (e) {
      UI.toast('操作失败', 'error');
    }
  }

  // ── 删除 ──────────────────────────────────────────────────
  function confirmDelete(id) {
    UI.confirm('确定要删除这条付款记录吗？此操作无法撤销。', () => deleteRecord(id));
  }

  async function deleteRecord(id) {
    try {
      await API.deletePayment(id);
      UI.toast('记录已删除', 'success');
      await loadData();
    } catch (e) {
      UI.toast('删除失败', 'error');
    }
  }

  // ── 导出 CSV ──────────────────────────────────────────────
  function exportCSV() {
    UI.exportToCSV(filterData().map(r => ({
      '客户姓名': r.client_name,
      '保单号':   r.policy_number,
      '保险公司': r.insurer,
      '产品名称': r.product_name,
      '保费(RM)': r.premium,
      '缴费频率': r.frequency,
      '下次付款日': r.next_due_date,
      '状态':     CONFIG.PAYMENT_STATUS[r.status]?.label || r.status,
      '备注':     r.notes
    })), 'Payments');
  }

  // ── 获取逾期/即将到期数据（供仪表板使用）────────────────
  function getAlerts() {
    const today = new Date();
    return _data.filter(r => {
      if (r.status === 'paid' || r.status === 'cancelled') return false;
      const days = UI.daysUntil(r.next_due_date);
      return days !== null && days <= CONFIG.REMINDERS.payment_due_warning_days;
    }).sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date));
  }

  function getStats() {
    const paid    = _data.filter(r => r.status === 'paid').length;
    const overdue = _data.filter(r => r.status === 'overdue').length;
    const pending = _data.filter(r => r.status === 'pending').length;
    const upcoming = _data.filter(r => {
      const days = UI.daysUntil(r.next_due_date);
      return r.status === 'pending' && days !== null && days <= 30;
    }).length;
    return { total: _data.length, paid, overdue, pending, upcoming };
  }

  return {
    render, loadData, exportCSV, getAlerts, getStats,
    openAddModal, openEditModal, markPaid, confirmDelete,
    onSearch, onFilter, onInsurer
  };

})();
