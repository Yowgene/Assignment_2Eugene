// MiniShop SPA - Clean Rewritten Version
// Works WITHOUT defer (everything runs inside DOMContentLoaded)

// ======================================================================
// MAIN WRAPPER - Ensures ALL HTML loads before JS runs
// ======================================================================
document.addEventListener("DOMContentLoaded", () => {

    // --------------------------
    // CONSTANTS & STORAGE KEYS
    // --------------------------
    const API_URL =
        "https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json";

    const PRODUCTS_KEY = "minishop-products";
    const CART_KEY = "minishop-cart";

    // --------------------------
    // DOM ELEMENTS
    // --------------------------
    const views = document.querySelectorAll(".view");
    const navLinks = document.querySelectorAll(".nav-link[data-nav]");
    const logo = document.getElementById("logo");

    // Home
    const heroText = document.getElementById("hero-text");
    const homeFeatured = document.getElementById("home-featured-products");

    // Browse
    const productList = document.getElementById("product-list");
    const filterCheckboxes = document.querySelectorAll('input[data-filter]');
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



    // --------------------------
    // DATA
    // --------------------------
    let products = [];
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    // ======================================================================
    // INITIALIZATION
    // ======================================================================
    initApp();

    async function initApp() {
        await loadProducts();
        updateHomeHero();
        renderHomeFeatured();
        renderProducts(getFilteredAndSortedProducts());
        renderCart();
        setupNavigation();
        setupHomeButtons();
        setupBrowseFilters();
        setupCartEvents();
        showView("view-home");
    }

    // ======================================================================
    // LOAD PRODUCTS (LOCALSTORAGE FIRST, THEN API)
    // ======================================================================
    async function loadProducts() {
        const stored = localStorage.getItem(PRODUCTS_KEY);

        if (stored) {
            try {
                products = JSON.parse(stored);
                if (products.length > 0) return;
            } catch {
                localStorage.removeItem(PRODUCTS_KEY);
            }
        }

        const res = await fetch(API_URL);
        products = await res.json();
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }

    // ======================================================================
    // VIEW MANAGEMENT
    // ======================================================================
    function showView(viewId) {
        views.forEach(v => v.classList.remove("active"));
        document.getElementById(viewId).classList.add("active");

        navLinks.forEach(n => n.classList.remove("active"));
        const key = viewId.split("-")[1];
        const active = document.querySelector(`.nav-link[data-nav="${key}"]`);
        if (active) active.classList.add("active");
    }

    function setupNavigation() {
        logo.addEventListener("click", () => {
            showView("view-home");
            updateHomeHero();
            renderHomeFeatured();
        });

        navLinks.forEach(link => {
            link.addEventListener("click", e => {
                e.preventDefault();
                const target = "view-" + link.dataset.nav;
                showView(target);

                if (link.dataset.nav === "browse") {
                    renderProducts(getFilteredAndSortedProducts());
                } else if (link.dataset.nav === "cart") {
                    renderCart();
                }
            });
        });

        backToBrowse.addEventListener("click", () => {
            showView("view-browse");
            renderProducts(getFilteredAndSortedProducts());
        });
    }

    // ======================================================================
    // HOME VIEW
    // ======================================================================
    function updateHomeHero() {
        const total = cart.reduce((s, i) => s + i.qty, 0);
        heroText.textContent =
            `Explore products, add to cart, and checkout. Your cart has ${total} item(s).`;
    }

    function renderHomeFeatured() {
        const featured = products.slice(0, 3);

        homeFeatured.innerHTML = featured.map(p => `
            <div class="product-card" data-id="${p.id}">
                <div class="rect-img"></div>
                <h3>${p.name}</h3>
                <p>$${p.price.toFixed(2)}</p>
                <button class="view-product-btn">View</button>
            </div>
        `).join("");

        homeFeatured.querySelectorAll(".view-product-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = e.target.closest(".product-card").dataset.id;
                showProduct(id);
            });
        });
    }

    function setupHomeButtons() {
        document.querySelectorAll(".home-category-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const gender = btn.dataset.filterGender;
                showView("view-browse");

                filterCheckboxes.forEach(cb => cb.checked = false);

                if (gender) {
                    const cb = document.querySelector(`input[data-filter="gender"][value="${gender}"]`);
                    if (cb) cb.checked = true;
                }

                renderProducts(getFilteredAndSortedProducts());
            });
        });
    }

    // ======================================================================
    // BROWSE VIEW
    // ======================================================================
    function setupBrowseFilters() {
        filterCheckboxes.forEach(cb =>
            cb.addEventListener("change", () =>
                renderProducts(getFilteredAndSortedProducts())
            )
        );

        clearFiltersBtn.addEventListener("click", () => {
            filterCheckboxes.forEach(cb => cb.checked = false);
            renderProducts(getFilteredAndSortedProducts());
        });

        sortSelect.addEventListener("change", () => {
            renderProducts(getFilteredAndSortedProducts());
        });
    }

    function getFilteredAndSortedProducts() {
        let list = products.slice();

        const genders = checked("gender");
        const cats = checked("category");
        const sizes = checked("size");
        const colors = checked("color");

        list = list.filter(p =>
            (genders.length === 0 || genders.includes(p.gender)) &&
            (cats.length === 0 || cats.includes(p.category.toLowerCase())) &&
            (sizes.length === 0 || p.sizes.some(s => sizes.includes(s))) &&
            (colors.length === 0 || p.color.some(c => colors.includes(c.name)))
        );

        const sortBy = sortSelect.value;
        list.sort((a, b) => {
            if (sortBy === "name") return a.name.localeCompare(b.name);
            if (sortBy === "price") return a.price - b.price;
            if (sortBy === "category") return a.category.localeCompare(b.category);
        });

        return list;
    }

    function checked(type) {
        return Array.from(document.querySelectorAll(`input[data-filter="${type}"]:checked`))
            .map(x => x.value);
    }

    function renderProducts(list) {
        if (list.length === 0) {
            productList.innerHTML = "<p>No products match your filters.</p>";
            return;
        }

        productList.innerHTML = list.map(p => `
            <div class="product-card" data-id="${p.id}">
                <div class="rect-img"></div>
                <h3>${p.name}</h3>
                <p>$${p.price.toFixed(2)}</p>
                <div class="card-buttons">
                    <button class="view-product-btn">View</button>
                    <button class="quick-add-btn">+ Cart</button>
                </div>
            </div>
        `).join("");

        productList.querySelectorAll(".view-product-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = e.target.closest(".product-card").dataset.id;
                showProduct(id);
            });
        });

        productList.querySelectorAll(".quick-add-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const id = e.target.closest(".product-card").dataset.id;
                quickAddToCart(id);
            });
        });
    }

    // ======================================================================
    // QUICK ADD
    // ======================================================================
    function quickAddToCart(id) {
        const p = products.find(x => x.id == id);
        if (!p) return;

        const defaultSize = p.sizes[0] || "One Size";
        const defaultColor = p.color[0] || { hex: "#000", name: "Default" };

        const existing = cart.find(
            item => item.id === p.id &&
                item.size === defaultSize &&
                item.colorHex === defaultColor.hex
        );

        if (existing) existing.qty++;
        else {
            cart.push({
                id: p.id,
                name: p.name,
                price: p.price,
                size: defaultSize,
                colorHex: defaultColor.hex,
                colorName: defaultColor.name,
                qty: 1
            });
        }

        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateHomeHero();
        renderCart();
    }

    // ======================================================================
    // PRODUCT VIEW (DETAIL PAGE)
    // ======================================================================
    function showProduct(id) {
        const p = products.find(x => x.id == id);
        if (!p) return;

        breadcrumb.textContent = `Home > ${p.gender} > ${p.category} > ${p.name}`;

        mainProductImg.src = "photos/" + p.id + ".jpg";

        thumbContainer.innerHTML = `
            <img src="photos/${p.id}.jpg">
            <img src="photos/${p.id}.jpg">
        `;

        thumbContainer.querySelectorAll("img").forEach(img =>
            img.addEventListener("click", () => {
                mainProductImg.src = img.src;
            })
        );

        const sizeHTML = p.sizes.map(s =>
            `<button class="size-btn" data-size="${s}">${s}</button>`
        ).join("");

        const colorHTML = p.color.map(c =>
            `<span class="color-swatch" data-color-hex="${c.hex}" data-color-name="${c.name}" style="background:${c.hex}"></span>`
        ).join("");

        productInfo.innerHTML = `
            <h2>${p.name}</h2>
            <p><strong>Price:</strong> $${p.price.toFixed(2)}</p>
            <p>${p.description}</p>
            <p><strong>Material:</strong> ${p.material}</p>

            <label><strong>Quantity:</strong></label><br>
            <input type="number" id="qtyInput" min="1" value="1" class="quantity-box">

            <h4>Sizes</h4>
            <div class="size-options">${sizeHTML}</div>

            <h4>Colors</h4>
            <div class="color-options">${colorHTML}</div>

            <button id="addToCartBtn" class="add-btn">+ Add to Cart</button>
        `;

        let selectedSize = null;
        let selectedColorHex = null;
        let selectedColorName = null;

        productInfo.querySelectorAll(".size-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                productInfo.querySelectorAll(".size-btn").forEach(b => b.classList.remove("selected"));
                btn.classList.add("selected");
                selectedSize = btn.dataset.size;
            });
        });

        productInfo.querySelectorAll(".color-swatch").forEach(sw => {
            sw.addEventListener("click", () => {
                productInfo.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected"));
                sw.classList.add("selected");
                selectedColorHex = sw.dataset.colorHex;
                selectedColorName = sw.dataset.colorName;
            });
        });

        productInfo.querySelector("#addToCartBtn").addEventListener("click", () => {
            const qty = parseInt(document.getElementById("qtyInput").value, 10) || 1;

            if (!selectedSize || !selectedColorHex) {
                alert("Select a size and color first.");
                return;
            }

            const existing = cart.find(
                item =>
                    item.id === p.id &&
                    item.size === selectedSize &&
                    item.colorHex === selectedColorHex
            );

            if (existing) existing.qty += qty;
            else {
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
            alert(`${p.name} added to cart.`);
        });

        renderRelated(p);
        showView("view-product");
    }

    // ======================================================================
    // RELATED PRODUCTS
    // ======================================================================
    function renderRelated(p) {
        const related = products
            .filter(r => r.id !== p.id && r.gender === p.gender && r.category === p.category)
            .slice(0, 4);

        if (related.length === 0) {
            relatedContainer.innerHTML = "<p>No related items.</p>";
            return;
        }

        relatedContainer.innerHTML = related.map(r => `
            <div class="product-card" data-id="${r.id}">
                <div class="rect-img"></div>
                <h3>${r.name}</h3>
                <p>$${r.price.toFixed(2)}</p>
                <button class="view-product-btn">View</button>
            </div>
        `).join("");

        relatedContainer.querySelectorAll(".view-product-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const rid = e.target.closest(".product-card").dataset.id;
                showProduct(rid);
            });
        });
    }

    // ======================================================================
    // CART VIEW
    // ======================================================================
    function setupCartEvents() {
        shipMethodSelect.addEventListener("change", () => renderCart());
        shipDestinationSelect.addEventListener("change", () => renderCart());

        checkoutBtn.addEventListener("click", () => {
            if (!cart.length) return;
            alert("Checkout complete!");
            cart = [];
            localStorage.removeItem(CART_KEY);
            renderCart();
            updateHomeHero();
            showView("view-home");
        });
    }

    function renderCart() {
        if (!cart.length) {
            cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>";
            disableShipping(true);
            updateSummary(0, 0, 0);
            return;
        }

        disableShipping(false);

        let merchTotal = 0;

        cartItemsDiv.innerHTML = cart.map((item, index) => {
            const subtotal = item.qty * item.price;
            merchTotal += subtotal;

            return `
                <div class="cart-item">
                    <button class="delete-btn" data-index="${index}">-</button>
                    <div class="rect-img small"></div>
                    <div>
                        <strong>${item.name}</strong><br>
                        ${item.colorName} | ${item.size}
                    </div>
                    <span>$${item.price.toFixed(2)}</span>
                    <span>${item.qty}</span>
                    <strong>$${subtotal.toFixed(2)}</strong>
                </div>
            `;
        }).join("");

        cartItemsDiv.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", e => {
                const i = e.target.dataset.index;
                cart.splice(i, 1);
                localStorage.setItem(CART_KEY, JSON.stringify(cart));
                renderCart();
                updateHomeHero();
            });
        });

        calculateTotals(merchTotal);
    }

    function calculateTotals(merchTotal) {
        const dest = shipDestinationSelect.value;
        const method = shipMethodSelect.value;

        let shipping = 0;

        if (merchTotal <= 500) {
            const table = {
                canada: { standard: 10, express: 25, priority: 35 },
                us: { standard: 15, express: 25, priority: 50 },
                intl: { standard: 20, express: 30, priority: 50 }
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
        sumTotalSpan.textContent = "$" + (merch + shipping + tax).toFixed(2);
    }

    function disableShipping(disable) {
        [shipMethodSelect, shipDestinationSelect, checkoutBtn]
            .forEach(el => el.classList.toggle("disabled", disable));
    }


}); // END DOMContentLoaded WRAPPER
