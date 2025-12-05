// purchase.js

// --- Access to Item Data (پێویستە بۆ وەرگرتنی داتا لە Local Storage) ---
// purchase.js
// ...
const INVENTORY_KEY = "inventory";
const PURCHASE_HISTORY_KEY = "purchaseHistory"; // 🆕 کلیلێکی نوێ بۆ تۆمارکردنی کڕینەکان
// ...

// 🆕 فانکشنەکانی تایبەت بە Purchase History
function getPurchaseHistory() {
    return getFromStorage(PURCHASE_HISTORY_KEY, []);
}

function savePurchaseHistory(history) {
    saveToStorage(PURCHASE_HISTORY_KEY, history);
}

// ...

// وەرگرتنی داتا لە Local Storage (بەکارهێنانی هەمان لۆژیکی item.js)
function getFromStorage(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    try {
        const parsed = JSON.parse(data);
        return parsed || defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// وەرگرتنی هەموو ئایتمەکانی بەردەست لە Local Storage
function getInventory() { 
    return getFromStorage(INVENTORY_KEY, []); 
}

// --- Global DOM References ---
const addButton = document.querySelector('.add-list');
const purchaseButton = document.querySelector('.purchase-add'); // 🆕 دوگمەی کڕین
const mainDiv = document.querySelector('.main-div');
const totalAmountSpan = document.querySelector('.headr-div h1:first-of-type span');
const totalCountSpan = document.querySelector('.headr-div h1:last-of-type span');


// --- Item Data Preparation (ئامادەکردنی داتای ئایتم) ---

let itemInventoryCache = [];

function loadAvailableItems() {
    const inventory = getInventory();
    
    // دروستکردنی لیستێکی سادەتر بۆ بەکارهێنان لە Select
    itemInventoryCache = inventory.map(item => ({
        id: item.id,
        // ناوی ئایتمەکە (مۆدێل + براند + کوالێتی) بۆ نیشاندان
        fullName: `${item.brand} ${item.name} ${item.type} ${item.quality}`, 
        purchasePrice: item.purchasePrice || 0 
    }));
}


// --- DOM Element Creation ---

let rowCount = 0; 

// 1. فانکشنێک بۆ دروستکردنی <select>ی ئایتمەکان
function createItemSelectElement(id) {
    const select = document.createElement('select');
    select.className = 'item-select';
    select.setAttribute('data-row-id', id);
    select.required = true;

    // ئۆپشنێکی دیفۆڵت
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '--- ئایتمێک هەڵبژێرە ---';
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    // زیادکردنی ئایتمەکان بۆ Select (ئەمە دووبارە دەبێتەوە کاتێک Select2 بانگ دەکرێت)
    itemInventoryCache.forEach(item => {
        let option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.fullName;
        option.setAttribute('data-price', item.purchasePrice); 
        select.appendChild(option);
    });

    // گوێگر بۆ نوێکردنەوەی نرخی کڕین کاتێک ئایتمێک هەڵدەبژێردرێت
    select.addEventListener('change', (e) => {
        const selectedOption = e.target.options[e.target.selectedIndex];
        const defaultPrice = selectedOption ? selectedOption.getAttribute('data-price') : 0;
        const row = e.target.closest('.item-row');
        
        if (row && defaultPrice) {
            const priceInput = row.querySelector('.buy-price');
            priceInput.value = parseFloat(defaultPrice).toFixed(2);
        }
        
        calculateRowTotal(row);
        updateOverallTotals();
    });

    return select;
}

// 2. فانکشنێک بۆ زیادکردنی ڕیزێکی نوێ
function addNewRow() {
    rowCount++;
    
    // دروستکردنی <div> نوێی ڕیزەکە
    const newRow = document.createElement('div');
    newRow.className = 'item-row';
    newRow.setAttribute('data-row-id', rowCount);
    
    // --- بەشی هەڵبژاردنی ئایتم (Select Input) ---
    const itemSelect = createItemSelectElement(rowCount);
    
    // --- بەشی نرخی کڕین (Buy Price Input) ---
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.className = 'buy-price';
    priceInput.placeholder = 'نرخی کڕین';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.required = true;
    priceInput.value = '0.00';

    // --- بەشی ژمارە (Quantity Input) ---
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.className = 'quantity';
    quantityInput.placeholder = 'ژمارە';
    quantityInput.min = '1';
    quantityInput.required = true;
    quantityInput.value = '1';

    // --- بەشی کۆی گشتی ڕیزەکە (Total) ---
    const rowTotalSpan = document.createElement('span');
    rowTotalSpan.className = 'row-total-amount';
    rowTotalSpan.textContent = '0.00';
    rowTotalSpan.setAttribute('data-total', '0');
    
    // --- دوگمەی سڕینەوە (Delete Button) ---
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-row-btn';
    deleteBtn.textContent = '❌';
    deleteBtn.type = 'button'; // دڵنیایی بۆ ئەوەی فۆرمەکە سەمیت نەکات
    deleteBtn.addEventListener('click', (e) => {
        e.preventDefault(); // ڕێگری لە سەمیتکردنی فۆرم
        e.target.closest('.item-row').remove();
        updateOverallTotals(); 
    });

    // زیادکردنی توخمەکان بۆ ناو ڕیزەکە
    newRow.appendChild(itemSelect);
    newRow.appendChild(priceInput);
    newRow.appendChild(quantityInput);
    newRow.appendChild(rowTotalSpan);
    newRow.appendChild(deleteBtn);

    // دانانی ڕیزەکە بۆ ناو 'main-div'
    mainDiv.appendChild(newRow);
    
    // دانانی گوێگر بۆ گۆڕانکاری لە نرخ یان ژمارە
    const calculationInputs = [priceInput, quantityInput];
    calculationInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const row = e.target.closest('.item-row');
            calculateRowTotal(row);
            updateOverallTotals();
        });
    });

    // ******* چالاککردنی Select2 بۆ توانای گەڕان *******
    // ئەمە پێویستی بە jQuery هەیە.
    if (typeof $ !== 'undefined' && $.fn.select2) {
        $(itemSelect).select2({
            width: '350px',
            dir: "rtl"
        });
    }

    updateOverallTotals();
}

// 3. لۆژیکی حیسابکردن
function calculateRowTotal(row) {
    const priceInput = row.querySelector('.buy-price');
    const quantityInput = row.querySelector('.quantity');
    const rowTotalSpan = row.querySelector('.row-total-amount');

    const price = parseFloat(priceInput.value) || 0;
    const quantity = parseInt(quantityInput.value) || 0;
    
    const total = price * quantity;
    
    rowTotalSpan.textContent = total.toLocaleString('en-US', { minimumFractionDigits: 2 });
    rowTotalSpan.setAttribute('data-total', total);
}

function updateOverallTotals() {
    let grandTotal = 0;
    let grandQuantity = 0;

    const allRows = mainDiv.querySelectorAll('.item-row');
    
    allRows.forEach(row => {
        const rowTotal = parseFloat(row.querySelector('.row-total-amount').getAttribute('data-total')) || 0;
        const quantity = parseInt(row.querySelector('.quantity').value) || 0;

        grandTotal += rowTotal;
        grandQuantity += quantity;
    });

    totalAmountSpan.textContent = grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 });
    totalCountSpan.textContent = grandQuantity;
}

// --- 4. لۆژیکی مامەڵەکردن لەگەڵ پرۆسەی کڕین (Purchase Logic) ---

// purchase.js

// ... (هەموو فانکشنەکانی تر وەک خۆیان دەمێننەوە)

// --- 4. لۆژیکی مامەڵەکردن لەگەڵ پرۆسەی کڕین (Purchase Logic) ---

function handlePurchase(e) {
    e.preventDefault();
    
    const allRows = mainDiv.querySelectorAll('.item-row');
    const purchaseItems = [];
    let isValid = true;
    let grandTotalCost = 0; // 🆕 کۆی نرخی کڕینی وەسڵەکە

    if (allRows.length === 0 || (allRows.length === 1 && !allRows[0].querySelector('.item-select').value)) {
        alert('تکایە لانیکەم یەک ئایتم بە زانیاری تەواو بۆ کڕین زیاد بکە.');
        return;
    }
    
    // وەرگرتنی هەموو ئایتمەکانی ئینڤێنتۆری بۆ وەرگرتنی ناو و وەسف لە تۆمارکردنی وەسڵدا
    const inventory = getInventory(); 

    // 1. پاساندنی داتا و کۆکردنەوەی داتای کڕین
    allRows.forEach((row, index) => {
        const itemSelect = row.querySelector('.item-select');
        const priceInput = row.querySelector('.buy-price');
        const quantityInput = row.querySelector('.quantity');

        const itemId = parseInt(itemSelect.value);
        const purchasePrice = parseFloat(priceInput.value);
        const quantity = parseInt(quantityInput.value);
        const totalCost = purchasePrice * quantity; // نرخی گشتی یەک ڕیز
        
        // ... (لۆژیکی پاساندنی پێشوو) ...
        if (!itemId || isNaN(purchasePrice) || purchasePrice <= 0 || isNaN(quantity) || quantity <= 0) {
            if (!itemSelect.value && !priceInput.value && !quantityInput.value) return; 

            alert(`تکایە هەموو خانەکانی ڕیزی ${index + 1} بە دروستی پڕ بکەرەوە (ئایتم, نرخ و ژمارەی دروست).`);
            isValid = false;
            row.style.border = '2px solid red'; 
            return;
        }

        const itemDetails = inventory.find(item => item.id === itemId);

        purchaseItems.push({
            id: itemId,
            name: itemDetails ? `${itemDetails.name} (${itemDetails.brand} - ${itemDetails.quality})` : 'ئایتم نادیار', // ناو بۆ وەسڵەکە
            purchasePrice: purchasePrice,
            quantity: quantity,
            totalCost: totalCost
        });
        grandTotalCost += totalCost; // کۆکردنەوەی کۆی نرخی کڕینی وەسڵەکە
        row.style.border = 'none';
    });

    if (!isValid || purchaseItems.length === 0) return;

    // --- 2. نوێکردنەوەی ئینڤێنتۆری (هەمان لۆژیکی پێشوو) ---
    let successfulUpdates = 0;

    purchaseItems.forEach(purchase => {
        const itemIndex = inventory.findIndex(item => item.id === purchase.id);

        if (itemIndex !== -1) {
            const existingItem = inventory[itemIndex];

            const oldTotalCost = (existingItem.purchasePrice || 0) * (existingItem.quantity || 0);
            const newTotalCost = oldTotalCost + purchase.totalCost;
            const newTotalQuantity = (existingItem.quantity || 0) + purchase.quantity;
            
            const averagePurchasePrice = newTotalQuantity > 0 
                ? Math.round((newTotalCost / newTotalQuantity) * 100) / 100 
                : purchase.purchasePrice; 

            existingItem.quantity = newTotalQuantity;
            existingItem.purchasePrice = averagePurchasePrice; 
            
            successfulUpdates++;
        }
    });

    // پاشەکەوتکردنی ئینڤێنتۆری نوێکراو
    saveToStorage(INVENTORY_KEY, inventory);
    
    // --- 🆕 3. تۆمارکردنی کڕینەکە وەک وەسڵێک (Purchase Receipt) ---
    if (successfulUpdates > 0) {
        const history = getPurchaseHistory();
        const receiptId = Date.now(); // وەک ID
        
        const newReceipt = {
            id: receiptId,
            date: new Date().toLocaleString('ar-IQ', { // فۆرماتی کوردی بۆ ڕێکەوت
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }), 
            items: purchaseItems.map(item => ({ // تۆمارکردنی داتای ئایتمەکان
                name: item.name,
                price: item.purchasePrice,
                qty: item.quantity,
                total: item.totalCost
            })),
            grandTotal: grandTotalCost
        };
        
        history.unshift(newReceipt); // زیادکردنی بۆ سەرەتای لیستەکە
        savePurchaseHistory(history);
        
        // --- 4. پاککردنەوەی فۆرم و دڵنیایی ---
        alert(`کڕین بە سەرکەوتوویی ئەنجام درا و وەسڵ تۆمار کرا! کۆی نرخ: ${grandTotalCost.toLocaleString()} دینار.`);
        
        mainDiv.innerHTML = ''; 
        loadAvailableItems(); 
        addNewRow(); 
    } else {
         alert('کڕین سەرکەوتوو نەبوو. هیچ ئایتمێک نوێ نەکرایەوە.');
    }
}


// --- Initial Setup ---
addButton.addEventListener('click', addNewRow);
purchaseButton.addEventListener('click', handlePurchase); 

document.addEventListener('DOMContentLoaded', () => {
    loadAvailableItems(); 
    addNewRow(); 
});