// app.js — Main Application Controller

const App = (() => {

  let _currentPage = 'dashboard';

  const PAGES = {
    dashboard: {
      title: 'Dashboard', subtitle: 'Overview & Reminders',
      module: () => DashboardModule.render()
    },
    payments: {
      title: 'Payment Tracker', subtitle: 'Premium payment records',
      module: () => PaymentsModule.render()
    },
    claims: {
      title: 'Claims Management', subtitle: 'Track and update claim records',
      module: () => ClaimsModule.render()
    },
    servicing: {
      title: 'Service Records', subtitle: 'Client servicing history & follow-ups',
      module: () => ServicingModule.render()
    },
    settings: {
      title: 'Settings & Help', subtitle: 'Configuration and maintenance guide',
      module: () => SettingsModule.render()
    }
  };

  async function init() {
    // Apply accent color
    if (CONFIG.SYSTEM.accent_color) {
      document.documentElement.style.setProperty('--accent', CONFIG.SYSTEM.accent_color);
    }

    // Set system info
    document.title = CONFIG.SYSTEM.name;
    const sysNameEl = document.getElementById('sys-name');
    const sysCompEl = document.getElementById('sys-company');
    const logoBadge = document.getElementById('logo-badge');
    if (sysNameEl) sysNameEl.textContent = CONFIG.SYSTEM.name;
    if (sysCompEl) sysCompEl.textContent = CONFIG.SYSTEM.company;
    if (logoBadge) logoBadge.textContent = CONFIG.SYSTEM.logo_text || 'AW';

    // Today's date
    const todayEl = document.getElementById('today-date');
    if (todayEl) todayEl.textContent = new Date().toLocaleDateString('en-MY', { month: 'short', day: 'numeric' });

    // Navigation clicks
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.page));
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') UI.closeModal();
      if (e.altKey && e.key === '1') navigate('dashboard');
      if (e.altKey && e.key === '2') navigate('payments');
      if (e.altKey && e.key === '3') navigate('claims');
      if (e.altKey && e.key === '4') navigate('servicing');
    });

    // Ping API (non-blocking)
    API.ping().then(ok => {
      if (!ok) UI.toast('Could not connect to Google Sheets. Check API_URL in config.js', 'warning');
    });

    await navigate('dashboard');
  }

  async function navigate(pageName) {
    const page = PAGES[pageName];
    if (!page) return;
    _currentPage = pageName;

    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageName);
    });

    const titleEl    = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    if (titleEl)    titleEl.textContent    = page.title;
    if (subtitleEl) subtitleEl.textContent = page.subtitle;

    try {
      await page.module();
    } catch (e) {
      console.error('Page render error:', e);
      document.getElementById('page-content').innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Page failed to load</div>
          <div class="empty-sub">${e.message}</div>
          <button class="btn btn-outline" style="margin-top:12px" onclick="App.navigate('${pageName}')">🔄 Retry</button>
        </div>`;
    }
  }

  async function refreshData() {
    UI.toast('Refreshing...', 'info');
    await navigate(_currentPage);
  }

  window.addEventListener('DOMContentLoaded', () => {
    Auth.init();
    if (Auth.isLoggedIn()) init();
    else {
      const check = setInterval(() => {
        if (Auth.isLoggedIn()) { clearInterval(check); init(); }
      }, 200);
    }
  });

  return { navigate, refreshData };

})();
