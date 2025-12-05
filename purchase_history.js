// reports.js - وەشانی تەواو و چارەسەرکراو بۆ ڕاپۆرتە داراییەکان (بە فلتەری بەروار)

// ⚠️ تێبینی: ئەم فایلە پشت بە فەنکشنە گشتییەکان وەک getFromStorage دەبەستێت 
// (کە وابزانرێت لە 'script.js' یان دیکەدا دیاریکراوە)
// و هەروەها پشت بە getLoanTransactions و getPurchaseHistory دەبەستێت.

// --- Shared Storage Access (پێویستە ئەم فەنکشنانە لە شوێنێکی تردا هەبن) ---
async function getSales() { return await getFromStorage('salesTransactions', []); } 
async function getExpenses() { return await getFromStorage('expensesData', []); } 
async function getLoanTransactions() { return await getFromStorage('loanTransactions', []); } 
async function getPurchaseHistory() { return await getFromStorage('purchaseHistory', []); } 


// Function to convert date input to timestamp for filtering
function getTimestamp(dateString, isEnd = false) {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isEnd) {
        // بۆ بەرواری کۆتایی، کاتەکە دادەنرێت لە کۆتایی ڕۆژەکەدا
        date.setHours(23, 59, 59, 999);
    } else {
        // بۆ بەرواری سەرەتا، کاتەکە دادەنرێت لە سەرەتای ڕۆژەکەدا
        date.setHours(0, 0, 0, 0);
    }
    return date.getTime(); 
}

// Function to filter data based on date range
function filterByDate(dataArray, startTime, endTime, dateKey = 'timestamp') {
    return dataArray.filter(item => {
        let itemTimestamp;

        if (item[dateKey]) {
            // بەکارهێنانی کێلدی 'date' یان 'id'
            itemTimestamp = new Date(item[dateKey]).getTime(); 
        } else if (item.id) {
            // بەکارهێنانی id وەک timestamp (بۆ مامەڵەکانی فرۆش)
            itemTimestamp = item.id;
        } else {
            return true; // ئەگەر کێلد نەبوو، وا دادەنرێت دەکەوێتە ناو مەوداکەوە
        }
        
        const isAfterStart = !startTime || itemTimestamp >= startTime;
        const isBeforeEnd = !endTime || itemTimestamp <= endTime; 
        return isAfterStart && isBeforeEnd;
    });
}


// Main function to load and calculate all report data
async function loadReportData() { 
    // 1. Get Filters from Date Inputs
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    let startTime = getTimestamp(startDateInput.value, false);
    let endTime = getTimestamp(endDateInput.value, true);

    // Validate dates
    if (startTime && endTime && startTime > endTime) {
        alert("⚠️ بەرواری دەستپێکردن ناتوانێت لە بەرواری کۆتایی درەنگتر بێت.");
        return;
    }
    
    // 2. Fetch Data (Optimized Parallel Fetching)
    const [sales, expenses, purchases, loans] = await Promise.all([
        getSales(),
        getExpenses(),
        getPurchaseHistory(), 
        getLoanTransactions() 
    ]);
    
    // 3. Filter Data by Date Range
    // Sales: وا بزانرێت id یان timestamp هەیە
    const filteredSales = filterByDate(sales, startTime, endTime, 'id'); 
    // Expenses: وا بزانرێت کێلدی 'date' هەیە
    const filteredExpenses = filterByDate(expenses, startTime, endTime, 'date');
    // Purchases: وا بزانرێت کێلدی 'date' هەیە
    const filteredPurchases = filterByDate(purchases, startTime, endTime, 'date'); 
    // Loans: وا بزانرێت کێلدی 'date' هەیە
    const filteredLoans = filterByDate(loans, startTime, endTime, 'date'); 

    
    // 4. Calculate KPIs 
    let totalSales = 0;
    let totalGrossProfit = 0;
    let totalExpensesAmount = 0;
    let totalPurchaseAmount = 0;
    let totalItemsCount = 0;
    let totalDebt = 0; // کۆی مانەوەی قەرز (قەرز - دانەوە) لە ماوەی فلتەردا
    
    const soldItemsSummary = {}; 
    
    // Calculate Sales & Profit & Items
    filteredSales.forEach(t => {
        totalSales += t.totalSale || 0;
        totalGrossProfit += t.totalProfit || 0;
        
        if (Array.isArray(t.items)) {
             t.items.forEach(item => {
                const quantity = item.quantity || 0;
                totalItemsCount += quantity;
                const itemName = item.name || 'ناوی نادیار';
                
                // کۆکردنەوەی ئایتمە فرۆشراوەکان
                if (soldItemsSummary[itemName]) {
                    soldItemsSummary[itemName] += quantity;
                } else {
                    soldItemsSummary[itemName] = quantity;
                }
            });
        }
    });
    
    // Calculate Expenses
    filteredExpenses.forEach(e => {
        totalExpensesAmount += e.amount || 0;
    });

    // Calculate Purchase (بە پێی کلیلەی grandTotal لە purchase_history.js)
    filteredPurchases.forEach(p => {
        totalPurchaseAmount += p.grandTotal || 0; 
    });

    // Calculate Debts (کۆی گشتی amountDue، کە دەکرێت ئەرێنی یان نەرێنی بێت بۆ دانەوە)
    filteredLoans.forEach(d => {
         totalDebt += d.amountDue || 0; 
    });
    
    // Calculate Net Profit
    const totalNetProfit = totalGrossProfit - totalExpensesAmount;
    
    // Calculate Income (تەنها فرۆش بەکاردێ)
    const totalIncome = totalSales; 

    
    // 5. Update the UI Metrics
    
    // کۆی فرۆش
    document.getElementById('total-sales').textContent = totalSales.toLocaleString() + ' IQD';
    
    // کۆی خەرجی
    document.getElementById('total-expenses').textContent = totalExpensesAmount.toLocaleString() + ' IQD';
    
    // کۆی قازانج (خاوێن)
    document.getElementById('total-profit').textContent = totalNetProfit.toLocaleString() + ' IQD';
    const profitElement = document.getElementById('total-profit');
    if (profitElement) {
        profitElement.style.color = totalNetProfit >= 0 ? '#28a745' : '#dc3545';
    }
    
    // کۆی کڕین
    document.getElementById('total-purchase').textContent = totalPurchaseAmount.toLocaleString() + ' IQD';
    
    // کۆی داهات
    document.getElementById('total-income').textContent = totalIncome.toLocaleString() + ' IQD';
    
    // کۆی قەرز (قەرزی خاوێن لە ماوەی فلتەردا)
    document.getElementById('total-debt').textContent = totalDebt.toLocaleString() + ' IQD';
    
    // کۆی ژمارەی ئایتم
    document.getElementById('total-items').textContent = totalItemsCount.toLocaleString();

    
    // 6. Display Sold Items List
    displaySoldItemsList(soldItemsSummary);
}


// Function to display the detailed sold items table
function displaySoldItemsList(itemsSummary) {
    const tbody = document.getElementById('sold-items-list');
    if (!tbody) return;
    
    // Clear previous entries
    tbody.innerHTML = '';
    
    const itemNames = Object.keys(itemsSummary);

    if (itemNames.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="no-data">هیچ ئایتمێک لەم مەودایەدا نەفرۆشراوە.</td></tr>';
        return;
    }
    
    // Sort items by quantity (high to low)
    const sortedItems = itemNames.sort((a, b) => itemsSummary[b] - itemsSummary[a]);

    sortedItems.forEach(itemName => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${itemName}</td>
            <td>${itemsSummary[itemName].toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    });
}


// Initial Load Dispatcher and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');

    // Attach loadReportData to changes in date inputs
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', loadReportData);
        endDateInput.addEventListener('change', loadReportData);
    }

    // Load data on page load
    if (document.getElementById('total-sales')) {
        loadReportData(); 
    }
});