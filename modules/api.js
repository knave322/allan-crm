// modules/api.js — Google Apps Script API Layer with Offline Cache

const API = (() => {
  let _connected = false;
  const _memCache = {};

  function isConnected() { return _connected; }

  function setStatus(ok) {
    _connected = ok;
    const dot  = document.querySelector('.connection-dot');
    const text = document.querySelector('.connection-text');
    const banner = document.getElementById('offline-banner');

    if (dot) {
      dot.className = 'connection-dot ' + (ok ? 'connected' : (navigator.onLine ? 'disconnected' : 'offline'));
    }
    if (text) {
      text.textContent = ok ? 'Connected' : (navigator.onLine ? 'Disconnected' : 'Offline Mode');
    }
    if (banner) {
      if (!ok && !navigator.onLine) {
        banner.classList.add('show');
      } else {
        banner.classList.remove('show');
      }
    }
  }

  function cacheKey(action, params) {
    return action + JSON.stringify(params || {});
  }

  function saveToLocalCache(key, data) {
    try {
      localStorage.setItem('crm_cache_' + key, JSON.stringify({ data, ts: Date.now() }));
    } catch(e) {}
    _memCache[key] = data;
  }

  function loadFromLocalCache(key, maxAgeMin) {
    if (_memCache[key]) return _memCache[key];
    try {
      const raw = localStorage.getItem('crm_cache_' + key);
      if (!raw) return null;
      const { data, ts } = JSON.parse(raw);
      if (maxAgeMin && (Date.now() - ts) > maxAgeMin * 60000) return null;
      _memCache[key] = data;
      return data;
    } catch(e) { return null; }
  }

  function getCachedData(action) {
    return loadFromLocalCache(cacheKey(action), null);
  }

  async function get(action, params = {}) {
    const key = cacheKey(action, params);
    const cached = loadFromLocalCache(key, CONFIG.CACHE_MINUTES);

    // Return cache immediately if offline
    if (!navigator.onLine) {
      setStatus(false);
      if (cached) return cached;
      throw new Error('Offline and no cached data');
    }

    const url = new URL(CONFIG.API_URL);
    url.searchParams.set('action', action);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    try {
      const res = await fetch(url.toString(), { mode: 'cors' });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const data = Array.isArray(json) ? json : (json.data || json);
      saveToLocalCache(key, data);
      setStatus(true);
      return data;
    } catch (e) {
      setStatus(false);
      if (cached) {
        UI.toast('Using cached data (offline)', 'warning');
        return cached;
      }
      throw e;
    }
  }

  async function post(action, data) {
    if (!navigator.onLine) {
      throw new Error('Cannot save data while offline. Please reconnect.');
    }
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action, ...data })
    });
    const json = await res.json();
    if (json.error) throw new Error(json.error);
    // Invalidate related cache
    Object.keys(_memCache).forEach(k => { if (k.startsWith(action.replace('add','get').replace('update','get').replace('delete','get'))) delete _memCache[k]; });
    setStatus(true);
    return json;
  }

  async function ping() {
    try {
      const url = new URL(CONFIG.API_URL);
      url.searchParams.set('action', 'ping');
      const res = await fetch(url.toString(), { mode: 'cors', signal: AbortSignal.timeout(5000) });
      const json = await res.json();
      setStatus(!!json.ok);
      return !!json.ok;
    } catch {
      setStatus(false);
      return false;
    }
  }

  // Listen for online/offline events
  window.addEventListener('online',  () => ping());
  window.addEventListener('offline', () => setStatus(false));

  return { get, post, ping, isConnected, getCachedData };
})();
