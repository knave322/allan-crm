// modules/ui.js — Shared UI Utilities

const UI = (() => {

  // ── Toast ──
  function toast(msg, type = 'info') {
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ── Badge ──
  function badge(value, configArray) {
    const item = configArray.find(x => x.value === value);
    const label = item ? item.label : value;
    return `<span class="badge badge-${value}">${label}</span>`;
  }

  // ── Currency ──
  function currency(val) {
    return `${CONFIG.SYSTEM.currency} ${Number(val || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  }

  // ── Date ──
  function date(val) {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString('en-MY', { day:'2-digit', month:'short', year:'numeric' });
  }

  // ── Days until ──
  function daysUntil(dateStr) {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  }

  // ── Paginate ──
  function paginate(items, page, size) {
    const total = Math.ceil(items.length / size);
    const start = (page - 1) * size;
    return {
      items: items.slice(start, start + size),
      total, page, size, count: items.length
    };
  }

  // ── Pagination HTML ──
  function paginationHTML(paged, onPage) {
    if (paged.total <= 1) return '';
    const info = `Showing ${Math.min((paged.page-1)*paged.size+1, paged.count)}–${Math.min(paged.page*paged.size, paged.count)} of ${paged.count}`;
    const btns = [];
    for (let i = 1; i <= paged.total; i++) {
      btns.push(`<button class="page-btn${i===paged.page?' active':''}" onclick="${onPage}(${i})">${i}</button>`);
    }
    return `<div class="pagination">
      <span class="page-info">${info}</span>
      <div class="page-btns">${btns.join('')}</div>
    </div>`;
  }

  // ── Modal ──
  function showModal(title, bodyHTML, footerHTML) {
    closeModal();
    const el = document.createElement('div');
    el.className = 'modal-overlay';
    el.id = 'active-modal';
    el.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">${title}</div>
          <button class="modal-close" onclick="UI.closeModal()">×</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-footer">${footerHTML}</div>
      </div>`;
    el.addEventListener('click', e => { if (e.target === el) closeModal(); });
    document.body.appendChild(el);
  }

  function closeModal() {
    const el = document.getElementById('active-modal');
    if (el) el.remove();
  }

  // ── Export CSV ──
  function exportCSV(rows, filename) {
    if (!rows || !rows.length) { toast('No data to export', 'warning'); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => {
      const v = String(r[h] || '').replace(/"/g, '""');
      return v.includes(',') ? `"${v}"` : v;
    }).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = filename + '_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
  }

  // ── Confirm ──
  function confirm(msg, onYes) {
    showModal('Confirm Action',
      `<p style="color:var(--text-secondary);line-height:1.6">${msg}</p>`,
      `<button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
       <button class="btn btn-danger" onclick="UI.closeModal();(${onYes.toString()})()">Confirm</button>`
    );
  }

  return { toast, badge, currency, date, daysUntil, paginate, paginationHTML, showModal, closeModal, exportCSV, confirm };
})();
