// ============================================================
// modules/dashboard.js — 🏠 仪表板模块
// ⚠️  请勿修改此文件
// ============================================================

const DashboardModule = (() => {

  async function render() {
    document.getElementById('page-content').innerHTML = `
      <!-- 欢迎横幅 -->
      <div style="margin-bottom:20px">
        <h2 style="font-size:20px;font-weight:700">
          你好，${CONFIG.SYSTEM.advisor} 👋
        </h2>
        <p style="color:var(--text-muted);font-size:13px;margin-top:4px">
          ${new Date().toLocaleDateString('zh-MY', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid" id="dash-stats">
        <div class="stat-card">
          <div class="stat-icon blue">💳</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-payments">—</div>
            <div class="stat-label">付款记录总数</div>
            <div class="stat-sub" id="stat-overdue">加载中...</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow">⏳</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-upcoming">—</div>
            <div class="stat-label">30天内到期付款</div>
            <div class="stat-sub">需要跟进</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">🏥</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-claims">—</div>
            <div class="stat-label">理赔记录总数</div>
            <div class="stat-sub" id="stat-claims-processing">加载中...</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">🔧</div>
          <div class="stat-info">
            <div class="stat-value" id="stat-svc">—</div>
            <div class="stat-label">服务记录总数</div>
            <div class="stat-sub" id="stat-followup">加载中...</div>
          </div>
        </div>
      </div>

      <!-- 下方两栏 -->
      <div class="dash-grid">
        <!-- 左：待办提醒 -->
        <div>
          <!-- 付款提醒 -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">⏰ 即将到期付款</div>
              <button class="btn btn-outline btn-sm" onclick="App.navigate('payments')">查看全部</button>
            </div>
            <div id="dash-payment-reminders">
              <div class="loading-overlay" style="padding:30px"><div class="spinner"></div></div>
            </div>
          </div>

          <!-- 跟进提醒 -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🔔 待跟进服务</div>
              <button class="btn btn-outline btn-sm" onclick="App.navigate('servicing')">查看全部</button>
            </div>
            <div id="dash-followup-reminders">
              <div class="loading-overlay" style="padding:30px"><div class="spinner"></div></div>
            </div>
          </div>
        </div>

        <!-- 右：理赔进行中 + 快捷操作 -->
        <div>
          <!-- 快捷操作 -->
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">⚡ 快捷操作</div>
            <div style="display:flex;flex-direction:column;gap:10px">
              <button class="btn btn-primary" style="justify-content:flex-start;gap:10px"
                onclick="PaymentsModule.openAddModal()">
                💳 新增付款记录
              </button>
              <button class="btn btn-outline" style="justify-content:flex-start;gap:10px"
                onclick="ClaimsModule.openAddModal()">
                🏥 新增理赔记录
              </button>
              <button class="btn btn-outline" style="justify-content:flex-start;gap:10px"
                onclick="ServicingModule.openAddModal()">
                🔧 新增服务记录
              </button>
              <button class="btn btn-outline" style="justify-content:flex-start;gap:10px"
                onclick="App.exportCSV()">
                📥 导出当前数据
              </button>
            </div>
          </div>

          <!-- 理赔进行中 -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🏥 理赔进行中</div>
              <button class="btn btn-outline btn-sm" onclick="App.navigate('claims')">查看全部</button>
            </div>
            <div id="dash-active-claims">
              <div class="loading-overlay" style="padding:30px"><div class="spinner"></div></div>
            </div>
          </div>
        </div>
      </div>`;

    // 加载所有模块数据（并行）
    await Promise.all([
      loadPaymentAlerts(),
      loadClaimsActive(),
      loadFollowupAlerts()
    ]);
  }

  // ── 付款提醒 ─────────────────────────────────────────────
  async function loadPaymentAlerts() {
    try {
      // 触发 payments 模块加载（如还没加载）
      if (typeof PaymentsModule !== 'undefined') {
        await PaymentsModule.loadData();
        const alerts = PaymentsModule.getAlerts();
        const stats  = PaymentsModule.getStats();

        document.getElementById('stat-payments').textContent = stats.total;
        document.getElementById('stat-overdue').textContent =
          stats.overdue > 0 ? `⚠️ ${stats.overdue} 条逾期` : '无逾期';
        document.getElementById('stat-upcoming').textContent = stats.upcoming;

        const el = document.getElementById('dash-payment-reminders');
        if (!el) return;

        if (alerts.length === 0) {
          el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">
            ✅ 暂无即将到期的付款</div>`;
          return;
        }

        el.innerHTML = `<div class="reminder-list">
          ${alerts.slice(0, 8).map(r => {
            const days = UI.daysUntil(r.next_due_date);
            const isDanger = days !== null && days <= CONFIG.REMINDERS.payment_due_danger_days;
            return `<div class="reminder-item ${isDanger ? 'danger' : ''}">
              <div class="avatar" style="width:26px;height:26px;font-size:11px">${UI.avatarText(r.client_name)}</div>
              <div class="ri-name">
                ${r.client_name}
                <div style="font-size:11px;color:var(--text-muted)">${r.insurer} · ${UI.currency(r.premium)}</div>
              </div>
              <div class="ri-days ${isDanger ? 'danger' : ''}">
                ${days === 0 ? '今天到期！' : days < 0 ? `逾期${Math.abs(days)}天` : `${days}天后`}
              </div>
            </div>`;
          }).join('')}
          ${alerts.length > 8 ? `<div style="text-align:center;font-size:12px;color:var(--text-muted);padding:8px">
            还有 ${alerts.length - 8} 条...</div>` : ''}
        </div>`;
      }
    } catch (e) {
      console.warn('Dashboard payment alerts error:', e);
    }
  }

  // ── 跟进提醒 ─────────────────────────────────────────────
  async function loadFollowupAlerts() {
    try {
      if (typeof ServicingModule !== 'undefined') {
        await ServicingModule.loadData();
        const followups = ServicingModule.getPendingFollowups();
        const stats     = ServicingModule.getStats();

        document.getElementById('stat-svc').textContent = stats.total;
        document.getElementById('stat-followup').textContent =
          stats.followup > 0 ? `🔔 ${stats.followup} 待跟进` : '无待跟进';

        const el = document.getElementById('dash-followup-reminders');
        if (!el) return;

        if (followups.length === 0) {
          el.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:13px">
            ✅ 暂无逾期跟进记录</div>`;
          return;
        }

        el.innerHTML = `<div class="reminder-list">
          ${followups.slice(0, 6).map(r => {
            const days = UI.daysUntil(r.next_followup);
            const overdue = days !== null && days < 0;
            return `<div class="reminder-item ${overdue ? 'danger' : ''}">
              <div class="avatar" style="width:26px;height:26px;font-size:11px">${UI.avatarText(r.client_name)}</div>
              <div class="ri-name">
                ${r.client_name}
                <div style="font-size:11px;color:var(--text-muted)">${r.service_type}</div>
              </div>
              <div class="ri-days ${overdue ? 'danger' : ''}">
                ${overdue ? `逾期${Math.abs(days)}天` : `${days}天后`}
              </div>
            </div>`;
          }).join('')}
        </div>`;
      }
    } catch (e) {
      console.warn('Dashboard followup alerts error:', e);
    }
  }

  // ── 进行中理赔 ────────────────────────────────────────────
  async function loadClaimsActive() {
    try {
      if (typeof ClaimsModule !== 'undefined') {
        await ClaimsModule.loadData();
        const stats = ClaimsModule.getStats();

        document.getElementById('stat-claims').textContent = stats.total;
        document.getElementById('stat-claims-processing').textContent =
          stats.processing > 0 ? `🔄 ${stats.processing} 件审核中` : '无待处理';

        const el = document.getElementById('dash-active-claims');
        if (!el) return;

        // 从 ClaimsModule 的内部数据里取进行中的理赔
        // 由于 _data 是私有变量，通过 getStats 的方式间接展示
        el.innerHTML = `
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            ${Object.entries(CONFIG.CLAIM_STATUS).map(([k, v]) => {
              // 这里需要实际数量，暂时用样式展示
              return `<div style="text-align:center;flex:1;min-width:70px">
                <div style="font-size:20px">${v.icon}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:4px">${v.label}</div>
              </div>`;
            }).join('')}
          </div>
          <div class="alert-banner alert-info" style="margin-top:12px">
            📊 共 <strong>${stats.total}</strong> 条理赔记录，
            <strong>${stats.processing}</strong> 件审核中，
            <strong>${stats.approved}</strong> 件已处理
          </div>`;
      }
    } catch (e) {
      console.warn('Dashboard claims error:', e);
    }
  }

  return { render };

})();
