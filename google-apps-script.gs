// ============================================================
// google-apps-script.gs — Google Apps Script 后端
// Allan CRM 2026 — 数据接口层
// ============================================================
// 部署步骤：
//   1. 打开 Google Sheets → 扩展程序 → Apps Script
//   2. 把这整个文件内容粘贴进去（替换原有内容）
//   3. 点击「部署」→「新增部署」→ 类型选「网页应用」
//   4. 执行者选「我」，有权限访问选「所有人」
//   5. 复制 Web App URL → 粘贴到 config.js 的 API_URL
// ============================================================
// ⚠️  修改 Sheet 名称后，同步更新 config.js 的 SHEET_NAMES
// ============================================================

// ── 工作表名称（与 config.js 保持一致）──────────────────────
const SHEET = {
  payments:  'Payments',
  claims:    'Claims',
  servicing: 'Servicing',
  clients:   'Clients'
};

// ── 路由入口（GET 请求）──────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || '';
  const params = e.parameter;

  try {
    let result;
    switch (action) {
      case 'ping':         result = { ok: true };                         break;
      case 'getPayments':  result = getPayments(params);                  break;
      case 'getClaims':    result = getClaims(params);                    break;
      case 'getServicing': result = getServicing(params);                 break;
      case 'getClients':   result = getClients();                         break;
      case 'getDashboard': result = getDashboard();                       break;
      default:             result = { error: '未知的 action: ' + action }; break;
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ── 路由入口（POST 请求）──────────────────────────────────────
function doPost(e) {
  const action = e.parameter.action || '';
  let body = {};

  try {
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }
  } catch (err) {
    return jsonResponse({ error: '无效的请求体 JSON' });
  }

  try {
    let result;
    switch (action) {
      // Payments
      case 'addPayment':    result = addRow(SHEET.payments, body);          break;
      case 'updatePayment': result = updateRow(SHEET.payments, body);       break;
      case 'deletePayment': result = deleteRow(SHEET.payments, body.id);    break;
      // Claims
      case 'addClaim':      result = addRow(SHEET.claims, body);            break;
      case 'updateClaim':   result = updateRow(SHEET.claims, body);         break;
      case 'deleteClaim':   result = deleteRow(SHEET.claims, body.id);      break;
      // Servicing
      case 'addServicing':  result = addRow(SHEET.servicing, body);         break;
      case 'updateServicing':result = updateRow(SHEET.servicing, body);     break;
      case 'deleteServicing':result = deleteRow(SHEET.servicing, body.id);  break;
      default:              result = { error: '未知的 action: ' + action }; break;
    }
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({ error: err.message });
  }
}

// ══════════════════════════════════════════════════════════
// 数据读取函数
// ══════════════════════════════════════════════════════════

function getPayments(params) {
  const data = sheetToArray(SHEET.payments);
  return { data, total: data.length };
}

function getClaims(params) {
  const data = sheetToArray(SHEET.claims);
  return { data, total: data.length };
}

function getServicing(params) {
  const data = sheetToArray(SHEET.servicing);
  return { data, total: data.length };
}

function getClients() {
  const data = sheetToArray(SHEET.clients);
  return { data, total: data.length };
}

function getDashboard() {
  const payments  = sheetToArray(SHEET.payments);
  const claims    = sheetToArray(SHEET.claims);
  const servicing = sheetToArray(SHEET.servicing);

  const today = new Date();
  const in30  = new Date(today.getTime() + 30 * 86400000);

  const overduePayments = payments.filter(r =>
    r.status !== 'paid' && r.status !== 'cancelled' &&
    r.next_due_date && new Date(r.next_due_date) < today
  ).length;

  const upcomingPayments = payments.filter(r =>
    r.status === 'pending' &&
    r.next_due_date &&
    new Date(r.next_due_date) >= today &&
    new Date(r.next_due_date) <= in30
  ).length;

  const activeClaims = claims.filter(r =>
    r.status === 'submitted' || r.status === 'processing'
  ).length;

  const pendingFollowups = servicing.filter(r =>
    r.status === 'followup' || r.status === 'scheduled'
  ).length;

  return {
    payments:  { total: payments.length, overdue: overduePayments, upcoming: upcomingPayments },
    claims:    { total: claims.length, active: activeClaims },
    servicing: { total: servicing.length, pending: pendingFollowups }
  };
}

// ══════════════════════════════════════════════════════════
// 数据写入函数（增删改）
// ══════════════════════════════════════════════════════════

function addRow(sheetName, data) {
  const sheet  = getOrCreateSheet(sheetName);
  const headers = getHeaders(sheet);

  // 生成唯一 ID（时间戳 + 随机数）
  const id = Date.now() + '_' + Math.floor(Math.random() * 10000);

  // 构建行数据（按 headers 顺序）
  data.id = id;
  data.created_at = new Date().toISOString();
  data.updated_at = new Date().toISOString();

  const row = headers.map(h => {
    const val = data[h];
    return val !== undefined && val !== null ? val : '';
  });

  sheet.appendRow(row);
  return { ok: true, id };
}

function updateRow(sheetName, data) {
  const sheet   = getOrCreateSheet(sheetName);
  const headers = getHeaders(sheet);
  const idCol   = headers.indexOf('id') + 1;  // 1-indexed

  if (idCol === 0) throw new Error('工作表缺少 id 列');

  const allData = sheet.getDataRange().getValues();
  let targetRow = -1;

  for (let i = 1; i < allData.length; i++) {  // 从第2行开始（跳过表头）
    if (String(allData[i][idCol - 1]) === String(data.id)) {
      targetRow = i + 1;  // 转为 1-indexed
      break;
    }
  }

  if (targetRow === -1) throw new Error('找不到记录 id: ' + data.id);

  data.updated_at = new Date().toISOString();

  // 更新每一列
  headers.forEach((h, colIdx) => {
    if (h === 'id' || h === 'created_at') return;  // 不覆盖 id 和创建时间
    if (data[h] !== undefined) {
      sheet.getRange(targetRow, colIdx + 1).setValue(data[h]);
    }
  });

  return { ok: true };
}

function deleteRow(sheetName, id) {
  const sheet   = getOrCreateSheet(sheetName);
  const headers = getHeaders(sheet);
  const idCol   = headers.indexOf('id') + 1;

  if (idCol === 0) throw new Error('工作表缺少 id 列');

  const allData = sheet.getDataRange().getValues();
  let targetRow = -1;

  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][idCol - 1]) === String(id)) {
      targetRow = i + 1;
      break;
    }
  }

  if (targetRow === -1) throw new Error('找不到记录 id: ' + id);

  sheet.deleteRow(targetRow);
  return { ok: true };
}

// ══════════════════════════════════════════════════════════
// 工具函数
// ══════════════════════════════════════════════════════════

// 把 Sheet 转为 JSON 对象数组
function sheetToArray(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const allData = sheet.getDataRange().getValues();
  if (allData.length < 2) return [];  // 只有表头或空表

  const headers = allData[0].map(h => String(h).trim());

  return allData.slice(1)
    .filter(row => row.some(cell => cell !== ''))  // 过滤空行
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => {
        let val = row[i];
        // 日期对象转字符串
        if (val instanceof Date) {
          val = Utilities.formatDate(val, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
        }
        obj[h] = val !== undefined && val !== null ? val : '';
      });
      return obj;
    });
}

// 获取表头
function getHeaders(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return firstRow.map(h => String(h).trim());
}

// 获取或创建 Sheet（并初始化表头）
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    const headers = SHEET_HEADERS[sheetName] || ['id', 'created_at', 'updated_at'];
    sheet.appendRow(headers);
    // 设置表头样式
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e3a5f');
    headerRange.setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// JSON 响应
function jsonResponse(data) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ══════════════════════════════════════════════════════════
// Sheet 表头定义
// ══════════════════════════════════════════════════════════
// ⚠️  重要：如果你的 Google Sheet 已有数据，请确保第一行
//    的列名（表头）与下方定义的 key 完全一致！
// ══════════════════════════════════════════════════════════

const SHEET_HEADERS = {
  Payments: [
    'id',
    'client_name',
    'policy_number',
    'product_name',
    'insurer',
    'premium',
    'frequency',
    'next_due_date',
    'status',
    'notes',
    'created_at',
    'updated_at'
  ],
  Claims: [
    'id',
    'client_name',
    'policy_number',
    'claim_number',
    'insurer',
    'claim_type',
    'claim_amount',
    'approved_amount',
    'paid_amount',
    'submit_date',
    'last_update',
    'status',
    'rejection_reason',
    'notes',
    'created_at',
    'updated_at'
  ],
  Servicing: [
    'id',
    'client_name',
    'service_date',
    'service_type',
    'summary',
    'action_plan',
    'next_followup',
    'status',
    'handled_by',
    'created_at',
    'updated_at'
  ],
  Clients: [
    'id',
    'client_name',
    'ic_number',
    'phone',
    'email',
    'dob',
    'occupation',
    'tier',
    'notes',
    'created_at',
    'updated_at'
  ]
};

// ══════════════════════════════════════════════════════════
// 一键初始化：创建所有 Sheets（可选，首次使用时运行）
// 在 Apps Script 编辑器里，选择此函数 → 点击运行
// ══════════════════════════════════════════════════════════
function initializeAllSheets() {
  Object.values(SHEET).forEach(sheetName => getOrCreateSheet(sheetName));
  Logger.log('✅ 所有工作表已初始化完毕！');

  // 添加示例数据（测试用）
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 示例付款记录
  const paySh = ss.getSheetByName(SHEET.payments);
  if (paySh.getLastRow() < 2) {
    const samplePayments = [
      ['1_sample', '陈大明', 'AIA-2024-001', 'A-Life Legacy', 'AIA Life', 500, '月缴 (Monthly)',
        '2026-04-30', 'pending', '示例记录', new Date().toISOString(), new Date().toISOString()],
      ['2_sample', '李美琪', 'AIT-2023-002', 'Takaful Medical', 'AIA Takaful', 300, '年缴 (Annual)',
        '2026-05-15', 'pending', '', new Date().toISOString(), new Date().toISOString()],
      ['3_sample', '张伟强', 'ALZ-2024-003', 'Allianz Motor', 'Allianz General', 1200, '年缴 (Annual)',
        '2026-03-25', 'overdue', '已提醒', new Date().toISOString(), new Date().toISOString()]
    ];
    samplePayments.forEach(row => paySh.appendRow(row));
  }

  // 示例理赔记录
  const claimSh = ss.getSheetByName(SHEET.claims);
  if (claimSh.getLastRow() < 2) {
    claimSh.appendRow([
      '4_sample', '陈大明', 'AIA-2024-001', 'CLM-2026-001', 'AIA Life',
      '住院 (Hospitalisation)', 8500, 8500, 0, '2026-03-01', '2026-03-15',
      'processing', '', '住院5天，单据已提交', new Date().toISOString(), new Date().toISOString()
    ]);
  }

  // 示例服务记录
  const svcSh = ss.getSheetByName(SHEET.servicing);
  if (svcSh.getLastRow() < 2) {
    svcSh.appendRow([
      '5_sample', '李美琪', '2026-03-20', '年度检讨 (Annual Review)',
      '完成2026年度保单检讨，建议增加CI保障至RM200k', '准备CI产品对比表发给客户',
      '2026-04-10', 'followup', 'Allan', new Date().toISOString(), new Date().toISOString()
    ]);
  }

  Logger.log('✅ 示例数据已添加！');
}
