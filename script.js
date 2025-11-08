// لە سەرەتای فایلی script.js دایبنێ
// 🚨 گرنگ: ناونیشانی خۆت و کلیلی خۆت دابنێ!
const SUPABASE_URL = 'https://iidyoxulomjnbgyjvkou.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpZHlveHVsb21qbmJneWp2a291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTk3NTgsImV4cCI6MjA3ODAzNTc1OH0.Y6Owu8_eDS8gvixh8Cx3mg4OWgyp1EZz--NgNy-V2RM';

let supabaseClient = null; // گۆڕاوی سەرەکیی Supabase Client


// --- General LocalStorage Functions (Shared access) ---
function getFromStorage(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getTransactions() {
    const transactions = localStorage.getItem('salesTransactions');
    return transactions ? JSON.parse(transactions) : [];
}

function saveTransactions(transactions) {
    localStorage.setItem('salesTransactions', JSON.stringify(transactions));
}

function getLoanTransactions() {
    const loans = localStorage.getItem('loanTransactions');
    return loans ? JSON.parse(loans) : [];
}

function saveLoanTransactions(loans) {
    localStorage.setItem(key, JSON.stringify(loans));
}

function getCustomers() {
    const customers = localStorage.getItem('customerData');
    return customers ? JSON.parse(customers) : [];
}


// ==========================================================
// --- SALES PAGE LOGIC (sales.html) ---
// ==========================================================

let salesCart = []; 

// Function to populate Type and Brand filters on sales page
function populateSalesFilters() {
    const brands = getFromStorage('brands', []);
    const types = getFromStorage('types', []);
    
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

// Function to populate the customer list datalist (Auto-Complete)
function populateCustomerDropdown() {
    const customerInput = document.getElementById('customerNameInput');
    const datalist = document.getElementById('customerDatalist');
    
    if (!customerInput || !datalist) return;
    
    const customers = getCustomers();

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
            populateCustomerDropdown(); // Load customers when toggled
        } else {
            customerInput.style.display = 'none';
            customerInput.value = '';
        }
    }
}

// Function to display items on the sales page (Search and Filter Logic)
function displaySalesItems() {
    const itemsContainer = document.getElementById('salesItemsContainer'); 
    if (!itemsContainer) return; 

    const items = getFromStorage('inventory', []);
    
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

// Function to add an item to the cart
function addToCart(itemId) {
    const items = getFromStorage('inventory');
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
function removeFromCart(itemId) {
    const index = salesCart.findIndex(item => item.id === itemId);
    if (index !== -1) {
        if (salesCart[index].quantity > 1) {
            salesCart[index].quantity -= 1;
        } else {
            salesCart.splice(index, 1);
        }
    }
    updateCartDisplay();
}


// Function to handle manual price changes (Ensures only numbers are used)
function manualPriceEdit(inputElement) {
    inputElement.value = inputElement.value.replace(/[^0-9]/g, '');

    const itemId = parseInt(inputElement.getAttribute('data-item-id'));
    const newPrice = parseInt(inputElement.value) || 0; 

    const cartItem = salesCart.find(i => i.id === itemId);

    if (cartItem && newPrice >= 0) {
        cartItem.salePrice = newPrice;
        updateCartDisplay();
    }
}


// Function to update the cart display and total price (Handles Price Edit and Discount)
function updateCartDisplay() {
    const cartContainer = document.getElementById('cartItems');
    const subTotalPriceElement = document.getElementById('sub-total-price');
    const finalTotalPriceElement = document.getElementById('final-total-price');
    const discountInput = document.getElementById('discountInput');

    if (!cartContainer || !subTotalPriceElement || !finalTotalPriceElement || !discountInput) return;

    let subTotalSale = 0;
    const discountAmount = parseInt(discountInput.value) || 0;
    
    if (discountAmount < 0) {
        discountInput.value = 0;
        return updateCartDisplay();
    }

    cartContainer.innerHTML = '';

    if (salesCart.length === 0) {
        subTotalPriceElement.textContent = '0';
        finalTotalPriceElement.textContent = '0';
        return;
    }

    salesCart.forEach(item => {
        const currentSalePrice = parseInt(item.salePrice) || 0; 
        const itemTotal = currentSalePrice * item.quantity;
        subTotalSale += itemTotal;

        const cartElement = document.createElement('div');
        cartElement.className = 'cart-item'; 
        cartElement.style.borderRight = `5px solid ${item.color || '#ccc'}`;
        
        cartElement.innerHTML = `
            <p class="title">${item.name}</p>
            <div class="details">
                <span>x${item.quantity}</span>
                <span style="font-weight: bold;">= ${itemTotal.toLocaleString()}</span>
                
                <input type="text" 
                        value="${currentSalePrice}" 
                        data-item-id="${item.id}"
                        onblur="manualPriceEdit(this)"
                        class="cart-item-price-input"
                        pattern="[0-9]*" 
                        inputmode="numeric"> 
                         
                <button class="remove-btn" onclick="removeFromCart(${item.id})">لابردن</button>
            </div>
        `;
        cartContainer.appendChild(cartElement);
    });
    
    const finalTotal = subTotalSale - discountAmount;

    subTotalPriceElement.textContent = subTotalSale.toLocaleString();
    finalTotalPriceElement.textContent = finalTotal.toLocaleString();
}


// Function to finalize the sale
function checkout() {
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

    let items = getFromStorage('inventory');
    const transactionId = Date.now();
    let totalSalePrice = 0;
    let totalProfitForTransaction = 0;
    let totalItemsCount = 0;
    let soldItemsDetails = []; 

    // 1. Update stock and calculate profit for the transaction
    salesCart.forEach(cartItem => {
        const inventoryItem = items.find(i => i.id === cartItem.id); 
        const itemSalePrice = parseInt(cartItem.salePrice) || 0; 
        
        if (inventoryItem) {
            inventoryItem.quantity -= cartItem.quantity; 

            const unitProfit = (itemSalePrice - cartItem.purchasePrice);
            const itemProfit = unitProfit * cartItem.quantity;

            totalSalePrice += itemSalePrice * cartItem.quantity;
            totalProfitForTransaction += itemProfit;
            totalItemsCount += cartItem.quantity;
            
            soldItemsDetails.push({
                id: cartItem.id, // CRUCIAL: Pass the inventory ID for data.js
                name: cartItem.name,
                type: cartItem.type,
                brand: cartItem.brand,
                quality: cartItem.quality,
                quantity: cartItem.quantity,
                salePrice: itemSalePrice, 
                purchasePrice: cartItem.purchasePrice,
                profit: itemProfit
            });
        }
    });

    const subTotalSale = totalSalePrice;
    const finalSale = subTotalSale - discountAmount;
    const finalProfit = totalProfitForTransaction - discountAmount;

    // 2. Save the updated inventory
    saveToStorage('inventory', items);

    // 3. Record the complete transaction (with discount and loan details)
    const transactions = getTransactions();
    const newTransaction = {
        id: transactionId,
        date: new Date().toLocaleString('ckb-IQ', { timeZone: 'Asia/Baghdad' }), 
        isLoan: isLoan, 
        customerName: isLoan ? customerName : null, 
        subTotalSale: subTotalSale,
        totalSale: finalSale, 
        discount: discountAmount,
        totalProfit: finalProfit, 
        totalItemsCount: totalItemsCount,
        items: soldItemsDetails 
    };
    transactions.push(newTransaction);
    saveTransactions(transactions); 
    
    // 4. Record as a LOAN if applicable
    if (isLoan) {
        const loans = getLoanTransactions();
        loans.push({
            transactionId: transactionId,
            customer: customerName,
            amountDue: finalSale,
            date: newTransaction.date,
            items: soldItemsDetails 
        });
        saveLoanTransactions(loans);
    }
    
    // 5. Clear the current cart and update displays
    alert("فرۆشتن بە سەرکەوتوویی تەواو بوو!");

    salesCart = [];
    document.getElementById('discountInput').value = 0; 
    document.getElementById('isLoanSale').checked = false;
    document.getElementById('customerNameInput').value = '';
    toggleCustomerInput();
    updateCartDisplay();
    displaySalesItems(); 
}


// ==========================================================
// --- Supabase Authentication Logic ---
// ==========================================================

// Function بۆ کردنەوەی پەنجەرەی لۆگین/تۆمارکردن
async function handleLogin() {
    if (!supabaseClient) return; // دڵنیابوون لە چالاکبوونی کڵایێنت
    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google', // یان 'email'
        options: {
            redirectTo: window.location.origin, 
        },
    });
    if (error) console.error("Login Error:", error.message);
}

// Function بۆ چوونە دەرەوە
// Function بۆ کردنەوەی پەنجەرەی لۆگین/تۆمارکردن (بۆ لۆگینی ئیمەیڵ)
async function handleLogin() {
    if (!supabaseClient) return;

    // داواکردنی ئیمەیڵی یوزەر بۆ ناردنی لینکی لۆگین
    const email = prompt("تکایە ئیمەیڵی خۆت بنووسە بۆ لۆگین/تۆمارکردن:");
    if (!email) return;

    // بەکارهێنانی signInWithOtp (Magic Link)
    const { data, error } = await supabaseClient.auth.signInWithOtp({
        email: email,
        options: {
            emailRedirectTo: window.location.origin, // دوای کلیککردن لەسەر لینکەکە بگەڕێتەوە بۆ ماڵپەڕی ئێستا
        },
    });
    
    if (error) {
        console.error("Login Error:", error.message);
        alert(`هەڵە: ${error.message}`);
    } else {
        alert("✅ نامەیەکی لۆگین نێردرا بۆ ئیمەیڵەکەت. تکایە بۆ تەواوکردنی پرۆسەی لۆگین، کرتە لەسەر لینکەکە بکە.");
    }
}

// Function بۆ پشکنینی باری لۆگین و نیشاندانی دوگمە
async function checkUserStatus() {
    if (!supabaseClient) return; // دڵنیابوون لە چالاکبوونی کڵایێنت

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const loginButton = document.getElementById('login-button');
    
    if (loginButton) {
        if (user) {
            // یوزەر لۆگینی کردووە
            loginButton.textContent = `چوونە دەرەوە (${user.email})`;
            loginButton.onclick = handleLogout;
        } else {
            // یوزەر لۆگینی نەکردووە
            loginButton.textContent = 'چوونە ژوورەوە / تۆمارکردن';
            loginButton.onclick = handleLogin;
        }
    }
}


// Function بۆ گواستنەوەی داتای LocalStorage بۆ Supabase
// لەناو فایلی script.js، فەنکشنی migrateLocalStorageData() بەمە بگۆڕە:

async function migrateLocalStorageData() {
    if (!supabaseClient) {
        alert("سیستەمی گواستنەوە چالاک نییە. تکایە لۆگین بکە.");
        return;
    }
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        alert("تکایە سەرەتا لۆگین بکە بۆ گواستنەوەی داتا.");
        return;
    }
    
    if (!confirm("⚠ دڵنیایت کە دەتەوێت داتای کۆنی LocalStorage بگوازیتەوە بۆ سێرڤەری Supabase؟ ئەم کارە تەنها یەک جار دەکرێت.")) {
        return;
    }

    const inventoryData = getFromStorage('inventory');
    const loanData = getLoanTransactions();
    const owner_id = user.id; // IDـی پارێزراو

    let loansInserted = 0;
    let itemsInserted = 0; 
    
    try {
        // =======================================================
        // A. گواستنەوەی داتای ئایتمەکان (INVENTORY)
        // =======================================================
        if (inventoryData && inventoryData.length > 0) {
            
            for (const item of inventoryData) {
                const { error } = await supabaseClient // ✅ گۆڕدرا بۆ supabaseClient
                    .from('inventory') // 🚨 ناوی خشتەی گۆڕدراوە بۆ 'inventory' (پیتی بچووک)
                    .insert({
                        owner_id: owner_id, 
                        item_name: item.name, 
                        quantity: item.quantity,
                        sale_price: item.salePrice,
                        purchase_price: item.purchasePrice, // دڵنیا ببەوە لەوەی ئەم ستوونە هەیە
                        brand: item.brand,
                        type: item.type,
                        color: item.color,
                        original_id: item.id 
                    });

                if (!error) {
                    itemsInserted++;
                } else {
                    console.error("هەڵە لە ئایتمدا:", error.message);
                    // ئەگەر هەڵە هەبوو، گواستنەوە ڕادەگرین بۆ پشکنین
                    throw new Error(`هەڵە لە تۆمارکردنی ئایتمەکان: ${error.message}`);
                }
            }
        }
        
        // =======================================================
        // B. گواستنەوەی داتای قەرزەکان (LOANS)
        // =======================================================
        if (loanData && loanData.length > 0) {
            for (const loan of loanData) {
                const { error } = await supabaseClient // ✅ گۆڕدرا بۆ supabaseClient
                    .from('loans') // 🚨 ناوی خشتەی گۆڕدراوە بۆ 'loans' (پیتی بچووک)
                    .insert({
                        owner_id: owner_id, 
                        customer_name: loan.customerName || loan.customer, 
                        amount_due: loan.totalSale || loan.amountDue,
                        date: loan.date,
                        items_details: loan.items || loan.items_details, 
                    });

                if (!error) {
                    loansInserted++;
                } else {
                     console.error("هەڵە لە قەرزدا:", error.message);
                     throw new Error(`هەڵە لە تۆمارکردنی قەرزەکان: ${error.message}`);
                }
            }
        }

        alert(`✅ گواستنەوە سەرکەوتوو بوو. ${itemsInserted} ئایتم و ${loansInserted} قەرز گوازرایەوە.`);

        // دوای سەرکەوتن، دەتوانیت داتای LocalStorage بسڕیتەوە بۆ دڵنیایی
        // localStorage.clear();
        
    } catch (error) {
        alert(`❌ هەڵە لە گواستنەوەدا. تکایە سەیری کۆنسۆڵ بکە بۆ زانیاری وردتر.`);
        console.error("Migration Failed:", error);
    }
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
    // ئەمە هەڵەی 'Cannot access... before initialization' چارەسەر دەکات
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