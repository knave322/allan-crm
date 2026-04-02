// ============================================================
// modules/ui.js — 共用 UI 工具函数
// ⚠️  请勿修改此文件
// ============================================================

const UI = (() => {

  // ── Toast 通知 ────────────────────────────────────────────
  function toast(message, type = 'success', duration = 3500) {
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(50px)';
      el.style.transition = '0.3s';
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ── 状态徽章 ─────────────────────────────────────────────
  function statusBadge(statusMap, key) {
    const s = statusMap[key];
    if (!s) return `<span class="badge" style="background:rgba(100,116,139,0.15);color:#94a3b8">${key || '—'}</span>`;
    return `<span class="badge" style="background:${s.color}22;color:${s.color}">${s.icon || ''} ${s.label}</span>`;
  }

  // ── 货币格式 ─────────────────────────────────────────────
  function currency(value) {
    const n = parseFloat(value);
    if (isNaN(n)) return '—';
    return CONFIG.SYSTEM.currency + ' ' + n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── 日期格式 ─────────────────────────────────────────────
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('zh-MY', { year: 'numeric', month: '2-digit', day: '2-digit' });
  }

  function formatDateRelative(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const diff = Math.ceil((d - new Date()) / 86400000);
    if (diff === 0)  return '今天';
    if (diff === 1)  return '明天';
    if (diff === -1) return '昨天';
    if (diff > 0)    return `${diff}天后`;
    return `${Math.abs(diff)}天前`;
  }

  // ── 计算距离今天天数 ──────────────────────────────────────
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    return Math.ceil((d - new Date()) / 86400000);
  }

  // ── 客户头像文字 ──────────────────────────────────────────
  function avatarText(name) {
    if (!name) return '?';
    return name.trim().charAt(0).toUpperCase();
  }

  // ── 加载状态 ─────────────────────────────────────────────
  function showLoading(containerId, message = '加载中...') {
    const el = document.getElementById(containerId) || document.getElementById('page-content');
    el.innerHTML = `<div class="loading-overlay"><div class="spinner"></div><span>${message}</span></div>`;
  }

  function showError(containerId, message, retryFn) {
    const el = document.getElementById(containerId) || document.getElementById('page-content');
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <p style="color:var(--danger)">${message}</p>
        ${retryFn ? `<button class="btn btn-outline" style="margin-top:12px" onclick="(${retryFn.toString()})()">🔄 重试</button>` : ''}
      </div>`;
  }

  // ── 空状态 ────────────────────────────────────────────────
  function emptyState(icon, text, subtext) {
    return `<div class="empty-state">
      <div class="empty-icon">${icon}</div>
      <p>${text}</p>
      ${subtext ? `<small>${subtext}</small>` : ''}
    </div>`;
  }

  // ── 分页器 ────────────────────────────────────────────────
  function renderPagination(totalItems, currentPage, pageSize, onPageChange) {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return '';

    const start = (currentPage - 1) * pageSize + 1;
    const end   = Math.min(currentPage * pageSize, totalItems);

    let html = `<div class="pagination">
      <span class="page-info">显示 ${start}–${end}，共 ${totalItems} 条</span>
      <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''}
        onclick="(${onPageChange.toString()})(${currentPage - 1})">‹</button>`;

    const range = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) range.push(i);
      else if (range[range.length - 1] !== '…') range.push('…');
    }

    range.forEach(p => {
      if (p === '…') {
        html += `<span class="page-btn" style="cursor:default">…</span>`;
      } else {
        html += `<button class="page-btn ${p === currentPage ? 'active' : ''}"
          onclick="(${onPageChange.toString()})(${p})">${p}</button>`;
      }
    });

    html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''}
      onclick="(${onPageChange.toString()})(${currentPage + 1})">›</button></div>`;
    return html;
  }

  // ── 连接状态指示器 ────────────────────────────────────────
  function setConnectionStatus(ok) {
    const el = document.getElementById('conn-indicator');
    if (!el) return;
    el.className = 'conn-status ' + (ok ? 'conn-ok' : 'conn-err');
    el.innerHTML = `<div class="conn-dot"></div><span>${ok ? '已连接' : '未连接'}</span>`;
  }

  // ── Select Options 帮助函数 ───────────────────────────────
  function buildOptions(arr, selected = '') {
    return arr.map(v => `<option value="${v}" ${v === selected ? 'selected' : ''}>${v}</option>`).join('');
  }

  function buildStatusOptions(statusMap, selected = '') {
    return Object.entries(statusMap).map(([k, v]) =>
      `<option value="${k}" ${k === selected ? 'selected' : ''}>${v.icon} ${v.label}</option>`
    ).join('');
  }

  // ── 确认对话框（浏览器内置简化版）────────────────────────
  function confirm(message, onOk) {
    Modal.open('确认操作', `
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:36px;margin-bottom:12px">⚠️</div>
        <p>${message}</p>
      </div>
    `, [
      { label: '取消', class: 'btn-outline', fn: () => Modal.close() },
      { label: '确认删除', class: 'btn-danger', fn: () => { Modal.close(); onOk(); } }
    ]);
  }

  // ── 导出 CSV ──────────────────────────────────────────────
  function exportToCSV(rows, filename) {
    if (!rows || rows.length === 0) { toast('没有数据可导出', 'warning'); return; }
    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map(r => headers.map(h => {
        const v = r[h] || '';
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename + '_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    toast('CSV 导出成功！', 'success');
  }

  return {
    toast, statusBadge, currency, formatDate, formatDateRelative,
    daysUntil, avatarText, showLoading, showError, emptyState,
    renderPagination, setConnectionStatus, buildOptions,
    buildStatusOptions, confirm, exportToCSV
  };

})();

// ============================================================
// Modal 模块（全局共用弹窗）
// ============================================================
const Modal = (() => {

  let _currentCallbacks = [];

  function open(title, bodyHTML, buttons = []) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;

    // 渲染底部按钮
    const footer = document.getElementById('modal-footer');
    footer.innerHTML = '';
    _currentCallbacks = buttons;

    if (buttons.length === 0) {
      footer.innerHTML = `<button class="btn btn-outline" onclick="Modal.close()">关闭</button>`;
    } else {
      buttons.forEach((btn, i) => {
        const el = document.createElement('button');
        el.className = `btn ${btn.class || 'btn-outline'}`;
        el.textContent = btn.label;
        el.setAttribute('data-btn-idx', i);
        el.addEventListener('click', () => btn.fn && btn.fn());
        footer.appendChild(el);
      });
    }

    document.getElementById('modal-overlay').classList.add('active');
  }

  function close() {
    document.getElementById('modal-overlay').classList.remove('active');
  }

  function closeOnOverlay(e) {
    if (e.target === document.getElementById('modal-overlay')) close();
  }

  return { open, close, closeOnOverlay };

})();
