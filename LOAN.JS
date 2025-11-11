// loan.js - FINAL STABLE LOCAL STORAGE VERSION (NO ASYNC/AWAIT)

// ⚠️ تێبینی: ئەم فایلە پشت دەبەستێت بە فەنکشنەکانی getLoanTransactions و saveLoanTransactions 
// کە دەبێت لە script.jsـدا بوونیان هەبێت.

// Function to group loans by customer
function getLoansGroupedByCustomer() {
    const loans = getLoanTransactions() || []; 
    const groupedLoans = {};
    
    loans.forEach(loan => {
        const amount = loan.amountDue || 0;
        const customer = (loan.customer || 'Unnamed Customer').trim();
        if (!groupedLoans[customer]) {
            groupedLoans[customer] = {
                totalDue: 0,
                transactions: []
            };
        }
        // دڵنیابوونەوە لەوەی amountDue ژمارەیە
        const numericAmount = parseFloat(amount) || 0; 
        groupedLoans[customer].totalDue += numericAmount;
        groupedLoans[customer].transactions.push(loan);
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
    
    // ✅ چاکسازیی یەکلاکەرەوە: ڕاستەوخۆ دەیگوازینەوە بۆ لیستی سەرەکی
    window.location.href = 'loan.html'; 
    
    alert('قەرزەکە بە سەرکەوتوویی واسڵ کرا و لابرا.');
}


// ACTION: Edit Loan (Calls data.js function)
function editLoan(transactionId) { 
    if (typeof editTransaction === 'function') {
        editTransaction(transactionId);
    } else {
        alert("هەڵە: فەنکشنی دەستکاریکردنی مامەڵە نەدۆزرایەوە.");
    }
}


// 1. Display the main overview list of all loan customers (With Search)
function displayCustomerLoanOverview() {
    const container = document.getElementById('loanContentContainer');
    const searchInput = document.getElementById('loanSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (!container) return;
    
    const groupedLoans = getLoansGroupedByCustomer(); 
    let customers = Object.keys(groupedLoans).sort();

    // Filtering logic 
    customers = customers.filter(name => name.toLowerCase().includes(searchTerm));

    if (customers.length === 0) {
        container.innerHTML = `<h2 class="loan-list-header">لیستی قەرزدارەکان</h2><p class="no-data">هیچ قەرزێک تۆمار نەکراوە.</p>`;
        return;
    }

    let tableHTML =` <h2 class="loan-list-header">لیستی قەرزدارەکان (${customers.length} کریار)</h2>`;
    tableHTML += `
        <table class="customer-loan-table">
            <thead>
                <tr style="background-color: #007bff; color: white;">
                    <th style="border-radius: 8px 0 0 0;">ناوی کریار</th>
                    <th>کۆی بڕی قەرز (IQD)</th>
                    <th style="border-radius: 0 8px 0 0;">ژمارەی مامەڵە</th>
                </tr>
            </thead>
            <tbody>
    `;

    customers.forEach(customerName => {
        const data = groupedLoans[customerName];
        const totalDue = (data.totalDue || 0).toLocaleString();
        
        tableHTML += `
            <tr class="clickable-row" onclick="loadLoanDetails('${customerName}')">
                <td>${customerName}</td>
                <td class="loan-amount-total">${totalDue}</td>
                <td>${data.transactions.length}</td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    container.innerHTML = tableHTML;
}

// 2. Display the details for a specific customer
function displayCustomerLoanDetails(customerName) {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const groupedLoans = getLoansGroupedByCustomer();
    const customerData = groupedLoans[customerName];
    
    if (!customerData) {
        // ✅ چاکسازیی یەکلاکەرەوە: ڕاستەوخۆ دەیگوازینەوە بۆ loan.html (لیستی سەرەکی)
        window.location.href = 'loan.html'; 
        return;
    }

    const totalDue = (customerData.totalDue || 0).toLocaleString();
    
    // 1. دروستکردنی دوگمەی گەڕانەوە
    let htmlContent = `<button class="detail-back-btn" onclick="window.location.href='loan.html'">
                            گەڕانەوە بۆ لیست
                        </button>`;
    
    htmlContent += `<h2 class="loan-list-header">وردەکاری قەرزی کریار: ${customerName}</h2>`;
    
    // 2. Total Summary Box (کۆی قەرز)
    htmlContent += `<div class="customer-total-box">
                        <strong>کۆی گشتی قەرزی نەگەڕاوە: </strong>
                        <span style="font-size: 1.5em; color: #dc3545;">${totalDue} IQD</span>
                    </div>`;

    // 3. List of Invoices/Transactions (لیستی وەسڵەکان)
    htmlContent += `<div class="loan-invoices-wrapper">`;
    customerData.transactions.forEach(loan => {
        let itemsListHTML = '';
        (loan.items || []).forEach(item => {
             itemsListHTML += `
                <li class="invoice-item-detail">
                    <span class="item-name-details">${item.name} (${item.brand} / ${item.type})</span>
                    <span class="item-qty">x${item.quantity || 0}</span>
                    <span class="item-price">${(item.salePrice || 0).toLocaleString()} IQD</span>
                </li>
            `;
        });

        htmlContent += `
            <div class="loan-invoice-card">
                <div class="transaction-header">
                    <span style="font-weight: bold;">وەسڵی ژمارە: ${loan.transactionId}</span>
                    <span class="transaction-date">بەروار: ${loan.date}</span>
                    <span class="total-sale">کۆی فرۆش: ${loan.amountDue.toLocaleString()} IQD</span>
                    <div class="actions">
                        <button class="pay-loan-btn" onclick="closeLoan(${loan.transactionId})">وا سڵکردن</button>
                    </div>
                </div>
                <ul class="item-sold-list">
                    ${itemsListHTML}
                </ul>
            </div>
        `;
    });
    htmlContent += `</div>`;

    container.innerHTML = htmlContent;
}


// --- MAIN LOADER AND ROUTER ---
function loadLoanDetails(customerName) {
    window.location.href = `loan.html?customer=${encodeURIComponent(customerName)}`;
}

// Helper function to decode URL parameter safely
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedValue = urlParams.get(param);
    return encodedValue ? decodeURIComponent(encodedValue) : null;
}

function loadLoanManagementPage() {
    const customer = getQueryParam('customer');
    
    if (customer) {
        displayCustomerLoanDetails(customer);
    } else {
        displayCustomerLoanOverview();
    }
}


// Initial Load for Loan Management Page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loanContentContainer')) {
        loadLoanManagementPage();
    }
});