// ============================================================
// modules/servicing.js — 🔧 服务记录模块
// ⚠️  请勿修改此文件。标签/状态请在 config.js 修改
// ============================================================

const ServicingModule = (() => {

  let _data = [];
  let _currentPage = 1;
  let _filterStatus = '';
  let _filterSearch = '';
  let _filterType   = '';

  // ── 渲染主页面 ────────────────────────────────────────────
  async function render() {
    document.getElementById('page-content').innerHTML = `
      <!-- 统计卡片 -->
      <div class="stats-grid" id="svc-stats"></div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">🔧 服务记录</div>
          <button class="btn btn-primary" onclick="ServicingModule.openAddModal()">
            ＋ 新增服务记录
          </button>
        </div>

        <!-- 筛选 -->
        <div class="filter-bar">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="svc-search" placeholder="搜索客户姓名 / 服务内容..."
              oninput="ServicingModule.onSearch(this.value)" />
          </div>
          <select id="svc-status-filter" onchange="ServicingModule.onFilter(this.value)" style="width:auto;min-width:140px">
            <option value="">全部状态</option>
            ${UI.buildStatusOptions(CONFIG.SERVICE_STATUS)}
          </select>
          <select id="svc-type-filter" onchange="ServicingModule.onType(this.value)" style="width:auto;min-width:180px">
            <option value="">全部服务类别</option>
            ${CONFIG.SERVICE_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>

        <!-- 切换：表格 / 时间线 -->
        <div class="tab-bar" style="margin-bottom:16px">
          <div class="tab-btn active" id="tab-table" onclick="ServicingModule.switchView('table')">📋 列表视图</div>
          <div class="tab-btn" id="tab-timeline" onclick="ServicingModule.switchView('timeline')">📅 时间线视图</div>
        </div>

        <div id="svc-table-wrap">
          <div class="loading-overlay"><div class="spinner"></div><span>加载服务记录...</span></div>
        </div>
      </div>`;

    await loadData();
  }

  let _currentView = 'table';

  // ── 加载数据 ──────────────────────────────────────────────
  async function loadData() {
    try {
      const res = await API.getServicing();
      _data = res.data || [];
      renderStats();
      renderView();
    } catch (e) {
      document.getElementById('svc-table-wrap').innerHTML =
        UI.emptyState('⚠️', '无法加载服务记录', '请检查 API_URL 设置');
    }
  }

  // ── 统计 ──────────────────────────────────────────────────
  function renderStats() {
    const el = document.getElementById('svc-stats');
    if (!el) return;
    const s = getStats();
    el.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon blue">🔧</div>
        <div class="stat-info">
          <div class="stat-value">${s.total}</div>
          <div class="stat-label">总服务记录</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div class="stat-info">
          <div class="stat-value">${s.completed}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon yellow">🔔</div>
        <div class="stat-info">
          <div class="stat-value">${s.followup}</div>
          <div class="stat-label">待跟进</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">📅</div>
        <div class="stat-info">
          <div class="stat-value">${s.thisMonth}</div>
          <div class="stat-label">本月服务</div>
        </div>
      </div>`;
  }

  // ── 切换视图 ──────────────────────────────────────────────
  function switchView(view) {
    _currentView = view;
    document.getElementById('tab-table').classList.toggle('active', view === 'table');
    document.getElementById('tab-timeline').classList.toggle('active', view === 'timeline');
    renderView();
  }

  function renderView() {
    if (_currentView === 'timeline') renderTimeline();
    else renderTable();
  }

  // ── 表格视图 ──────────────────────────────────────────────
  function renderTable() {
    const filtered = filterData().sort((a, b) =>
      new Date(b.service_date) - new Date(a.service_date));
    const total = filtered.length;
    const paged = filtered.slice(
      (_currentPage - 1) * CONFIG.PAGE_SIZE,
      _currentPage * CONFIG.PAGE_SIZE
    );

    const wrap = document.getElementById('svc-table-wrap');
    if (!wrap) return;

    if (paged.length === 0) {
      wrap.innerHTML = UI.emptyState('🔧', '没有找到服务记录', '点击「新增服务记录」开始添加');
      return;
    }

    wrap.innerHTML = `
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>客户姓名</th>
              <th>服务日期</th>
              <th>服务类别</th>
              <th>服务内容摘要</th>
              <th>下次跟进</th>
              <th>状态</th>
              <th>跟进人员</th>
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
    const daysToFollowup = UI.daysUntil(row.next_followup);
    const followupStyle = daysToFollowup !== null && daysToFollowup < 0
      ? 'color:var(--danger);font-weight:600'
      : daysToFollowup !== null && daysToFollowup <= 7
        ? 'color:var(--warning);font-weight:500' : '';

    return `<tr>
      <td>
        <div class="flex-center gap-8">
          <div class="avatar">${UI.avatarText(row.client_name)}</div>
          <span class="fw-500">${row.client_name || '—'}</span>
        </div>
      </td>
      <td class="td-muted">${UI.formatDate(row.service_date)}</td>
      <td>
        <span style="background:var(--bg-hover);padding:2px 8px;border-radius:4px;font-size:12px">
          ${row.service_type || '—'}
        </span>
      </td>
      <td style="max-width:200px;white-space:normal;font-size:12px">
        ${(row.summary || '—').substring(0, 80)}${(row.summary || '').length > 80 ? '...' : ''}
      </td>
      <td style="${followupStyle}">
        ${UI.formatDate(row.next_followup)}
        ${daysToFollowup !== null ? `<br><small>${UI.formatDateRelative(row.next_followup)}</small>` : ''}
      </td>
      <td>${UI.statusBadge(CONFIG.SERVICE_STATUS, row.status)}</td>
      <td class="td-muted">${row.handled_by || CONFIG.SYSTEM.advisor}</td>
      <td>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm" onclick="ServicingModule.openEditModal('${row.id}')" title="编辑">✏️</button>
          <button class="btn btn-outline btn-sm" onclick="ServicingModule.markComplete('${row.id}')" title="标记完成">✅</button>
          <button class="btn btn-outline btn-sm" onclick="ServicingModule.confirmDelete('${row.id}')" style="color:var(--danger)" title="删除">🗑️</button>
        </div>
      </td>
    </tr>`;
  }

  // ── 时间线视图 ────────────────────────────────────────────
  function renderTimeline() {
    const filtered = filterData().sort((a, b) =>
      new Date(b.service_date) - new Date(a.service_date));
    const wrap = document.getElementById('svc-table-wrap');
    if (!wrap) return;

    if (filtered.length === 0) {
      wrap.innerHTML = UI.emptyState('📅', '没有找到服务记录');
      return;
    }

    const statusIcons = { completed: '✅', scheduled: '📅', followup: '🔔', cancelled: '❌' };

    wrap.innerHTML = `<div class="timeline" style="padding:4px 0">
      ${filtered.slice(0, 30).map(row => `
        <div class="tl-item">
          <div class="tl-dot">${statusIcons[row.status] || '🔧'}</div>
          <div class="tl-body">
            <div class="flex-center gap-8" style="flex-wrap:wrap">
              <span class="tl-title">${row.client_name}</span>
              <span style="font-size:11px;background:var(--bg-hover);padding:1px 6px;border-radius:3px">${row.service_type || '—'}</span>
              ${UI.statusBadge(CONFIG.SERVICE_STATUS, row.status)}
            </div>
            <div class="tl-meta">${UI.formatDate(row.service_date)} · 服务人员：${row.handled_by || CONFIG.SYSTEM.advisor}</div>
            ${row.summary ? `<div class="tl-note">${row.summary}</div>` : ''}
            ${row.next_followup ? `<div class="tl-meta" style="margin-top:4px">📅 下次跟进：${UI.formatDate(row.next_followup)} (${UI.formatDateRelative(row.next_followup)})</div>` : ''}
          </div>
          <button class="btn btn-outline btn-sm" onclick="ServicingModule.openEditModal('${row.id}')">✏️</button>
        </div>`).join('')}
    </div>`;
  }

  // ── 筛选 ──────────────────────────────────────────────────
  function filterData() {
    return _data.filter(row => {
      const s = _filterSearch.toLowerCase();
      const matchSearch = !s ||
        (row.client_name || '').toLowerCase().includes(s) ||
        (row.summary     || '').toLowerCase().includes(s);
      const matchStatus = !_filterStatus || row.status === _filterStatus;
      const matchType   = !_filterType   || row.service_type === _filterType;
      return matchSearch && matchStatus && matchType;
    });
  }

  function onSearch(v) { _filterSearch = v; _currentPage = 1; renderView(); }
  function onFilter(v) { _filterStatus = v; _currentPage = 1; renderView(); }
  function onType(v)   { _filterType   = v; _currentPage = 1; renderView(); }

  // ── 表单 ──────────────────────────────────────────────────
  function buildForm(data = {}) {
    return `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">客户姓名 <span class="required">*</span></label>
          <input type="text" id="f-client-name" value="${data.client_name || ''}" placeholder="例：张伟强" />
        </div>
        <div class="form-group">
          <label class="form-label">服务日期 <span class="required">*</span></label>
          <input type="date" id="f-service-date" value="${data.service_date || new Date().toISOString().slice(0,10)}" />
        </div>
        <div class="form-group">
          <label class="form-label">服务类别 <span class="required">*</span></label>
          <select id="f-service-type">
            <option value="">-- 请选择 --</option>
            ${UI.buildOptions(CONFIG.SERVICE_TYPES, data.service_type)}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">状态</label>
          <select id="f-status">
            ${UI.buildStatusOptions(CONFIG.SERVICE_STATUS, data.status || 'completed')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">下次跟进日期</label>
          <input type="date" id="f-next-followup" value="${data.next_followup || ''}" />
        </div>
        <div class="form-group">
          <label class="form-label">服务人员</label>
          <input type="text" id="f-handled-by" value="${data.handled_by || CONFIG.SYSTEM.advisor}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">服务内容摘要 <span class="required">*</span></label>
        <textarea id="f-summary" placeholder="详细描述本次服务的内容、讨论要点、客户反馈...">${data.summary || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">跟进行动计划</label>
        <textarea id="f-action" placeholder="下次跟进需要准备什么？给客户发什么资料？..." style="min-height:60px">${data.action_plan || ''}</textarea>
      </div>`;
  }

  function getFormData() {
    const clientName  = document.getElementById('f-client-name').value.trim();
    const serviceDate = document.getElementById('f-service-date').value;
    const serviceType = document.getElementById('f-service-type').value;
    const summary     = document.getElementById('f-summary').value.trim();

    if (!clientName)  { UI.toast('请填写客户姓名', 'warning'); return null; }
    if (!serviceDate) { UI.toast('请填写服务日期', 'warning'); return null; }
    if (!serviceType) { UI.toast('请选择服务类别', 'warning'); return null; }
    if (!summary)     { UI.toast('请填写服务内容摘要', 'warning'); return null; }

    return {
      client_name:   clientName,
      service_date:  serviceDate,
      service_type:  serviceType,
      status:        document.getElementById('f-status').value,
      next_followup: document.getElementById('f-next-followup').value,
      handled_by:    document.getElementById('f-handled-by').value.trim(),
      summary,
      action_plan:   document.getElementById('f-action').value.trim()
    };
  }

  // ── 新增 ──────────────────────────────────────────────────
  function openAddModal() {
    Modal.open('新增服务记录', buildForm(), [
      { label: '取消', class: 'btn-outline', fn: () => Modal.close() },
      { label: '💾 保存', class: 'btn-primary', fn: saveAdd }
    ]);
  }

  async function saveAdd() {
    const data = getFormData();
    if (!data) return;
    try {
      await API.addServicing(data);
      Modal.close();
      UI.toast('服务记录已保存！', 'success');
      await loadData();
    } catch (e) {
      UI.toast('保存失败：' + e.message, 'error');
    }
  }

  // ── 编辑 ──────────────────────────────────────────────────
  function openEditModal(id) {
    const row = _data.find(r => String(r.id) === String(id));
    if (!row) return;
    Modal.open('编辑服务记录', buildForm(row), [
      { label: '取消', class: 'btn-outline', fn: () => Modal.close() },
      { label: '💾 保存修改', class: 'btn-primary', fn: () => saveEdit(id) }
    ]);
  }

  async function saveEdit(id) {
    const data = getFormData();
    if (!data) return;
    try {
      await API.updateServicing(id, data);
      Modal.close();
      UI.toast('服务记录已更新！', 'success');
      await loadData();
    } catch (e) {
      UI.toast('更新失败：' + e.message, 'error');
    }
  }

  // ── 标记完成 ──────────────────────────────────────────────
  async function markComplete(id) {
    try {
      await API.updateServicing(id, { status: 'completed' });
      UI.toast('已标记为「已完成」✅', 'success');
      await loadData();
    } catch (e) {
      UI.toast('操作失败', 'error');
    }
  }

  // ── 删除 ──────────────────────────────────────────────────
  function confirmDelete(id) {
    UI.confirm('确定要删除这条服务记录吗？', () => deleteRecord(id));
  }

  async function deleteRecord(id) {
    try {
      await API.deleteServicing(id);
      UI.toast('记录已删除', 'success');
      await loadData();
    } catch (e) {
      UI.toast('删除失败', 'error');
    }
  }

  // ── 统计 ──────────────────────────────────────────────────
  function getStats() {
    const now = new Date();
    const thisMonth = _data.filter(r => {
      const d = new Date(r.service_date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
    return {
      total:     _data.length,
      completed: _data.filter(r => r.status === 'completed').length,
      followup:  _data.filter(r => r.status === 'followup').length,
      thisMonth
    };
  }

  // ── 获取待跟进提醒（供仪表板用）─────────────────────────
  function getPendingFollowups() {
    return _data.filter(r => {
      if (r.status === 'completed' || r.status === 'cancelled') return false;
      const days = UI.daysUntil(r.next_followup);
      return days !== null && days <= CONFIG.REMINDERS.follow_up_overdue_days;
    }).sort((a, b) => new Date(a.next_followup) - new Date(b.next_followup));
  }

  // ── 导出 CSV ──────────────────────────────────────────────
  function exportCSV() {
    UI.exportToCSV(filterData().map(r => ({
      '客户姓名': r.client_name,
      '服务日期': r.service_date,
      '服务类别': r.service_type,
      '内容摘要': r.summary,
      '行动计划': r.action_plan,
      '下次跟进': r.next_followup,
      '状态':     CONFIG.SERVICE_STATUS[r.status]?.label || r.status,
      '服务人员': r.handled_by
    })), 'Servicing');
  }

  return {
    render, loadData, exportCSV, getStats, getPendingFollowups,
    openAddModal, openEditModal, markComplete, confirmDelete,
    onSearch, onFilter, onType, switchView
  };

})();
