(function () {
  const SESSION = "yam-admin-ok";
  const loginScreen = document.getElementById("login-screen");
  const adminApp = document.getElementById("admin-app");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const listEl = document.getElementById("admin-list");
  const countEl = document.getElementById("dish-count");
  const modal = document.getElementById("dish-modal");
  const overlay = document.getElementById("overlay");
  const form = document.getElementById("dish-form");
  const toastEl = document.getElementById("toast");
  const variantRows = document.getElementById("variant-rows");

  let catalog = window.MenuStore.load();
  let editingId = null;
  const publishStatus = document.getElementById("publish-status");

  const money = (n) => {
    if (n == null) return "حسب الكمية";
    return `${Number(n).toLocaleString("ar-IQ")} د.ع`;
  };

  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  function expectedPin() {
    return String((window.SITE_CONFIG || {}).adminPin || "").trim();
  }

  function isAuthed() {
    return sessionStorage.getItem(SESSION) === "1";
  }

  function showApp() {
    loginScreen.hidden = true;
    adminApp.hidden = false;
    fillSelects();
    renderList();
  }

  function showLogin() {
    loginScreen.hidden = false;
    adminApp.hidden = true;
  }

  function catLabel(id) {
    const found = catalog.categories.find((c) => c.id === id);
    return found ? found.label : id;
  }

  function fillSelects() {
    const cat = form.category;
    cat.innerHTML = catalog.categories
      .filter((c) => c.id !== "all")
      .map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`)
      .join("");
    const assets = (catalog.assets || []).slice();
    catalog.menu.forEach((item) => {
      if (item.image && !assets.includes(item.image) && !String(item.image).startsWith("data:")) {
        assets.push(item.image);
      }
    });
    form.image.innerHTML = `<option value="">— اختَر صورة —</option>` +
      assets.map((src) => `<option value="${esc(src)}">${esc(src.replace("assets/", ""))}</option>`).join("");
  }

  function renderList() {
    countEl.textContent = `${catalog.menu.length} صنف`;
    if (!catalog.menu.length) {
      listEl.innerHTML = `<div class="empty-cart">لا توجد أصناف بعد. اضغط إضافة صنف.</div>`;
      return;
    }
    listEl.innerHTML = catalog.menu.map((item) => `
      <article class="admin-dish">
        <img src="${esc(item.image || "assets/pastry-mix.jpg")}" alt="">
        <div>
          <strong>${esc(item.name)}</strong>
          <p class="muted">${esc(catLabel(item.category))} · ${item.variants && item.variants.length ? "عدة أحجام" : money(item.price)}</p>
        </div>
        <div class="admin-dish-actions">
          <button class="btn btn-ghost" type="button" data-edit="${esc(item.id)}">تعديل</button>
          <button class="remove-item" type="button" data-del="${esc(item.id)}">حذف</button>
        </div>
      </article>
    `).join("");
  }

  function variantRow(v = {}) {
    const wrap = document.createElement("div");
    wrap.className = "admin-variant-row";
    wrap.innerHTML = `
      <input type="text" data-v="label" placeholder="الاسم مثل: الوسط" value="${esc(v.label || "")}" />
      <input type="number" data-v="price" min="0" step="500" placeholder="السعر" value="${v.price != null ? esc(v.price) : ""}" />
      <button type="button" class="remove-item" data-remove-variant>حذف</button>
    `;
    wrap.querySelector("[data-remove-variant]").addEventListener("click", () => wrap.remove());
    return wrap;
  }

  function openModal(item) {
    editingId = item ? item.id : null;
    document.getElementById("dish-form-eyebrow").textContent = item ? "تعديل" : "صنف جديد";
    document.getElementById("dish-form-title").textContent = item ? "تعديل الصنف" : "إضافة صنف";
    form.reset();
    form.id.value = item ? item.id : "";
    form.name.value = item ? item.name : "";
    form.desc.value = item ? item.desc || "" : "";
    form.category.value = item ? item.category : (catalog.categories.find((c) => c.id !== "all") || {}).id || "";
    form.extrasKey.value = item ? (item.extrasKey || "savory") : "savory";
    form.image.value = item && [...form.image.options].some((o) => o.value === item.image) ? item.image : "";
    form.imageUrl.value = item && !form.image.value ? (item.image || "") : "";
    form.unit.value = item ? item.unit || "" : "";
    form.kilo.checked = !!(item && item.step);
    form.price.value = item && item.price != null ? item.price : "";
    variantRows.innerHTML = "";
    (item && item.variants ? item.variants : []).forEach((v) => variantRows.appendChild(variantRow(v)));
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function collectVariants() {
    return [...variantRows.querySelectorAll(".admin-variant-row")].map((row, i) => {
      const label = row.querySelector('[data-v="label"]').value.trim();
      const price = Number(row.querySelector('[data-v="price"]').value);
      if (!label || !price) return null;
      return { id: `v${i + 1}`, label, price };
    }).filter(Boolean);
  }

  function setPublishStatus(ok) {
    if (!publishStatus) return;
    publishStatus.textContent = ok
      ? "القائمة منشورة لكل الزبائن. قد يحتاج الموقع دقيقة حتى يظهر التعديل."
      : "الحفظ على هذا الجهاز فقط. تعذر النشر للزبائن — تحقق من الإنترنت ثم احفظ مرة ثانية.";
  }

  async function persist() {
    const result = await window.MenuStore.save(catalog);
    renderList();
    setPublishStatus(!!result.remote);
    return result;
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const pin = String(new FormData(loginForm).get("pin") || "").trim();
    if (!expectedPin() || pin !== expectedPin()) {
      loginError.hidden = false;
      return;
    }
    sessionStorage.setItem(SESSION, "1");
    loginError.hidden = true;
    showApp();
  });

  document.getElementById("logout-btn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION);
    showLogin();
  });

  document.getElementById("add-dish").addEventListener("click", () => openModal(null));
  document.getElementById("close-dish").addEventListener("click", closeModal);
  overlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  document.getElementById("add-variant").addEventListener("click", () => {
    variantRows.appendChild(variantRow());
  });

  document.getElementById("reset-menu").addEventListener("click", async () => {
    if (!confirm("استعادة القائمة الأصلية؟ ستُحذف الأصناف التي أضفتها من لوحة التحكم.")) return;
    catalog = await window.MenuStore.reset();
    fillSelects();
    renderList();
    setPublishStatus(true);
    toast("تمت استعادة القائمة الأصلية");
  });

  listEl.addEventListener("click", async (e) => {
    const editId = e.target.dataset.edit;
    const delId = e.target.dataset.del;
    if (editId) {
      openModal(catalog.menu.find((i) => i.id === editId));
    }
    if (delId) {
      const item = catalog.menu.find((i) => i.id === delId);
      if (!item || !confirm(`حذف «${item.name}»؟`)) return;
      catalog.menu = catalog.menu.filter((i) => i.id !== delId);
      const result = await persist();
      toast(result.remote ? "تم حذف الصنف من الموقع" : "تم الحذف على هذا الجهاز فقط");
    }
  });

  function compressImage(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const max = 480;
        const scale = Math.min(1, max / img.width, max / img.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.55));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const variants = collectVariants();
    const priceRaw = form.price.value.trim();
    const uploaded = form.dataset.uploadedImage || "";
    const previous = (catalog.menu.find((i) => i.id === form.id.value) || {}).image || "";
    let image = uploaded || form.imageUrl.value.trim() || form.image.value;
    if (image && String(image).slice(0, 5) === "data:") {
      image = await compressImage(image);
    }
    if (!image) {
      toast("اختَر صورة أو أدخل رابطاً");
      return;
    }
    const item = {
      id: form.id.value || `dish-${Date.now()}`,
      name: form.name.value.trim(),
      desc: form.desc.value.trim(),
      category: form.category.value,
      extrasKey: form.extrasKey.value,
      image,
      unit: form.unit.value.trim(),
      step: form.kilo.checked ? 0.5 : undefined,
      price: variants.length ? undefined : (priceRaw === "" ? null : Number(priceRaw)),
      variants: variants.length ? variants : undefined
    };
    if (!item.step) delete item.step;
    if (!item.variants) delete item.variants;
    if (item.price == null && !item.variants) item.price = null;

    const idx = catalog.menu.findIndex((i) => i.id === item.id);
    if (idx >= 0) catalog.menu[idx] = item;
    else catalog.menu.push(item);
    delete form.dataset.uploadedImage;
    const result = await persist();
    closeModal();
    if (result.remote === "images-stripped") {
      const published = catalog.menu.find((i) => i.id === item.id);
      if (published && previous && String(previous).indexOf("data:") !== 0) {
        published.image = previous;
        renderList();
      }
      toast("تم حفظ التعديل للزبائن. الصورة المرفوعة كبيرة — اختَر صورة جاهزة من القائمة");
    } else if (result.remote) {
      toast("تم حفظ التعديل ويظهر الآن لكل الزبائن");
    } else {
      toast("حُفظ على هذا الجهاز فقط. تحقق من الإنترنت واحفظ مرة ثانية");
    }
  });

  form.imageFile.addEventListener("change", () => {
    const file = form.imageFile.files[0];
    if (!file) return;
    if (file.size > 1200000) {
      toast("الصورة كبيرة. اختَر صورة أصغر من 1 ميغابايت");
      form.imageFile.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      form.dataset.uploadedImage = reader.result;
      toast("تم تجهيز الصورة");
    };
    reader.readAsDataURL(file);
  });

  async function init() {
    catalog = window.MenuStore.load();
    if (isAuthed()) showApp();
    else showLogin();
    try {
      catalog = await window.MenuStore.loadAsync();
      setPublishStatus(true);
      if (isAuthed()) {
        fillSelects();
        renderList();
      }
    } catch (err) {
      console.warn("admin init", err);
      setPublishStatus(false);
    }
  }
  init();
})();
