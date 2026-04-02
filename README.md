# Allan CRM 2026 🛡️

**Insurance CRM System for Malaysian Advisors**
> AIA Life · AIA Takaful · Allianz General · ROC Wealth Advisory

---

## 🚀 系统概览

Allan CRM 2026 是专为马来西亚保险顾问设计的客户关系管理系统，部署在 GitHub Pages（免费），数据存储在 Google Sheets，后端使用 Google Apps Script。

### 核心功能
| 模块 | 说明 |
|------|------|
| 💳 付款跟踪 | 保费缴纳记录、到期提醒、逾期追踪 |
| 🏥 理赔管理 | 理赔进度跟踪、状态更新、金额记录 |
| 🔧 服务记录 | 客户服务历史、跟进计划、时间线视图 |
| 🏠 仪表板 | 汇总统计、待办提醒、快捷操作 |

---

## 📁 文件结构

```
allan-crm/
├── index.html                  # 主页面（入口）
├── config.js                   # ⭐ 唯一需要修改的配置文件
├── app.js                      # 主应用控制器
├── styles.css                  # 样式文件
├── google-apps-script.gs       # Google Apps Script 后端代码
├── modules/
│   ├── api.js                  # API 通信层
│   ├── ui.js                   # 共用 UI 工具
│   ├── dashboard.js            # 仪表板模块
│   ├── payments.js             # 付款跟踪模块
│   ├── claims.js               # 理赔管理模块
│   ├── servicing.js            # 服务记录模块
│   └── settings.js             # 设置模块
├── SETUP_GUIDE.xlsx            # 安装指南（Excel）
└── MAINTENANCE.xlsx            # 维护清单（Excel）
```

---

## ⚡ 快速部署（3步完成）

### 第1步：设置 Google Sheets

1. 创建新的 Google Sheets 文档
2. 打开「扩展程序」→「Apps Script」
3. 把 `google-apps-script.gs` 的内容**全部复制粘贴**进去
4. 点击「运行」→ 选择 `initializeAllSheets` 函数 → 运行（自动创建所有工作表）
5. 点击「部署」→「新增部署」
   - 类型：**网页应用**
   - 执行者：**我**
   - 有权限访问：**所有人**
6. 复制生成的 **Web App URL**

### 第2步：配置 config.js

打开 `config.js`，找到第一个设置项，粘贴你的 URL：

```javascript
API_URL: "https://script.google.com/macros/s/你的ID/exec",
```

根据需要修改其他配置（公司名、保险公司列表等）。

### 第3步：部署到 GitHub Pages

```bash
git add .
git commit -m "初始化 Allan CRM 2026"
git push origin main
```

在 GitHub 仓库设置中开启 GitHub Pages（Source: main branch）。

访问：`https://knave322.github.io/allan-crm/`

---

## 🔧 日常维护（无需懂代码）

### 只需修改 config.js！

| 要修改什么 | 位置 | 怎么改 |
|-----------|------|--------|
| 添加保险公司 | `INSURERS` 数组 | 加一行字符串 |
| 修改状态标签 | `PAYMENT_STATUS` / `CLAIM_STATUS` | 改 `label` 值 |
| 调整提醒天数 | `REMINDERS` 部分 | 改数字 |
| 修改主题颜色 | `accent_color` | 填十六进制颜色码 |
| 换 Google Sheets | `API_URL` | 粘贴新的 GAS URL |

修改后：`git add . → git commit → git push`

---

## 📊 Google Sheets 数据结构

### Payments 表（付款记录）
| 列名 | 说明 |
|------|------|
| id | 系统自动生成 |
| client_name | 客户姓名 |
| policy_number | 保单号 |
| product_name | 产品名称 |
| insurer | 保险公司 |
| premium | 保费金额 |
| frequency | 缴费频率 |
| next_due_date | 下次付款日（YYYY-MM-DD）|
| status | pending/paid/overdue/cancelled |
| notes | 备注 |

### Claims 表（理赔记录）
| 列名 | 说明 |
|------|------|
| client_name | 客户姓名 |
| claim_number | 理赔编号 |
| claim_type | 理赔类别 |
| claim_amount | 申请金额 |
| approved_amount | 批准金额 |
| submit_date | 提交日期 |
| status | submitted/processing/approved/paid_out/rejected |

### Servicing 表（服务记录）
| 列名 | 说明 |
|------|------|
| client_name | 客户姓名 |
| service_date | 服务日期 |
| service_type | 服务类别 |
| summary | 内容摘要 |
| action_plan | 行动计划 |
| next_followup | 下次跟进日期 |
| status | scheduled/completed/followup/cancelled |

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Alt + 1` | 跳转仪表板 |
| `Alt + 2` | 跳转付款跟踪 |
| `Alt + 3` | 跳转理赔管理 |
| `Alt + 4` | 跳转服务记录 |
| `Esc` | 关闭弹窗 |

---

## ❓ 常见问题

**Q：显示「未连接」怎么办？**
A：检查 config.js 中的 API_URL 是否正确，确认 GAS 已部署为「所有人可访问」。

**Q：数据没有更新怎么办？**
A：点击顶部「🔄 刷新」按钮，或在设置页面点击「清除缓存」。

**Q：想直接在 Google Sheets 里手动添加数据可以吗？**
A：可以，但必须严格按照表头格式，id 列需要手动填写一个唯一值（如 `manual_001`）。

**Q：怎么备份数据？**
A：Google Sheets 本身有版本历史。也可以在 CRM 里点击「导出 CSV」按钮。

---

## 📞 技术说明

- **前端**：HTML5 + Vanilla JavaScript（无框架依赖，零 npm）
- **后端**：Google Apps Script（免费，无需服务器）
- **数据库**：Google Sheets
- **托管**：GitHub Pages（免费）
- **设计**：深色主题，响应式布局，支持移动端

---

*Allan CRM 2026 — 专为马来西亚保险顾问打造 🇲🇾*
