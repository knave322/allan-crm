// ============================================================
// app.js — 主应用控制器
// ⚠️  请勿修改此文件
// ============================================================

const App = (() => {

  let _currentPage = 'dashboard';

  // ── 页面配置 ──────────────────────────────────────────────
  const PAGES = {
    dashboard: {
      title:    '仪表板',
      subtitle: '概览 & 待办提醒',
      module:   () => DashboardModule.render(),
      exportFn: null
    },
    payments: {
      title:    '付款跟踪',
      subtitle: '保费缴费记录管理',
      module:   () => PaymentsModule.render(),
      exportFn: () => PaymentsModule.exportCSV()
    },
    claims: {
      title:    '理赔管理',
      subtitle: '理赔记录跟踪与状态更新',
      module:   () => ClaimsModule.render(),
      exportFn: () => ClaimsModule.exportCSV()
    },
    servicing: {
      title:    '服务记录',
      subtitle: '客户服务历史与跟进管理',
      module:   () => ServicingModule.render(),
      exportFn: () => ServicingModule.exportCSV()
    },
    settings: {
      title:    '设置 & 帮助',
      subtitle: '系统配置与维护指南',
      module:   () => SettingsModule.render(),
      exportFn: null
    }
  };

  // ── 初始化 ────────────────────────────────────────────────
  async function init() {
    // 注入主题颜色
    if (CONFIG.SYSTEM.accent_color) {
      document.documentElement.style.setProperty('--accent', CONFIG.SYSTEM.accent_color);
    }

    // 设置界面文字
    document.title = CONFIG.SYSTEM.name;
    const sysNameEl = document.getElementById('sys-name');
    const sysCompEl = document.getElementById('sys-company');
    const logoBadge = document.getElementById('logo-badge');
    if (sysNameEl) sysNameEl.textContent = CONFIG.SYSTEM.name;
    if (sysCompEl) sysCompEl.textContent = CONFIG.SYSTEM.company;
    if (logoBadge) logoBadge.textContent = CONFIG.SYSTEM.logo_text || 'AW';

    // 显示今日日期
    const todayEl = document.getElementById('today-date');
    if (todayEl) todayEl.textContent = new Date().toLocaleDateString('zh-MY', { month: 'short', day: 'numeric' });

    // 绑定导航点击事件
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => navigate(item.dataset.page));
    });

    // 测试 API 连接（非阻塞）
    API.testConnection().then(ok => {
      UI.setConnectionStatus(ok);
      if (!ok) {
        UI.toast('⚠️ 未能连接 Google Sheets，请配置 API_URL', 'warning', 6000);
      }
    });

    // 渲染仪表板
    await navigate('dashboard');
  }

  // ── 页面导航 ──────────────────────────────────────────────
  async function navigate(pageName) {
    const page = PAGES[pageName];
    if (!page) return;

    _currentPage = pageName;

    // 更新侧边栏高亮
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageName);
    });

    // 更新顶部标题
    const titleEl    = document.getElementById('page-title');
    const subtitleEl = document.getElementById('page-subtitle');
    if (titleEl)    titleEl.textContent    = page.title;
    if (subtitleEl) subtitleEl.textContent = page.subtitle;

    // 在移动端关闭侧边栏
    document.getElementById('sidebar').classList.remove('open');

    // 渲染页面内容
    try {
      await page.module();
    } catch (e) {
      console.error('Page render error:', e);
      document.getElementById('page-content').innerHTML =
        `<div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <p style="color:var(--danger)">页面加载失败</p>
          <small>${e.message}</small>
          <br/>
          <button class="btn btn-outline" style="margin-top:12px" onclick="App.navigate('${pageName}')">🔄 重试</button>
        </div>`;
    }
  }

  // ── 刷新当前页面数据 ──────────────────────────────────────
  async function refreshData() {
    API.clearCache();
    UI.toast('正在刷新数据...', 'info', 1500);
    await navigate(_currentPage);
  }

  // ── 导出当前页 CSV ────────────────────────────────────────
  function exportCSV() {
    const page = PAGES[_currentPage];
    if (page && page.exportFn) {
      page.exportFn();
    } else {
      UI.toast('当前页面不支持导出', 'warning');
    }
  }

  // ── 移动端侧边栏开关 ──────────────────────────────────────
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
  }

  // ── 全局键盘快捷键 ───────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') Modal.close();
    if (e.altKey && e.key === '1') navigate('dashboard');
    if (e.altKey && e.key === '2') navigate('payments');
    if (e.altKey && e.key === '3') navigate('claims');
    if (e.altKey && e.key === '4') navigate('servicing');
  });

  // ── 启动 ─────────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', init);

  return { navigate, refreshData, exportCSV, toggleSidebar };

})();
