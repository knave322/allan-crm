// modules/dashboard.js — Dashboard Module

const DashboardModule = (() => {

  async function render() {
    document.getElementById('page-content').innerHTML = `
      <div style="margin-bottom:20px">
        <h2 style="font-size:20px;font-weight:700">
          Welcome back, ${CONFIG.SYSTEM.advisor} 👋
        </h2>
        <p style="color:var(--text-muted);font-size:13px;margin-top:4px">
          ${new Date().toLocaleDateString('en-MY', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      <div class="stats-grid" id="dash-stats">
        <div class="stat-card">
          <div class="stat-icon blue">💳</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-payments">—</div>
            <div class="stat-label">Total Payment Records</div>
            <div class="stat-sub" id="stat-overdue">Loading...</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">⏳</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-upcoming">—</div>
            <div class="stat-label">Due Within 30 Days</div>
            <div class="stat-sub">Needs follow-up</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">🏥</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-claims">—</div>
            <div class="stat-label">Total Claims</div>
            <div class="stat-sub" id="stat-claims-processing">Loading...</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">🔧</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-svc">—</div>
            <div class="stat-label">Total Service Records</div>
            <div class="stat-sub" id="stat-followup">Loading...</div>
          </div>
        </div>
      </div>

      <div class="dash-grid">
        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">⏰ Upcoming Payments</div>
              <button class="btn btn-outline btn-sm" onclick="App.navigate('payments')">View All</button>
            </div>
            <div id="dash-payment-reminders">
              <div class="loading-overlay" style="padding:30px"><div class="spinner"></div></div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">🔔 Pending Follow-ups</div>
              <button class="btn btn-outline btn-sm" onclick="App.navigate('servicing')">View All</button>
            </div>
            <div id="dash-followup-reminders">
              <div class="loading-overlay" style="padding:30px"><div class="spinner"></div></div>
            </div>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">⚡ Quick Actions</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <button class="btn btn-primary" style="justify-content:flex-start;gap:10px"
                onclick="PaymentsModule.openAddModal()">
                💳 Add Payment Record
              </button>
              <button class="btn btn-outline" style="justify-content:flex-start;gap:10px"
                onclick="ClaimsModule.openAddModal()">
                🏥 Add Claim Record
              </button>
              <button class="btn btn-outline" style="justify-content:flex-start;gap:10px"
                onclick="ServicingModule.openAddModal()">
                🔧 Add Service Record
              </button>
              <button class="btn btn-outline" style="justify-content:flex-start;gap:10px"
                onclick="UI.exportTableToCSV('payments')">
                📥 Export Data (CSV)
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">🏥 Claims In Progress</div>
              <button class="btn btn-outline btn-sm" onclick="App.navigate('claims')">View All</button>
            </div>
            <div id="dash-claims-progress">
              <div class="loading-overlay" style="padding:20px"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </div>
    `;

    loadDashboardData();
  }

  async function loadDashboardData() {
    try {
      const [payments, claims, servicing] = await Promise.all([
        API.get('getPayments'),
        API.get('getClaims'),
        API.get('getServicing')
      ]);

      renderStats(payments, claims, servicing);
      renderPaymentReminders(payments);
      renderFollowupReminders(servicing);
      renderClaimsProgress(claims);
    } catch (e) {
      console.error('Dashboard load error:', e);
      // Try to use cached data
      const cached = API.getCachedData('getPayments');
      if (cached) {
        document.getElementById('dash-payment-reminders').innerHTML =
          '<div class="empty-state"><div class="empty-icon">📶</div><div class="empty-title">Offline Mode</div><div class="empty-sub">Showing cached data</div></div>';
      }
    }
  }

  function renderStats(payments, claims, servicing) {
    const now = new Date();
    const in30 = new Date(now); in30.setDate(in30.getDate() + 30);

    const overdue  = payments.filter(p => p.status === 'overdue').length;
    const upcoming = payments.filter(p => {
      const d = new Date(p.next_due_date);
      return p.status === 'pending' && d >= now && d <= in30;
    }).length;
    const processing = claims.filter(c => ['submitted','processing','approved'].includes(c.status)).length;
    const followup   = servicing.filter(s => s.status === 'followup').length;

    document.getElementById('stat-payments').textContent = payments.length;
    document.getElementById('stat-overdue').innerHTML = overdue > 0
      ? `<span class="text-danger">⚠ ${overdue} overdue</span>` : '✓ All up to date';
    document.getElementById('stat-upcoming').textContent = upcoming;
    document.getElementById('stat-claims').textContent = claims.length;
    document.getElementById('stat-claims-processing').textContent = `${processing} in progress`;
    document.getElementById('stat-svc').textContent = servicing.length;
    document.getElementById('stat-followup').textContent = `${followup} pending follow-up`;
  }

  function renderPaymentReminders(payments) {
    const now = new Date();
    const in30 = new Date(now); in30.setDate(in30.getDate() + 30);

    const items = payments
      .filter(p => {
        if (p.status === 'overdue') return true;
        if (p.status === 'pending') {
          const d = new Date(p.next_due_date);
          return d >= now && d <= in30;
        }
        return false;
      })
      .sort((a, b) => new Date(a.next_due_date) - new Date(b.next_due_date))
      .slice(0, 5);

    const el = document.getElementById('dash-payment-reminders');
    if (!items.length) {
      el.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-icon">✅</div><div class="empty-title">No upcoming payments</div></div>';
      return;
    }

    el.innerHTML = items.map(p => {
      const due = new Date(p.next_due_date);
      const diff = Math.ceil((due - now) / 86400000);
      const isOverdue = p.status === 'overdue' || diff < 0;
      const cls = isOverdue ? 'danger' : diff <= 7 ? 'warning' : 'success';
      const label = isOverdue ? `Overdue ${Math.abs(diff)}d` : `Due in ${diff}d`;
      const initials = p.client_name ? p.client_name.substring(0,2).toUpperCase() : '??';
      return `
        <div class="reminder-item" onclick="App.navigate('payments')">
          <div class="reminder-avatar ${cls}">${initials}</div>
          <div class="reminder-info">
            <div class="reminder-name">${p.client_name}</div>
            <div class="reminder-detail">${p.insurer} · ${CONFIG.SYSTEM.currency} ${Number(p.premium||0).toFixed(2)}</div>
          </div>
          <div class="reminder-badge ${cls}">${label}</div>
        </div>`;
    }).join('');
  }

  function renderFollowupReminders(servicing) {
    const items = servicing
      .filter(s => s.status === 'followup' || (s.next_followup && new Date(s.next_followup) <= new Date(Date.now() + 7*86400000)))
      .sort((a, b) => new Date(a.next_followup) - new Date(b.next_followup))
      .slice(0, 4);

    const el = document.getElementById('dash-followup-reminders');
    if (!items.length) {
      el.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-icon">✅</div><div class="empty-title">No pending follow-ups</div></div>';
      return;
    }

    const now = new Date();
    el.innerHTML = items.map(s => {
      const due = s.next_followup ? new Date(s.next_followup) : null;
      const diff = due ? Math.ceil((due - now) / 86400000) : null;
      const cls = diff !== null ? (diff < 0 ? 'danger' : diff <= 3 ? 'warning' : 'success') : 'warning';
      const label = diff !== null ? (diff < 0 ? `Overdue ${Math.abs(diff)}d` : `In ${diff}d`) : 'Pending';
      const initials = s.client_name ? s.client_name.substring(0,2).toUpperCase() : '??';
      return `
        <div class="reminder-item" onclick="App.navigate('servicing')">
          <div class="reminder-avatar ${cls}">${initials}</div>
          <div class="reminder-info">
            <div class="reminder-name">${s.client_name}</div>
            <div class="reminder-detail">${s.service_type || 'Service'}</div>
          </div>
          <div class="reminder-badge ${cls}">${label}</div>
        </div>`;
    }).join('');
  }

  function renderClaimsProgress(claims) {
    const active = claims.filter(c => ['submitted','processing','approved'].includes(c.status));
    const el = document.getElementById('dash-claims-progress');

    if (!active.length) {
      el.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-icon">✅</div><div class="empty-title">No active claims</div></div>';
      return;
    }

    const statusMap = { submitted:'Submitted', processing:'Processing', approved:'Approved' };
    const claimStatusCounts = {};
    CONFIG.CLAIM_STATUS.forEach(s => { claimStatusCounts[s.value] = 0; });
    claims.forEach(c => { if (claimStatusCounts[c.status] !== undefined) claimStatusCounts[c.status]++; });

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px">
        ${Object.entries(claimStatusCounts).filter(([k]) => ['draft','submitted','processing','approved','paid_out','rejected'].includes(k)).map(([k,v]) => {
          const s = CONFIG.CLAIM_STATUS.find(x => x.value === k);
          return `<div style="text-align:center;padding:10px;border-radius:8px;background:var(--bg-base);border:1px solid var(--border)">
            <div style="font-size:18px;font-weight:700;color:var(--text-primary)">${v}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${s ? s.label : k}</div>
          </div>`;
        }).join('')}
      </div>
      ${active.slice(0,3).map(c => `
        <div class="reminder-item">
          <div class="reminder-info">
            <div class="reminder-name">${c.client_name} — ${c.claim_type || 'Claim'}</div>
            <div class="reminder-detail">${c.insurer} · ${UI.badge(c.status, CONFIG.CLAIM_STATUS)}</div>
          </div>
        </div>`).join('')}
    `;
  }

  return { render };
})();
