// reports.js - FINAL FIREBASE FIRESTORE VERSION (ASYNC & COMPLETE)

// ⚠️ تێبینی: ئەم فایلە پشت دەبەستێت بە فەنکشنە گشتییەکان کە لە 'script.js'ـدا گۆڕدراون بۆ async.

// --- Shared Storage Access ---
async function getTransactions() { return await getFromStorage('salesTransactions', []); } 
async function getExpenses() { return await getFromStorage('expensesData', []); } 
async function getInventory() { return await getFromStorage('inventory', []); } 
async function getLoanTransactions() { return await getFromStorage('loanTransactions', []); } 


// Function to calculate start/end timestamps based on the preset filter
function calculateDateRange(preset) {
    const now = new Date();
    now.setHours(0, 0, 0, 0); 
    let startDate, endDate;

    switch (preset) {
        case 'today':
            startDate = now;
            endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); 
            break;
        case 'last7':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
        case 'last30':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
        case 'currentMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            break;
        case 'all':
        default:
            return { startTime: null, endTime: null };
    }

    return { 
        startTime: startDate.getTime(), 
        endTime: endDate.getTime() 
    };
}


// Function to convert date input to timestamp for filtering
function getTimestamp(dateString) {
    if (!dateString) return null;
    return new Date(dateString).getTime(); 
}

// Main function to load and calculate all report data
async function loadReportData() { // 🚨 async
    // 1. Get Filters from Dropdown
    const presetSelect = document.getElementById('datePreset');
    const customDatesDiv = document.getElementById('customDates');
    const selectedPreset = presetSelect ? presetSelect.value : 'all';

    let startTime, endTime;

    if (selectedPreset === 'custom') {
        customDatesDiv.style.display = 'flex';
        startTime = getTimestamp(document.getElementById('startDate').value);
        endTime = getTimestamp(document.getElementById('endDate').value);
    } else {
        customDatesDiv.style.display = 'none';
        const range = calculateDateRange(selectedPreset);
        startTime = range.startTime;
        endTime = range.endTime;
    }
    
    // Validate dates
    if ((startTime && endTime && startTime >= endTime)) {
        alert("⚠️ بەرواری سەرەتا ناتوانێت لە بەرواری کۆتایی درەنگتر بێت.");
        return;
    }

    // 2. Fetch Data (Optimized Parallel Fetching)
    const [transactions, expenses] = await Promise.all([
        getTransactions(),
        getExpenses()
    ]);
    
    // 3. Filter Transactions and Expenses by Date Range
    const filteredTransactions = transactions.filter(t => {
        const transactionTimestamp = t.id; 
        const isAfterStart = !startTime || transactionTimestamp >= startTime;
        const isBeforeEnd = !endTime || transactionTimestamp <= endTime; 
        return isAfterStart && isBeforeEnd;
    });

    const filteredExpenses = expenses.filter(e => {
        const expenseTimestamp = new Date(e.date).getTime(); 
        const isAfterStart = !startTime || expenseTimestamp >= startTime;
        const isBeforeEnd = !endTime || expenseTimestamp <= endTime;
        return isAfterStart && isBeforeEnd;
    });
    
    
    // 4. Calculate KPIs 
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalExpensesAmount = 0;
    let totalItemsSold = 0;
    
    filteredTransactions.forEach(t => {
        totalRevenue += t.totalSale || 0;
        totalProfit += t.totalProfit || 0;
        totalItemsSold += t.totalItemsCount || 0;
    });
    
    filteredExpenses.forEach(e => {
        totalExpensesAmount += e.amount || 0;
    });

    const netProfit = totalProfit - totalExpensesAmount;
    const totalTransactionsCount = filteredTransactions.length;
    const avgProfitPerTransaction = totalTransactionsCount > 0 ? (netProfit / totalTransactionsCount) : 0;
    
    
    // 5. Update the UI
    document.getElementById('report-revenue').textContent = totalRevenue.toLocaleString() + ' IQD';
    document.getElementById('report-net-profit').textContent = netProfit.toLocaleString() + ' IQD';
    
    const profitElement = document.getElementById('report-net-profit');
    if (profitElement) {
        profitElement.style.color = netProfit >= 0 ? '#28a745' : '#dc3545';
    }

    document.getElementById('report-expenses').textContent = totalExpensesAmount.toLocaleString() + ' IQD';
    document.getElementById('report-avg-profit').textContent = Math.round(avgProfitPerTransaction).toLocaleString() + ' IQD';
    
    // 6. Display detailed table
    displayDetailedTransactionReport(filteredTransactions);
}


// Function to display the detailed table
function displayDetailedTransactionReport(transactions) {
    const container = document.getElementById('detailedReportTableContainer');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="no-data-msg">هیچ مامەڵەیەک لەم مەودایەدا نەدۆزرایەوە.</p>';
        return;
    }
    
    let tableHTML = `<h3 style="margin-bottom: 15px;">${transactions.length} مامەڵە دۆزرایەوە</h3>
                     <table class="report-table">
                         <thead>
                             <tr>
                                 <th>بەروار</th>
                                 <th>کۆی فرۆش</th>
                                 <th>قازانجی خاوێن</th>
                                 <th>ژمارەی ئایتم</th>
                                 <th>وردەکاری</th>
                             </tr>
                         </thead>
                         <tbody>`;
    
    transactions.forEach(t => {
        tableHTML += `<tr>
                          <td>${t.date}</td>
                          <td>${(t.totalSale || 0).toLocaleString()} IQD</td>
                          <td style="color: ${t.totalProfit >= 0 ? '#28a745' : '#dc3545'}">${(t.totalProfit || 0).toLocaleString()} IQD</td>
                          <td>${t.totalItemsCount || 0}</td>
                          <td><span style="font-size: 0.9em; color: #6c757d;">${t.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</span></td>
                      </tr>`;
    });
    
    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}


// Initial Load Dispatcher (بۆ ئەوەی loadReportData بانگ بکات)
document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ گرنگ: ئەمە بۆ نیشاندانی inputـی بەرواری تایبەت
    const presetSelect = document.getElementById('datePreset');
    if (presetSelect) {
        presetSelect.addEventListener('change', (event) => {
            if (event.target.value === 'custom') {
                document.getElementById('customDates').style.display = 'flex';
            } else {
                document.getElementById('customDates').style.display = 'none';
            }
            // 🚨 بانگکردنی داتا دوای گۆڕینی فلتەر
            loadReportData(); 
        });
    }

    if (document.getElementById('report-revenue')) {
        // Load data on page load (default is 'all')
        loadReportData(); 
    }
});