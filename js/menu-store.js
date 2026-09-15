window.YAM_STORE_KEY = "yam-menu-v1";

window.MenuStore = {
  defaultData() {
    const src = window.YAM_DEFAULT || { categories: [], menu: [], extras: {}, assets: [] };
    return {
      categories: src.categories.map((c) => Object.assign({}, c)),
      menu: src.menu.map((item) => JSON.parse(JSON.stringify(item))),
      assets: (src.assets || []).slice()
    };
  },
  load() {
    try {
      const raw = localStorage.getItem(window.YAM_STORE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && Array.isArray(data.menu) && data.menu.length) {
          const fallback = window.YAM_DEFAULT || {};
          return {
            categories: Array.isArray(data.categories) && data.categories.length
              ? data.categories
              : (fallback.categories || []),
            menu: data.menu,
            assets: Array.isArray(data.assets) && data.assets.length
              ? data.assets
              : (fallback.assets || [])
          };
        }
      }
    } catch (err) {
      console.warn("MenuStore.load", err);
    }
    return this.defaultData();
  },
  save(data) {
    const cleanMenu = (data.menu || []).map((item) => {
      const copy = Object.assign({}, item);
      delete copy.extras;
      return copy;
    });
    localStorage.setItem(window.YAM_STORE_KEY, JSON.stringify({
      categories: data.categories,
      menu: cleanMenu,
      assets: data.assets || []
    }));
  },
  reset() {
    localStorage.removeItem(window.YAM_STORE_KEY);
  }
};
