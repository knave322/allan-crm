// ============================================================
// modules/settings.js — ⚙️ 设置 & 帮助模块
// ⚠️  请勿修改此文件
// ============================================================

const SettingsModule = (() => {

  async function render() {
    const connected = API.isConnected();

    document.getElementById('page-content').innerHTML = `
      <!-- API 连接状态 -->
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">🔌 Google Sheets 连接状态</div>
        <div class="alert-banner ${connected ? 'alert-success' : 'alert-danger'}">
          ${connected
            ? '✅ 已成功连接到 Google Sheets！数据正在同步。'
            : '❌ 未连接到 Google Sheets。请检查 config.js 中的 API_URL 是否正确配置。'}
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">当前 API URL（来自 config.js）</label>
          <input type="text" value="${CONFIG.API_URL}" readonly style="color:var(--text-muted);cursor:not-allowed" />
        </div>
        <button class="btn btn-outline" onclick="SettingsModule.testConnection()">🔄 测试连接</button>
      </div>

      <!-- 系统信息 -->
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">ℹ️ 系统信息</div>
        <div class="form-grid">
          <div><div class="form-label">系统名称</div><div>${CONFIG.SYSTEM.name}</div></div>
          <div><div class="form-label">公司</div><div>${CONFIG.SYSTEM.company}</div></div>
          <div><div class="form-label">顾问姓名</div><div>${CONFIG.SYSTEM.advisor}</div></div>
          <div><div class="form-label">货币</div><div>${CONFIG.SYSTEM.currency}</div></div>
          <div><div class="form-label">版本</div><div>v1.0.0 (2026)</div></div>
          <div><div class="form-label">每页记录数</div><div>${CONFIG.PAGE_SIZE} 条</div></div>
        </div>
      </div>

      <!-- 配置摘要 -->
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">⚙️ 当前配置摘要</div>
        <div class="form-grid">
          <div>
            <div class="form-label">保险公司列表（${CONFIG.INSURERS.length} 家）</div>
            <div style="font-size:12px">${CONFIG.INSURERS.join(' / ')}</div>
          </div>
          <div>
            <div class="form-label">付款到期提醒</div>
            <div>警告：${CONFIG.REMINDERS.payment_due_warning_days}天 / 危险：${CONFIG.REMINDERS.payment_due_danger_days}天</div>
          </div>
          <div>
            <div class="form-label">保单续期提醒</div>
            <div>${CONFIG.REMINDERS.policy_renewal_warning_days}天前提醒</div>
          </div>
          <div>
            <div class="form-label">缓存时间</div>
            <div>${CONFIG.CACHE_MINUTES} 分钟</div>
          </div>
        </div>
      </div>

      <!-- 维护指南 -->
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">📖 快速维护指南</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[
            { icon:'1️⃣', title:'修改保险公司列表', desc:'打开 config.js → 找到 INSURERS 数组 → 添加或删除公司名称 → 保存文件' },
            { icon:'2️⃣', title:'修改付款/理赔状态标签', desc:'打开 config.js → 找到 PAYMENT_STATUS / CLAIM_STATUS → 修改 label 值 → 保存' },
            { icon:'3️⃣', title:'修改提醒天数', desc:'打开 config.js → 找到 REMINDERS 部分 → 修改天数数字 → 保存' },
            { icon:'4️⃣', title:'更换 Google Sheets', desc:'部署新的 GAS → 复制新的 Web App URL → 粘贴到 config.js 的 API_URL → 保存' },
            { icon:'5️⃣', title:'部署更新到 GitHub', desc:'修改文件后 → git add . → git commit -m "更新配置" → git push → 等待 GitHub Pages 自动更新' }
          ].map(item => `
            <div style="display:flex;gap:12px;align-items:flex-start;padding:12px;background:var(--bg-base);border-radius:var(--radius-sm)">
              <span style="font-size:20px;flex-shrink:0">${item.icon}</span>
              <div>
                <div class="fw-600 fs-13">${item.title}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:3px">${item.desc}</div>
              </div>
            </div>`).join('')}
        </div>
      </div>

      <!-- 数据管理 -->
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">📊 数据管理</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-outline" onclick="SettingsModule.exportAll()">📥 导出全部数据（CSV）</button>
          <button class="btn btn-outline" onclick="SettingsModule.clearCache()">🗑️ 清除本地缓存</button>
          <button class="btn btn-outline" onclick="App.refreshData()">🔄 强制刷新数据</button>
        </div>
      </div>

      <!-- 联系 & 支持 -->
      <div class="card">
        <div class="card-title" style="margin-bottom:14px">💬 技术支持</div>
        <div class="alert-banner alert-info">
          如需修改系统功能（非配置），请联系开发者或参考 README.md 文件中的维护说明。
          <br/>所有用户配置修改只需编辑 <strong>config.js</strong> 文件，无需懂编程。
        </div>
      </div>`;
  }

  async function testConnection() {
    UI.toast('正在测试连接...', 'info', 2000);
    const ok = await API.testConnection();
    if (ok) {
      UI.toast('✅ 连接成功！Google Sheets 正在响应', 'success');
    } else {
      UI.toast('❌ 连接失败。请检查 config.js 中的 API_URL', 'error', 5000);
    }
  }

  function exportAll() {
    UI.toast('正在准备导出...', 'info');
    // 触发每个模块的 CSV 导出
    setTimeout(() => PaymentsModule.exportCSV(), 200);
    setTimeout(() => ClaimsModule.exportCSV(), 800);
    setTimeout(() => ServicingModule.exportCSV(), 1400);
  }

  function clearCache() {
    API.clearCache();
    UI.toast('本地缓存已清除', 'success');
  }

  return { render, testConnection, exportAll, clearCache };

})();
