// reports.js

// --- General LocalStorage Functions (Shared access) ---
function getFromStorage(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    try {
        const parsed = JSON.parse(data);
        // دڵنیابوونەوە لەوەی کە داتاکە نەڵڵ (null) نییە
        return parsed || defaultValue; 
    } catch (e) {
        return defaultValue;
    }
}

function getSales() { return getFromStorage('salesTransactions', []); } 
function getExpenses() { return getFromStorage('expensesData', []); } 
function getLoanTransactions() { return getFromStorage('loanTransactions', []); } 
function getPurchaseHistory() { return getFromStorage('purchaseHistory', []); } 
function getInventory() { return getFromStorage('inventory', []); } 


// -----------------------------------------------------------------------
// --- لۆجیکی بەروار (بۆ فۆرماتی DD/MM/YYYY, HH:MM:SS) ---
// -----------------------------------------------------------------------

/**
 * گۆڕینی stringـی بەروار بۆ Timestamp
 */
function parseCustomDate(dateString) {
    if (!dateString) return null;

    // وادادەنرێت کە فۆرماتی بەروارەکە "DD/MM/YYYY, HH:MM:SS" یان "DD/MM/YYYY" بێت
    const datetimeParts = dateString.split(', ');
    
    // ئەگەر بەشی کاتی نەبوو، کاتی سەرەکی بۆ دادەنێین (00:00:00)
    if (datetimeParts.length < 2) {
         datetimeParts.push('00:00:00');
    }
    
    const dateParts = datetimeParts[0].split('/'); 
    const timeParts = datetimeParts[1].split(':'); 

    if (dateParts.length !== 3 || timeParts.length < 2) {
        return null; 
    }
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; 
    const year = parseInt(dateParts[2], 10);
    const hour = parseInt(timeParts[0] || 0, 10);
    const minute = parseInt(timeParts[1] || 0, 10);
    const second = parseInt(timeParts[2] || 0, 10); // دەبێت بۆ second پشکنین بکەین

    const dateObject = new Date(year, month, day, hour, minute, second);

    if (isNaN(dateObject.getTime())) {
        return null;
    }
    return dateObject.getTime();
}

/**
 * گۆڕینی بەرواری ئینپووت بۆ Timestampـی سەرەتا یان کۆتایی
 */
function getTimestamp(dateString, isEnd = false) {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isEnd) {
        date.setHours(23, 59, 59, 999); 
    } else {
        date.setHours(0, 0, 0, 0); 
    }
    return date.getTime(); 
}

// فلتەرکردنی داتا بەپێی مەودای بەروار
function filterByDate(dataArray, startTime, endTime, dateKey = 'date') {
    return dataArray.filter(item => {
        let itemTimestamp;

        // ئەگەر کلیلەکە 'id' بوو وەک لە salesTransactions، IDەکە بەکار دەهێنین
        if (dateKey === 'id' && item.id) {
            itemTimestamp = item.id;
        } 
        else if (item[dateKey] && item[dateKey] !== null) {
            itemTimestamp = parseCustomDate(item[dateKey]);
            
            if (!itemTimestamp) {
                return false; 
            }
        } else {
            // ئەگەر کێڵدی بەروارەکەی نەبوو، وا دادەنرێت لە مەوداکەدا بێت
            return true; 
        }
        
        const isAfterStart = !startTime || itemTimestamp >= startTime;
        const isBeforeEnd = !endTime || itemTimestamp <= endTime; 
        return isAfterStart && isBeforeEnd;
    });
}


// -----------------------------------------------------------------------
// --- فەنکشنی سەرەکی: بارکردن و ژماردنی داتا ---
// -----------------------------------------------------------------------

function loadReportData() { 
    // 1. وەرگرتنی فلتەرەکان
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    const startTime = getTimestamp(startDateInput.value, false);
    const endTime = getTimestamp(endDateInput.value, true);

    // Validate dates
    if (startDateInput.value && endDateInput.value && startTime > endTime) {
        alert("⚠️ بەرواری دەستپێکردن ناتوانێت لە بەرواری کۆتایی درەنگتر بێت.");
        return;
    }
    
    // 2. وەرگرتنی داتا
    const sales = getSales();
    const expenses = getExpenses();
    const purchases = getPurchaseHistory(); 
    const loans = getLoanTransactions();     
    const inventory = getInventory(); 

    
    // 3. فلتەرکردنی داتا
    // salesTransactions بە ID فلتەر دەکرێت
    const filteredSales = filterByDate(sales, startTime, endTime, 'id'); 
    const filteredExpenses = filterByDate(expenses, startTime, endTime, 'date');
    const filteredPurchases = filterByDate(purchases, startTime, endTime, 'date'); 
    const filteredLoans = filterByDate(loans, startTime, endTime, 'date'); 

    
    // 4. ژماردنی KPIs
    let totalSales = 0;
    let totalGrossProfit = 0;
    let totalExpensesAmount = 0; 
    let totalPurchaseAmount = 0; 
    let totalDebt = 0;           
    let totalSoldItemsCount = 0;
    let inventoryPurchaseValue = 0;
    let totalAvailableItemsCount = 0; 

    
    // ئەم ئۆبجێکتە ناوی ئایتمە فرۆشراوەکان و کۆی ژمارەکانیان ڕادەگرێت.
    const soldItemsSummary = {}; 
    
    // فرۆش و قازانج
    filteredSales.forEach(t => {
        totalSales += t.totalSale || 0;
        totalGrossProfit += t.totalProfit || 0;
        
        if (Array.isArray(t.items)) {
             t.items.forEach(item => {
                const quantity = item.quantity || 0;
                totalSoldItemsCount += quantity; 
                
                // 💡 چاکسازی: دروستکردنی ناوی تەواو (داواکاری بەکارهێنەر)
                const itemName = item.name || 'ناوی نادیار';
                const itemBrand = item.brand || 'نادیار';
                const itemType = item.type || 'نادیار';
                const itemQuality = item.quality || 'نادیار';
                
                // دروستکردنی ناوی تەواو بۆ کلیل
                const fullItemName = `${itemName} (براند: ${itemBrand}, جۆر: ${itemType}, کوالێتی: ${itemQuality})`.trim();
                
                if (soldItemsSummary[fullItemName]) {
                    soldItemsSummary[fullItemName] += quantity;
                } else {
                    soldItemsSummary[fullItemName] = quantity;
                }
            });
        }
    });

    // ژماردنی بەهای ئینڤێنتۆری و کۆی ژمارەی بەردەست
    inventory.forEach(item => {
        const price = parseFloat(item.purchasePrice) || 0;
        const quantity = parseInt(item.quantity) || 0;
        
        inventoryPurchaseValue += price * quantity; 
        totalAvailableItemsCount += quantity;
    });

    
    // خەرجی
    filteredExpenses.forEach(e => {
        totalExpensesAmount += e.amount || 0;
    });

    // کڕین
    filteredPurchases.forEach(p => {
        const purchaseTotal = parseFloat(p.grandTotal) || 0;
        totalPurchaseAmount += purchaseTotal; 
    });

    // قەرز
    filteredLoans.forEach(d => {
         totalDebt += d.amountDue || 0; 
    });
    
    // ⭐️ گۆڕانکاریی سەرەکی (داواکاری بەکارهێنەر): قازانجی خاوێن ئێستا یەکسانە بە قازانجی گشتی
    // چونکە کۆی خەرجی لێ کەم ناکرێتەوە.
    const totalNetProfit = totalGrossProfit; 
    
    // کۆی داهات وەک بەهای گشتیی ئینڤێنتۆری دانراوە
    const totalIncome = inventoryPurchaseValue; 

    
    // 5. نوێکردنەوەی UI Metrics
    
    document.getElementById('total-sales').textContent = totalSales.toLocaleString() + ' IQD';
    document.getElementById('total-expenses').textContent = totalExpensesAmount.toLocaleString() + ' IQD';
    
    // کۆی قازانج (قازانجی گشتی)
    document.getElementById('total-profit').textContent = totalNetProfit.toLocaleString() + ' IQD';
    const profitElement = document.getElementById('total-profit');
    if (profitElement) {
        // هێشتا ڕەنگی قازانج بەپێی بەهاکەی دەگۆڕدرێت
        profitElement.style.color = totalNetProfit >= 0 ? '#28a745' : '#dc3545';
    }
    
    // کۆی کڕین
    document.getElementById('total-purchase').textContent = totalPurchaseAmount.toLocaleString() + ' IQD';
    
    // کۆی داهات (بەهای ئینڤێنتۆری)
    document.getElementById('total-income').textContent = totalIncome.toLocaleString() + ' IQD'; 
    
    // کۆی قەرز 
    document.getElementById('total-debt').textContent = totalDebt.toLocaleString() + ' IQD';
    
    // کۆی ئایتم (کۆی ژمارەی ئایتمی بەردەست)
    document.getElementById('total-items').textContent = totalAvailableItemsCount.toLocaleString();

    
    // 6. نیشاندانی لیستی ئایتمە فرۆشراوەکان
    displaySoldItemsList(soldItemsSummary);
}


// Function to display the detailed sold items table
function displaySoldItemsList(itemsSummary) {
    const tbody = document.getElementById('sold-items-list');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const itemNames = Object.keys(itemsSummary);

    if (itemNames.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-data">هیچ ئایتمێک لەم مەودایەدا نەفرۆشراوە.</td></tr>';
        return;
    }
    
    // ڕێکخستنی ئایتمەکان بەپێی زۆرترین بڕی فرۆشراو
    const sortedItems = itemNames.sort((a, b) => itemsSummary[b] - itemsSummary[a]);

    sortedItems.forEach(fullItemName => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${fullItemName}</td>
            <td>${itemsSummary[fullItemName].toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}


// Initial Load Dispatcher and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', loadReportData);
        endDateInput.addEventListener('change', loadReportData);
    }

    // دڵنیابوونەوە لەوەی ئێمە لە پەرەی ڕاپۆرتەکانداین پێش بارکردنی داتا
    if (document.getElementById('total-sales')) {
        loadReportData(); 
    }
});