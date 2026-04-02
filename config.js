// ============================================================
// ALLAN CRM 2026 — 配置文件 (config.js)
// ============================================================
// ⚠️  重要：这是系统里【唯一】需要修改的文件！
//    所有定制（名字、保险公司、状态标签、颜色等）
//    全部在这里修改。请勿改动其他 .js 文件。
// ============================================================
// 上次修改：2026-04-03
// ============================================================

const CONFIG = {

  // ──────────────────────────────────────────────────────────
  // 1. GOOGLE APPS SCRIPT 后端 URL
  //    步骤：部署 google-apps-script.gs → 复制 Web App URL → 粘贴到这里
  // ──────────────────────────────────────────────────────────
  API_URL: "https://script.google.com/macros/s/AKfycbwJvyJW_RKs2idl0zBSHgMIxxiC_OKoQVzAE7Wd5o7wEV4Ak7aBE1lkqJyMD92kmTbB/exec",

  // ──────────────────────────────────────────────────────────
  // 2. 系统基本信息
  // ──────────────────────────────────────────────────────────
  SYSTEM: {
    name:        "Allan CRM 2026",          // 系统名称（显示在顶部）
    company:     "ROC Wealth Advisory",    // 公司名称
    advisor:     "Allan",                  // 顾问姓名
    currency:    "RM",                     // 货币符号
    timezone:    "Asia/Kuala_Lumpur",      // 时区
    logo_text:   "RS",                     // 左上角 Logo 文字（2个字母）
    accent_color: "#0ea5e9"                // 主题颜色（十六进制）
  },

  // ──────────────────────────────────────────────────────────
  // 3. 保险公司列表（下拉选单）
  //    增删保险公司：直接在这里加或删字符串
  // ──────────────────────────────────────────────────────────
  INSURERS: [
    "AIA Life",
    "AIA Takaful",
    "Allianz General",
    "Great Eastern",
    "Prudential",
    "其他"
  ],

  // ──────────────────────────────────────────────────────────
  // 4. 付款频率（Payment Frequency）
  // ──────────────────────────────────────────────────────────
  PAYMENT_FREQUENCIES: [
    "月缴 (Monthly)",
    "季缴 (Quarterly)",
    "半年缴 (Semi-Annual)",
    "年缴 (Annual)",
    "一次性 (Single Premium)"
  ],

  // ──────────────────────────────────────────────────────────
  // 5. 付款状态配置
  //    label = 显示文字，color = 颜色代码
  // ──────────────────────────────────────────────────────────
  PAYMENT_STATUS: {
    pending:   { label: "待付款",  color: "#f59e0b", icon: "⏳" },
    paid:      { label: "已付款",  color: "#10b981", icon: "✅" },
    overdue:   { label: "逾期",    color: "#ef4444", icon: "🔴" },
    cancelled: { label: "已取消",  color: "#6b7280", icon: "❌" }
  },

  // ──────────────────────────────────────────────────────────
  // 6. 理赔状态配置
  // ──────────────────────────────────────────────────────────
  CLAIM_STATUS: {
    draft:      { label: "草稿",    color: "#9ca3af", icon: "📝" },
    submitted:  { label: "已提交",  color: "#3b82f6", icon: "📤" },
    processing: { label: "审核中",  color: "#f59e0b", icon: "🔄" },
    approved:   { label: "已批准",  color: "#10b981", icon: "✅" },
    paid_out:   { label: "已赔付",  color: "#8b5cf6", icon: "💰" },
    rejected:   { label: "拒绝",    color: "#ef4444", icon: "❌" }
  },

  // ──────────────────────────────────────────────────────────
  // 7. 理赔类别
  // ──────────────────────────────────────────────────────────
  CLAIM_TYPES: [
    "住院 (Hospitalisation)",
    "重症 (Critical Illness)",
    "意外 (Accidental)",
    "身故 (Death Benefit)",
    "全残 (TPD)",
    "门诊 (Outpatient)",
    "牙科 (Dental)",
    "其他 (Others)"
  ],

  // ──────────────────────────────────────────────────────────
  // 8. 服务记录类型（Servicing Types）
  // ──────────────────────────────────────────────────────────
  SERVICE_TYPES: [
    "年度检讨 (Annual Review)",
    "保单变更 (Policy Amendment)",
    "受益人更新 (Beneficiary Update)",
    "理赔协助 (Claims Assistance)",
    "新保单咨询 (New Policy Consultation)",
    "续期提醒 (Renewal Reminder)",
    "医疗卡申请 (Medical Card Application)",
    "投资检讨 (Investment Review)",
    "信托/遗嘱咨询 (Trust/Will Advisory)",
    "客户跟进 (Follow-Up)",
    "其他 (Others)"
  ],

  // ──────────────────────────────────────────────────────────
  // 9. 服务状态
  // ──────────────────────────────────────────────────────────
  SERVICE_STATUS: {
    scheduled:  { label: "已预约",  color: "#3b82f6", icon: "📅" },
    completed:  { label: "已完成",  color: "#10b981", icon: "✅" },
    followup:   { label: "待跟进",  color: "#f59e0b", icon: "🔔" },
    cancelled:  { label: "取消",    color: "#6b7280", icon: "❌" }
  },

  // ──────────────────────────────────────────────────────────
  // 10. 提醒天数设置
  //     系统会在到期前 X 天显示提醒（仪表板警告区）
  // ──────────────────────────────────────────────────────────
  REMINDERS: {
    payment_due_warning_days:   30,   // 付款到期前多少天显示警告
    payment_due_danger_days:     7,   // 付款到期前多少天显示红色危险
    policy_renewal_warning_days: 60,  // 保单续期前多少天提醒
    follow_up_overdue_days:       7   // 跟进超过多少天视为逾期
  },

  // ──────────────────────────────────────────────────────────
  // 11. 客户分层标签（Client Tier）
  // ──────────────────────────────────────────────────────────
  CLIENT_TIERS: [
    "VIP (>RM5000 APE)",
    "优质 (RM2000-5000 APE)",
    "标准 (RM500-2000 APE)",
    "新客户 (New)"
  ],

  // ──────────────────────────────────────────────────────────
  // 12. Google Sheets 工作表名称
  //     必须和你的 Google Sheets 中的 Sheet 名称完全一致！
  // ──────────────────────────────────────────────────────────
  SHEET_NAMES: {
    clients:   "Clients",    // 客户主表
    payments:  "Payments",   // 付款跟踪表
    claims:    "Claims",     // 理赔记录表
    servicing: "Servicing"   // 服务记录表
  },

  // ──────────────────────────────────────────────────────────
  // 13. 每页显示记录数
  // ──────────────────────────────────────────────────────────
  PAGE_SIZE: 20,

  // ──────────────────────────────────────────────────────────
  // 14. 本地缓存时间（分钟）
  //     减少对 Google Sheets API 的请求次数
  // ──────────────────────────────────────────────────────────
  CACHE_MINUTES: 5

};

// 防止意外修改配置对象
Object.freeze(CONFIG);
