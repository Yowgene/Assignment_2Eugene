// domcontent loaded event, then main app code then we can put the javascript on header
document.addEventListener("DOMContentLoaded", () => {

    //API url for products
    const API_URL =
        "https://gist.githubusercontent.com/rconnolly/d37a491b50203d66d043c26f33dbd798/raw/37b5b68c527ddbe824eaed12073d266d5455432a/clothing-compact.json";

    // key names for localstorage -- https://www.w3schools.com/html/html5_webstorage.asp
    const PRODUCTS_KEY = "minishop-products";
    const CART_KEY = "minishop-cart";

    //dom elements to interact with
    const views = document.querySelectorAll(".view"); // all views
    const navLinks = document.querySelectorAll(".nav-link[data-nav]"); //nav links
    const logo = document.getElementById("logo"); // clickable logo

    // Home
    const heroText = document.getElementById("hero-text"); //hero text
    const homeFeatured = document.getElementById("home-featured-products"); // featured products

    // Browse
    const productList = document.getElementById("product-list"); // product list
    const filterCheckboxes = document.querySelectorAll('input[data-filter]'); // filter checkboxes, this is with data-filter attribute
    const clearFiltersBtn = document.getElementById("clearFilters"); // clear filters button
    const sortSelect = document.getElementById("sortProducts"); // sort select dropdown

    // Product view
    const backToBrowse = document.getElementById("backToBrowse"); // back to browse button
    const breadcrumb = document.getElementById("product-breadcrumb"); // breadcrumb
    const mainProductImg = document.getElementById("main-product-img"); // main product image
    const thumbContainer = document.getElementById("thumb-container"); // thumbnail container
    const productInfo = document.getElementById("product-info"); // product info container
    const relatedContainer = document.getElementById("related-products"); // related products container

    // Cart
    const cartItemsDiv = document.getElementById("cart-items");// cart items container
    const shipMethodSelect = document.getElementById("shipMethod"); // shipping method select
    const shipDestinationSelect = document.getElementById("shipDestination"); // shipping destination select
    const checkoutBtn = document.getElementById("checkoutBtn"); // checkout button
    const sumMerchSpan = document.getElementById("sum-merch");// summary merchandise total span
    const sumShipSpan = document.getElementById("sum-shipping");// summary shipping total span
    const sumTaxSpan = document.getElementById("sum-tax");//  summary tax total span
    const sumTotalSpan = document.getElementById("sum-total"); // summary grand total span



  //product array and cart array
    let products = [];
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || []; // load cart from localstorage or empty array, in the api

    
    initApp();
    //promise based function to load products from api or localstorage
    function initApp() {
    loadProducts()
    .then(() => {
      updateHomeHero();
      renderHomeFeatured();
      renderProducts(getFilteredAndSortedProducts());
      renderCart();

      showView("view-home");
      setupNavigation();
      setupHomeButtons();
      setupBrowseFilters();
      setupCartEvents();
    })
    //error handling
    .catch(err => {
      console.error("Error loading products:", err);
      if (heroText) {
        heroText.textContent = "Sorry, there was a problem loading products.";
      }
    });
}
    // Load products from localStorage or fetch from API
    function loadProducts() {
      return new Promise((resolve, reject) => {
        const stored = localStorage.getItem(PRODUCTS_KEY);
          // Load from localStorage first
          if (stored) {
            try {
              products = JSON.parse(stored);
              if (Array.isArray(products) && products.length > 0) {
                resolve();
                return;
              }
            } catch (err) {
              console.warn("Clearing invalid product cache");
              localStorage.removeItem(PRODUCTS_KEY);
            }
          }
          // Fetch API with .then()
          fetch(API_URL)
            .then(response => { //check for http errors
              if (!response.ok) {
                reject("HTTP error: " + response.status); 
                return; //stop processing
              }
              return response.json(); //parse json
            })
            .then(json => { //store products and save to localstorage
              products = json; //assume json is array of products
              localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products)); //store in localstorage
              resolve(); //resolve promise
            })
            .catch(err => reject(err)); //network or parsing error
        });
      }


    //view management function to show/hide views, when nav links clicked, then view will become the active trait
    function showView(viewId) {
        views.forEach(v => v.classList.remove("active")); //hide all views
        document.getElementById(viewId).classList.add("active"); //show target view

        navLinks.forEach(n => n.classList.remove("active")); //deactivate all nav links
        const key = viewId.split("-")[1]; //extract key from viewId
        const active = document.querySelector(`.nav-link[data-nav="${key}"]`); //find matching nav link
        if (active) active.classList.add("active"); //activate matching nav link
    }

    // setup navigation event listeners for logo and nav links
    function setupNavigation() { //nav setup
        logo.addEventListener("click", () => { //clickable logo
            showView("view-home"); //go to home view
            updateHomeHero(); //will change back to home hero text, or welcome to shoppei
            renderHomeFeatured(); //render featured products, will show featured products alongside the hero text
        });

        navLinks.forEach(link => { //nav links
            link.addEventListener("click", e => { //click event, depending on which link clicked, home, browse 
                e.preventDefault(); //prevent default link behavior
                const target = "view-" + link.dataset.nav; //construct target view id
                showView(target); //show target view
              
                if (link.dataset.nav === "browse") { //if browse link clicked, then it will render products
                    renderProducts(getFilteredAndSortedProducts()); //render products with current filters/sorting
                } else if (link.dataset.nav === "cart") { //if cart link clicked, then it will render cart
                    renderCart(); //render cart contents
                }
            });
        });

        backToBrowse.addEventListener("click", () => { //back to browse button on product view
            showView("view-browse"); //show browse view
            renderProducts(getFilteredAndSortedProducts()); //render products with current filters/sorting
        });
    }

    //this is for hero view on home page or banner
    function updateHomeHero() {
        const total = cart.reduce((s, i) => s + i.qty, 0); //calculate total items in cart
        heroText.textContent = // update hero text
            `Explore products, add to cart, and checkout. Your cart has ${total} item(s).`; //dynamic text showing number of items in cart
    }

    // render featured products on home page
    function renderHomeFeatured() {
        const featured = products.slice(0, 3); //take first 3 products as featured
        //generate HTML for featured products, https://www.w3schools.com/jsref/prop_html_innerhtml.asp .map added for each product
        homeFeatured.innerHTML = featured.map(p => `
            <div class="product-card" data-id="${p.id}">
                <div class="rect-img"></div>
                <h3>${p.name}</h3>
                <p>$${p.price.toFixed(2)}</p>
                <button class="view-product-btn">View</button>
            </div>
        `).join("");

        //add event listeners to view buttons
        homeFeatured.querySelectorAll(".view-product-btn").forEach(btn => { //select all view product buttons
            btn.addEventListener("click", e => { //click event
                const id = e.target.closest(".product-card").dataset.id; //get product id from closest product card
                showProduct(id); //show product detail view
            });
        });
    }

    //setup home category buttons to filter
    function setupHomeButtons() {
        document.querySelectorAll(".home-category-btn").forEach(btn => { //select all home category buttons
            btn.addEventListener("click", () => { //click event
                const gender = btn.dataset.filterGender; //get gender from button dataset
                showView("view-browse"); //show browse view

                filterCheckboxes.forEach(cb => cb.checked = false); //clear all filters

                if (gender) { //if gender specified, check corresponding checkbox
                    const cb = document.querySelector(`input[data-filter="gender"][value="${gender}"]`); //select checkbox
                    if (cb) cb.checked = true; //check checkbox
                }

                renderProducts(getFilteredAndSortedProducts()); //render products with current filters/sorting
            });
        });
    }

    //Browse view filtering and sorting setup
    function setupBrowseFilters() { //filter and sort setup
        filterCheckboxes.forEach(cb => //for each filter checkbox
            cb.addEventListener("change", () => //change event
                renderProducts(getFilteredAndSortedProducts()) //render products with current filters/sorting
            )
        );

        clearFiltersBtn.addEventListener("click", () => { //clear filters button
            filterCheckboxes.forEach(cb => cb.checked = false); //uncheck all filters
            renderProducts(getFilteredAndSortedProducts()); //render products with current filters/sorting
        });

        sortSelect.addEventListener("change", () => { //sort select dropdown
            renderProducts(getFilteredAndSortedProducts()); //render products with current filters/sorting
        });
    }

    function getFilteredAndSortedProducts() { //get filtered and sorted products
        let list = products.slice(); //copy full product list

        const genders = checked("gender"); //get checked genders
        const cats = checked("category");//get checked categories
        const sizes = checked("size"); //get checked sizes
        const colors = checked("color"); //get checked colors

        list = list.filter(p => //filter products based on checked filters
            (genders.length === 0 || genders.includes(p.gender)) && //if no
            (cats.length === 0 || cats.includes(p.category.toLowerCase())) && //if no categories checked or product category is in checked categories
            (sizes.length === 0 || p.sizes.some(s => sizes.includes(s))) && //if no sizes checked or product has at least one size in checked sizes
            (colors.length === 0 || p.color.some(c => colors.includes(c.name))) //if no colors checked or product has at least one color in checked colors
        );

        const sortBy = sortSelect.value; //get selected sort option
        list.sort((a, b) => { //sort products based on selected option
            if (sortBy === "name") return a.name.localeCompare(b.name); //alphabetical
            if (sortBy === "price") return a.price - b.price; //price low to high
            if (sortBy === "category") return a.category.localeCompare(b.category); //category alphabetical
        });

        return list; //return filtered and sorted list
    }

    function checked(type) { //get checked values for a filter type
        return Array.from(document.querySelectorAll(`input[data-filter="${type}"]:checked`)) //select checked checkboxes
            .map(x => x.value); //return array of values
    }

    function renderProducts(list) { //render product list in browse view
        if (list.length === 0) { //if no products match filters
            productList.innerHTML = "<p>No products match your filters.</p>"; //display message
            return;
        }
//generate HTML for product list
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

        productList.querySelectorAll(".view-product-btn").forEach(btn => { //add event listeners to view buttons
            btn.addEventListener("click", e => { //click event
                const id = e.target.closest(".product-card").dataset.id; //get product id from closest product card
                showProduct(id); //show product detail view
            });
        });

        productList.querySelectorAll(".quick-add-btn").forEach(btn => { //add event listeners to quick add buttons
            btn.addEventListener("click", e => { //click event
                const id = e.target.closest(".product-card").dataset.id; //get product id from closest product card
                quickAddToCart(id); //quick add product to cart
            });
        });
    }

    // Quick add product to cart with default options
    function quickAddToCart(id) {
        const p = products.find(x => x.id == id); //find product by id
        if (!p) return; //if product not found, exit

        const defaultSize = p.sizes[0] || "One Size"; //default to first size or "One Size"
        const defaultColor = p.color[0] || { hex: "#000", name: "Default" }; //default to first color or black,

        const existing = cart.find( //check if product with same options already in cart
            item => item.id === p.id && //same product id
                item.size === defaultSize && //same size
                item.colorHex === defaultColor.hex //same color
        );

        if (existing) existing.qty++; //if found, increment quantity
        else { //if not found, add new item to cart
            cart.push({ //add new item to cart
                id: p.id,
                name: p.name,
                price: p.price,
                size: defaultSize,
                colorHex: defaultColor.hex,
                colorName: defaultColor.name,
                qty: 1
            });
        }

        localStorage.setItem(CART_KEY, JSON.stringify(cart)); //save updated cart to localstorage,stringify cart array
        updateHomeHero(); //update home hero text
        renderCart(); //render cart view
    }

    // product detail view
    function showProduct(id) {
        const p = products.find(x => x.id == id); //find product by id
        if (!p) return; //if product not found, exit

        breadcrumb.textContent = `Home > ${p.gender} > ${p.category} > ${p.name}`; //update breadcrumb text
        mainProductImg.src = "photos/images2.jpg";

        //populate thumbnails (using same image for demo)
        thumbContainer.innerHTML = `
            <img src="photos/images2.jpg">
            <img src="photos/images2.jpg">
        `;
      //add click event listeners to thumbnails
        thumbContainer.querySelectorAll("img").forEach(img =>
            img.addEventListener("click", () => {
                mainProductImg.src = img.src;
            })
        );
        //populate product info
        const sizeHTML = p.sizes.map(s =>
            `<button class="size-btn" data-size="${s}">${s}</button>`
        ).join("");
        //populate color options
        const colorHTML = p.color.map(c =>
            `<span class="color-swatch" data-color-hex="${c.hex}" data-color-name="${c.name}" style="background:${c.hex}"></span>`
        ).join("");
        //set innerHTML of product info container, got from API
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

        let selectedSize = null; //variables to track selected options
        let selectedColorHex = null; //selected color hex
        let selectedColorName = null; //selected color name

        productInfo.querySelectorAll(".size-btn").forEach(btn => { //add event listeners to size buttons
            btn.addEventListener("click", () => { //click event
                productInfo.querySelectorAll(".size-btn").forEach(b => b.classList.remove("selected")); //deselect all sizes
                btn.classList.add("selected"); //select clicked size
                selectedSize = btn.dataset.size; //update selected size
            });
        });

        productInfo.querySelectorAll(".color-swatch").forEach(sw => { //add event listeners to color swatches
            sw.addEventListener("click", () => { //click event
                productInfo.querySelectorAll(".color-swatch").forEach(s => s.classList.remove("selected")); //deselect all colors
                sw.classList.add("selected"); //select clicked color
                selectedColorHex = sw.dataset.colorHex; //update selected color hex
                selectedColorName = sw.dataset.colorName; //update selected color name
            });
        });

        productInfo.querySelector("#addToCartBtn").addEventListener("click", () => { //add event listener to add to cart button
            const qty = parseInt(document.getElementById("qtyInput").value, 10) || 1; //get quantity input value

            if (!selectedSize || !selectedColorHex) { //ensure size and color selected
                alert("Select a size and color first."); //alerts the customer
                return;
            }

            const existing = cart.find( //check if product with same options already in cart
                item => 
                    item.id === p.id && //same product id 
                    item.size === selectedSize && //same size
                    item.colorHex === selectedColorHex //same color
            );

            if (existing) existing.qty += qty; //if found, increment quantity
            else { //if not found, add new item to cart
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

            localStorage.setItem(CART_KEY, JSON.stringify(cart)); //save updated cart to localstorage, stringify cart array
            updateHomeHero(); //update home hero text
            renderCart(); //render cart view
            alert(`${p.name} added to cart.`); //confirmation alert
        });

        renderRelated(p); //render related products
        showView("view-product"); //show product detail view
    }

    //related products
    function renderRelated(p) { //render related
        const related = products //find related products
            .filter(r => r.id !== p.id && r.gender === p.gender && r.category === p.category) //same gender and category, exclude current product
            .slice(0, 4); //take first 4 related products

        if (related.length === 0) { //if no related products
            relatedContainer.innerHTML = "<p>No related items.</p>"; //display message
            return; 
        }

        //generate HTML for related products
        relatedContainer.innerHTML = related.map(r => ` 
            <div class="product-card" data-id="${r.id}">
                <div class="rect-img"></div>
                <h3>${r.name}</h3>
                <p>$${r.price.toFixed(2)}</p>
                <button class="view-product-btn">View</button>
            </div>
        `).join("");

        relatedContainer.querySelectorAll(".view-product-btn").forEach(btn => { //add event listeners to view buttons
            btn.addEventListener("click", e => { //click event
                const rid = e.target.closest(".product-card").dataset.id; //get related product id from closest product card
                showProduct(rid); //show related product detail view
            });
        });
    }

    //cart event setup
    function setupCartEvents() { //setup cart events
        shipMethodSelect.addEventListener("change", () => renderCart()); //re-render cart on shipping method change
        shipDestinationSelect.addEventListener("change", () => renderCart()); //re-render cart on shipping destination change

        checkoutBtn.addEventListener("click", () => { //checkout button
            if (!cart.length) return; //if cart empty, exit
            alert("Checkout complete!"); //confirmation alert
            cart = []; //clear cart
            localStorage.removeItem(CART_KEY); //remove cart from localstorage
            renderCart(); //re-render cart
            updateHomeHero(); //update home hero text
            showView("view-home"); //return to home view
        });
    }

    function renderCart() { //render cart contents
        if (!cart.length) { //if cart empty
            cartItemsDiv.innerHTML = "<p>Your cart is empty.</p>"; //display message
            disableShipping(true); //disable shipping options
            updateSummary(0, 0, 0); //reset summary totals
            return;
        }

        disableShipping(false); //enable shipping options

        let merchTotal = 0; //variable to track merchandise total

        cartItemsDiv.innerHTML = cart.map((item, index) => { //generate HTML for cart items
            const subtotal = item.qty * item.price; //calculate item subtotal
            merchTotal += subtotal; //add to merchandise total

            //return HTML for each cart item
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
        //add event listeners to delete buttons
        cartItemsDiv.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", e => { //click event
                const i = e.target.dataset.index; //get item index from button dataset
                cart.splice(i, 1); //remove item from cart
                localStorage.setItem(CART_KEY, JSON.stringify(cart)); //save updated cart to localstorage
                renderCart();//render cart view
                updateHomeHero(); //update home hero text
            });
        });

        calculateTotals(merchTotal); //calculate and update totals
    }

    function calculateTotals(merchTotal) { //calculate shipping, tax, and update summary
        const dest = shipDestinationSelect.value; //shipping destination
        const method = shipMethodSelect.value;//shipping method

        let shipping = 0; //variable to track shipping cost

        if (merchTotal <= 500) { //free shipping for orders over $500
            const table = { //shipping cost table
                canada: { standard: 10, express: 25, priority: 35 },
                us: { standard: 15, express: 25, priority: 50 },
                intl: { standard: 20, express: 30, priority: 50 }
            };
            shipping = table[dest][method];//lookup shipping cost
        }

        const tax = dest === "canada" ? merchTotal * 0.05 : 0; //5% tax for Canada only

        updateSummary(merchTotal, shipping, tax); //update summary display
    }

    //update summary display
    function updateSummary(merch, shipping, tax) {
        sumMerchSpan.textContent = "$" + merch.toFixed(2);//update merchandise total
        sumShipSpan.textContent = "$" + shipping.toFixed(2);  //update shipping total
        sumTaxSpan.textContent = "$" + tax.toFixed(2); //update tax total
        sumTotalSpan.textContent = "$" + (merch + shipping + tax).toFixed(2); //update grand total
    }

    function disableShipping(disable) { //enable/disable shipping options and checkout button
        [shipMethodSelect, shipDestinationSelect, checkoutBtn] //array of elements to disable/enable
            .forEach(el => el.classList.toggle("disabled", disable)); //toggle disabled class
    }

    //This will show the about dialog in the html file
    const aboutBtn = document.getElementById("aboutBtn"); //about button in footer
    const aboutDialog = document.getElementById("aboutDialog"); //about dialog element
    const aboutClose = document.getElementById("aboutClose"); //about dialog close button

    aboutBtn.addEventListener("click", () => {
      aboutDialog.showModal();//show modal dialog
    });

    aboutClose.addEventListener("click", () => {
      aboutDialog.close(); //close dialog
    });


});
