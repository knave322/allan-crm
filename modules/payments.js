// modules/payments.js — Payment Tracker (Read-Only, WABI Format)

const PaymentsModule = (() => {
  let _data = [], _currentPage = 1;
  let _filterStatus = '', _filterSearch = '', _filterFreq = '';
  const MONTHS_2026 = ['2026 JAN','2026 FEB','2026 MAR','2026 APR','2026 MAY','2026 JUN','2026 JUL','2026 AUG','2026 SEP','2026 OCT','2026 NOV','2026 DEC'];
  const MONTHS_2025 = ['2025 JAN','2025 FEB','2025 MAR','2025 APR','2025 MAY','2025 JUN','2025 JUL','2025 AUG','2025 SEP','2025 OCT','2025 NOV','2025 DEC'];

  function getFreq(mode) {
    const m = (mode||'').toUpperCase();
    if (m.includes('- M')) return 'Monthly';
    if (m.includes('- Q')) return 'Quarterly';
    if (m.includes('- A')) return 'Annual';
    if (m.includes('- S')) return 'Semi-Annual';
    return 'Other';
  }

  function parseAmount(v) {
    if (!v || String(v).trim() in {'·':'','':'','nan':'','--':''}) return null;
    const s = String(v).trim().replace(/,/g,'');
    if (s.includes('+')) {
      try { return s.split('+').reduce((a,b)=>a+parseFloat(b),0); } catch { return null; }
    }
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  // Get current month label e.g. "2026 APR"
  function currentMonthLabel() {
    const d = new Date();
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    return `${d.getFullYear()} ${months[d.getMonth()]}`;
  }

  async function render() {
    document.getElementById('page-content').innerHTML = `
      <div id="pay-summary-cards" style="margin-bottom:20px">
        <div class="loading-overlay" style="padding:40px"><div class="spinner"></div></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title">💳 Payment Tracker — 24-Month View</div>
          <div style="display:flex;gap:8px">
            <button class="btn btn-outline btn-sm" onclick="PaymentsModule.exportCSV()">📥 Export</button>
            <a href="${CONFIG.SHEETS_URL}" target="_blank" class="btn btn-primary btn-sm" style="text-decoration:none">📊 Edit in Sheets</a>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-bar">
          <input class="search-input" type="text" id="pay-search"
            placeholder="Search client / policy / plan..."
            oninput="PaymentsModule.onSearch(this.value)" />
          <select class="form-control" onchange="PaymentsModule.onStatus(this.value)" style="width:auto">
            <option value="">All Status</option>
            <option value="Active">✿ Active</option>
            <option value="No Data">○ No Data</option>
            <option value="Premium Holiday">⏸ Premium Holiday</option>
            <option value="Lapsed">✕ Lapsed</option>
          </select>
          <select class="form-control" onchange="PaymentsModule.onFreq(this.value)" style="width:auto">
            <option value="">All Frequency</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Annual">Annual</option>
            <option value="Semi-Annual">Semi-Annual</option>
          </select>
        </div>

        <!-- Month selector -->
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;flex-wrap:wrap">
          <span style="font-size:12px;color:var(--text-muted);font-weight:600">VIEW YEAR:</span>
          <button id="btn-2025" class="btn btn-outline btn-sm" onclick="PaymentsModule.setYear(2025)">2025</button>
          <button id="btn-2026" class="btn btn-primary btn-sm" onclick="PaymentsModule.setYear(2026)">2026</button>
        </div>

        <div id="payments-table-wrap">
          <div class="loading-overlay"><div class="spinner"></div><span>Loading...</span></div>
        </div>
      </div>`;

    await loadData();
  }

  let _year = 2026;
  function setYear(y) {
    _year = y;
    document.getElementById('btn-2025').className = y === 2025 ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
    document.getElementById('btn-2026').className = y === 2026 ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
    renderTable();
  }

  async function loadData() {
    try {
      const res = await API.get('getPayments');
      _data = Array.isArray(res) ? res : (res.data || []);
      renderSummary();
      renderTable();
    } catch (e) {
      document.getElementById('payments-table-wrap').innerHTML =
        `<div class="empty-state"><div class="empty-icon">⚠️</div><div class="empty-title">${e.message}</div></div>`;
    }
  }

  function renderSummary() {
    const cur = currentMonthLabel();
    const active      = _data.filter(r => r.status === 'Active').length;
    const noData      = _data.filter(r => r.status === 'No Data').length;
    const premHol     = _data.filter(r => r.status === 'Premium Holiday').length;
    const monthly     = _data.filter(r => r.status === 'Active' && getFreq(r.frequency||r.pay_mode||r.mode) === 'Monthly');
    const monthlyANP  = monthly.reduce((s,r) => s + (parseAmount(r.anp)||parseAmount(r.premium)||0), 0);
    const curPaid     = _data.filter(r => {
      const v = r[cur] || r['months_'+cur];
      return parseAmount(v) !== null;
    }).length;

    document.getElementById('pay-summary-cards').innerHTML = `
      <div class="stats-grid" style="grid-template-columns:repeat(5,1fr)">
        <div class="stat-card">
          <div class="stat-icon" style="background:#d1fae5;font-size:20px">✿</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--success)">${active}</div>
            <div class="stat-label">Active Policies</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#f1f5f9;font-size:20px">○</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--text-muted)">${noData}</div>
            <div class="stat-label">No Data</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:#fef3c7;font-size:20px">⏸</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--warning)">${premHol}</div>
            <div class="stat-label">Premium Holiday</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">💰</div>
          <div class="stat-info">
            <div class="stat-value" style="font-size:18px">RM ${monthlyANP.toLocaleString('en-MY',{minimumFractionDigits:0,maximumFractionDigits:0})}</div>
            <div class="stat-label">Monthly ANP (Active)</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">📅</div>
          <div class="stat-info">
            <div class="stat-value">${curPaid}</div>
            <div class="stat-label">${cur} Paid</div>
          </div>
        </div>
      </div>`;
  }

  function filterData() {
    return _data.filter(r => {
      const name = (r.client_name||r.owner||r.policy_owner||'').toLowerCase();
      const policy = (r.policy_number||r.policy||'').toLowerCase();
      const plan = (r.product_name||r.plan||'').toLowerCase();
      const status = r.status||'';
      const freq = getFreq(r.frequency||r.pay_mode||r.mode||'');
      const s = _filterSearch.toLowerCase();
      return (!s || name.includes(s) || policy.includes(s) || plan.includes(s)) &&
             (!_filterStatus || status === _filterStatus) &&
             (!_filterFreq || freq === _filterFreq);
    });
  }

  function renderTable() {
    const months = _year === 2026 ? MONTHS_2026 : MONTHS_2025;
    const curMonth = currentMonthLabel();
    const filtered = filterData();
    const paged = UI.paginate(filtered, _currentPage, CONFIG.PAGE_SIZE);
    const wrap = document.getElementById('payments-table-wrap');
    if (!wrap) return;

    if (!paged.items.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">No records found</div></div>`;
      return;
    }

    const monthHeaders = months.map(m => {
      const isCur = m === curMonth;
      return `<th style="min-width:72px;text-align:center;${isCur?'background:var(--accent-light);color:var(--accent-dark);font-weight:700':''}">${m.replace('20','').replace(' ','<br>')}</th>`;
    }).join('');

    const rows = paged.items.map(r => {
      const name   = r.client_name||r.owner||r.policy_owner||'—';
      const policy = r.policy_number||r.policy||'—';
      const plan   = r.product_name||r.plan||'—';
      const mode   = r.frequency||r.pay_mode||r.mode||'—';
      const freq   = getFreq(mode);
      const prem   = parseAmount(r.premium) || 0;
      const status = r.status||'No Data';
      const remark = r.notes||r.remark||'';

      const statusBadge = {
        'Active':          '<span class="badge" style="background:#d1fae5;color:#065f46">✿ Active</span>',
        'Lapsed':          '<span class="badge" style="background:#fee2e2;color:#991b1b">✕ Lapsed</span>',
        'Premium Holiday': '<span class="badge" style="background:#fef3c7;color:#92400e">⏸ Holiday</span>',
        'No Data':         '<span class="badge" style="background:#f1f5f9;color:#64748b">○ No Data</span>',
      }[status] || `<span class="badge">${status}</span>`;

      const initials = name.substring(0,2).toUpperCase();
      const freqBadge = {
        'Monthly':     '<span style="font-size:10px;color:var(--accent)">M</span>',
        'Quarterly':   '<span style="font-size:10px;color:var(--purple)">Q</span>',
        'Annual':      '<span style="font-size:10px;color:var(--success)">A</span>',
        'Semi-Annual': '<span style="font-size:10px;color:var(--warning)">S</span>',
      }[freq] || '';

      const monthCells = months.map(m => {
        // Try various field name formats
        const val = parseAmount(r[m]) ?? parseAmount(r[m.replace(' ','_')]) ?? parseAmount(r['m_'+m]);
        const isCur = m === curMonth;
        const bg = isCur ? 'background:rgba(14,165,233,0.06);' : '';
        if (val !== null && val > 0) {
          return `<td style="text-align:center;${bg}color:var(--success);font-weight:600;font-size:12px">${val.toLocaleString('en-MY',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>`;
        }
        return `<td style="text-align:center;${bg}color:var(--border)">·</td>`;
      }).join('');

      return `<tr>
        <td style="white-space:nowrap">${statusBadge}</td>
        <td><div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--accent);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${initials}</div>
          <div>
            <div style="font-weight:600;font-size:13px">${name}</div>
            <div style="font-size:11px;color:var(--text-muted)">${policy}</div>
          </div>
        </div></td>
        <td style="font-size:12px;color:var(--text-secondary)">${plan}</td>
        <td style="font-size:12px;white-space:nowrap">${freqBadge} ${freq}</td>
        <td style="font-weight:600;text-align:right;font-size:13px">${prem > 0 ? 'RM '+prem.toLocaleString('en-MY',{minimumFractionDigits:2}) : '—'}</td>
        <td style="font-size:11px;color:var(--text-muted);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${remark}</td>
        ${monthCells}
      </tr>`;
    }).join('');

    wrap.innerHTML = `
      <div style="overflow-x:auto">
        <table style="min-width:1200px">
          <thead>
            <tr style="position:sticky;top:0;z-index:10">
              <th style="min-width:90px">Status</th>
              <th style="min-width:200px">Client / Policy</th>
              <th style="min-width:80px">Plan</th>
              <th style="min-width:90px">Frequency</th>
              <th style="min-width:90px;text-align:right">Premium</th>
              <th style="min-width:100px">Remark</th>
              ${monthHeaders}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      ${UI.paginationHTML(paged, 'PaymentsModule.goPage')}`;
  }

  function goPage(p) { _currentPage = p; renderTable(); }
  function onSearch(v) { _filterSearch = v; _currentPage = 1; renderTable(); }
  function onStatus(v) { _filterStatus = v; _currentPage = 1; renderTable(); }
  function onFreq(v)   { _filterFreq = v;   _currentPage = 1; renderTable(); }

  function exportCSV() {
    const months = _year === 2026 ? MONTHS_2026 : MONTHS_2025;
    UI.exportCSV(filterData().map(r => {
      const row = {
        'Status': r.status, 'Client': r.client_name||r.owner||r.policy_owner,
        'Policy': r.policy_number||r.policy, 'Plan': r.product_name||r.plan,
        'Mode': r.frequency||r.pay_mode||r.mode, 'Premium': r.premium,
        'Remark': r.notes||r.remark
      };
      months.forEach(m => { row[m] = parseAmount(r[m]) || '·'; });
      return row;
    }), `Payments_${_year}`);
  }

  return { render, loadData, exportCSV, goPage, onSearch, onStatus, onFreq, setYear };
})();
