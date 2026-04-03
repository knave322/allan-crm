// modules/settings.js — Settings & Help

const SettingsModule = (() => {

  async function render() {
    document.getElementById('page-content').innerHTML = `
      <div style="max-width:760px">

        <div class="card">
          <div class="card-header">
            <div class="card-title">🔌 Connection Status</div>
            <button class="btn btn-outline btn-sm" onclick="SettingsModule.testConnection()">Test Connection</button>
          </div>
          <div id="conn-status">
            <div class="loading-overlay" style="padding:20px"><div class="spinner"></div></div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:14px">⚙️ Current Configuration</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            ${[
              ['System Name', CONFIG.SYSTEM.name],
              ['Company', CONFIG.SYSTEM.company],
              ['Advisor', CONFIG.SYSTEM.advisor],
              ['Currency', CONFIG.SYSTEM.currency],
              ['Timezone', CONFIG.SYSTEM.timezone],
              ['Page Size', CONFIG.PAGE_SIZE + ' records/page'],
              ['Cache Duration', CONFIG.CACHE_MINUTES + ' minutes'],
              ['Payment Warning', CONFIG.REMINDERS.payment_due_warning_days + ' days before'],
              ['Payment Danger', CONFIG.REMINDERS.payment_due_danger_days + ' days before'],
              ['Insurers', CONFIG.INSURERS.join(', ')]
            ].map(([k,v]) => `
              <div style="background:var(--bg-base);padding:10px 14px;border-radius:6px;border:1px solid var(--border)">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">${k}</div>
                <div style="font-size:13px;font-weight:500;color:var(--text-primary)">${v}</div>
              </div>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:14px">📖 How to Update Configuration</div>
          <p style="color:var(--text-secondary);font-size:13.5px;line-height:1.8;margin-bottom:12px">
            All customizable settings are in <strong>config.js</strong>. This is the only file you need to edit.
          </p>
          <div style="background:var(--bg-base);border-radius:8px;padding:14px;border:1px solid var(--border)">
            <div style="font-size:12.5px;color:var(--text-secondary);line-height:2">
              1. Open <strong>config.js</strong> in any text editor<br>
              2. Make your changes (insurer names, status labels, reminder days, etc.)<br>
              3. Save the file<br>
              4. In GitHub Desktop → Commit → Push Origin<br>
              5. Wait ~1 minute → refresh the CRM page
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:14px">⌨️ Keyboard Shortcuts</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${[
              ['Alt + 1', 'Dashboard'],
              ['Alt + 2', 'Payment Tracker'],
              ['Alt + 3', 'Claims Management'],
              ['Alt + 4', 'Service Records'],
              ['Escape',  'Close modal/dialog']
            ].map(([k,v]) => `
              <div style="display:flex;align-items:center;gap:12px;padding:8px 12px;background:var(--bg-base);border-radius:6px;border:1px solid var(--border)">
                <kbd style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;padding:2px 8px;font-size:12px;font-family:monospace;color:var(--text-secondary)">${k}</kbd>
                <span style="font-size:13px;color:var(--text-primary)">${v}</span>
              </div>`).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:14px">🔄 Data Management</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn btn-outline" onclick="SettingsModule.clearCache()">🗑️ Clear Local Cache</button>
            <button class="btn btn-outline" onclick="SettingsModule.exportAll()">📥 Export All Data</button>
          </div>
          <p style="color:var(--text-muted);font-size:12px;margin-top:10px">
            Clearing cache forces fresh data from Google Sheets on next load.
          </p>
        </div>

      </div>`;

    testConnection();
  }

  async function testConnection() {
    const el = document.getElementById('conn-status');
    if (el) el.innerHTML = '<div class="loading-overlay" style="padding:20px"><div class="spinner"></div><span>Testing connection...</span></div>';
    const ok = await API.ping();
    if (el) el.innerHTML = ok
      ? `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:#d1fae5;border-radius:8px;border:1px solid #6ee7b7">
           <span style="font-size:20px">✅</span>
           <div>
             <div style="font-weight:600;color:#065f46">Connected to Google Sheets</div>
             <div style="font-size:12px;color:#047857;margin-top:2px">API is responding normally</div>
           </div>
         </div>`
      : `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:#fee2e2;border-radius:8px;border:1px solid #fca5a5">
           <span style="font-size:20px">❌</span>
           <div>
             <div style="font-weight:600;color:#991b1b">Connection Failed</div>
             <div style="font-size:12px;color:#b91c1c;margin-top:2px">Check API_URL in config.js and ensure Apps Script is deployed</div>
           </div>
         </div>`;
  }

  function clearCache() {
    try {
      Object.keys(localStorage).filter(k => k.startsWith('crm_cache_')).forEach(k => localStorage.removeItem(k));
      UI.toast('Cache cleared ✅', 'success');
    } catch(e) { UI.toast('Could not clear cache', 'warning'); }
  }

  async function exportAll() {
    try {
      const [payments, claims, servicing] = await Promise.all([
        API.get('getPayments'), API.get('getClaims'), API.get('getServicing')
      ]);
      UI.exportCSV(payments, 'Payments');
      setTimeout(() => UI.exportCSV(claims, 'Claims'), 500);
      setTimeout(() => UI.exportCSV(servicing, 'Servicing'), 1000);
      UI.toast('Exporting all data...', 'info');
    } catch(e) { UI.toast('Export failed: ' + e.message, 'error'); }
  }

  return { render, testConnection, clearCache, exportAll };
})();
