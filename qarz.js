// loan.js - 3-TIER LOAN MANAGEMENT LOGIC (FINAL & COMPLETE)

// ⚠️ تێبینی: ئەم فایلە پشت بە فەنکشنە گشتییەکانی get/saveLoanTransactions و getCustomers دەبەستێت.

// --- UTILITY FUNCTIONS ---

// Function to get all loans grouped by customer (used across all levels)
function getLoansGroupedByCustomer() {
    // ⚠️ ئەمە پێویستی بەوەیە کە getLoanTransactions و getCustomers لە script.jsـدا بن
    const allLoans = getLoanTransactions() || []; 
    const allCustomers = getCustomers() || []; 
    
    const groupedLoans = {};
    
    // 1. یەکخستنی داتای قەرزدارەکان
    allLoans.forEach(loan => {
        const amount = loan.amountDue || 0;
        const customer = (loan.customer || 'Unnamed Customer').trim();
        
        if (!groupedLoans[customer]) {
            groupedLoans[customer] = {
                totalDue: 0,
                transactions: [] // ئەمە لیستی وەسڵەکانە
            };
        }
        const numericAmount = parseFloat(amount) || 0; 
        groupedLoans[customer].totalDue += numericAmount;
        groupedLoans[customer].transactions.push(loan);
    });
    
    // 2. زیادکردنی کڕیارەکانی بێ قەرز (Non-debtors) بۆ لیستەکە
    allCustomers.forEach(c => {
        const name = c.name.trim();
        if (!groupedLoans[name]) {
            groupedLoans[name] = {
                totalDue: 0,
                transactions: []
            };
        }
    });
    
    return groupedLoans;
}

// ACTION: Close/Pay Loan (واسڵکردن)
function closeLoan(transactionId) { 
    if (!confirm('دڵنیایت کە ئەم قەرزە بە تەواوی واسڵ کراوە و دەبێت بسڕدرێتەوە لە لیستی قەرزەکان؟')) {
        return;
    }

    let loans = getLoanTransactions(); 
    loans = loans.filter(loan => loan.transactionId !== transactionId);
    saveLoanTransactions(loans); 
    
    // 🚨 گەڕانەوە بۆ لیستی سەرەکی
    window.location.href = 'qarz.html'; 
    
    alert('قەرزەکە بە سەرکەوتوویی واسڵ کرا و لابرا.');
}

// -----------------------------------------------------------------------
// --- LEVEL 1: CUSTOMER OVERVIEW (لیستی قەرزدارەکان) ---
// -----------------------------------------------------------------------

function displayCustomerOverview() {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const groupedLoans = getLoansGroupedByCustomer(); 
    let customers = Object.keys(groupedLoans).sort();

    // ⚠️ لۆجیکی نمایشکردنی خشتە و کرتەکردن
    let tableHTML =` 
        <h2>لیستی هەموو کڕیارەکان (${customers.length})</h2>
        <table class="customer-loan-table">
            <thead>
                <tr style="background-color: #007bff; color: white;">
                    <th>ناوی کریار</th>
                    <th>کۆی بڕی قەرز (IQD)</th>
                    <th>ژمارەی وەسڵ</th>
                </tr>
            </thead>
            <tbody>
    `;

    customers.forEach(customerName => {
        const data = groupedLoans[customerName];
        const totalDue = (data.totalDue || 0).toLocaleString();
        
        // 🚨 کرتەکردن دەتنێرێت بۆ ئاستی 2
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

// لە loan.js:
function displayCustomerInvoices(customerName) {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const groupedLoans = getLoansGroupedByCustomer();
    const customerData = groupedLoans[customerName];
    
    if (!customerData || customerData.transactions.length === 0) {
        loadOverview(); 
        return;
    }

    const totalDue = (customerData.totalDue || 0).toLocaleString();
    
    let htmlContent = `<button class="detail-back-btn" onclick="loadOverview()">
                            گەڕانەوە بۆ لیستی کڕیارەکان
                        </button>`;
    
    htmlContent += `<h2 class="loan-header">وەسڵەکانی ${customerName}</h2>`;
    htmlContent += `<div class="customer-total-box">
                        <strong>کۆی گشتی قەرزی نەگەڕاوە: </strong>
                        <span style="font-size: 1.5em; color: #dc3545;">${totalDue} IQD</span>
                    </div>`;

    htmlContent += `<div class="loan-invoices-wrapper">`;
    customerData.transactions.forEach(invoice => {
        // 🚨 لێرەدا فەنکشنی loadInvoiceView بانگ دەکەین بۆ وردەکاریی تەواو
        htmlContent += `
            <div class="loan-invoice-card" onclick="loadInvoiceView(${invoice.transactionId})">
                <div class="transaction-header">
                    <span style="font-weight: bold;">وەسڵی ژمارە: ${invoice.transactionId}</span>
                    <span class="total-sale">کۆی فرۆش: ${invoice.amountDue.toLocaleString()} IQD</span>
                    <div class="actions">
                        <button class="pay-loan-btn" onclick="event.stopPropagation(); closeLoan(${invoice.transactionId})">وا سڵکردن</button>
                    </div>
                </div>
            </div>
        `;
    });
    htmlContent += `</div>`;

    container.innerHTML = htmlContent;
}

// -----------------------------------------------------------------------
// --- LEVEL 3: SINGLE INVOICE VIEW (وردەکاریی یەک وەسڵ) ---
// -----------------------------------------------------------------------

// لە loan.js:
function displayInvoiceView(transactionId) {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const allLoans = getLoanTransactions() || [];
    const invoice = allLoans.find(t => t.transactionId === transactionId || t.id === transactionId);

    if (!invoice) {
        container.innerHTML = `<h1>❌ هەڵە: وەسڵ ژمارە ${transactionId} نەدۆزرایەوە.</h1>`;
        return;
    }
    
    // ⚠️ لێرەدا لۆجیکی دروستکردنی HTMLـی وردەکاریی وەسڵە
    let htmlContent = `<button class="detail-back-btn" onclick="window.location.href='qarz.html?customer=${encodeURIComponent(invoice.customer)}'">گەڕانەوە</button>`;
    htmlContent += `<h2>وردەکاری وەسڵ: #${transactionId}</h2>`;
    
    // ... (زیادکردنی وردەکاریی ئایتمەکان و کۆی گشتی) ...
    
    container.innerHTML = htmlContent;
}

// -----------------------------------------------------------------------
// --- ROUTER & INITIALIZATION ---
// -----------------------------------------------------------------------

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedValue = urlParams.get(param);
    return encodedValue ? decodeURIComponent(encodedValue) : null;
}

// Navigation Functions
function loadOverview() { window.location.href = 'qarz.html'; }
function loadDetailsView(customerName) { 
    window.location.href = `qarz.html?customer=${encodeURIComponent(customerName)}`; 
}
function loadInvoiceView(transactionId) {
    window.location.href = `qarz.html?transaction=${transactionId}`; 
}

// Main Router
function loadLoanRouter() {
    const customerName = getQueryParam('customer');
    const transactionId = getQueryParam('transaction');
    
    if (transactionId) {
        displayInvoiceView(parseFloat(transactionId)); // ئاستی 3
    } else if (customerName) {
        displayCustomerInvoices(customerName); // ئاستی 2
    } else {
        displayCustomerOverview(); // ئاستی 1
    }
}

document.addEventListener('DOMContentLoaded', loadLoanRouter);