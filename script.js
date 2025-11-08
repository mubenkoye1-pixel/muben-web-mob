// لە سەرەتای فایلی script.js دایبنێ
// 🚨 گرنگ: ناونیشانی خۆت و کلیلی خۆت دابنێ!
const SUPABASE_URL = 'https://iidyoxulomjnbgyjvkou.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZHlveHVsb21qbmJneWp2a291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTk3NTgsImV4cCI6MjA3ODAzNTc1OH0.Y6Owu8_eDS8gvixh8Cx3mg4OWgyp1EZz--NgNy-V2RM';

let supabaseClient = null; // گۆڕاوی سەرەکیی Supabase Client

// ==========================================================
// --- CENTRAL DATA FETCHING (Supabase Implementation) ---
// ==========================================================

// Function بۆ هێنانی داتا لە Supabase و فلتەرکردنی بەپێی owner_id
async function fetchDataFromSupabase(tableName) {
    if (!supabaseClient) return [];
    
    // وەرگرتنی یوزەری ئێستا
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return []; // ئەگەر لۆگینی نەکردبێت، داتا ناهێنرێت

    try {
        const { data, error } = await supabaseClient
            .from(tableName) 
            .select('*')
            .eq('owner_id', user.id); // 🚨 فلتەرکردنی زۆر گرنگ بۆ جیاکردنەوەی داتا
        
        if (error) {
            console.error(`Error fetching data from ${tableName}:`, error.message);
            return [];
        }
        return data; 
    } catch (e) {
        console.error("Supabase fetch failed:", e.message);
        return [];
    }
}


// --- گۆڕینی فەنکشنەکانی LocalStorage بۆ بەکارهێنانی Supabase ---

// گۆڕینی getFromStorage
async function getFromStorage(key) {
    // 🚨 ئێستا سەرەتا لە Supabase دەهێنێت
    if (key === 'inventory') {
        return await fetchDataFromSupabase('Inventory'); // ⬅️ ناوی ڕاستەقینەی خشتەکەت بە سپەیس
    }
    if (key === 'loanTransactions') {
        return await fetchDataFromSupabase('Loans'); // ⬅️ ناوی خشتەی قەرزەکانت بە سپەیس
    }
    
    // بۆ customerData و brands و types (ئەگەر لە LocalStorage مابن)
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

// --- General LocalStorage Functions (Shared access) ---
function saveToStorage(key, data) {
    // ⚠️ ئەمە دەبێت بگۆڕدرێت بۆ Supabase Insert/Update دواتر
    localStorage.setItem(key, JSON.stringify(data));
}

function getTransactions() { /* ... */ } // هێشتا LocalStorage
function saveTransactions(transactions) { /* ... */ } // هێشتا LocalStorage
function getLoanTransactions() { /* ... */ } // هێشتا LocalStorage
function saveLoanTransactions(loans) { /* ... */ } // هێشتا LocalStorage

// گۆڕینی getCustomers
async function getCustomers() { // 🚨 async
    // لە LocalStorage دەمێنێتەوە تا دەگوازرێتەوە
    const customers = localStorage.getItem('customerData');
    return customers ? JSON.parse(customers) : [];
}


// ==========================================================
// --- SALES PAGE LOGIC (sales.html) ---
// (هەموو فەنکشنەکانی پڕۆژەی خۆت لێرەدایە)
// ==========================================================

let salesCart = []; 

// گۆڕینی populateSalesFilters
async function populateSalesFilters() { // 🚨 async
    const brands = await getFromStorage('brands'); // 🚨 await
    const types = await getFromStorage('types'); // 🚨 await
    
    const filterBrandSelect = document.getElementById('filterBrand');
    const filterTypeSelect = document.getElementById('filterType');

    if (filterBrandSelect && filterTypeSelect) {
        filterBrandSelect.innerHTML = '<option value="all">هەموو براندەکان</option>';
        brands.forEach(b => {
            filterBrandSelect.innerHTML +=` <option value="${b}">${b}</option>;`
        });

        filterTypeSelect.innerHTML = '<option value="all">هەموو جۆرەکان</option>';
        types.forEach(t => {
            filterTypeSelect.innerHTML +=` <option value="${t.name}">${t.name}</option>`;
        });
    }
}

// گۆڕینی populateCustomerDropdown
async function populateCustomerDropdown() { // 🚨 async
    const customerInput = document.getElementById('customerNameInput');
    const datalist = document.getElementById('customerDatalist');
    
    if (!customerInput || !datalist) return;
    
    const customers = await getCustomers(); // 🚨 await

    datalist.innerHTML = '';
    customers.forEach(c => {
        const option = document.createElement('option');
        option.value = c.name;
        datalist.appendChild(option);
    });
}

// Function to toggle the customer name input visibility (Loan Checkbox)
function toggleCustomerInput() {
    const isLoan = document.getElementById('isLoanSale').checked; 
    const customerInput = document.getElementById('customerNameInput');
    
    if (customerInput) {
        if (isLoan) {
            customerInput.style.display = 'block';
            customerInput.focus();
            populateCustomerDropdown(); // ئەمە دەبێت async جێبەجێ بکات
        } else {
            customerInput.style.display = 'none';
            customerInput.value = '';
        }
    }
}

// گۆڕینی displaySalesItems
async function displaySalesItems() { // 🚨 async
    const itemsContainer = document.getElementById('salesItemsContainer'); 
    if (!itemsContainer) return; 

    const items = await getFromStorage('inventory'); // 🚨 await
    
    const selectedBrand = document.getElementById('filterBrand') ? document.getElementById('filterBrand').value : 'all';
    const selectedType = document.getElementById('filterType') ? document.getElementById('filterType').value : 'all';
    
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : ''; 


    itemsContainer.innerHTML = ''; 

    const filteredItems = items.filter(item => {
        const matchesFilters = (selectedBrand === 'all' || item.brand === selectedBrand) &&
                               (selectedType === 'all' || item.type === selectedType);

        const itemText = [item.name, item.brand, item.type, item.quality].join(' ').toLowerCase();
        
        const matchesSearch = searchTerm === '' || itemText.includes(searchTerm);
        
        return matchesFilters && matchesSearch;
    });

    if (filteredItems.length === 0) {
        itemsContainer.innerHTML = '<p style="text-align: center; color: #555;">هیچ ئایتمێک بەو فلتەرە بەردەست نییە.</p>';
        return;
    }

    filteredItems.forEach(item => {
        const outOfStockClass = item.quantity <= 0 ? 'out-of-stock' : '';
        
        const card = document.createElement('div');
        card.className = `sales-item-card ${outOfStockClass}`; 
        
        card.style.backgroundColor = item.color || '#ccc'; 
        
        card.onclick = () => {
            if (item.quantity > 0) {
                addToCart(item.id);
            } else {
                alert('ببوورە، ئەم ئایتمە تەواو بووە.');
            }
        };

        const salePrice = item.salePrice || 0;
        const quantity = item.quantity || 0;
        
        let stockStatusClass = 'stock-high';
        if (quantity === 0) {
            stockStatusClass = 'stock-empty';
        } else if (quantity <= 5) {
            stockStatusClass = 'stock-low';
        }

        card.innerHTML = `
            <span class="stock-count" style="background-color: ${quantity <= 5 ? (quantity === 0 ? '#dc3545' : '#ffc107') : 'rgba(0,0,0,0.4)'}">
                ${quantity}
            </span>
            
            <p class="item-model-name">${item.name || ' '}</p>
            
            <div class="main-info-group">
                <p class="detail-line">براند: <span class="brand-name">${item.brand}</span> | جۆر: <span class="type-name">${item.type}</span></p>
                <p class="detail-line">کوالێتی: <span class="quality-name">${item.quality}</span></p>
            </div>
            
            <div class="price-box">
                <p class="price-value">${salePrice.toLocaleString()}</p>
                <p class="currency">دینار</p>
            </div>
        `;
        itemsContainer.appendChild(card);
    });
}

// گۆڕینی addToCart
async function addToCart(itemId) { // 🚨 async
    const items = await getFromStorage('inventory'); // 🚨 await
    const itemToAdd = items.find(item => item.id === itemId);

    if (!itemToAdd || itemToAdd.quantity <= 0) {
        return;
    }
    
    if (typeof salesCart === 'undefined') {
           salesCart = [];
    }

    const cartItem = salesCart.find(i => i.id === itemId);

    if (cartItem) {
        if (cartItem.quantity < itemToAdd.quantity) {
            cartItem.quantity += 1;
        } else {
            alert('ناتوانیت زیاتر لە بڕی بەردەست زیاد بکەیت.');
            return;
        }
    } else {
        salesCart.push({
            id: itemToAdd.id, // INVENTORY ID (Crucial for data.js edit/delete)
            name: itemToAdd.name,
            salePrice: itemToAdd.salePrice, // Start with default sale price
            purchasePrice: itemToAdd.purchasePrice, 
            color: itemToAdd.color,
            brand: itemToAdd.brand, 
            type: itemToAdd.type,   
            quality: itemToAdd.quality, 
            quantity: 1
        });
    }

    updateCartDisplay();
}

// Function to remove item from cart
function removeFromCart(itemId) { /* ... */ }
// Function to handle manual price changes (Ensures only numbers are used)
function manualPriceEdit(inputElement) { /* ... */ }
// Function to update the cart display and total price (Handles Price Edit and Discount)
function updateCartDisplay() { /* ... */ }

// گۆڕینی checkout
async function checkout() { // 🚨 async
    if (salesCart.length === 0) {
        alert('سەبەتەکە بەتاڵە، ناتوانیت فرۆشتن تەواو بکەیت.');
        return;
    }

    const isLoan = document.getElementById('isLoanSale').checked;
    const customerName = document.getElementById('customerNameInput').value.trim();
    
    if (isLoan && customerName === '') {
        alert('تکایە ناوی کریار بنووسە بۆ فرۆشتنی قەرز.');
        document.getElementById('customerNameInput').focus();
        return;
    }

    const discountAmount = parseInt(document.getElementById('discountInput').value) || 0;
    const finalPriceText = document.getElementById('final-total-price').textContent;
    
    if (!confirm(`دڵنیایت لە تەواوکردنی فرۆشتن بە کۆی گشتی ${finalPriceText} دینار؟\n${isLoan ? '⚠ ئەمە وەک مامەڵەی قەرز تۆمار دەکرێت.' : ''}`)) {
        return;
    }

    let items = await getFromStorage('inventory'); // 🚨 await
    const transactionId = Date.now();
    // ... لۆجیکی تەواوی ئەم فەنکشنە لێرە جێبەجێ دەبێت
    
    // 🚨 ئەمە دەبێت بگۆڕدرێت بۆ Supabase Insert
    saveToStorage('inventory', items);
    
    // 🚨 ئەمە دەبێت بگۆڕدرێت بۆ Supabase Insert
    saveTransactions(transactions); 
    
    // 🚨 ئەمە دەبێت بگۆڕدرێت بۆ Supabase Insert
    saveLoanTransactions(loans);
    
    // ... 
    alert("فرۆشتن بە سەرکەوتوویی تەواو بوو!");
}


// ==========================================================
// --- Supabase Authentication Logic ---
// ==========================================================

// Function بۆ کردنەوەی پەنجەرەی لۆگین/تۆمارکردن
async function handleLogin() {
    if (!supabaseClient) return; 

    const email = prompt("تکایە ئیمەیڵی خۆت بنووسە بۆ لۆگین/تۆمارکردن:");
    if (!email) return;

    const { data, error } = await supabaseClient.auth.signInWithOtp({
        email: email,
        options: {
            emailRedirectTo: window.location.origin, 
        },
    });
    
    if (error) {
        console.error("Login Error:", error.message);
        alert(`هەڵە: ${error.message}`);
    } else {
        alert("✅ نامەیەکی لۆگین نێردرا بۆ ئیمەیڵەکەت. تکایە بۆ تەواوکردنی پرۆسەی لۆگین، کرتە لەسەر لینکەکە بکە.");
    }
}

// Function بۆ چوونە دەرەوە
async function handleLogout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    window.location.reload(); 
}

// Function بۆ پشکنینی باری لۆگین و نیشاندانی دوگمە
async function checkUserStatus() {
    if (!supabaseClient) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const loginButton = document.getElementById('login-button');
    
    if (loginButton) {
        if (user) {
            loginButton.textContent = `چوونە دەرەوە (${user.email})`;
            loginButton.onclick = handleLogout;
        } else {
            loginButton.textContent = 'چوونە ژوورەوە / تۆمارکردن';
            loginButton.onclick = handleLogin;
        }
    }
}


// Function بۆ گواستنەوەی داتای LocalStorage بۆ Supabase
async function migrateLocalStorageData() {
    // ... لۆجیکی گواستنەوەی تەواو لێرەدایە ...
}


// Initial Load on Page AND Supabase Client Initialization
document.addEventListener('DOMContentLoaded', () => {
    // 1. لۆجیکی باری سەرەتایی پڕۆژەی خۆت (Sales)
    if (document.getElementById('salesItemsContainer')) {
        populateSalesFilters(); 
        populateCustomerDropdown(); 
        displaySalesItems();
        updateCartDisplay(); 
    }
    
    // 2. ✅ دروستکردنی Supabase Client و چالاککردنی
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // 3. چالاککردنی لۆگین دوای دروستکردنی Client
        if (supabaseClient) {
            checkUserStatus(); 
        }
    } else {
        console.error("Fatal Error: Supabase library (CDN) is missing or not ready.");
    }
});