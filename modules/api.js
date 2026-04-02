// ============================================================
// modules/api.js — Google Apps Script API 层
// 负责所有与 Google Sheets 后端的通信
// ⚠️  请勿修改此文件
// ============================================================

const API = (() => {

  // ── 本地缓存（减少 GAS 请求次数）─────────────────────────
  const cache = {};
  let _connected = false;

  function getCacheKey(action, params) {
    return action + JSON.stringify(params || {});
  }

  function setCache(key, data) {
    cache[key] = {
      data,
      ts: Date.now(),
      ttl: CONFIG.CACHE_MINUTES * 60 * 1000
    };
  }

  function getCache(key) {
    const c = cache[key];
    if (!c) return null;
    if (Date.now() - c.ts > c.ttl) { delete cache[key]; return null; }
    return c.data;
  }

  function clearCache() {
    Object.keys(cache).forEach(k => delete cache[k]);
  }

  // ── 核心请求函数 ──────────────────────────────────────────
  async function request(action, params = {}, useCache = true) {
    const cacheKey = getCacheKey(action, params);

    // GET 类操作先查缓存
    if (useCache && action.startsWith('get')) {
      const cached = getCache(cacheKey);
      if (cached) return cached;
    }

    const url = new URL(CONFIG.API_URL);
    url.searchParams.set('action', action);

    let response;
    try {
      if (['getPayments', 'getClaims', 'getServicing', 'getDashboard', 'getClients'].includes(action)) {
        // GET 请求
        Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        response = await fetch(url.toString());
      } else {
        // POST 请求（增删改）
        response = await fetch(CONFIG.API_URL + '?action=' + action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params)
        });
      }

      if (!response.ok) throw new Error('HTTP ' + response.status);

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      _connected = true;
      UI.setConnectionStatus(true);

      if (useCache && action.startsWith('get')) {
        setCache(cacheKey, data);
      }

      return data;

    } catch (err) {
      _connected = false;
      UI.setConnectionStatus(false);
      console.error('[API Error]', action, err.message);
      throw err;
    }
  }

  // ── PUBLIC METHODS ────────────────────────────────────────

  return {
    isConnected: () => _connected,
    clearCache,

    // 测试连接
    async testConnection() {
      try {
        const res = await request('ping', {}, false);
        return res.ok === true;
      } catch { return false; }
    },

    // ── CLIENTS ──
    async getClients() {
      return request('getClients');
    },

    // ── PAYMENTS ──
    async getPayments(filters = {}) {
      return request('getPayments', filters);
    },
    async addPayment(data) {
      clearCache();
      return request('addPayment', data, false);
    },
    async updatePayment(id, data) {
      clearCache();
      return request('updatePayment', { id, ...data }, false);
    },
    async deletePayment(id) {
      clearCache();
      return request('deletePayment', { id }, false);
    },

    // ── CLAIMS ──
    async getClaims(filters = {}) {
      return request('getClaims', filters);
    },
    async addClaim(data) {
      clearCache();
      return request('addClaim', data, false);
    },
    async updateClaim(id, data) {
      clearCache();
      return request('updateClaim', { id, ...data }, false);
    },
    async deleteClaim(id) {
      clearCache();
      return request('deleteClaim', { id }, false);
    },

    // ── SERVICING ──
    async getServicing(filters = {}) {
      return request('getServicing', filters);
    },
    async addServicing(data) {
      clearCache();
      return request('addServicing', data, false);
    },
    async updateServicing(id, data) {
      clearCache();
      return request('updateServicing', { id, ...data }, false);
    },
    async deleteServicing(id) {
      clearCache();
      return request('deleteServicing', { id }, false);
    },

    // ── DASHBOARD SUMMARY ──
    async getDashboard() {
      return request('getDashboard');
    }
  };

})();
