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
    localStorage.setItem('loanTransactions', JSON.stringify(loans));
}

function getCustomers() {
    // This assumes customer.js has loaded and defined this function globally
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

