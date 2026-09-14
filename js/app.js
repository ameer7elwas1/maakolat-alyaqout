(function () {
  const money = (n) => {
    if (n == null) return "حسب الكمية";
    return `${Number(n).toLocaleString("ar-IQ")} د.ع`;
  };

  const extrasSavory = {
    salt: {
      type: "radio",
      label: "الملح",
      options: [
        { label: "ملح قليل", value: "قليل" },
        { label: "ملح عادي", value: "عادي", checked: true },
        { label: "ملح زيادة", value: "زيادة" }
      ]
    },
    sofra: { type: "toggle", label: "سفرة", hint: "تجهيز للسفرة والتقديم" },
    pickles: { type: "toggle", label: "طرشي" }
  };

  const extrasSweet = {
    sofra: { type: "toggle", label: "تجهيز للسفرة / تقديم ضيافة" },
    box: { type: "toggle", label: "علبة مناسبة" }
  };

  const extrasGrill = {
    salt: extrasSavory.salt,
    sofra: extrasSavory.sofra,
    pickles: extrasSavory.pickles,
    rice: { type: "toggle", label: "تمن أحمر", checked: true },
    greens: { type: "toggle", label: "خضرة" }
  };

  const categories = [
    { id: "all", label: "الكل" },
    { id: "pastry", label: "معجنات ومقبلات" },
    { id: "kibbeh", label: "الكبة" },
    { id: "mains", label: "أطباق رئيسية" },
    { id: "dolma", label: "الدولمة" },
    { id: "sweets", label: "الحلويات" },
    { id: "special", label: "حسب الكمية" }
  ];

  const menu = [
    {
      id: "pastry-mix",
      category: "pastry",
      name: "لحم بعجين وميني بيتزا وفطائر",
      desc: "تشكيلة 50 قطعة، مناسبة للضيافة.",
      price: 35000,
      unit: "50 قطعة",
      image: "#8d2434 url('https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80') center/cover",
      extras: extrasSavory
    },
    {
      id: "rice-kibbeh-mix",
      category: "pastry",
      name: "كبة تمن وبورك وسمبوسة",
      desc: "50 قطعة مشكلة من كبة التمن والبورك والسمبوسة.",
      price: 35000,
      unit: "50 قطعة",
      image: "linear-gradient(160deg,#3f0b14,#c9a227)",
      extras: extrasSavory
    },
    {
      id: "kibbeh-halabi",
      category: "kibbeh",
      name: "كبة حلبية",
      desc: "كبة حلبية مقرمشة.",
      price: 10000,
      unit: "15 قطعة",
      image: "linear-gradient(160deg,#6b1220,#d46a4c)",
      extras: extrasSavory
    },
    {
      id: "kibbeh-mosul",
      category: "kibbeh",
      name: "كبة هلالية موصلية",
      desc: "كبة موصلية هلالية.",
      price: 15000,
      unit: "10 قطع",
      image: "linear-gradient(160deg,#4a1d10,#c9a227)",
      extras: extrasSavory
    },
    {
      id: "kibbeh-burghul",
      category: "kibbeh",
      name: "كبة برغل",
      desc: "اختَر الحجم المناسب لك.",
      image: "linear-gradient(160deg,#7a2e12,#6b1220)",
      extras: extrasSavory,
      variants: [
        { id: "double", label: "دبل — 7 قطع", price: 10000 },
        { id: "medium", label: "الوسط — 10 قطع", price: 10000 }
      ]
    },
    {
      id: "kabsa",
      category: "mains",
      name: "كبسة الدجاج والمقلوبة",
      desc: "طبق رئيسي جاهز للسفرة.",
      price: 20000,
      unit: "صينية",
      image: "#8a4b12 url('https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=900&q=80') center/cover",
      extras: extrasGrill
    },
    {
      id: "chicken-tray",
      category: "mains",
      name: "صينية الدجاج",
      desc: "مع الملحقات: طرشي وخضرة وتتبيلة الدجاج.",
      image: "linear-gradient(160deg,#6b1220,#d46a4c)",
      extras: {
        salt: extrasSavory.salt,
        sofra: extrasSavory.sofra,
        extraPickles: { type: "toggle", label: "طرشي إضافي" }
      },
      variants: [
        { id: "full", label: "صينية كاملة مع الملحقات", price: 15000 },
        { id: "half", label: "نص صينية", price: 8000 }
      ]
    },
    {
      id: "dolma",
      category: "dolma",
      name: "جدر دولمة",
      desc: "دولمة بيتية على ثلاث أحجام.",
      image: "linear-gradient(160deg,#355e3b,#c9a227)",
      extras: extrasSavory,
      variants: [
        { id: "large", label: "الحجم الكبير", price: 25000 },
        { id: "medium", label: "الوسط", price: 17000 },
        { id: "small", label: "الصغير", price: 10000 }
      ]
    },
    {
      id: "kleija-free-fat",
      category: "sweets",
      name: "كليجة بالدهن الحر",
      desc: "بالتمر والحلقوم، السعر للكيلو.",
      price: 12000,
      unit: "كيلو",
      step: 0.5,
      image: "linear-gradient(160deg,#7a4b16,#c9a227)",
      extras: extrasSweet
    },
    {
      id: "kleija-walnut",
      category: "sweets",
      name: "كليجة الجوز",
      desc: "كليجة فاخرة بالجوز، السعر للكيلو.",
      price: 15000,
      unit: "كيلو",
      step: 0.5,
      image: "linear-gradient(160deg,#5b3310,#d46a4c)",
      extras: extrasSweet
    },
    {
      id: "kleija-janna",
      category: "sweets",
      name: "كليجة بدهن جنة",
      desc: "السعر للكيلو.",
      price: 7000,
      unit: "كيلو",
      step: 0.5,
      image: "linear-gradient(160deg,#8d6a3a,#f6efe2)",
      extras: extrasSweet
    },
    {
      id: "basbousa",
      category: "sweets",
      name: "بسبوسة",
      desc: "اختَر بالقطر أو بالعسل، السعر للكيلو.",
      unit: "كيلو",
      step: 0.5,
      image: "linear-gradient(160deg,#c9a227,#6b1220)",
      extras: extrasSweet,
      variants: [
        { id: "qater", label: "بالقطر — الكيلو", price: 10000 },
        { id: "honey", label: "بالعسل — الكيلو", price: 15000 }
      ]
    },
    {
      id: "plain-cake",
      category: "sweets",
      name: "كيك سادة",
      desc: "قالب كبير.",
      price: 7000,
      unit: "قالب كبير",
      image: "linear-gradient(160deg,#d46a4c,#f6efe2)",
      extras: extrasSweet
    },
    {
      id: "layer-cake",
      category: "sweets",
      name: "كيك الطبقات",
      desc: "حسب عدد الطبقات من 3 إلى 10 آلاف.",
      image: "linear-gradient(160deg,#6b1220,#e7d7a0)",
      extras: extrasSweet,
      variants: [
        { id: "c3", label: "طبقات خفيفة — 3,000 د.ع", price: 3000 },
        { id: "c5", label: "وسط — 5,000 د.ع", price: 5000 },
        { id: "c8", label: "كبير — 8,000 د.ع", price: 8000 },
        { id: "c10", label: "فاخر — 10,000 د.ع", price: 10000 }
      ]
    },
    {
      id: "qatayef",
      category: "sweets",
      name: "قطايف بالقشطة",
      desc: "10 قطع.",
      price: 8000,
      unit: "10 قطع",
      image: "linear-gradient(160deg,#b8572a,#c9a227)",
      extras: extrasSweet
    },
    {
      id: "grilled-fish",
      category: "special",
      name: "سمك شوي",
      desc: "مع التمن الأحمر والطرشي. السعر حسب الكمية.",
      price: null,
      image: "linear-gradient(160deg,#1f4e5f,#c9a227)",
      extras: extrasGrill
    },
    {
      id: "qouzi",
      category: "special",
      name: "قوزي لحم",
      desc: "حسب الكمية المطلوبة للمناسبة.",
      price: null,
      image: "linear-gradient(160deg,#3f0b14,#c9a227)",
      extras: extrasSavory
    }
  ];

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
    toast: document.getElementById("toast"),
    hours: document.getElementById("hours-text")
  };

  let currentCategory = "all";
  let activeItem = null;
  let qty = 1;
  const cart = JSON.parse(localStorage.getItem("yam-cart") || "[]");

  const saveCart = () => localStorage.setItem("yam-cart", JSON.stringify(cart));
  const cartQty = () => cart.reduce((s, i) => s + i.qty, 0);
  const cartSum = () => cart.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

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
        <div class="dish-photo" style="background:${item.image}">
          <span class="dish-badge">${item.unit || (item.variants ? "عدة أحجام" : "حسب الطلب")}</span>
        </div>
        <div class="dish-body">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <div class="price">${priceLabel(item)}</div>
          <button class="btn btn-primary" data-add="${item.id}" type="button">أضف للسلة مع الإضافات</button>
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
        return `<fieldset class="choice-row"><legend>${extra.label}</legend>${extra.options.map((o) =>
          `<label class="chip"><input type="radio" name="${key}" value="${o.value || o.label}" ${o.checked ? "checked" : ""} /> ${o.label}</label>`
        ).join("")}</fieldset>`;
      }
      return `<label class="toggle-extra">${extra.label}${extra.hint ? ` <small class="muted">${extra.hint}</small>` : ""}
        <input type="checkbox" name="${key}" ${extra.checked ? "checked" : ""} /></label>`;
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
        <textarea name="note" rows="2" placeholder="مثال: بدون بصل، توصيل الساعة 7..."></textarea>
      </label>
      <button class="btn btn-primary btn-block" type="submit">إضافة إلى السلة</button>
    `;
  }

  function openItem(item) {
    activeItem = item;
    els.itemTitle.textContent = item.name;
    els.itemDesc.textContent = item.desc;
    els.itemHero.style.background = item.image;
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

  function bind() {
    document.getElementById("hours-text").textContent = (window.SITE_CONFIG || {}).hours || "";

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
    });

    els.checkoutForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const form = new FormData(els.checkoutForm);
      sendWhatsapp({
        name: form.get("name").trim(),
        phone: form.get("phone").trim(),
        address: form.get("address").trim(),
        fulfillment: form.get("fulfillment"),
        notes: form.get("notes").trim()
      });
    });
  }

  renderCategories();
  renderMenu();
  renderCart();
  bind();
})();
