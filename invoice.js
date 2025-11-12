// invoice.js - Logic for displaying the specific invoice data

document.addEventListener('DOMContentLoaded', async () => {
    // 1. وەرگرتنی IDـی مامەڵە لە ناونیشانی وێبەوە
    const urlParams = new URLSearchParams(window.location.search);
    const transactionId = parseFloat(urlParams.get('transactionId')); 

    const invoiceContainer = document.getElementById('invoiceContainer');

    if (isNaN(transactionId)) {
        invoiceContainer.innerHTML = '<h1>❌ هەڵە: IDـی مامەڵە نەدۆزرایەوە.</h1>';
        return;
    }
    
    // 2. هێنانی هەموو مامەڵەکان (پێویستە getTransactions لە script.js بوونی هەبێت)
    // ⚠️ چونکە ئەمە لەسەر Local Storageـە، دەبێت ئەم فەنکشنە synchronously (بێ async) کار بکات
    if (typeof getTransactions !== 'function') {
        invoiceContainer.innerHTML = '<h1>⚠️ هەڵە: فەنکشنی سەرەکی نەدۆزرایەوە.</h1>';
        return;
    }
    
    const transactions = getTransactions();
    const loans = getLoanTransactions(); // بۆ پشکنینی ئەوەی ئایا قەرزە

    const transaction = transactions.find(t => t.id === transactionId);

    if (!transaction) {
        invoiceContainer.innerHTML = '<h1>مامەڵەکە نەدۆزرایەوە.</h1>';
        return;
    }

    // 3. دروستکردنی HTMLـی وەسڵ
    let isLoan = transaction.isLoan || false;
    let customerName = transaction.customerName || 'كڕیاری نەناسراو';
    let invoiceHTML = `
        <div class="invoice-header">
            <h2>وەسڵی فرۆشتن / قەرز</h2>
            <p><strong>بەروار:</strong> ${transaction.date}</p>
            <p><strong>بۆ کڕیار:</strong> ${customerName}</p>
            <p class="transaction-type-status">${isLoan ? 'قەرزی نەگەڕاوە ⚠️' : 'فرۆشتنی کۆتایی'}</p>
        </div>
        
        <table class="items-table">
            <thead>
                <tr>
                    <th>کاڵا</th>
                    <th>براند / جۆر</th>
                    <th>عدد</th>
                    <th>نرخی یەکە</th>
                    <th>کۆی فرۆش</th>
                </tr>
            </thead>
            <tbody>
    `;

    transaction.items.forEach(item => {
        invoiceHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.brand} / ${item.type}</td>
                <td>${item.quantity}</td>
                <td>${(item.salePrice || 0).toLocaleString()} IQD</td>
                <td>${(item.quantity * (item.salePrice || 0)).toLocaleString()} IQD</td>
            </tr>
        `;
    });

    invoiceHTML += `</tbody></table>
        <div class="totals-section">
            <p>کۆی گشتی (پێش داشکاندن): <span>${transaction.subTotalSale.toLocaleString()} IQD</span></p>
            <p>داشکاندن: <span class="discount">${transaction.discount.toLocaleString()} IQD</span></p>
            <h3>کۆی کۆتایی وەسڵ: <span class="final-total">${transaction.totalSale.toLocaleString()} IQD</span></h3>
            <p class="profit-line">قازانجی خاوێن: <span>${transaction.totalProfit.toLocaleString()} IQD</span></p>
        </div>
    `;

    invoiceContainer.innerHTML = invoiceHTML;
});
