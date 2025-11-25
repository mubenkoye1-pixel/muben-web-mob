// loan.js - FINAL STABLE LOCAL STORAGE VERSION (NO ASYNC/AWAIT & CLEAN)

// ⚠️ تێبینی: ئەم فایلە پشت بە فەنکشنەکانی getLoanTransactions و saveLoanTransactions 
// و getCustomers دەبەستێت کە دەبێت لە script.jsـدا بوونیان هەبێت.

// --- UTILITY FUNCTIONS ---

// Function to get all loans grouped by customer (used across all levels)
function getLoansGroupedByCustomer() {
    // ⚠️ پشت بە getLoanTransactions و getCustomers دەبەستێت
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
                transactions: []
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
    
    // ✅ چاکسازیی یەکلاکەرەوە: گەڕانەوە بۆ لیستی گشتی (ئاستی 1)
    window.location.href = 'qarz.html'; 
    
    alert('قەرزەکە بە سەرکەوتوویی واسڵ کرا و لابرا.');
}


// ACTION: Edit Loan (Calls data.js function)
function editLoan(transactionId) { 
    if (typeof editTransaction === 'function') {
        // ⚠️ ئەمە فەنکشنێکی ناو data.jsـە
        editTransaction(transactionId); 
    } else {
        alert("هەڵە: فەنکشنی دەستکاریکردنی مامەڵە نەدۆزرایەوە.");
    }
}


// -----------------------------------------------------------------------
// --- LEVEL 1: CUSTOMER OVERVIEW (لیستی گشتی) ---
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

    // ⚠️ دروستکردنی خشتە و onclick بۆ ئاستی 2
    let tableHTML =` 
        <div class="search-area"><input type="text" id="loanSearchInput" placeholder="گەڕان بە ناوی قەرزدار..." oninput="filterCustomerList()" class="search-input"></div>
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
        
        // 🚨 کرتەکردن دەتنێرێت بۆ ئاستی 2 (وردەکاریی وەسڵەکان)
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
// --- LEVEL 2: INVOICE LIST FOR ONE CUSTOMER (وردەکاریی وەسڵەکان) ---
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// --- LEVEL 2: INVOICE LIST FOR ONE CUSTOMER (وردەکاریی وەسڵەکان) ---
// -----------------------------------------------------------------------

// -----------------------------------------------------------------------
// --- LEVEL 2: INVOICE LIST FOR ONE CUSTOMER (وردەکاریی وەسڵەکان) ---
// -----------------------------------------------------------------------

function displayCustomerInvoices(customerName) {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const groupedLoans = getLoansGroupedByCustomer();
    const customerData = groupedLoans[customerName];
    
    // 🚨 زیادکردنی بەشی سۆرتکردن لێرە
    const unsortedTransactions = customerData.transactions || [];

    // سۆرتکردنی مامەڵەکان بەپێی transactionId (کە new Date().getTime()ـە)
    // بۆ نوێترین بۆ کۆنترین (Descending Order)
    const sortedTransactions = unsortedTransactions.sort((a, b) => {
        // transactionId ژمارەیەکە و بە ئاسانی دەتوانرێت بەراورد بکرێت
        // بۆ نوێترین (گەورەترین ژمارە) بۆ سەرەوە: b.transactionId - a.transactionId
        return b.transactionId - a.transactionId;
    });
    // ---------------------------------------------
    

    const totalDue = (customerData.totalDue || 0).toLocaleString();
    
    let htmlContent = `<div class="customer-total-box">
                         <strong>کۆی گشتی قەرزی نەگەڕاوە: </strong>
                         <span style="font-size: 1.5em; color: #dc3545;">${totalDue} IQD</span>
                     </div>
    <button class="detail-back-btn" onclick="loadOverview()">گەڕانەوە بۆ لیستی کڕیارەکان</button>
<button class="plus-btn" onclick="addBlankInvoiceRow('${customerName}')">+</button>`;
    htmlContent += `<h2 class="loan-header">وردەکاری قەرزی کریار: ${customerName}</h2>`;
 

    // 🚨 3. List of Invoices/Transactions
    htmlContent += `  
    <div class="loan-invoices-wrapper">`;
    // ئێستا sortedTransactions بەکاردەهێنین
    sortedTransactions.forEach(invoice => {
        // 💡 دیاریکردنی ئەوەی ئاخۆ مامەڵەکە دانەوەی قەرزە (سالبە)
        const isPayment = (invoice.amountDue || 0) < 0;
        const cardClass = isPayment ? ' loan-invoice-card--payment' : '';
        
        // ناونیشانی گونجاو دیاری دەکەین
        const titleText = isPayment ? 'گەڕانەوەی قەرز (دانەوە)' : 'وەسڵی قەرز';
        
        // 🚨 کرتەکردن دەتنێرێت بۆ ئاستی 3 (وردەکاریی یەک وەسڵ)
        htmlContent += `
            <div class="loan-invoice-card${cardClass}" onclick="loadInvoiceView(${invoice.transactionId})">
                <div class="transaction-header">
                    <span style="font-weight: bold;">${titleText} ژمارە: ${invoice.transactionId}</span>
                    <span class="total-sale">بڕ: ${(invoice.amountDue || 0).toLocaleString()} IQD</span>
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

// لە loan.js: گۆڕینی فەنکشنی displayInvoiceView()

function displayInvoiceView(transactionId) {
    const container = document.getElementById('loanContentContainer');
    if (!container) return;
    
    const allLoans = getLoanTransactions() || [];
    const invoice = allLoans.find(t => t.transactionId === transactionId || t.id === transactionId);

    if (!invoice) {
        container.innerHTML = `<h2 class="loan-header">❌ هەڵە: وەسڵ ژمارە ${transactionId} نەدۆزرایەوە.</h2>`;
        return;
    }
    
    // 1. دروستکردنی HTMLـی وردەکاریی ئایتمەکان
    let itemsListHTML = '';
    (invoice.items || []).forEach(item => { 
        itemsListHTML += `
            <tr class="invoice-item-row">
                <td>${item.name} (${item.brand} / ${item.type})</td>
                <td>${item.quantity.toLocaleString()}</td>
                <td>${(item.salePrice || 0).toLocaleString()} IQD</td>
                <td>${(item.quantity * (item.salePrice || 0)).toLocaleString()} IQD</td>
            </tr>
        `;
    });

    // 2. دروستکردنی پێکهاتەی سەرەکی
    const customer = invoice.customerName || invoice.customer || 'کڕیاری نەناسراو';
    let htmlContent = `<button class="detail-back-btn" onclick="loadDetailsView('${customer}')">
                            <i class="fas fa-arrow-right"></i> گەڕانەوە بۆ وەسڵەکانی ${customer}
                        </button>`;
                        
    htmlContent += `<h2>وردەکاری وەسڵ: #${transactionId}</h2>`;

    htmlContent += `
        <div class="single-invoice-details">
            <p><strong>کڕیار:</strong> ${customer}</p>
            <p><strong>بەروار:</strong> ${invoice.date}</p>
            <p><strong>کۆی داشکاندن:</strong> ${(invoice.discount || 0).toLocaleString()} IQD</p>
        </div>

        <table class="invoice-items-table">
            <thead>
                <tr>
                    <th>کاڵا</th>
                    <th>بڕ</th>
                    <th>نرخی یەکە</th>
                    <th>کۆی گشتی</th>
                </tr>
            </thead>
            <tbody>
                ${itemsListHTML}
            </tbody>
        </table>
        
        <h3 class="final-total">کۆی کۆتایی وەسڵ: ${(invoice.totalSale || 0).toLocaleString()} IQD</h3>
    `;
    
    container.innerHTML = htmlContent;
}


// -----------------------------------------------------------------------
// --- ROUTER & INITIALIZATION ---
// -----------------------------------------------------------------------

// Helper function to decode URL parameter safely
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


// ACTION: Add New Loan (قەرزێکی نوێ زیاد بکە)
// Function to visually add a new, empty row for a new invoice draft
// Function to visually add a new, empty row for a new invoice draft
function addBlankInvoiceRow(customerName) {
    const invoicesWrapper = document.querySelector('.loan-invoices-wrapper');
    if (!invoicesWrapper) return;

    // دڵنیابوون لەوەی زیاتر لە یەک ڕیزی کاتی نییە (بۆ ڕێگریکردن لە زیادکردنی زۆر)
    if (document.querySelector('.new-draft-card')) {
        alert("تکایە سەرەتا وەسڵە نوێیەکە تۆمار بکە یان هەڵیبوەشێنەوە.");
        return;
    }
    
    const newInvoiceId = new Date().getTime(); 

    const newRowHTML = `
        <div class="loan-invoice-card new-draft-card animated-in" id="draft-${newInvoiceId}">
            <div class="transaction-header new-draft-header">
                <span style="font-weight: bold; color: #343a40;">📍 تۆمارکردنی مامەڵەی نوێ:</span>
                
                <div class="input-group">
                    <input 
                        type="number" 
                        id="newAmount-${newInvoiceId}" 
                        placeholder="بڕ (بۆ دانەوەی قەرز بە سالب بنووسە) IQD" 
                        class="loan-input-field"
                    >
                </div>

                <div class="actions">
                    <button 
                        class="loan-action-btn save-btn" 
                        onclick="saveNewLoan('${customerName}', document.getElementById('newAmount-${newInvoiceId}').value, ${newInvoiceId})">
                        💾 تۆمارکردن
                    </button>
                    <button 
                        class="loan-action-btn cancel-btn" 
                        onclick="document.getElementById('draft-${newInvoiceId}').remove()">
                        ❌ هەڵوەشاندنەوە
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // ڕیزە نوێیەکە بۆ سەرەتای لیستەکە زیاد دەکەین
    invoicesWrapper.insertAdjacentHTML('afterbegin', newRowHTML);
}


// ACTION: Save New Loan (تۆمارکردنی قەرزێکی نوێ بۆ Local Storage)
// ACTION: Save New Loan (تۆمارکردنی قەرزێکی نوێ / یان گەڕانەوەی قەرز)
function saveNewLoan(customerName, amountDueStr, draftId) {
    const numericAmount = parseFloat(amountDueStr);
    
    // 1. پشتڕاستکردنەوەی داتا
    // ئێستا ڕێگە بە ژمارە سالبەکان دەدەین (بۆ دانەوەی قەرز)
    if (isNaN(numericAmount) || numericAmount === 0) {
        alert("تکایە بڕێکی دروست داخڵ بکە (بۆ دانەوەی قەرز ژمارەی سالب بەکاربێنە).");
        return;
    }

    // 2. دیاریکردنی جۆری مامەڵەکە
    let transactionType = (numericAmount > 0) ? 'New Debt' : 'Payment Received';
    
    // 3. دروستکردنی ئۆبجێکتی قەرزی نوێ
    const newTransaction = {
        transactionId: new Date().getTime(), 
        customer: customerName,
        date: new Date().toLocaleDateString('ku-IQ', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        // بڕی قەرزەکە بە شێوەی ئەرێنی یان نەرێنی (سالب) دەمێنێتەوە
        amountDue: numericAmount, 
        items: [], 
        totalSale: numericAmount, 
        loanType: transactionType // جۆری مامەڵەکە دیاری دەکەین
    };

    // 4. وەرگرتنی قەرزە کۆنەکان و زیادکردنی قەرزە نوێیەکە
    let allLoans = getLoanTransactions() || [];
    allLoans.push(newTransaction);
    
    // 5. تۆمارکردنی لیستە نوێیەکە بۆ Local Storage
    saveLoanTransactions(allLoans); 

    // 6. لابردنی ڕیزە کاتییەکە (Draft Row)
    const draftElement = document.getElementById(`draft-${draftId}`);
    if (draftElement) {
        draftElement.remove();
    }
    
    // 7. دووبارە بارکردنەوەی ئاستی 2 بۆ نوێکردنەوەی کۆی گشتی
    loadDetailsView(customerName);
    
    // 8. پەیامی سەرکەوتوو
    if (numericAmount > 0) {
        alert(`قەرزی نوێ بۆ ${customerName} بە بڕی ${numericAmount.toLocaleString()} IQD تۆمار کرا.`);
    } else {
        // بۆ ئەوەی پەیامەکە باشتر دەربکەوێت، بڕە سالبەکە دەکەینە موجەب (ئەرێنی)
        const absoluteAmount = Math.abs(numericAmount).toLocaleString();
        alert(`بڕی ${absoluteAmount} IQD وەرگیرایەوە لە ${customerName}.`);
    }
}