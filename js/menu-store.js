window.YAM_STORE_KEY = "yam-menu-v1";

window.MenuStore = {
  CHUNK_BYTES: 800,
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
        : (fallback.assets || [])
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
  loadLocal() {
    try {
      const raw = localStorage.getItem(window.YAM_STORE_KEY);
      if (!raw) return null;
      return this.normalize(JSON.parse(raw));
    } catch (err) {
      console.warn("MenuStore.loadLocal", err);
      return null;
    }
  },
  saveLocal(data) {
    localStorage.setItem(window.YAM_STORE_KEY, JSON.stringify(this.payload(data)));
  },
  splitBytes(text, maxBytes) {
    const encoder = new TextEncoder();
    const chunks = [];
    let current = "";
    for (const ch of text) {
      const trial = current + ch;
      if (encoder.encode(trial).length > maxBytes) {
        if (!current) throw new Error("chunk too small");
        chunks.push(current);
        current = ch;
      } else {
        current = trial;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  },
  async fetchJson(url) {
    const res = await fetch(this.cacheUrl(url), { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  },
  async loadRemote() {
    const ids = this.chunkIds();
    if (ids.length) {
      try {
        const parts = await Promise.all(ids.map((id) => this.fetchJson(this.chunkUrl(id))));
        const text = parts.map((p) => {
          const c = p && p.data && typeof p.data.c === "string" ? p.data.c : "";
          return c === "." ? "" : c;
        }).join("");
        if (text) {
          const data = this.normalize(JSON.parse(text));
          if (data) return data;
        }
      } catch (err) {
        console.warn("MenuStore.loadRemote chunks", err);
      }
    }
    try {
      const json = await this.fetchJson("menu.json");
      const data = this.normalize(json);
      if (data) return data;
    } catch (err) {
      console.warn("MenuStore.loadRemote menu.json", err);
    }
    return null;
  },
  merge(remote, local) {
    if (!remote) return local;
    if (!local) return remote;
    const have = {};
    remote.menu.forEach((item) => { have[item.id] = true; });
    const extra = local.menu.filter((item) => item && item.id && !have[item.id]);
    if (!extra.length) {
      return {
        categories: remote.categories,
        menu: remote.menu,
        assets: remote.assets && remote.assets.length ? remote.assets : local.assets
      };
    }
    const assets = (remote.assets || []).slice();
    extra.forEach((item) => {
      if (item.image && assets.indexOf(item.image) < 0 && String(item.image).indexOf("data:") !== 0) {
        assets.push(item.image);
      }
    });
    return {
      categories: remote.categories && remote.categories.length ? remote.categories : local.categories,
      menu: remote.menu.concat(extra),
      assets: assets.length ? assets : (local.assets || [])
    };
  },
  withoutHeavyImages(data) {
    return {
      categories: data.categories,
      menu: (data.menu || []).map((item) => {
        const next = Object.assign({}, item);
        if (next.image && String(next.image).slice(0, 5) === "data:") {
          next.image = "assets/pastry-mix.jpg";
        }
        return next;
      }),
      assets: data.assets || []
    };
  },
  async putChunk(id, text) {
    const res = await fetch(this.chunkUrl(id), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "yam-menu", data: { c: text || "" } })
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
  },
  async saveRemote(data) {
    const ids = this.chunkIds();
    if (!ids.length) return false;
    const send = async (body) => {
      const text = JSON.stringify(this.payload(body));
      const parts = this.splitBytes(text, this.CHUNK_BYTES);
      if (parts.length > ids.length) throw new Error("catalog too large");
      const writes = ids.map((id, i) => this.putChunk(id, parts[i] || ""));
      await Promise.all(writes);
    };
    try {
      await send(data);
      return true;
    } catch (err) {
      console.warn("MenuStore.saveRemote", err);
      try {
        await send(this.withoutHeavyImages(data));
        return "images-stripped";
      } catch (err2) {
        console.warn("MenuStore.saveRemote retry", err2);
        return false;
      }
    }
  },
  load() {
    return this.loadLocal() || this.defaultData();
  },
  async loadAsync() {
    const remote = await this.loadRemote();
    const local = this.loadLocal();
    const merged = this.merge(remote, local) || local || this.defaultData();
    if (local) {
      const remoteIds = remote ? remote.menu.map((i) => i.id).join() : "";
      const mergedIds = merged.menu.map((i) => i.id).join();
      if (!remote || mergedIds !== remoteIds) {
        await this.saveRemote(merged);
      }
    }
    this.saveLocal(merged);
    return merged;
  },
  async save(data) {
    const clean = this.payload(data);
    this.saveLocal(clean);
    const remote = await this.saveRemote(clean);
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
