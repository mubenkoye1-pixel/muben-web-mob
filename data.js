// data.js - FINAL STABLE LOCAL STORAGE VERSION (SYNCHRONOUS)

// --- Shared Storage Access (Relies on item.js base functions) ---
// NOTE: We assume getFromStorage and saveToStorage are defined globally in item.js.

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

function getTransactions() { return getFromStorage('salesTransactions', []); }
function saveTransactions(transactions) { saveToStorage('salesTransactions', transactions); }
function getLoanTransactions() { return getFromStorage('loanTransactions', []); }
function saveLoanTransactions(loans) { saveToStorage('loanTransactions', loans); }
function getInventory() { return getFromStorage('inventory', []); } 


// ==========================================================
// --- DATA PAGE LOGIC (data.html) ---
// ==========================================================

// FIX 1: Define the global variable here ONLY ONCE
let currentTransactionBeingEdited = null; 

// --- Tab Switching Logic (Necessary utility) ---
function showTab(tabId, clickedButton) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.style.display = 'block';
    }
    
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    if (tabId === 'loan-transactions') {
         // Assuming displayLoanTransactionsWithSearch is accessible from loan.js or defined here
         if (typeof displayLoanTransactionsWithSearch === 'function') {
              displayLoanTransactionsWithSearch(); 
         }
    }
}


// --- Core Analysis Function (Synchronous) ---
function analyzeInventory() {
    const transactions = getTransactions();
    const loanTransactions = getLoanTransactions();
    
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalItems = 0;
    let totalLoanDue = 0; 

    transactions.forEach(t => {
        totalRevenue += t.totalSale || 0;
        totalProfit += t.totalProfit || 0;
        totalItems += t.totalItemsCount || 0;
    });

    loanTransactions.forEach(loan => {
        totalLoanDue += loan.amountDue || 0;
    });

    // Display KPIs (Summary Bar)
    const kpiRevenue = document.getElementById('kpi-total-revenue');
    const kpiProfit = document.getElementById('kpi-total-profit');
    const kpiLoanDue = document.getElementById('kpi-total-loan-due');
    
    if (kpiRevenue) kpiRevenue.textContent = totalRevenue.toLocaleString() + ' IQD';
    if (kpiProfit) kpiProfit.textContent = totalProfit.toLocaleString() + ' IQD';
    if (kpiLoanDue) kpiLoanDue.textContent = totalLoanDue.toLocaleString() + ' IQD';

    // Set profit color for KPI
    if (kpiProfit) {
        if (totalProfit >= 0) {
            kpiProfit.style.color = '#28a745'; // Green
        } else {
            kpiProfit.style.color = '#dc3545'; // Red
        }
    }

    displayTransactions(transactions);
    
    if (typeof displayLoanTransactionsWithSearch === 'function') {
         displayLoanTransactionsWithSearch(); 
    }
}


function displayTransactions(transactions) {
    const container = document.getElementById('transactionsListContainer');
    if (!container) return;

    if (transactions.length === 0) {
        container.innerHTML = '<p class="no-data">هیچ فرۆشتنێک تۆمار نەکراوە.</p>';
        return;
    }

    container.innerHTML = ''; 
    transactions.sort((a, b) => b.id - a.id); 

    transactions.forEach(t => {
        const profitClass = (t.totalProfit || 0) >= 0 ? 'total-profit' : 'total-profit profit-negative';
        
        let itemsListHTML = '';
        t.items.forEach(item => {
            itemsListHTML += `
                <li>
                    <span class="item-name-details">${item.name} (${item.brand} / ${item.type})</span>
                    <span class="item-qty">x${item.quantity || 0}</span>
                    <span class="item-price">${(item.salePrice || 0).toLocaleString()} IQD</span>
                </li>
            `;
        });

        const cardHTML = `
            <div class="transaction-card">
                <div class="transaction-header">
                    <span class="transaction-date">بەروار: ${t.date}</span>
                    <div class="actions">
                         <button class="action-btn edit-trans-btn" onclick="editTransaction(${t.id})">دەستکاری</button>
                         <button class="action-btn delete-trans-btn" onclick="deleteTransaction(${t.id})">سڕینەوە</button>
                    </div>
                </div>
                <ul class="item-sold-list">
                    ${itemsListHTML}
                </ul>
                <div class="transaction-header" style="background-color: #f8f9fa;">
                    <span class="total-sale">کۆی فرۆش: ${(t.totalSale || 0).toLocaleString()} IQD</span>
                    <span class="${profitClass}">کۆی قازانج: ${(t.totalProfit || 0).toLocaleString()} IQD</span>
                    <span class="total-count">کۆی عدد: ${t.totalItemsCount || 0}</span>
                </div>
            </div>
        `;
        container.innerHTML += cardHTML;
    });
}


// --- DELETE LOGIC (سڕینەوە) ---
function deleteTransaction(transactionId) {
    if (!confirm('ئایا دڵنیایت لە سڕینەوەی ئەم مامەڵەیە؟ ژمارەی ئایتمەکان دەگەڕێنرێنەوە بۆ ئینڤێنتۆری.')) {
        return;
    }
    
    let transactions = getTransactions();
    let inventory = getFromStorage('inventory', []);
    let loans = getLoanTransactions(); 
    
    const transactionIndex = transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex !== -1) {
        const transactionToDelete = transactions[transactionIndex];
        
        // 1. Restore items to inventory (Reverse the sale)
        transactionToDelete.items.forEach(soldItem => {
            const inventoryItemIndex = inventory.findIndex(item => 
                (item.name || '').toLowerCase() === (soldItem.name || '').toLowerCase() &&
                (item.brand || '').toLowerCase() === (soldItem.brand || '').toLowerCase() &&
                (item.type || '').toLowerCase() === (soldItem.type || '').toLowerCase() &&
                (item.quality || '').toLowerCase() === (soldItem.quality || '').toLowerCase()
            );
            
            if (inventoryItemIndex !== -1) {
                inventory[inventoryItemIndex].quantity += (soldItem.quantity || 0); // Increase stock
            } 
        });
        
        // 2. Remove transaction
        transactions.splice(transactionIndex, 1);
        
        // 3. Remove loan record if it was a loan
        const loanIndex = loans.findIndex(l => l.transactionId === transactionId);
        if (loanIndex !== -1) {
            loans.splice(loanIndex, 1);
            saveLoanTransactions(loans);
        }

        // 4. Save and refresh
        saveToStorage('inventory', inventory);
        saveTransactions(transactions);
        analyzeInventory(); // Reload data page
        alert('مامەڵەکە بە سەرکەوتوویی سڕایەوە و ژمارەی ئایتمەکان گەڕێنرایەوە.');
    }
}


// --- EDIT LOGIC (دەستکاریکردن) ---

function closeModal() {
    const modalElement = document.getElementById('editModal');
    if (modalElement) {
        modalElement.style.display = 'none';
    }
    currentTransactionBeingEdited = null;
    const alertElement = document.getElementById('modalAlert');
    if (alertElement) {
        alertElement.textContent = ''; // Clear alerts
    }
}

function editTransaction(transactionId) {
    const transactions = getTransactions();
    const transactionToEdit = transactions.find(t => t.id === transactionId);
    
    if (!transactionToEdit) {
        alert('مامەڵەکە نەدۆزرایەوە.');
        return;
    }
    
    currentTransactionBeingEdited = transactionToEdit;
    
    // Get DOM elements safely
    const editDateElement = document.getElementById('edit-date');
    const itemsContainer = document.getElementById('edit-items-container');
    const editIdInput = document.getElementById('edit-transaction-id');
    const editModal = document.getElementById('editModal');

    if (!editDateElement || !itemsContainer || !editIdInput || !editModal) {
        console.error("Critical DOM element missing for editing. Check data.html structure.");
        alert("هەڵەیەکی ناوخۆیی: بەشێکی لاپەڕە نەدۆزرایەوە.");
        return;
    }
    
    // Fill Modal Data
    editIdInput.value = transactionId;
    editDateElement.textContent = transactionToEdit.date;
    itemsContainer.innerHTML = '';
    
    // Display each item for quantity adjustment
    transactionToEdit.items.forEach((item, index) => {
        itemsContainer.innerHTML += `
            <div class="edit-item-row">
                <span>${item.name} (${item.brand}/${item.type}) - نرخی فرۆشتن: ${(item.salePrice || 0).toLocaleString()}</span>
                <label>عدد: 
                    <input type="number" 
                           id="qty-edit-${index}" 
                           data-index="${index}"
                           data-old-qty="${item.quantity || 0}"
                           data-sale-price="${item.salePrice || 0}"
                           data-purchase-price="${item.purchasePrice || 0}"
                           value="${item.quantity || 0}" 
                           min="0" required>
                </label>
            </div>
        `;
    });
    
    editModal.style.display = 'block';
}

function saveEditedTransaction(event) {
    event.preventDefault();
    if (!currentTransactionBeingEdited) return;

    let totalNewSale = 0;
    let totalNewProfit = 0;
    let totalNewItemsCount = 0;
    
    let inventory = getFromStorage('inventory', []);
    let loans = getLoanTransactions();
    const updatedItems = [];
    
    const modalAlert = document.getElementById('modalAlert');
    const itemsToProcess = [...currentTransactionBeingEdited.items]; 
    
    modalAlert.textContent = '';
    let isQuantitiesValid = true;

    for (const [index, item] of itemsToProcess.entries()) {
        const inputElement = document.getElementById(`qty-edit-${index}`); 
        
        if (!inputElement) continue;

        const oldQuantity = parseInt(inputElement.getAttribute('data-old-qty'));
        const newQuantity = parseInt(inputElement.value);
        
        if (isNaN(newQuantity) || newQuantity < 0) {
             isQuantitiesValid = false;
             modalAlert.textContent = 'تکایە ژمارەی دروست داخڵ بکە (ژمارەی موجەب).';
             modalAlert.style.backgroundColor = '#f8d7da';
             break;
        }

        const quantityDifference = newQuantity - oldQuantity; 
        
        // 1. Update Inventory Stock based on difference
        const inventoryItemIndex = inventory.findIndex(i => 
            (i.name || '').toLowerCase() === (item.name || '').toLowerCase() && 
            (i.brand || '').toLowerCase() === (item.brand || '').toLowerCase() && 
            (i.type || '').toLowerCase() === (item.type || '').toLowerCase() && 
            (i.quality || '').toLowerCase() === (item.quality || '').toLowerCase()
        );

        if (inventoryItemIndex !== -1) {
            const currentStock = inventory[inventoryItemIndex].quantity || 0;
            
            if (quantityDifference > 0 && currentStock < quantityDifference) { 
                 modalAlert.textContent =` ناتوانیت ${quantityDifference} دانەی تر زیاد بکەیت. تەنها ${currentStock} لە عەمباردا بەردەستە.`;
                 modalAlert.style.backgroundColor = '#f8d7da';
                 isQuantitiesValid = false;
                 break;
            }
            inventory[inventoryItemIndex].quantity -= quantityDifference;
        } else {
             modalAlert.textContent =` ئایتمی ${item.name} لە عەمباردا نەدۆزرایەوە بۆ دەستکاریکردنی ستۆک.`;
             modalAlert.style.backgroundColor = '#f8d7da';
             isQuantitiesValid = false;
             return;
        }
        
        // 2. Calculate new metrics
        const salePrice = item.salePrice || 0;
        const purchasePrice = item.purchasePrice || 0;
        const itemProfit = (salePrice - purchasePrice) * newQuantity;

        totalNewSale += salePrice * newQuantity;
        totalNewProfit += itemProfit;
        totalNewItemsCount += newQuantity;
        
        // 3. Update the transaction's item list
        const updatedItem = { ...item, quantity: newQuantity, profit: itemProfit };
        updatedItems.push(updatedItem);
    } 

    if (!isQuantitiesValid) return;


    // 4. Update the main transaction object
    currentTransactionBeingEdited.totalSale = totalNewSale;
    currentTransactionBeingEdited.totalProfit = totalNewProfit;
    currentTransactionBeingEdited.totalItemsCount = totalNewItemsCount;
    currentTransactionBeingEdited.items = updatedItems.filter(item => item.quantity > 0); 
    
    
    // 5. Save all changes
    let transactions = getTransactions();
    const index = transactions.findIndex(t => t.id === currentTransactionBeingEdited.id);
    if (index !== -1) {
        transactions[index] = currentTransactionBeingEdited;
    }
    
    const loanIndex = loans.findIndex(l => l.transactionId === currentTransactionBeingEdited.id);
    if (loanIndex !== -1) {
        loans[loanIndex].amountDue = totalNewSale;
        loans[loanIndex].items = currentTransactionBeingEdited.items;
        saveLoanTransactions(loans);
    }


    saveToStorage('inventory', inventory); 
    saveTransactions(transactions); 
    
    closeModal();
    analyzeInventory(); 
    alert('مامەڵەکە بە سەرکەوتوویی دەستکاری کرا.');
}


// Initial Load Dispatcher
function loadDataPage() {
    analyzeInventory(); 
    const defaultTabButton = document.querySelector('.tab-btn');
    if (defaultTabButton) {
        showTab('all-transactions', defaultTabButton);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('transactionsListContainer')) {
        loadDataPage();
    }
    
    const closeButton = document.querySelector('.close-btn');
    if (closeButton) {
        closeButton.onclick = closeModal;
    }
});