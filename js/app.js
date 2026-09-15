(function () {
  const money = (n) => {
    if (n == null) return "حسب الكمية";
    return `${Number(n).toLocaleString("ar-IQ")} د.ع`;
  };

  let categories = [];
  let menu = [];

  const els = {
    grid: document.getElementById("menu-grid"),
    cats: document.getElementById("category-bar"),
    overlay: document.getElementById("overlay"),
    cartDrawer: document.getElementById("cart-drawer"),
    cartItems: document.getElementById("cart-items"),
    cartCount: document.getElementById("cart-count"),
    cartTotal: document.getElementById("cart-total"),
    mobileBar: document.getElementById("mobile-bar"),
    mobileTotal: document.getElementById("mobile-total"),
    itemModal: document.getElementById("item-modal"),
    itemHero: document.getElementById("item-hero"),
    itemTitle: document.getElementById("item-modal-title"),
    itemDesc: document.getElementById("item-modal-desc"),
    itemForm: document.getElementById("item-form"),
    checkoutModal: document.getElementById("checkout-modal"),
    checkoutForm: document.getElementById("checkout-form"),
    checkoutSummary: document.getElementById("checkout-summary"),
    locationBox: document.getElementById("location-box"),
    locationStatus: document.getElementById("location-status"),
    locationPreview: document.getElementById("location-preview"),
    shareLocation: document.getElementById("share-location"),
    toast: document.getElementById("toast"),
    hours: document.getElementById("hours-text")
  };

  let currentCategory = "all";
  let activeItem = null;
  let qty = 1;
  let customerLocation = null;
  const cart = JSON.parse(localStorage.getItem("yam-cart") || "[]");

  const saveCart = () => localStorage.setItem("yam-cart", JSON.stringify(cart));
  const cartQty = () => cart.reduce((s, i) => s + i.qty, 0);
  const cartSum = () => cart.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  function hydrateItem(item) {
    const presets = (window.YAM_DEFAULT && window.YAM_DEFAULT.extras) || {};
    const extras = presets[item.extrasKey] || item.extras || {};
    return Object.assign({}, item, { extras });
  }

  function loadCatalog() {
    const data = (window.MenuStore && window.MenuStore.load()) || { categories: [], menu: [] };
    categories = (data.categories || []).slice();
    menu = (data.menu || []).map(hydrateItem);
  }

  function toast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add("show");
    setTimeout(() => els.toast.classList.remove("show"), 1800);
  }

  function renderCategories() {
    els.cats.innerHTML = categories.map((c) =>
      `<button class="cat-btn ${c.id === currentCategory ? "active" : ""}" data-id="${c.id}" type="button">${c.label}</button>`
    ).join("");
  }

  function priceLabel(item) {
    if (item.variants) {
      const min = Math.min(...item.variants.map((v) => v.price));
      return `من ${money(min)}`;
    }
    return money(item.price);
  }

  function renderMenu() {
    const items = menu.filter((i) => currentCategory === "all" || i.category === currentCategory);
    els.grid.innerHTML = items.map((item) => `
      <article class="dish-card">
        <div class="dish-photo">
          <img src="${item.image}" alt="${item.name}">
          <span class="dish-badge">${item.unit || (item.variants ? "عدة أحجام" : "حسب الطلب")}</span>
        </div>
        <div class="dish-body">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="price">${priceLabel(item)}</div>
          <button class="btn btn-primary" data-add="${item.id}" type="button">أضف للسلة</button>
        </div>
      </article>
    `).join("");
  }

  function selectedPrice(item, form) {
    if (item.variants) {
      const id = form.querySelector("[name=variant]:checked").value;
      return item.variants.find((v) => v.id === id).price;
    }
    return item.price;
  }

  function selectedVariantLabel(item, form) {
    if (!item.variants) return item.unit || "";
    const id = form.querySelector("[name=variant]:checked").value;
    return item.variants.find((v) => v.id === id).label;
  }

  function extrasFromForm(item, form) {
    const chosen = [];
    Object.entries(item.extras || {}).forEach(([key, extra]) => {
      if (extra.type === "radio") {
        const val = form.querySelector(`[name="${key}"]:checked`);
        if (val) chosen.push(`${extra.label}: ${val.value}`);
      } else if (form.querySelector(`[name="${key}"]`)?.checked) {
        chosen.push(extra.label);
      }
    });
    const note = form.querySelector("[name=note]")?.value.trim();
    if (note) chosen.push(`ملاحظة: ${note}`);
    return chosen;
  }

  function renderItemForm(item) {
    qty = item.step ? 1 : 1;
    const variants = item.variants
      ? `<fieldset class="choice-row"><legend>الحجم / النوع</legend>${item.variants.map((v, i) =>
          `<label class="chip"><input type="radio" name="variant" value="${v.id}" ${i === 0 ? "checked" : ""} /> ${v.label}</label>`
        ).join("")}</fieldset>`
      : "";

    const extraFields = Object.entries(item.extras || {}).map(([key, extra]) => {
      if (extra.type === "radio") {
        return extra.options.map((o) =>
          `<label class="toggle-extra">
            <input type="radio" name="${key}" value="${o.value || o.label}" ${o.checked ? "checked" : ""} />
            <span>${o.label}</span>
          </label>`
        ).join("");
      }
      return `<label class="toggle-extra">
        <input type="checkbox" name="${key}" ${extra.checked ? "checked" : ""} />
        <span>${extra.label}${extra.hint ? ` <small class="muted">${extra.hint}</small>` : ""}</span>
      </label>`;
    }).join("");

    const unit = item.unit === "كيلو" || item.step ? "كيلو" : "كمية";
    els.itemForm.innerHTML = `
      ${variants}
      <div class="qty-row">
        <span>${unit}</span>
        <div class="qty-controls">
          <button type="button" data-qty="-">−</button>
          <strong id="qty-val">1</strong>
          <button type="button" data-qty="+">+</button>
        </div>
      </div>
      ${extraFields}
      <label>ملاحظات على هذا الصنف
        <textarea name="note" rows="2" placeholder="مثال: توصيل الساعة 7..."></textarea>
      </label>
      <button class="btn btn-primary btn-block" type="submit">إضافة إلى السلة</button>
    `;
  }

  function openItem(item) {
    activeItem = item;
    els.itemTitle.textContent = item.name;
    els.itemDesc.textContent = item.desc;
    els.itemHero.style.backgroundImage = `url("${item.image}")`;
    els.itemHero.style.backgroundSize = "cover";
    els.itemHero.style.backgroundPosition = "center";
    renderItemForm(item);
    els.itemModal.classList.add("open");
    els.itemModal.setAttribute("aria-hidden", "false");
    els.overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModals() {
    els.itemModal.classList.remove("open");
    els.itemModal.setAttribute("aria-hidden", "true");
    els.checkoutModal.classList.remove("open");
    els.checkoutModal.setAttribute("aria-hidden", "true");
    els.cartDrawer.classList.remove("open");
    els.cartDrawer.setAttribute("aria-hidden", "true");
    els.overlay.hidden = true;
    document.body.style.overflow = "";
  }

  function openCart() {
    renderCart();
    els.cartDrawer.classList.add("open");
    els.cartDrawer.setAttribute("aria-hidden", "false");
    els.overlay.hidden = false;
    els.itemModal.classList.remove("open");
    els.checkoutModal.classList.remove("open");
    document.body.style.overflow = "hidden";
  }

  function renderCart() {
    els.cartCount.textContent = cartQty();
    const total = money(cartSum());
    els.cartTotal.textContent = total;
    els.mobileTotal.textContent = total;
    els.mobileBar.hidden = cart.length === 0;

    if (!cart.length) {
      els.cartItems.innerHTML = `<div class="empty-cart">سلتك فارغة. اختر من القائمة ما لذّ وطاب.</div>`;
      return;
    }

    els.cartItems.innerHTML = cart.map((item, idx) => `
      <div class="cart-item">
        <div class="cart-item-top">
          <h4>${item.name}</h4>
          <button class="remove-item" data-remove="${idx}" type="button">حذف</button>
        </div>
        <div>${item.variant || ""}</div>
        <div class="extras">${item.extras.join(" · ") || "بدون إضافات"}</div>
        <div class="price">${item.qty} × ${item.price == null ? "حسب الكمية" : money(item.price)}</div>
      </div>
    `).join("");
  }

  function addToCart(item, form) {
    const variant = selectedVariantLabel(item, form);
    const extras = extrasFromForm(item, form);
    cart.push({
      id: item.id,
      name: item.name,
      variant,
      extras,
      qty,
      price: selectedPrice(item, form)
    });
    saveCart();
    renderCart();
    closeModals();
    toast("تمت إضافة الصنف إلى السلة");
  }

  function mapsUrl(lat, lng) {
    return `https://maps.google.com/?q=${lat},${lng}`;
  }

  function setLocationStatus(text, kind) {
    els.locationStatus.textContent = text;
    els.locationStatus.classList.remove("ok", "err");
    if (kind) els.locationStatus.classList.add(kind);
    els.locationBox.classList.toggle("is-set", kind === "ok");
  }

  function applyLocation(lat, lng) {
    const url = mapsUrl(lat, lng);
    customerLocation = { lat, lng, url };
    setLocationStatus("تم تحديد الموقع", "ok");
    els.locationPreview.hidden = false;
    els.locationPreview.classList.add("is-visible");
    els.locationPreview.href = url;
    els.shareLocation.textContent = "إعادة تحديد الموقع";
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("المتصفح لا يدعم تحديد الموقع", "err");
      toast("فعّل الموقع من إعدادات المتصفح أو اكتب العنوان بدقة");
      return;
    }
    setLocationStatus("جاري تحديد الموقع...", "");
    els.shareLocation.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        els.shareLocation.disabled = false;
        applyLocation(pos.coords.latitude, pos.coords.longitude);
        toast("تم حفظ موقعك مع الطلب");
      },
      (err) => {
        els.shareLocation.disabled = false;
        const msg = err.code === 1
          ? "المتصفح رفض صلاحية الموقع. اسمح بالموقع ثم أعد المحاولة"
          : "تعذر تحديد الموقع. حاول مرة أخرى";
        setLocationStatus("لم يُحدَّد الموقع", "err");
        toast(msg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function renderCheckoutSummary() {
    const lines = cart.map((i) => `${i.name}${i.variant ? ` (${i.variant})` : ""} × ${i.qty}`).join("<br>");
    const pending = cart.some((i) => i.price == null);
    els.checkoutSummary.innerHTML = `${lines}<br><strong>المجموع: ${money(cartSum())}</strong>${pending ? "<br>بعض الأصناف سعرها حسب الكمية ويُؤكد عبر واتساب." : ""}`;
  }

  function buildWhatsappMessage(data) {
    const cfg = window.SITE_CONFIG || {};
    const lines = [
      `طلب جديد من موقع ${cfg.businessName || "مأكولات الياقوت والمرجان"}`,
      "",
      `الاسم: ${data.name}`,
      `الهاتف: ${data.phone}`,
      `العنوان: ${data.address}`,
      data.locationUrl ? `الموقع على الخريطة: ${data.locationUrl}` : "الموقع: لم يُحدَّد",
      `الاستلام: ${data.fulfillment}`,
      data.notes ? `ملاحظات: ${data.notes}` : "",
      "",
      "الطلب:"
    ].filter((x, i, arr) => x !== "" || arr[i - 1] !== "");

    cart.forEach((item, i) => {
      lines.push(`${i + 1}) ${item.name}`);
      if (item.variant) lines.push(`   النوع: ${item.variant}`);
      lines.push(`   الكمية: ${item.qty}`);
      if (item.extras.length) lines.push(`   الإضافات: ${item.extras.join("، ")}`);
      lines.push(`   السعر: ${item.price == null ? "حسب الكمية" : money(item.price)}`);
    });
    lines.push("", `المجموع التقريبي: ${money(cartSum())}`);
    return lines.join("\n");
  }

  function sendWhatsapp(data) {
    const cfg = window.SITE_CONFIG || {};
    const text = encodeURIComponent(buildWhatsappMessage(data));
    const raw = String(cfg.whatsapp || "").replace(/[^\d]/g, "");
    const placeholder = !raw || raw.includes("0000000") || raw.length < 11;
    const url = placeholder
      ? `https://wa.me/?text=${text}`
      : `https://wa.me/${raw}?text=${text}`;
    window.location.assign(url);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("yam-theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) btn.setAttribute("aria-label", theme === "dark" ? "الوضع الفاتح" : "الوضع المظلم");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === "dark" ? "#161012" : "#6B1220";
  }

  function bind() {
    applyTheme(localStorage.getItem("yam-theme") || "dark");
    document.getElementById("theme-toggle").addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
    });

    const cfg = window.SITE_CONFIG || {};
    document.getElementById("hours-text").textContent = cfg.hours || "";
    const phoneLink = document.getElementById("phone-link");
    if (phoneLink && cfg.whatsapp) {
      const digits = String(cfg.whatsapp).replace(/[^\d]/g, "");
      phoneLink.href = `https://wa.me/${digits}`;
      phoneLink.textContent = cfg.phoneDisplay || "07869789710";
    }

    els.cats.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (!btn) return;
      currentCategory = btn.dataset.id;
      renderCategories();
      renderMenu();
    });

    els.grid.addEventListener("click", (e) => {
      const id = e.target.dataset.add;
      if (!id) return;
      openItem(menu.find((i) => i.id === id));
    });

    els.itemForm.addEventListener("click", (e) => {
      const dir = e.target.dataset.qty;
      if (!dir) return;
      const step = activeItem?.step || 1;
      qty = dir === "+" ? qty + step : Math.max(step, qty - step);
      if (step < 1) qty = Math.round(qty * 10) / 10;
      document.getElementById("qty-val").textContent = qty;
    });

    els.itemForm.addEventListener("submit", (e) => {
      e.preventDefault();
      addToCart(activeItem, els.itemForm);
    });

    ["open-cart", "open-cart-2", "mobile-open-cart"].forEach((id) => {
      document.getElementById(id).addEventListener("click", openCart);
    });
    document.getElementById("close-cart").addEventListener("click", closeModals);
    document.getElementById("close-item").addEventListener("click", closeModals);
    document.getElementById("close-checkout").addEventListener("click", closeModals);
    els.overlay.addEventListener("click", closeModals);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModals(); });

    els.cartItems.addEventListener("click", (e) => {
      if (e.target.dataset.remove == null) return;
      cart.splice(Number(e.target.dataset.remove), 1);
      saveCart();
      renderCart();
    });

    document.getElementById("go-checkout").addEventListener("click", () => {
      if (!cart.length) return toast("أضف صنفاً أولاً");
      renderCheckoutSummary();
      els.cartDrawer.classList.remove("open");
      els.cartDrawer.setAttribute("aria-hidden", "true");
      els.itemModal.classList.remove("open");
      els.checkoutModal.classList.add("open");
      els.checkoutModal.setAttribute("aria-hidden", "false");
      els.overlay.hidden = false;
      document.body.style.overflow = "hidden";
      if (customerLocation) applyLocation(customerLocation.lat, customerLocation.lng);
      else requestLocation();
    });

    els.shareLocation.addEventListener("click", requestLocation);

    els.checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!customerLocation) {
        toast("حدّد موقعك على الخريطة قبل إرسال الطلب");
        requestLocation();
        return;
      }
      const form = new FormData(els.checkoutForm);
      sendWhatsapp({
        name: form.get("name").trim(),
        phone: form.get("phone").trim(),
        address: form.get("address").trim(),
        fulfillment: form.get("fulfillment"),
        notes: form.get("notes").trim(),
        locationUrl: customerLocation.url
      });
    });
  }

  loadCatalog();
  renderCategories();
  renderMenu();
  renderCart();
  bind();
})();
