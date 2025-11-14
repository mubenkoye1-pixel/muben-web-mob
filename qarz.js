// loan.js - 3-TIER LOAN MANAGEMENT LOGIC

// ⚠️ تێبینی: ئەم فایلە پشت بە فەنکشنەکانی get/saveLoanTransactions لە script.js دەبەستێت.

// --- UTILITY FUNCTIONS ---

// Function to get all loans grouped by customer (used across all levels)
// لە loan.js

function getLoansGroupedByCustomer() {
    // 🚨 1. هێنانی هەموو قەرزەکان و هەموو کڕیارەکان
    const allLoans = getLoanTransactions() || []; 
    const allCustomers = getCustomers() || []; // 👈 بانگکردنی گشتی بۆ هەموو کڕیارەکان
    
    const groupedLoans = {};
    
    // 2. یەکخستنی داتای قەرزدارەکان
    allLoans.forEach(loan => {
        const amount = loan.amountDue || 0;
        const customer = (loan.customer || 'Unnamed Customer').trim();
        
        if (!groupedLoans[customer]) {
            groupedLoans[customer] = {
                totalDue: 0,
                transactions: []
            };
        }
        const numericAmount = parseFloat(amount) || 0; 
        groupedLoans[customer].totalDue += numericAmount;
        groupedLoans[customer].transactions.push(loan);
    });
    
    // 3. زیادکردنی کڕیارەکانی بێ قەرز (Non-debtors)
    allCustomers.forEach(c => {
        const name = c.name.trim();
        // ئەگەر کڕیارەکە پێشتر لە لیستی قەرزدارەکاندا نەبوو، سفر بۆی دادەنێین
        if (!groupedLoans[name]) {
            groupedLoans[name] = {
                totalDue: 0,
                transactions: []
            };
        }
    });
    
    return groupedLoans;
}

// -----------------------------------------------------------------------
// --- LEVEL 1: CUSTOMER OVERVIEW (لیستی قەرزدارەکان) ---
// -----------------------------------------------------------------------

function displayCustomerOverview() {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const groupedLoans = getLoansGroupedByCustomer(); 
    let customers = Object.keys(groupedLoans).sort();

    if (customers.length === 0) {
        container.innerHTML = `<h2 class="loan-header">لیستی قەرزدارەکان</h2><p class="no-data">هیچ قەرزێک تۆمار نەکراوە.</p>`;
        return;
    }

    let tableHTML =` 
        <table class="customer-loan-table">
            <thead>
                <tr style="background-color: #007bff; color: white;">
                    <th>ناوی کریار</th>
                    <th>کۆی بڕی قەرز (IQD)</th>
                    <th>ژمارەی وەسڵ</th>
                </tr>
            </thead>
            <tbody id="customerListBody">
    `;

    customers.forEach(customerName => {
        const data = groupedLoans[customerName];
        const totalDue = (data.totalDue || 0).toLocaleString();
        
        tableHTML += `
            <tr class="clickable-row" onclick="loadDetailsView('${customerName}')">
                <td>${customerName}</td>
                <td class="loan-amount-total">${totalDue}</td>
                <td>${data.transactions.length}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

// -----------------------------------------------------------------------
// --- LEVEL 2: INVOICE LIST FOR ONE CUSTOMER (لیستی وەسڵەکانی یەک کڕیار) ---
// -----------------------------------------------------------------------

// لە loan.js: گۆڕینی فەنکشنی displayCustomerInvoices

function displayCustomerInvoices(customerName) {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const groupedLoans = getLoansGroupedByCustomer();
    const customerData = groupedLoans[customerName];
    
    if (!customerData) {
        loadOverview(); // گەڕانەوە بۆ لیستی گشتی
        return;
    }

    const totalDue = (customerData.totalDue || 0).toLocaleString();
    
    // 1. دروستکردنی HTML
    let htmlContent = `<button class="detail-back-btn" onclick="loadOverview()">گەڕانەوە بۆ لیستی کڕیارەکان</button>`;
    htmlContent += `<h2>وەسڵەکانی ${customerName}</h2>`;
    htmlContent += `<div class="customer-total-box">
                        <strong>کۆی گشتی قەرزی نەگەڕاوە: </strong>
                        <span style="font-size: 1.5em; color: #dc3545;">${totalDue} IQD</span>
                    </div>`;

    // 2. لیستی وەسڵەکان
    customerData.transactions.forEach(invoice => {
        let itemsListHTML = '';
        (invoice.transactions || []).forEach(item => { // ⚠️ دەبێت داتاکەی invoice بە دروستی بخوێنرێتەوە
             itemsListHTML += `
                <li class="invoice-item-detail">
                    <span class="item-name-details">${item.name} (${item.brand} / ${item.type})</span>
                    <span class="item-qty">x${item.quantity || 0}</span>
                    <span class="item-price">${(item.salePrice || 0).toLocaleString()} IQD</span>
                </li>
            `;
        });

        htmlContent += `
            <div class="loan-invoice-card" onclick="loadInvoiceView(${invoice.transactionId})">
                <div class="transaction-header">
                    <span style="font-weight: bold;">وەسڵی ژمارە: ${invoice.transactionId}</span>
                    <span class="transaction-date">بەروار: ${invoice.date}</span>
                    <span class="total-sale">کۆی فرۆش: ${invoice.amountDue.toLocaleString()} IQD</span>
                    <div class="actions">
                        <button class="pay-loan-btn" onclick="event.stopPropagation(); closeLoan(${invoice.transactionId})">وا سڵکردن</button>
                    </div>
                </div>
                <ul class="item-sold-list">
                    ${itemsListHTML}
                </ul>
            </div>
        `;
    });

    container.innerHTML = htmlContent;
}
// -----------------------------------------------------------------------
// --- LEVEL 3: SINGLE INVOICE VIEW (وردەکاریی یەک وەسڵ) ---
// -----------------------------------------------------------------------

function displayInvoiceView(transactionId) {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const groupedLoans = getLoansGroupedByCustomer();
    // ... Logic to find the specific invoice and display its details
    
    container.innerHTML = `<h1>وردەکاری وەسڵ: ${transactionId}</h1>`;
    // ... display details and 'closeLoan' button
}

// -----------------------------------------------------------------------
// --- ROUTER & INITIALIZATION ---
// -----------------------------------------------------------------------

// Router to decide which view to load
function loadLoanRouter() {
    const customerName = getQueryParam('customer');
    const transactionId = getQueryParam('transaction');
    
    if (transactionId) {
        displayInvoiceView(transactionId); // ئاستی 3
    } else if (customerName) {
        displayCustomerInvoices(customerName); // ئاستی 2
    } else {
        displayCustomerOverview(); // ئاستی 1
    }
}

// Navigation Functions
function loadOverview() { window.location.href = 'loan.html'; }
function loadDetailsView(customerName) { 
    window.location.href = `loan.html?customer=${encodeURIComponent(customerName)}`; 
}
function loadInvoiceView(transactionId) {
    // ⚠️ دەبێت ناوی کڕیارەکەش بنێرینەوە
    window.location.href = `loan.html?transaction=${transactionId}`; 
}

document.addEventListener('DOMContentLoaded', loadLoanRouter);

// Helper function to decode URL parameter safely (Assumed in script.js or global)
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedValue = urlParams.get(param);
    return encodedValue ? decodeURIComponent(encodedValue) : null;
}

// لە کۆتایی فایلی loan.js زیاد بکە

// ✅ چارەسەری یەکلاکەرەوە: ناساندنی فەنکشنە سەرەکییەکان بە شێوەی Global
window.getLoansGroupedByCustomer = getLoansGroupedByCustomer;
window.displayCustomerOverview = displayCustomerOverview;
window.loadLoanRouter = loadLoanRouter;
window.loadOverview = loadOverview;
window.loadDetailsView = loadDetailsView;
window.loadInvoiceView = loadInvoiceView;
