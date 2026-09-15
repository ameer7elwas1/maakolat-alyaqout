window.YAM_STORE_KEY = "yam-menu-v1";
window.YAM_PUB_KEY = "yam-pub-v2";

window.MenuStore = {
  FETCH_MS: 12000,
  defaultData() {
    const src = window.YAM_DEFAULT || { categories: [], menu: [], extras: {}, assets: [] };
    return {
      categories: src.categories.map((c) => Object.assign({}, c)),
      menu: src.menu.map((item) => JSON.parse(JSON.stringify(item))),
      assets: (src.assets || []).slice()
    };
  },
  repo() {
    return String((window.SITE_CONFIG || {}).githubRepo || "ameer7elwas1/maakolat-alyaqout").trim();
  },
  decodeAuth(hex) {
    const pin = String((window.SITE_CONFIG || {}).adminPin || "");
    const h = String(hex || "").replace(/\s/g, "");
    if (!h || !pin || h.length % 2) return "";
    let out = "";
    for (let i = 0; i < h.length; i += 2) {
      const code = parseInt(h.substr(i, 2), 16) ^ pin.charCodeAt((i / 2) % pin.length);
      out += String.fromCharCode(code);
    }
    return out;
  },
  token() {
    const cfg = window.SITE_CONFIG || {};
    let stored = "";
    try { stored = localStorage.getItem("yam-gh-token") || ""; } catch (err) {}
    return String(cfg.githubToken || stored || this.decodeAuth(cfg.githubAuth) || "").trim();
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
  utf8ToBase64(text) {
    return btoa(unescape(encodeURIComponent(text)));
  },
  async dataUrlToBase64(dataUrl) {
    const res = await fetch(dataUrl);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  },
  ghHeaders() {
    const token = this.token();
    const headers = {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28"
    };
    if (token) headers.Authorization = "Bearer " + token;
    return headers;
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
  async loadFileCatalog() {
    try {
      return this.normalize(await this.fetchJson("menu.json", 5000));
    } catch (err) {
      console.warn("MenuStore.loadFileCatalog", err);
      return null;
    }
  },
  async loadRemote() {
    return this.loadFileCatalog();
  },
  async getFileMeta(path) {
    const url = "https://api.github.com/repos/" + this.repo() + "/contents/" + path;
    const res = await fetch(url, { headers: this.ghHeaders(), cache: "no-store" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  },
  async putFile(path, contentBase64, message) {
    const meta = await this.getFileMeta(path);
    const body = {
      message: message || "Update menu",
      content: contentBase64,
      branch: "main"
    };
    if (meta && meta.sha) body.sha = meta.sha;
    const url = "https://api.github.com/repos/" + this.repo() + "/contents/" + path;
    const res = await fetch(url, {
      method: "PUT",
      headers: Object.assign({ "Content-Type": "application/json" }, this.ghHeaders()),
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error("HTTP " + res.status + " " + errText.slice(0, 180));
    }
    return true;
  },
  async publishImages(data) {
    let stripped = false;
    const menu = [];
    for (let i = 0; i < (data.menu || []).length; i++) {
      const item = Object.assign({}, data.menu[i]);
      if (item.image && String(item.image).slice(0, 5) === "data:") {
        try {
          const path = "assets/uploads/" + item.id + ".jpg";
          const b64 = await this.dataUrlToBase64(item.image);
          await this.putFile(path, b64, "Update dish photo " + item.name);
          item.image = path + "?v=" + Date.now();
        } catch (err) {
          console.warn("MenuStore.publishImages", item.id, err);
          stripped = true;
          if (!item.image || String(item.image).slice(0, 5) === "data:") {
            item.image = "assets/pastry-mix.jpg";
          }
        }
      }
      menu.push(item);
    }
    return { data: Object.assign({}, data, { menu }), stripped };
  },
  async saveRemote(data) {
    if (!this.token()) return false;
    try {
      const prepared = await this.publishImages(this.payload(data));
      const json = JSON.stringify(prepared.data, null, 2);
      await this.putFile("menu.json", this.utf8ToBase64(json), "Publish menu from admin");
      return prepared.stripped ? "images-stripped" : true;
    } catch (err) {
      console.warn("MenuStore.saveRemote", err);
      return false;
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
      await this.saveRemote(merged);
    }
    this.saveLocal(merged);
    this.savePublished(merged);
    return merged;
  },
  async save(data) {
    const clean = this.payload(data);
    this.saveLocal(clean);
    const remote = await this.saveRemote(clean);
    if (remote) this.savePublished(clean);
    return { local: true, remote };
  },
  async reset() {
    localStorage.removeItem(window.YAM_STORE_KEY);
    const fresh = this.defaultData();
    await this.saveRemote(fresh);
    this.saveLocal(fresh);
    this.savePublished(fresh);
    return fresh;
  }
};
