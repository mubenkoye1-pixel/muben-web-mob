// --- General LocalStorage Functions (Shared access) ---
// NOTE: These are defined here as a fallback, but rely on item.js and customer.js for data.

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


<p class="storage-location-text">شوێن: 
                <span class="location-name">${item.storageLocation || 'دیاری نەکراوە'}</span>
            </p>


            
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
      
            <div class="details">
            <p class="title">${item.name}</p>
                <span>${item.quantity}</span>
                <span style="font-weight: bold;"> ${itemTotal.toLocaleString()}</span>
                
                <input type="text" 
                       value="${currentSalePrice}" 
                       data-item-id="${item.id}"
                       onblur="manualPriceEdit(this)"
                       class="cart-item-price-input"
                       pattern="[0-9]*" 
                       inputmode="numeric"> 
                       
                <button class="remove-btn" onclick="removeFromCart(${item.id})"><i class="fa-solidfa-trash"></i>X</button>
            </div>
        `;
        cartContainer.appendChild(cartElement);
    });
    
    const finalTotal = subTotalSale - discountAmount;

    subTotalPriceElement.textContent = subTotalSale.toLocaleString();
    finalTotalPriceElement.textContent = finalTotal.toLocaleString();
}


// Function to finalize the sale
// لە script.js: جێگەی فەنکشنی checkout() بگرەوە

// لە script.js: جێگەی فەنکشنی checkout() بگرەوە

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
    
    // دڵنیابوونەوەی کۆتایی
    if (!confirm(`دڵنیایت لە تەواوکردنی فرۆشتن بە کۆی گشتی ${finalPriceText} دینار؟\n${isLoan ? '⚠ ئەمە وەک مامەڵەی قەرز تۆمار دەکرێت.' : ''}`)) {
        return;
    }

    // 1. وەرگرتنی داتای سەرەکی (Sync)
    let items = getFromStorage('inventory');
    let transactions = getTransactions();
    let loans = getLoanTransactions(); 

    const transactionId = Date.now();
    let totalSalePrice = 0;
    let totalProfitForTransaction = 0;
    let totalItemsCount = 0;
    let soldItemsDetails = []; 

    // 2. Update stock and calculate profit for the transaction
    salesCart.forEach(cartItem => {
        // دۆزینەوەی ئایتمەکە لە عەمباردا (بە ID)
        const inventoryItemIndex = items.findIndex(i => i.id === cartItem.id); 
        const itemSalePrice = parseInt(cartItem.salePrice) || 0;
        
        if (inventoryItemIndex !== -1) {
            const inventoryItem = items[inventoryItemIndex];
            
            // کەمکردنەوەی ستۆک
            inventoryItem.quantity -= cartItem.quantity; 

            const unitProfit = (itemSalePrice - cartItem.purchasePrice);
            const itemProfit = unitProfit * cartItem.quantity;

            totalSalePrice += itemSalePrice * cartItem.quantity;
            totalProfitForTransaction += itemProfit;
            totalItemsCount += cartItem.quantity;
            
            // تۆمارکردنی وردەکاریی فرۆشتن
            soldItemsDetails.push({
                id: cartItem.id, 
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

    // 3. Record the complete transaction 
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
    
    // 4. Record as a LOAN if applicable
    if (isLoan) {
        loans.push({
            transactionId: transactionId,
            customer: customerName,
            amountDue: finalSale,
            date: newTransaction.date,
            items: soldItemsDetails 
        });
        saveLoanTransactions(loans); // Save loan list
    }
    
    // 5. Save all changes (Inventory and Transactions)
    saveToStorage('inventory', items); 
    saveTransactions(transactions); 
    
    // 6. Clear the current cart and update displays
    alert("فرۆشتن بە سەرکەوتوویی تەواو بوو!");

    salesCart = [];
    document.getElementById('discountInput').value = 0; 
    document.getElementById('isLoanSale').checked = false;
    document.getElementById('customerNameInput').value = '';
    toggleCustomerInput();
    updateCartDisplay();
    displaySalesItems(); 
}



// Initial Load on Page
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the sales page
    if (document.getElementById('salesItemsContainer')) {
        // Assuming other functions like populateSalesFilters() are defined elsewhere or loaded
        if (typeof populateSalesFilters === 'function') {
             populateSalesFilters(); 
        }
        // CRITICAL: Load customers on sales page startup
        if (typeof populateCustomerDropdown === 'function') {
             populateCustomerDropdown(); 
        }
        displaySalesItems();
        updateCartDisplay(); 
    }
});


// ==========================================================
// --- INVOICE GENERATION LOGIC ---
// ==========================================================

// ==========================================================
// --- INVOICE GENERATION LOGIC (Modern Design) ---
// ==========================================================

function generateInvoiceAndPrint() {
    if (salesCart.length === 0) {
        alert('سەبەتەکە بەتاڵە، ناتوانیت وەسڵ دروست بکەیت.');
        return;
    }

    const subTotal = document.getElementById('sub-total-price').textContent;
    const finalTotal = document.getElementById('final-total-price').textContent;
    const discount = document.getElementById('discountInput').value;
    const customerName = document.getElementById('isLoanSale').checked 
    const numcustomer = document.getElementById('customerPhone')
                        ? document.getElementById('customerNameInput').value.trim() 
                        : 'کڕیاری گشتی';

    const transactionId = Math.floor(Math.random() * 100000) + 1;
    const currentDate = new Date().toLocaleDateString('ckb-IQ');
    const currentTime = new Date().toLocaleTimeString('ckb-IQ', { hour: '2-digit', minute: '2-digit' });

    // زانیاری فرۆشگا (دەتوانیت بیگۆڕیت)
    const storeName = "SAIFADEN PHONE";
    const storeAddress = "هەولێر : کەلەک شەقامی 20م";
    const storePhone = "07514002080";
  

    // 1. دروستکردنی خشتەی ئایتمەکان
    let itemsTableHTML = '';
    salesCart.forEach(item => {
        const itemTotal = (parseInt(item.salePrice) || 0) * item.quantity;
        itemsTableHTML += `
            <tr class="item-row">
                <td style="text-align: right; width: 45%;">${item.name} (${item.brand} - ${item.type})</td>
                <td style="text-align: center;">${item.quantity.toLocaleString()}</td>
                <td style="text-align: left;">${(parseInt(item.salePrice) || 0).toLocaleString()} IQD</td>
                <td style="text-align: left; font-weight: bold;">${itemTotal.toLocaleString()} IQD</td>
            </tr>
        `;
    });

    // 2. دروستکردنی تەواوی کۆدی HTMLی وەسڵەکە
    const invoiceHTML = `
        <!DOCTYPE html>
        <html lang="ckb" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>وەسڵی فرۆشتن #${transactionId}</title>
            <style>
                /* فونتی سەرەکی */
                body { 
                    font-family: Tahoma, Arial, sans-serif; 
                    margin: 0; 
                    padding: 0; 
                    background-color: #f7f7f7; /* باکگراوندی سادە */
                }

                /* قاڵبی وەسڵ */
                .invoice-box {
                    max-width: 700px; 
                    margin: 50px auto; 
                    padding: 30px; 
                    border: 1px solid #ddd;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, .1); 
                    font-size: 14px; 
                    line-height: 20px;
                    color: #333; 
                    background: #fff; 
                    direction: rtl;
                }

                /* سەر و ژێرەوەی وەسڵ */
                .header-section {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 3px solid #007bff; /* ڕەنگی شین بۆ جوانی */
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }

                .header-info {
                    text-align: left;
                    font-size: 13px;
                }
                .header-info p { margin: 0; }

                .store-details {
                    text-align: right;
                }
                .store-details h1 {
                    color: #007bff;
                    font-size: 26px;
                    margin-top: 0;
                    margin-bottom: 5px;
                }

                /* زانیاری کڕیار و فرۆشتن */
                .client-info {
                    border: 1px solid #eee;
                    padding: 15px;
                    margin-bottom: 20px;
                    background-color: #fcfcfc;
                }
                .client-info p { margin: 5px 0; }
                .client-info strong { color: #000; }

                /* خشتەی ئایتمەکان */
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: right;
                }
                .items-table th, .items-table td {
                    padding: 10px;
                    border-bottom: 1px solid #eee;
                }
                .items-table th {
                    background-color: #007bff;
                    color: #fff;
                    font-weight: bold;
                    font-size: 15px;
                }
                .item-row:nth-child(even) {
                    background-color: #f9f9f9;
                }

                /* بەشی کۆی گشتی */
                .total-section {
                    width: 100%;
                    margin-top: 20px;
                    border-top: 2px solid #007bff;
                    padding-top: 10px;
                }
                .total-row {
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    margin: 5px 0;
                }
                .total-row strong {
                    width: 250px;
                    text-align: left;
                    padding-left: 10px;
                }
                .total-row span {
                    font-weight: bold;
                    width: 150px;
                    text-align: left;
                }
                .grand-total-row {
                    font-size: 20px;
                    color: #d9534f; /* ڕەنگی سوور بۆ کۆی کۆتایی */
                    border-top: 1px dashed #ccc;
                    padding-top: 10px;
                }

                /* ژێرەوە */
                .footer { 
                    text-align: center; 
                    margin-top: 30px; 
                    font-size: 12px; 
                    color: #777;
                    border-top: 1px solid #eee;
                    padding-top: 10px;
                }

                /* چاودێری چاپکردن (چاپی سپی و ڕەش) */
                @media print {
                    body { 
                        background: #fff; 
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .invoice-box { 
                        box-shadow: none; 
                        border: none; 
                        margin: 0; 
                        padding: 0;
                    }
                    .items-table th {
                        background-color: #007bff !important;
                        color: #fff !important;
                    }
                    .grand-total-row {
                        color: #d9534f !important;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-box">
                
                <div class="header-section">
                    <div class="store-details">
                        <h1>${storeName}</h1>
                        <p>ناونیشان:${storeAddress}</p>
                        <p>تەلەفۆن: ${storePhone}</p>
                    </div>
                    <div class="header-info">
                        <p><strong>وەسڵی ژمارە:</strong> #${transactionId}</p>
                        <p><strong>بەروار:</strong> ${currentDate}</p>
                        <p><strong>کات:</strong> ${currentTime}</p>
                    </div>
                </div>

                <div class="client-info">
                    <p><strong>ناوی کڕیار:</strong> ${customerName}</p>
                   
                    <p><strong>شێوازی فرۆشتن:</strong> ${document.getElementById('isLoanSale').checked ? 'قەرز' : 'نەقد'}</p>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 45%;">ناوی ئایتم</th>
                            <th style="width: 15%; text-align: center;">بڕ</th>
                            <th style="width: 20%; text-align: left;">نرخی تاک</th>
                            <th style="width: 20%; text-align: left;">کۆی گشتی</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsTableHTML}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div class="total-row">
                        <strong>کۆی گشتی (بێ داشکاندن):</strong>
                        <span>${subTotal} IQD</span>
                    </div>
                    <div class="total-row">
                        <strong>داشکاندن:</strong>
                        <span>${parseInt(discount).toLocaleString()} IQD</span>
                    </div>
                    <div class="total-row grand-total-row">
                        <strong> کۆی گشتی:</strong>
                        <span>${finalTotal} IQD</span>
                    </div>
                </div>
                
                <div class="footer">
                    سوپاس بۆ مامەڵەکردنتان! هیوای ڕۆژێکی خۆشتان بۆ دەخوازین.<br>
                    
                </div>

            </div>
        </body>
        </html>
    `;

    // 3. دروستکردنی پەنجەرەی نوێ و چاپکردن
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        
        printWindow.onload = () => {
            printWindow.focus();
            printWindow.print();
        };
    } else {
        alert('ناتوانرێت پەنجەرەی چاپکردن بکرێتەوە. تکایە ڕێگە بە "پۆپ ئەپەکان" بدە.');
    }
}