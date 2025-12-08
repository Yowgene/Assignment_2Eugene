// COMP 3512 - Assignment 2
// MiniShop SPA - student-style implementation

// ----------------- CONSTANTS -----------------
const API_URL =
  "https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json";

const PRODUCTS_KEY = "minishop-products";
const CART_KEY = "minishop-cart";

// ----------------- ELEMENTS -----------------

// Views + nav
const views = document.querySelectorAll(".view");
const navLinks = document.querySelectorAll(".nav-link[data-nav]");
const logo = document.getElementById("logo");

// About dialog
const aboutBtn = document.getElementById("aboutBtn");
const aboutDialog = document.getElementById("aboutDialog");
const aboutClose = document.getElementById("aboutClose");

// Home
const heroText = document.getElementById("hero-text");
const homeFeatured = document.getElementById("home-featured-products");

// Browse
const productList = document.getElementById("product-list");
const filterCheckboxes = document.querySelectorAll(
  'input[type="checkbox"][data-filter]'
);
const clearFiltersBtn = document.getElementById("clearFilters");
const sortSelect = document.getElementById("sortProducts");

// Product view
const backToBrowse = document.getElementById("backToBrowse");
const breadcrumb = document.getElementById("product-breadcrumb");
const mainProductImg = document.getElementById("main-product-img");
const thumbContainer = document.getElementById("thumb-container");
const productInfo = document.getElementById("product-info");
const relatedContainer = document.getElementById("related-products");

// Cart
const cartItemsDiv = document.getElementById("cart-items");
const shipMethodSelect = document.getElementById("shipMethod");
const shipDestinationSelect = document.getElementById("shipDestination");
const checkoutBtn = document.getElementById("checkoutBtn");
const sumMerchSpan = document.getElementById("sum-merch");
const sumShipSpan = document.getElementById("sum-shipping");
const sumTaxSpan = document.getElementById("sum-tax");
const sumTotalSpan = document.getElementById("sum-total");

// Toast
const toaster = document.getElementById("toaster");

// ----------------- DATA -----------------
let products = [];
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

// ----------------- INIT -----------------
document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  try {
    await loadProducts();
  } catch (err) {
    console.error("Error loading products:", err);
    heroText.textContent =
      "Sorry, there was a problem loading products from the API.";
  }

  updateHomeHero();
  renderHomeFeatured();
  renderProducts(getFilteredAndSortedProducts());
  renderCart();

  showView("view-home");
  setupNavigation();
  setupHomeButtons();
  setupBrowseFilters();
  setupCartEvents();
}

// Load products: localStorage first, then API
async function loadProducts() {
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (stored) {
    try {
      products = JSON.parse(stored);
      if (Array.isArray(products) && products.length > 0) {
        return;
      }
    } catch (e) {
      console.warn("Could not parse stored products, clearing them.");
      localStorage.removeItem(PRODUCTS_KEY);
    }
  }

  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error("API HTTP error: " + res.status);
  }
  products = await res.json();
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

// ----------------- VIEW MANAGEMENT -----------------
function showView(viewId) {
  views.forEach((v) => v.classList.remove("active"));
  const view = document.getElementById(viewId);
  if (view) view.classList.add("active");

  navLinks.forEach((link) => link.classList.remove("active"));
  const key = viewId.split("-")[1]; // "home", "browse", "cart", "product"
  const active = document.querySelector('.nav-link[data-nav="' + key + '"]');
  if (active) active.classList.add("active");
}

function setupNavigation() {
  // logo -> home
  if (logo) {
    logo.addEventListener("click", () => {
      showView("view-home");
      updateHomeHero();
      renderHomeFeatured();
    });
  }

  // nav links
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.nav;
      const viewId = "view-" + target;
      showView(viewId);

      if (target === "browse") {
        renderProducts(getFilteredAndSortedProducts());
      } else if (target === "cart") {
        renderCart();
      }
    });
  });

  // about dialog
  if (aboutBtn && aboutDialog && aboutClose) {
    aboutBtn.addEventListener("click", () => aboutDialog.showModal());
    aboutClose.addEventListener("click", () => aboutDialog.close());
  }

  // back to browse
  if (backToBrowse) {
    backToBrowse.addEventListener("click", () => {
      showView("view-browse");
      renderProducts(getFilteredAndSortedProducts());
    });
  }
}

// ----------------- HOME VIEW -----------------
function updateHomeHero() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  heroText.textContent =
    "Explore products, add to cart, and checkout. Your cart has " +
    totalItems +
    " item(s) saved locally.";
}

function renderHomeFeatured() {
  if (!products || products.length === 0) {
    homeFeatured.innerHTML = "<p>No products to feature yet.</p>";
    return;
  }

  const featured = products.slice(0, 3);
  homeFeatured.innerHTML = featured
    .map(
      (p) => `
      <div class="product-card" data-id="${p.id}">
        <img src="photos/${p.id}.jpg" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="view-product-btn">View</button>
      </div>
    `
    )
    .join("");

  homeFeatured.querySelectorAll(".view-product-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest(".product-card").dataset.id;
      showProduct(id);
    });
  });
}

function setupHomeButtons() {
  document.querySelectorAll(".home-category-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const gender = btn.dataset.filterGender;
      showView("view-browse");

      filterCheckboxes.forEach((cb) => (cb.checked = false));

      if (gender) {
        const cb = document.querySelector(
          'input[data-filter="gender"][value="' + gender + '"]'
        );
        if (cb) cb.checked = true;
      }

      renderProducts(getFilteredAndSortedProducts());
    });
  });
}

// ----------------- BROWSE VIEW -----------------
function setupBrowseFilters() {
  filterCheckboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      renderProducts(getFilteredAndSortedProducts());
    });
  });

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      filterCheckboxes.forEach((cb) => (cb.checked = false));
      renderProducts(getFilteredAndSortedProducts());
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      renderProducts(getFilteredAndSortedProducts());
    });
  }
}

function getFilteredAndSortedProducts() {
  if (!Array.isArray(products) || products.length === 0) return [];

  let list = products.slice();

  const genders = Array.from(
    document.querySelectorAll('input[data-filter="gender"]:checked')
  ).map((x) => x.value);

  const cats = Array.from(
    document.querySelectorAll('input[data-filter="category"]:checked')
  ).map((x) => x.value);

  const sizes = Array.from(
    document.querySelectorAll('input[data-filter="size"]:checked')
  ).map((x) => x.value);

  const colors = Array.from(
    document.querySelectorAll('input[data-filter="color"]:checked')
  ).map((x) => x.value);

  list = list.filter((p) => {
    const okGender = genders.length === 0 || genders.includes(p.gender);
    const okCat =
      cats.length === 0 || cats.includes(p.category.toLowerCase());
    const okSize =
      sizes.length === 0 || p.sizes.some((s) => sizes.includes(s));
    const okColor =
      colors.length === 0 ||
      p.color.some((c) => colors.includes(c.name));
    return okGender && okCat && okSize && okColor;
  });

  const sortBy = sortSelect ? sortSelect.value : "name";
  list.sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "price") return a.price - b.price;
    if (sortBy === "category")
      return a.category.localeCompare(b.category);
    return 0;
  });

  return list;
}

function renderProducts(list) {
  if (!list || list.length === 0) {
    productList.innerHTML = "<p>No products match your filters.</p>";
    return;
  }

  productList.innerHTML = list
    .map(
      (p) => `
      <div class="product-card" data-id="${p.id}">
        <img src="photos/${p.id}.jpg" alt="${p.name}">
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
        <button class="view-product-btn">View</button>
      </div>
    `
    )
    .join("");

  productList.querySelectorAll(".view-product-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest(".product-card").dataset.id;
      showProduct(id);
    });
  });
}

// ----------------- PRODUCT VIEW -----------------
function showProduct(id) {
  const p = products.find((prod) => prod.id === id);
  if (!p) return;

  breadcrumb.textContent = `Home > ${p.gender} > ${p.category} > ${p.name}`;

  mainProductImg.src = `photos/${p.id}.jpg`;
  mainProductImg.alt = p.name;

  // thumbnails (re-use same image twice for now)
  thumbContainer.innerHTML = `
    <img src="photos/${p.id}.jpg" alt="${p.name} thumbnail">
    <img src="photos/${p.id}.jpg" alt="${p.name} thumbnail">
  `;
  thumbContainer.querySelectorAll("img").forEach((img) => {
    img.addEventListener("click", () => {
      mainProductImg.src = img.src;
    });
  });

  const sizeHTML = p.sizes
    .map((s) => `<button class="size-btn" data-size="${s}">${s}</button>`)
    .join("");

  const colorHTML = p.color
    .map(
      (c) =>
        `<span class="color-swatch" data-color-hex="${c.hex}" data-color-name="${c.name}" style="background:${c.hex}"></span>`
    )
    .join("");

  productInfo.innerHTML = `
    <h2>${p.name}</h2>
    <p><strong>Price:</strong> $${p.price.toFixed(2)}</p>
    <p>${p.description}</p>
    <p><strong>Material:</strong> ${p.material}</p>

    <label for="qtyInput"><strong>Quantity:</strong></label><br>
    <input type="number" id="qtyInput" class="quantity-box" min="1" value="1">

    <h4>Sizes</h4>
    <div class="size-options">${sizeHTML}</div>

    <h4>Colors</h4>
    <div class="color-options">${colorHTML}</div>

    <button id="addToCartBtn" class="add-btn">+ Add to Cart</button>
  `;

  let selectedSize = null;
  let selectedColorHex = null;
  let selectedColorName = null;

  productInfo.querySelectorAll(".size-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      productInfo
        .querySelectorAll(".size-btn")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedSize = btn.dataset.size;
    });
  });

  productInfo.querySelectorAll(".color-swatch").forEach((sw) => {
    sw.addEventListener("click", () => {
      productInfo
        .querySelectorAll(".color-swatch")
        .forEach((s) => s.classList.remove("selected"));
      sw.classList.add("selected");
      selectedColorHex = sw.dataset.colorHex;
      selectedColorName = sw.dataset.colorName;
    });
  });

  const addBtn = productInfo.querySelector("#addToCartBtn");
  addBtn.addEventListener("click", () => {
    const qty = parseInt(document.getElementById("qtyInput").value, 10) || 1;
    if (!selectedSize || !selectedColorHex) {
      toast("Please select a size and color first.");
      return;
    }

    const existing = cart.find(
      (item) =>
        item.id === p.id &&
        item.size === selectedSize &&
        item.colorHex === selectedColorHex
    );

    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        id: p.id,
        name: p.name,
        price: p.price,
        size: selectedSize,
        colorHex: selectedColorHex,
        colorName: selectedColorName,
        qty: qty,
      });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateHomeHero();
    renderCart();
    toast(
      `${p.name} (${selectedSize}, ${selectedColorName}) x${qty} added to cart.`
    );
  });

  const related = products
    .filter(
      (prod) =>
        prod.id !== p.id &&
        prod.gender === p.gender &&
        prod.category === p.category
    )
    .sort(
      (a, b) =>
        Math.abs(a.price - p.price) - Math.abs(b.price - p.price)
    )
    .slice(0, 4);

  if (related.length === 0) {
    relatedContainer.innerHTML = "<p>No related products found.</p>";
  } else {
    relatedContainer.innerHTML = related
      .map(
        (r) => `
        <div class="product-card" data-id="${r.id}">
          <img src="photos/${r.id}.jpg" alt="${r.name}">
          <h3>${r.name}</h3>
          <p>$${r.price.toFixed(2)}</p>
          <button class="view-product-btn">View</button>
        </div>
      `
      )
      .join("");

    relatedContainer
      .querySelectorAll(".view-product-btn")
      .forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const rid = e.target.closest(".product-card").dataset.id;
          showProduct(rid);
        });
      });
  }

  showView("view-product");
}

// ----------------- CART VIEW -----------------
function setupCartEvents() {
  if (shipMethodSelect) {
    shipMethodSelect.addEventListener("change", () => renderCart());
  }

  if (shipDestinationSelect) {
    shipDestinationSelect.addEventListener("change", () => renderCart());
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (!cart || cart.length === 0) return;

      toast("Checkout complete! Thank you for your order.");
      cart = [];
      localStorage.removeItem(CART_KEY);
      renderCart();
      updateHomeHero();
      showView("view-home");
    });
  }
}

function renderCart() {
  if (!cart || cart.length === 0) {
    cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
    disableShippingAndCheckout(true);
    updateSummary(0, 0, 0);
    return;
  }

  disableShippingAndCheckout(false);

  let merchTotal = 0;
  cartItemsDiv.innerHTML = cart
    .map((item, index) => {
      const subtotal = item.qty * item.price;
      merchTotal += subtotal;

      return `
        <div class="cart-item" data-index="${index}">
          <button class="delete-btn" data-index="${index}">-</button>
          <img src="photos/${item.id}.jpg" alt="${item.name}">
          <div>
            <strong>${item.name}</strong><br>
            <span class="color-box" style="background:${item.colorHex}"></span>
            ${item.colorName} | Size: ${item.size}
          </div>
          <span>$${item.price.toFixed(2)}</span>
          <span>${item.qty}</span>
          <strong>$${subtotal.toFixed(2)}</strong>
        </div>
      `;
    })
    .join("");

  cartItemsDiv.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const i = parseInt(e.target.dataset.index, 10);
      cart.splice(i, 1);
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      renderCart();
      updateHomeHero();
    });
  });

  calculateShippingAndTotals(merchTotal);
}

function calculateShippingAndTotals(merchTotal) {
  const method = shipMethodSelect ? shipMethodSelect.value : "standard";
  const dest = shipDestinationSelect ? shipDestinationSelect.value : "canada";

  let shipping = 0;

  if (merchTotal > 500) {
    shipping = 0;
  } else {
    const table = {
      canada: { standard: 10, express: 25, priority: 35 },
      us: { standard: 15, express: 25, priority: 50 },
      intl: { standard: 20, express: 30, priority: 50 },
    };
    shipping = table[dest][method];
  }

  const tax = dest === "canada" ? merchTotal * 0.05 : 0;
  updateSummary(merchTotal, shipping, tax);
}

function updateSummary(merch, shipping, tax) {
  sumMerchSpan.textContent = "$" + merch.toFixed(2);
  sumShipSpan.textContent = "$" + shipping.toFixed(2);
  sumTaxSpan.textContent = "$" + tax.toFixed(2);
  const total = merch + shipping + tax;
  sumTotalSpan.textContent = "$" + total.toFixed(2);
}

function disableShippingAndCheckout(disable) {
  [shipMethodSelect, shipDestinationSelect, checkoutBtn].forEach((el) => {
    if (!el) return;
    if (disable) el.classList.add("disabled");
    else el.classList.remove("disabled");
  });
}

// ----------------- TOAST -----------------
function toast(msg) {
  if (!toaster) return;
  toaster.hidden = false;
  toaster.textContent = msg;
  toaster.style.opacity = "1";

  setTimeout(() => {
    toaster.style.opacity = "0";
    setTimeout(() => {
      toaster.hidden = true;
    }, 500);
  }, 2000);
}
