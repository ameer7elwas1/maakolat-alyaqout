window.YAM_STORE_KEY = "yam-menu-v1";
window.YAM_PUB_KEY = "yam-pub-v2";

window.MenuStore = {
  MAX_WRAPPED: 920,
  FETCH_MS: 15000,
  defaultData() {
    const src = window.YAM_DEFAULT || { categories: [], menu: [], extras: {}, assets: [] };
    return {
      categories: src.categories.map((c) => Object.assign({}, c)),
      menu: src.menu.map((item) => JSON.parse(JSON.stringify(item))),
      assets: (src.assets || []).slice()
    };
  },
  chunkIds() {
    const cfg = window.SITE_CONFIG || {};
    return Array.isArray(cfg.catalogChunks) ? cfg.catalogChunks.slice() : [];
  },
  chunkUrl(id) {
    const base = String((window.SITE_CONFIG || {}).catalogBase || "https://api.restful-api.dev/objects/");
    return base + id;
  },
  cacheUrl(url) {
    if (!url) return url;
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "t=" + Date.now();
  },
  normalize(data) {
    if (!data) return null;
    const inner = data.data && Array.isArray(data.data.menu) ? data.data : data;
    if (!inner || !Array.isArray(inner.menu) || !inner.menu.length) return null;
    const fallback = window.YAM_DEFAULT || {};
    return {
      categories: Array.isArray(inner.categories) && inner.categories.length
        ? inner.categories
        : (fallback.categories || []),
      menu: inner.menu.map((item) => {
        const copy = Object.assign({}, item);
        delete copy.extras;
        return copy;
      }),
      assets: Array.isArray(inner.assets) && inner.assets.length
        ? inner.assets
        : (fallback.assets || []),
      updatedAt: inner.updatedAt || 0
    };
  },
  payload(data) {
    const cleanMenu = (data.menu || []).map((item) => {
      const copy = Object.assign({}, item);
      delete copy.extras;
      return copy;
    });
    return {
      categories: data.categories || [],
      menu: cleanMenu,
      assets: data.assets || [],
      updatedAt: Date.now()
    };
  },
  readKey(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return this.normalize(JSON.parse(raw));
    } catch (err) {
      console.warn("MenuStore.readKey", key, err);
      return null;
    }
  },
  loadLocal() {
    return this.readKey(window.YAM_STORE_KEY);
  },
  loadPublished() {
    return this.readKey(window.YAM_PUB_KEY);
  },
  saveLocal(data) {
    localStorage.setItem(window.YAM_STORE_KEY, JSON.stringify(this.payload(data)));
  },
  savePublished(data) {
    localStorage.setItem(window.YAM_PUB_KEY, JSON.stringify(this.payload(data)));
  },
  loadImmediate() {
    return this.loadPublished() || this.defaultData();
  },
  wrappedBytes(piece) {
    return new TextEncoder().encode(JSON.stringify({ name: "yam-menu", data: { c: piece || "" } })).length;
  },
  splitChunks(text) {
    const chunks = [];
    let i = 0;
    while (i < text.length) {
      let lo = 1;
      let hi = Math.min(text.length - i, 700);
      let ok = 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const piece = text.slice(i, i + mid);
        if (this.wrappedBytes(piece) <= this.MAX_WRAPPED) {
          ok = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }
      chunks.push(text.slice(i, i + ok));
      i += ok;
    }
    return chunks;
  },
  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
  async fetchJson(url, timeout) {
    const ms = timeout == null ? this.FETCH_MS : timeout;
    const ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), ms) : null;
    try {
      const res = await fetch(this.cacheUrl(url), {
        cache: "no-store",
        signal: ctrl ? ctrl.signal : undefined
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  },
  async loadChunks() {
    const ids = this.chunkIds();
    if (!ids.length) return null;
    const parts = [];
    for (let i = 0; i < ids.length; i += 4) {
      const batch = ids.slice(i, i + 4);
      const rows = await Promise.all(batch.map((id) => this.fetchJson(this.chunkUrl(id))));
      parts.push.apply(parts, rows);
    }
    const text = parts.map((p) => {
      const c = p && p.data && typeof p.data.c === "string" ? p.data.c : "";
      return c === "." ? "" : c;
    }).join("");
    if (!text) return null;
    return this.normalize(JSON.parse(text));
  },
  async loadFileCatalog() {
    try {
      return this.normalize(await this.fetchJson("menu.json", 4000));
    } catch (err) {
      console.warn("MenuStore.loadFileCatalog", err);
      return null;
    }
  },
  pickLatest() {
    const list = Array.prototype.slice.call(arguments).filter(Boolean);
    if (!list.length) return null;
    return list.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))[0];
  },
  async loadRemote() {
    let cloud = null;
    try {
      cloud = await this.loadChunks();
    } catch (err) {
      console.warn("MenuStore.loadChunks", err);
    }
    const file = await this.loadFileCatalog();
    return this.pickLatest(cloud, file) || cloud || file;
  },
  fingerprint(data) {
    return JSON.stringify((data && data.menu || []).map((item) => ({
      id: item.id,
      name: item.name,
      desc: item.desc,
      image: String(item.image || "").slice(0, 120),
      price: item.price,
      unit: item.unit,
      step: item.step,
      extrasKey: item.extrasKey,
      variants: item.variants || null
    })));
  },
  overlay(remote, local) {
    if (!remote) return local;
    if (!local) return remote;
    const byId = {};
    remote.menu.forEach((item) => { byId[item.id] = item; });
    local.menu.forEach((item) => { byId[item.id] = item; });
    const seen = {};
    const menu = [];
    remote.menu.forEach((item) => {
      menu.push(byId[item.id]);
      seen[item.id] = true;
    });
    local.menu.forEach((item) => {
      if (item && item.id && !seen[item.id]) menu.push(item);
    });
    const assets = (remote.assets || []).slice();
    (local.assets || []).concat(local.menu.map((i) => i.image)).forEach((src) => {
      if (src && assets.indexOf(src) < 0 && String(src).indexOf("data:") !== 0) assets.push(src);
    });
    return {
      categories: (local.categories && local.categories.length) ? local.categories : remote.categories,
      menu,
      assets
    };
  },
  replaceHeavyImages(data, fallbackById) {
    return {
      categories: data.categories,
      menu: (data.menu || []).map((item) => {
        const next = Object.assign({}, item);
        if (next.image && String(next.image).slice(0, 5) === "data:") {
          const prev = fallbackById && fallbackById[item.id];
          next.image = (prev && String(prev).indexOf("data:") !== 0) ? prev : "assets/pastry-mix.jpg";
        }
        return next;
      }),
      assets: data.assets || []
    };
  },
  fitsRemote(data) {
    try {
      const parts = this.splitChunks(JSON.stringify(this.payload(data)));
      return parts.length <= this.chunkIds().length;
    } catch (err) {
      return false;
    }
  },
  async putChunk(id, text) {
    let lastErr = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      if (attempt) await this.sleep(220 * attempt);
      try {
        const res = await fetch(this.chunkUrl(id), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "yam-menu", data: { c: text || "" } })
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        return;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("putChunk failed");
  },
  async saveRemote(data, previous) {
    const ids = this.chunkIds();
    if (!ids.length) return false;
    const prevCat = previous || this.loadPublished() || this.defaultData();
    const prev = {};
    prevCat.menu.forEach((item) => { prev[item.id] = item.image; });
    const send = async (body) => {
      const text = JSON.stringify(this.payload(body));
      const parts = this.splitChunks(text);
      if (parts.length > ids.length) throw new Error("catalog too large");
      for (let i = 0; i < ids.length; i++) {
        await this.putChunk(ids[i], parts[i] || "");
      }
      let check = null;
      for (let v = 0; v < 3; v++) {
        if (v) await this.sleep(400);
        check = await this.loadChunks();
        if (check && this.fingerprint(check) === this.fingerprint(body)) return;
      }
      throw new Error("catalog verify failed");
    };
    const stripped = this.replaceHeavyImages(data, prev);
    try {
      if (!this.fitsRemote(data)) {
        await send(stripped);
        return "images-stripped";
      }
      await send(data);
      return true;
    } catch (err) {
      console.warn("MenuStore.saveRemote", err);
      try {
        await send(stripped);
        return "images-stripped";
      } catch (err2) {
        console.warn("MenuStore.saveRemote retry", err2);
        return false;
      }
    }
  },
  load() {
    return this.loadLocal() || this.loadPublished() || this.defaultData();
  },
  async refreshPublished() {
    const remote = await this.loadRemote();
    if (!remote) return null;
    this.savePublished(remote);
    return remote;
  },
  async loadAsync() {
    const remote = await this.loadRemote();
    const local = this.loadLocal();
    const merged = this.overlay(remote, local) || local || this.defaultData();
    if (local && this.fingerprint(merged) !== this.fingerprint(remote || { menu: [] })) {
      await this.saveRemote(merged, remote || local);
    }
    this.saveLocal(merged);
    this.savePublished(merged);
    return merged;
  },
  async save(data) {
    const previous = this.loadLocal() || this.loadPublished() || this.defaultData();
    const clean = this.payload(data);
    this.saveLocal(clean);
    const remote = await this.saveRemote(clean, previous);
    if (remote === "images-stripped") {
      const prev = {};
      previous.menu.forEach((item) => { prev[item.id] = item.image; });
      this.savePublished(this.replaceHeavyImages(clean, prev));
    } else if (remote) {
      this.savePublished(clean);
    }
    return { local: true, remote };
  },
  async reset() {
    localStorage.removeItem(window.YAM_STORE_KEY);
    const fresh = this.defaultData();
    await this.saveRemote(fresh);
    this.saveLocal(fresh);
    return fresh;
  }
};
