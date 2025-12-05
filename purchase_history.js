// purchase_history.js

// --- Constants (هەمان کلیلەکان کە لە purchase.js بەکارهاتوون) ---
const PURCHASE_HISTORY_KEY = "purchaseHistory"; 

// --- Shared Storage Access (بەکارهێنانی هەمان فانکشن) ---
function getFromStorage(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    try {
        const parsed = JSON.parse(data);
        return parsed || defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

function getPurchaseHistory() {
    return getFromStorage(PURCHASE_HISTORY_KEY, []);
}


// --- Display Logic ---

function displayReceipts() {
    const history = getPurchaseHistory();
    const listContainer = document.getElementById('receiptsList');
    listContainer.innerHTML = ''; 

    if (history.length === 0) {
        listContainer.innerHTML = '<p style="color: #ccc; text-align: center;">هیچ کڕینێک تۆمار نەکراوە.</p>';
        return;
    }

    history.forEach(receipt => {
        // دروستکردنی کارتێک بۆ هەر وەسڵێک
        const receiptCard = document.createElement('div');
        receiptCard.className = 'receipt-card';
        
        let itemsTable = `
            <table class="items-table">
                <thead>
                    <tr>
                        <th>ناوی ئایتم</th>
                        <th>نرخی یەکە</th>
                        <th>ژمارە</th>
                        <th>کۆی گشتی (ڕیز)</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // زیادکردنی ڕیزەکانی ئایتم
        receipt.items.forEach(item => {
            itemsTable += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.price.toLocaleString()}</td>
                    <td>${item.qty.toLocaleString()}</td>
                    <td>${item.total.toLocaleString()}</td>
                </tr>
            `;
        });
        
        itemsTable += `</tbody></table>`;

        receiptCard.innerHTML = `
            <div class="receipt-header">
                <h3># وەسڵ: ${receipt.id}</h3>
                <span class="receipt-date">رێکەوت: ${receipt.date}</span>
            </div>
            
            <div class="receipt-body">
                ${itemsTable}
            </div>
            
            <div class="receipt-footer">
                <strong>کۆی گشتی کڕین:</strong> 
                <span class="grand-total">${receipt.grandTotal.toLocaleString()} دینار</span>
            </div>
        `;

        listContainer.appendChild(receiptCard);
    });
}

// Initial Load
document.addEventListener('DOMContentLoaded', displayReceipts);