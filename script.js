// HANDY-NOTFALL-DETEKTOR: Wenn ein Fehler passiert, zeigt das Handy ein Textfenster an!
window.onerror = function(msg, url, line) {
    alert("Handy-Ladefehler: " + msg + " in Zeile: " + line);
    return false;
};

const RESTAURANT_NAME = "QrMenu Solutions";

// Firebase Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyD2pkRpFaVC4Jl6nRTwIS4x0Qxj6POT79A",
  authDomain: "restaurant-menu-dc5b9.firebaseapp.com",
  projectId: "restaurant-menu-dc5b9",
  storageBucket: "restaurant-menu-dc5b9.firebasestorage.app",
  messagingSenderId: "657984294527",
  appId: "1:657984294527:web:edc1fa4dd4ea281a94394a",
  measurementId: "G-TNBTG8BQBL"
};

let db = null;
let useDemoMode = false;

try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "DEIN_API_KEY") {
        throw new Error("Demo-Modus");
    }
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (e) {
    console.warn("Firebase bypassed: " + e.message);
    useDemoMode = true;
}

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
let tableNumber = "";
let cart = [];
let currentCategory = "Alle";

// Handy-Sicherer Speicherschutz (verhindert Abstürze im privaten Modus)
function safeSetItem(key, value) {
    try { localStorage.setItem(key, value); } catch(e) { console.error("Speichern blockiert"); }
}
function safeGetItem(key) {
    try { return localStorage.getItem(key); } catch(e) { return null; }
}

// Speisekartendatenbank (Über 60 Artikel)
const database = [
    // Vorspeisen
    { id: 1, name: "Bruschetta Classico mit Eiertomaten & Basilikum", category: "Vorspeisen", price: 6.90, img: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?auto=format&fit=crop&w=400&q=80" },
    { id: 2, name: "Knusprige Mozzarella Sticks mit Chili-Marmelade", category: "Vorspeisen", price: 7.90, img: "https://images.unsplash.com/photo-1531749668029-2db88e4b76ce?auto=format&fit=crop&w=400&q=80" },
    { id: 3, name: "Rinder-Carpaccio mit Trüffelcreme & Parmesan", category: "Vorspeisen", price: 14.50, img: "https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=400&q=80" },
    { id: 4, name: "Calamari Fritti mit hausgemachter Aioli", category: "Vorspeisen", price: 11.90, img: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&q=80" },
    { id: 5, name: "Vitello Tonnato (Zartes Kalbfleisch mit Thoncreme)", category: "Vorspeisen", price: 13.90, img: "https://images.unsplash.com/photo-1633504531198-40213973fa60?auto=format&fit=crop&w=400&q=80" },
    { id: 6, name: "Knoblauchbrot mit geschmolzenem Mozzarella", category: "Vorspeisen", price: 5.50, img: "https://images.unsplash.com/photo-1573145959489-4827cd346f34?auto=format&fit=crop&w=400&q=80" },
    { id: 7, name: "Antipasti Misto (Gemischte italienische Platte)", category: "Vorspeisen", price: 16.90, img: "https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=400&q=80" },
    { id: 8, name: "Fruchtige Tomatensuppe mit Sahnehaube", category: "Vorspeisen", price: 6.50, img: "https://images.unsplash.com/photo-1547592165-e1d17fed6005?auto=format&fit=crop&w=400&q=80" },
    // Burger
    { id: 9, name: "Truffle Smash Burger mit Double Cheddar & Bacon", category: "Burger", price: 15.90, img: "https://images.unsplash.com/photo-1586816001966-79b736744398?auto=format&fit=crop&w=400&q=80" },
    { id: 10, name: "Avocado Veggie Garden Burger (Vegan)", category: "Burger", price: 13.90, img: "https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=400&q=80" },
    { id: 11, name: "Classic Bacon Cheeseburger (100% Angus)", category: "Burger", price: 14.50, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80" },
    { id: 12, name: "BBQ Honey Smoke Burger mit Röstzwiebeln", category: "Burger", price: 15.20, img: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=400&q=80" },
    { id: 13, name: "Crispy Buttermilk Chicken Burger (Scharf)", category: "Burger", price: 13.90, img: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=400&q=80" },
    { id: 14, name: "Chili Cheese Inferno Burger mit Jalapeños", category: "Burger", price: 14.90, img: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=400&q=80" },
    { id: 15, name: "Greek Halloumi Burger mit Grillgemüse", category: "Burger", price: 13.50, img: "https://images.unsplash.com/photo-1585238342024-78d387f4a707?auto=format&fit=crop&w=400&q=80" },
    // Pizza
    { id: 16, name: "Pizza Margherita Deluxe mit Fior di Latte", category: "Pizza", price: 10.50, img: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=400&q=80" },
    { id: 17, name: "Pizza Diavola mit scharfer Salami & Spianata", category: "Pizza", price: 12.90, img: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=400&q=80" },
    { id: 18, name: "Pizza Prosciutto e Funghi (Schinken & Pilze)", category: "Pizza", price: 12.50, img: "https://images.unsplash.com/photo-1555072956-7758afb20e8f?auto=format&fit=crop&w=400&q=80" },
    { id: 19, name: "Pizza Quattro Formaggi (Vier edle Käsesorten)", category: "Pizza", price: 13.90, img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=400&q=80" },
    { id: 20, name: "Pizza Tonno e Cipolla (Thunfisch & Zwiebeln)", category: "Pizza", price: 12.80, img: "https://images.unsplash.com/photo-1573821663912-569905455b1c?auto=format&fit=crop&w=400&q=80" },
    { id: 21, name: "Pizza Parma (Parmaschinken, Rucola & Grana)", category: "Pizza", price: 14.90, img: "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?auto=format&fit=crop&w=400&q=80" },
    { id: 22, name: "Pizza Vegetaria (Frisches Marktgemüse)", category: "Pizza", price: 11.90, img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80" },
    { id: 23, name: "Pizza Calzone (Gefüllt mit Schinken & Salami)", category: "Pizza", price: 13.50, img: "https://images.unsplash.com/photo-1620311210137-b47e58a74136?auto=format&fit=crop&w=400&q=80" },
    { id: 24, name: "Pizza BBQ Chicken mit Mais & roten Zwiebeln", category: "Pizza", price: 13.90, img: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80" },
    { id: 25, name: "Pizza Frutti di Mare mit Knoblauchöl", category: "Pizza", price: 15.50, img: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=400&q=80" },
    // Pasta
    { id: 26, name: "Spaghetti Carbonara (Original mit Guanciale)", category: "Pasta", price: 12.90, img: "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=400&q=80" },
    { id: 27, name: "Penne all'Arrabbiata (Scharfe Tomatensauce)", category: "Pasta", price: 10.50, img: "https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&q=80" },
    { id: 28, name: "Hausgemachte Lasagne al Forno", category: "Pasta", price: 13.90, img: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=400&q=80" },
    { id: 29, name: "Tagliatelle al Tartufo (Frischer Trüffel & Rahm)", category: "Pasta", price: 17.90, img: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=400&q=80" },
    { id: 30, name: "Spaghetti Bolognese (100% Rindfleisch)", category: "Pasta", price: 11.90, img: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&q=80" },
    { id: 31, name: "Gnocchi Sorrento mit geschmolzenem Mozzarella", category: "Pasta", price: 11.50, img: "https://images.unsplash.com/photo-1559561853-08026f9fd895?auto=format&fit=crop&w=400&q=80" },
    { id: 32, name: "Tortellini alla Panna (Schinken-Sahnesauce)", category: "Pasta", price: 12.50, img: "https://images.unsplash.com/photo-1551815615-1ba31285807f?auto=format&fit=crop&w=400&q=80" },
    // Salate
    { id: 33, name: "Caesar Salad mit gegrillten Hähnchenstreifen", category: "Salate", price: 13.90, img: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=400&q=80" },
    { id: 34, name: "Insalata Caprese (Tomate, Mozzarella & Basilikum)", category: "Salate", price: 9.90, img: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=400&q=80" },
    { id: 35, name: "Griechischer Bauernsalat mit Feta & Oliven", category: "Salate", price: 11.50, img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80" },
    { id: 36, name: "Fitness-Salat mit gebratenen Lachsstreifen", category: "Salate", price: 16.90, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80" },
    { id: 37, name: "Kleiner gemischter Beilagensalat", category: "Salate", price: 4.90, img: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=400&q=80" },
    // Desserts
    { id: 38, name: "Hausgemachtes Tiramisu Classico", category: "Desserts", price: 7.50, img: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=400&q=80" },
    { id: 39, name: "Panna Cotta mit Himbeerspiegel", category: "Desserts", price: 6.90, img: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80" },
    { id: 40, name: "Warmes Schoko-Lava-Cake mit Vanilleeis", category: "Desserts", price: 8.50, img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80" },
    { id: 41, name: "Creme Brûlée mit echter Bourbon-Vanille", category: "Desserts", price: 7.90, img: "https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?auto=format&fit=crop&w=400&q=80" },
    { id: 42, name: "New York Cheesecake mit Blaubeersauce", category: "Desserts", price: 7.20, img: "https://images.unsplash.com/photo-1524351199679-46cddf530c04?auto=format&fit=crop&w=400&q=80" },
    // Drinks
    { id: 43, name: "Homemade Lemon-Mint Ice Tea (0,4l)", category: "Drinks", price: 4.90, img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80" },
    { id: 44, name: "Coca-Cola Original Taste (0,33l Glas)", category: "Drinks", price: 0.50, img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80" },
    { id: 45, name: "Coca-Cola Zero Sugar (0,33l Glas)", category: "Drinks", price: 3.80, img: "https://images.unsplash.com/photo-1543257580-7269da773bf5?auto=format&fit=crop&w=400&q=80" },
    { id: 46, name: "Fanta Orange (0,33l Glas)", category: "Drinks", price: 3.80, img: "https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=400&q=80" },
    { id: 47, name: "Sprite Zitronenlimonade (0,33l Glas)", category: "Drinks", price: 3.80, img: "https://images.unsplash.com/photo-1581006852262-e4307cf6283a?auto=format&fit=crop&w=400&q=80" },
    { id: 48, name: "San Pellegrino Mineralwasser (0,75l)", category: "Drinks", price: 6.50, img: "https://images.unsplash.com/photo-1608885898957-a599fb18de37?auto=format&fit=crop&w=400&q=80" },
    { id: 49, name: "Acqua Panna Stilles Wasser (0,75l)", category: "Drinks", price: 6.50, img: "https://images.unsplash.com/photo-1552530172-c99b82b4a6db?auto=format&fit=crop&w=400&q=80" },
    { id: 50, name: "Naturtrübe Apfelschorle (0,4l)", category: "Drinks", price: 4.20, img: "https://images.unsplash.com/photo-1568271675068-f76a73a1e290?auto=format&fit=crop&w=400&q=80" },
    { id: 51, name: "Frischer Orangensaft gepresst (0,3l)", category: "Drinks", price: 4.90, img: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=400&q=80" },
    // Cocktails
    { id: 52, name: "Aperol Spritz (Der Klassiker)", category: "Cocktails", price: 7.90, img: "https://images.unsplash.com/photo-1560512823-829485b8bf24?auto=format&fit=crop&w=400&q=80" },
    { id: 53, name: "Hugo (Prosecco, Minze & Holunder)", category: "Cocktails", price: 7.90, img: "https://images.unsplash.com/photo-1546171753-97d7676e4602?auto=format&fit=crop&w=400&q=80" },
    { id: 54, name: "Classic Mojito mit hellem Rum & Minze", category: "Cocktails", price: 9.50, img: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80" },
    { id: 55, name: "Premium Gin Tonic", category: "Cocktails", price: 10.50, img: "https://images.unsplash.com/photo-1547694421-2e46163351d8?auto=format&fit=crop&w=400&q=80" },
    { id: 56, name: "Italienisches Peroni Bier (0,33l)", category: "Cocktails", price: 4.20, img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=400&q=80" },
    { id: 57, name: "Frisch gezapftes Premium Pils (0,4l)", category: "Cocktails", price: 4.50, img: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?auto=format&fit=crop&w=400&q=80" },
    { id: 58, name: "Lugana DOC Weißwein (0,2l Glas)", category: "Cocktails", price: 6.90, img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&q=80" },
    { id: 59, name: "Primitivo Puglia Rotwein (0,2l Glas)", category: "Cocktails", price: 7.20, img: "https://images.unsplash.com/photo-1553184916-520f924632d2?auto=format&fit=crop&w=400&q=80" },
    { id: 60, name: "Prosecco Spumante (0,1l Glas)", category: "Cocktails", price: 4.90, img: "https://images.unsplash.com/photo-1594488687196-135492e74d1a?auto=format&fit=crop&w=400&q=80" }
];

const categories = ["Alle", ...new Set(database.map(item => item.category))];

window.onload = function() {
    try {
        document.getElementById("restaurantName").innerText = RESTAURANT_NAME;
        
        initTableSystem();
        renderCategories();
        renderMenu("Alle");
        
        let savedCart = safeGetItem("cart_v2");
        if(savedCart) {
            cart = JSON.parse(savedCart);
            updateCartUI();
        }
    } catch(err) {
        alert("Fehler im Ladevorgang: " + err.message);
    }
};

// === TISCHSYSTEM (Sicher gegen Mobile-Blockaden) ===
function initTableSystem() {
    let urlParams = new URLSearchParams(window.location.search);
    let urlTable = urlParams.get("table");
    let savedTable = safeGetItem("table_v2");

    if (urlTable) {
        tableNumber = urlTable;
        safeSetItem("table_v2", tableNumber);
    } else if (savedTable) {
        tableNumber = savedTable;
    }

    if (tableNumber) {
        document.getElementById("tableLabel").innerText = "Tisch " + tableNumber;
        hideModalDirect("tableModal");
    } else {
        showModalDirect("tableModal");
    }
}

function openTableModal() {
    document.getElementById("tableInput").value = tableNumber || "";
    showModalDirect("tableModal");
}

function saveTableNumber() {
    let num = document.getElementById("tableInput").value.trim();
    if(!num || num <= 0) {
        showToast("Bitte gültige Tischnummer eingeben! ⚠️");
        return;
    }
    tableNumber = num;
    safeSetItem("table_v2", num);
    document.getElementById("tableLabel").innerText = "Tisch " + tableNumber;
    hideModalDirect("tableModal");
    showToast(`Tisch ${tableNumber} gespeichert! 👍`);
}

// === VISUELLE STEUERUNG (Kompatibel mit alten CSS-Dateien) ===
function showModalDirect(id) {
    let el = document.getElementById(id);
    if(el) {
        el.style.display = "flex";
        el.classList.add("active");
    }
}

function hideModalDirect(id) {
    let el = document.getElementById(id);
    if(el) {
        el.style.display = "none";
        el.classList.remove("active");
    }
}

function togglePopup(id) {
    document.querySelectorAll(".action-popup").forEach(p => {
        if(p.id !== id) {
            p.style.display = "none";
            p.classList.remove("active");
        }
    });
    
    let el = document.getElementById(id);
    if(el) {
        if(el.style.display === "none" || !el.classList.contains("active")) {
            el.style.display = "flex";
            el.classList.add("active");
        } else {
            el.style.display = "none";
            el.classList.remove("active");
        }
    }
}

function toggleCart() {
    let overlay = document.getElementById("cartOverlay");
    let backdrop = document.getElementById("cartBackdrop");
    
    if(overlay && backdrop) {
        if(overlay.style.display === "none") {
            overlay.style.display = "block";
            backdrop.style.display = "block";
            overlay.classList.add("active");
            backdrop.classList.add("active");
        } else {
            overlay.style.display = "none";
            backdrop.style.display = "none";
            overlay.classList.remove("active");
            backdrop.classList.remove("active");
        }
    }
}

// === MENÜ & KATEGORIEN ===
function renderCategories() {
    const nav = document.getElementById("categoryNav");
    if(!nav) return;
    nav.innerHTML = categories.map(cat => `
        <button class="cat-btn ${cat === currentCategory ? 'active' : ''}" onclick="filterCategory('${cat}')">
            ${cat}
        </button>
    `).join("");
}

function renderMenu(cat) {
    const grid = document.getElementById("menuGrid");
    if(!grid) return;
    grid.innerHTML = "";

    const items = cat === "Alle" ? database : database.filter(i => i.category === cat);

    items.forEach((item, index) => {
        let delay = index * 0.02; 
        let rawBigPrice = item.price * 1.35;
        let bigPrice = (Math.round(rawBigPrice * 10) / 10).toFixed(2); 

        grid.innerHTML += `
            <div class="card" style="animation-delay: ${delay}s">
                <div class="img-container">
                    <img src="${item.img}" class="food-img" loading="lazy" alt="${item.name}" onerror="this.src='${FALLBACK_IMAGE}';">
                </div>
                <div class="card-details">
                    <h3>${item.name}</h3>
                    <div class="card-selectors">
                        <select id="size_${item.id}">
                            <option value="${item.price.toFixed(2)}">Standard (${item.price.toFixed(2)} €)</option>
                            <option value="${bigPrice}">Groß (${bigPrice} €)</option>
                        </select>
                        <input type="text" id="note_${item.id}" placeholder="Notiz...">
                    </div>
                    <div class="card-meta">
                        <span class="price">${item.price.toFixed(2)} €</span>
                        <button class="btn-add" onclick="addToCart(${item.id})">
                            <i class="fa-solid fa-plus"></i> Hinzufügen
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterCategory(cat) {
    currentCategory = cat;
    renderCategories();
    renderMenu(cat);
}

// === WARENKORB LOGIK ===
function addToCart(id) {
    if(!tableNumber) { openTableModal(); return; }

    const item = database.find(i => i.id === id);
    const sizeEl = document.getElementById(`size_${id}`);
    const noteEl = document.getElementById(`note_${id}`);
    
    const computedPrice = parseFloat(sizeEl.value); 
    const sizeText = sizeEl.options[sizeEl.selectedIndex].text.split(" ")[0]; 
    const note = noteEl.value.trim();

    let match = cart.find(c => c.id === id && c.size === sizeText && c.note === note);

    if (match) {
        match.qty++;
    } else {
        cart.push({ id, name: item.name, price: computedPrice, size: sizeText, note, qty: 1 });
    }

    noteEl.value = "";
    updateCartUI();
    showToast(`${item.name} im Warenkorb! 🛒`);
}

function updateCartUI() {
    const list = document.getElementById("cartList");
    if(!list) return;
    list.innerHTML = "";
    let total = 0, count = 0;

    cart.forEach((item, index) => {
        let subtotal = item.price * item.qty;
        total += subtotal;
        count += item.qty;

        list.innerHTML += `
            <div class="cart-card">
                <div class="cart-meta-info">
                    <h4>${item.name}</h4>
                    <p>${item.size} ${item.note ? `| "${item.note}"` : ''}</p>
                    <span style="font-weight:700; color:#ff4757;">${subtotal.toFixed(2)} €</span>
                </div>
                <div class="cart-qty-actions">
                    <button onclick="adjustQty(${index}, -1)">-</button>
                    <span>${item.qty}</span>
                    <button onclick="adjustQty(${index}, 1)">+</button>
                </div>
            </div>
        `;
    });

    if(!cart.length) {
        list.innerHTML = `<div style="text-align:center; padding:30px; color:#666;">Warenkorb leer.</div>`;
    }

    document.getElementById("cartCount").innerText = count;
    document.getElementById("totalPrice").innerText = total.toFixed(2) + " €";
    safeSetItem("cart_v2", JSON.stringify(cart));
}

function adjustQty(index, offset) {
    cart[index].qty += offset;
    if(cart[index].qty <= 0) cart.splice(index, 1);
    updateCartUI();
}

// === CORE FUNKTIONEN & REALES PAYPAL ===
function showToast(msg) {
    const box = document.getElementById("toastBox");
    if(!box) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerText = msg;
    box.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function sendPayload(payload) {
    if (useDemoMode) {
        console.log("Simulierter Send: ", payload);
        return Promise.resolve(true);
    }
    return db.collection("orders").add(payload);
}

function checkout(paymentStatus = "UNBEZAHLT") {
    if(!cart.length) return;
    let total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    
    let order = {
        tableNumber: tableNumber,
        type: "ORDER",
        items: cart,
        totalPrice: total,
        status: "eingegangen",
        payment: paymentStatus,
        timestamp: useDemoMode ? new Date() : firebase.firestore.FieldValue.serverTimestamp()
    };

    sendPayload(order).then(() => {
        if(paymentStatus === "UNBEZAHLT") {
            showToast("🧑‍🍳 Bestellung gesendet!");
        }
        cart = [];
        updateCartUI();
        toggleCart();
    });
}

function waiterAction(msg) {
    togglePopup('waiterMenu');
    showToast(msg.includes("Rechnung") ? "🧾 Rechnung angefordert!" : "🙋‍♂️ Service gerufen!");
    
    sendPayload({
        tableNumber, type: "SERVICE", message: msg, status: "eingegangen",
        timestamp: useDemoMode ? new Date() : firebase.firestore.FieldValue.serverTimestamp()
    });
}

function startPayPalSystem() {
    let total = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    if(total <= 0) {
        showToast("Warenkorb leer! 🛒");
        togglePopup('payMenu');
        return;
    }

    document.getElementById("paypal-button-container").innerHTML = "";

    if(typeof paypal === 'undefined') {
        showToast("⚠️ PayPal konnte nicht geladen werden. Bitte Barzahlung nutzen.");
        return;
    }

    paypal.Buttons({
        createOrder: function(data, actions) {
            return actions.order.create({
                purchase_units: [{ amount: { value: total.toFixed(2) } }]
            });
        },
        onApprove: function(data, actions) {
            return actions.order.capture().then(function(details) {
                togglePopup('payMenu');
                showToast("✅ Bezahlt! Danke, " + details.payer.name.given_name + ".");
                checkout("ONLINE_BEZAHLT");
            });
        },
        onError: function(err) {
            showToast("❌ Zahlungsfehler.");
            console.error(err);
        }
    }).render('#paypal-button-container');
}

function pay(method) {
    if(method === 'PayPal') {
        showToast("Bitte nutze die gelben/schwarzen Buttons unten! 👇");
        startPayPalSystem();
    } else {
        togglePopup('payMenu');
        showToast("💳 Kellner kommt zu Tisch " + tableNumber + "!");
        
        sendPayload({
            tableNumber, type: "PAYMENT", message: `Zahlung via ${method}`, status: "eingegangen",
            timestamp: useDemoMode ? new Date() : firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}