// inventory.js - کۆدی تەواوکراو و بێ نەقس بۆ مەخزەن

// 🚨 کلیلە پێویستەکان (پێویستە لەسەرەوە ڕابگەیەنرێن)
const WAREHOUSE_INVENTORY_KEY = "warehouseInventory"; 

let editingWarehouseItemId = null; 

// --- Shared Storage Functions (بۆ دڵنیابوونەوە لە بەردەستبوونیان) ---
function getFromStorage(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// وەرگرتنی داتای کاڵاکانی مەخزەن
function getWarehouseInventory() { 
    return getFromStorage(WAREHOUSE_INVENTORY_KEY, []); 
}

function saveWarehouseInventory(data) {
    saveToStorage(WAREHOUSE_INVENTORY_KEY, data);
}

// وەرگرتنی داتای پێکهاتەکان (لە item.js وەردەگیرێت)
function getComponentData() {
    return getFromStorage(COMPONENTS_KEY, {
        // داتای سەرەتایی بۆ دڵنیابوونەوە
        brands: ['سامسونگ', 'ئەپڵ'], 
        types: [{ name: 'شاشە', color: '#007bff' }],
        qualities: ['بیلادی', 'نۆڕماڵ']
    });
}


// --- Component Utilities ---

function populateSelect(selectId, items) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>هەڵبژێرە...</option>';
    
    const itemsArray = Array.isArray(items) ? items : []; 
    
    itemsArray.forEach(item => {
        const option = document.createElement('option');
        
        // وەرگرتنی ناوی براند یان جۆر
        const itemName = typeof item === 'object' && item !== null && item.name !== undefined ? item.name : item; 
        
        option.value = itemName;
        option.textContent = itemName;
        select.appendChild(option);
    });
}

function populateWarehouseSelects() {
    const components = getComponentData(); 
    
    // ✅ پڕکردنەوەی براندەکان (کە کێشەی هەبوو)
    populateSelect('w_itemBrand', components.brands || []);
    
    // پڕکردنەوەی جۆرەکان
    const typeNames = (components.types || []).map(t => t.name);
    populateSelect('w_itemType', typeNames);
    
    // پڕکردنەوەی کوالێتییەکان
    populateSelect('w_itemQuality', components.qualities || []);
}


// ==========================================================
// --- WAREHOUSE ITEM CRUD (زیادکردن/گۆڕین) ---
// ==========================================================

function resetWarehouseForm() {
    document.getElementById('warehouseItemForm').reset();
    document.getElementById('w_name').readOnly = false;
    editingWarehouseItemId = null;
    document.getElementById('w_submitBtn').textContent = '✅ زیادکردن بۆ مەخزەن';
    document.getElementById('w_submitBtn').style.backgroundColor = '#ffc107'; 
    populateWarehouseSelects(); 
}

function editWarehouseItem(itemId) {
    const items = getWarehouseInventory(); 
    const itemToEdit = items.find(item => item.id === itemId);

    if (itemToEdit) {
        populateWarehouseSelects(); 
        
        document.getElementById('w_name').value = itemToEdit.name;
        document.getElementById('w_itemBrand').value = itemToEdit.brand || '';
        document.getElementById('w_itemType').value = itemToEdit.type || '';
        document.getElementById('w_itemQuality').value = itemToEdit.quality || '';
        document.getElementById('w_quantity').value = itemToEdit.quantity;
        document.getElementById('w_purchasePrice').value = itemToEdit.purchasePrice;
        document.getElementById('w_location').value = itemToEdit.location || '';
        document.getElementById('w_note').value = itemToEdit.note || '';

        editingWarehouseItemId = itemId;
        document.getElementById('w_submitBtn').textContent = '💾 نوێکردنەوەی کاڵا';
        document.getElementById('w_submitBtn').style.backgroundColor = '#007bff'; 
        
        document.getElementById('w_name').readOnly = true; 
    }
}


function saveWarehouseItem(event) {
    event.preventDefault();
    
    const name = document.getElementById('w_name').value.trim();
    const brand = document.getElementById('w_itemBrand').value;
    const type = document.getElementById('w_itemType').value; 
    const quality = document.getElementById('w_itemQuality').value;
    
    const quantity = parseInt(document.getElementById('w_quantity').value);
    const purchasePrice = parseInt(document.getElementById('w_purchasePrice').value);
    const location = document.getElementById('w_location').value.trim();
    const note = document.getElementById('w_note').value.trim();

    if (!name || !brand || !type || !quality || isNaN(quantity) || isNaN(purchasePrice) || quantity < 1 || purchasePrice < 0) {
        alert('تکایە دڵنیابە لەوەی هەموو ناونیشانەکان (ناو، براند، جۆر، کوالێتی) و نرخەکان بە دروستی داخڵ کراون.');
        return; 
    }
    
    const components = getComponentData();
    const itemType = (components.types || []).find(t => t.name === type);
    const color = itemType ? itemType.color : '#ffc107';

    let items = getWarehouseInventory(); 

    const newItemData = {
        name, brand, type, quality, 
        quantity, purchasePrice, location, note,
        dateAdded: new Date().toISOString().split('T')[0], 
        color 
    };
    
    if (editingWarehouseItemId) {
        const index = items.findIndex(item => item.id === editingWarehouseItemId);
        if (index !== -1) {
            items[index] = { ...items[index], ...newItemData, id: editingWarehouseItemId };
            alert('کاڵای مەخزەن بە سەرکەوتوویی نوێ کرایەوە!');
        }
    } else {
        const existingItemIndex = items.findIndex(item => 
             item.name === name && item.brand === brand && item.type === type && item.quality === quality
        );

        if (existingItemIndex !== -1) {
            const existingItem = items[existingItemIndex];
            const totalOldCost = existingItem.purchasePrice * existingItem.quantity;
            const totalNewCost = purchasePrice * quantity;
            const totalQuantity = existingItem.quantity + quantity;
            
            const averagePurchasePrice = Math.round((totalOldCost + totalNewCost) / totalQuantity);
            
            items[existingItemIndex].quantity = totalQuantity;
            items[existingItemIndex].purchasePrice = averagePurchasePrice;
            items[existingItemIndex].location = location; 
            items[existingItemIndex].note = note; 
            
        } else {
            const newItem = { id: Date.now(), ...newItemData };
            items.push(newItem);
        }
    }

    saveWarehouseInventory(items); 
    resetWarehouseForm(); 
    loadWarehouseItems(); 
}


// ==========================================================
// --- WAREHOUSE DISPLAY LOGIC (پیشاندانی کارتەکانی مەخزەن) ---
// ==========================================================

function loadWarehouseItems() {
    const items = getWarehouseInventory(); 
    
    const searchInput = document.getElementById('inventorySearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let itemsToDisplay = items;

    if (searchTerm) {
        itemsToDisplay = items.filter(item => {
            const itemString = [
                item.name, item.location, item.note, item.brand, item.type, item.quality
            ].join(' ').toLowerCase();

            return itemString.includes(searchTerm);
        });
    }

    displayInventoryTable(itemsToDisplay);
}

function displayInventoryTable(items) {
    const container = document.getElementById('inventoryListTableContainer');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p class="no-items-message">هیچ کاڵایەک لە مەخزەنی ماڵەوەدا نییە یان دۆزرایەوە.</p>';
        const existingSummary = document.querySelector('.inventory-total-summary');
        if (existingSummary) existingSummary.remove();
        return;
    }
    
    container.innerHTML = '<div class="inventory-card-grid"></div>'; 
    const gridContainer = container.querySelector('.inventory-card-grid');

    let totalInventoryValue = 0; 

    items.forEach(item => {
        const quantity = item.quantity || 0;
        const purchasePrice = item.purchasePrice || 0;
        const totalItemCost = quantity * purchasePrice;
        totalInventoryValue += totalItemCost;

        const cardHTML = `
            <div class="inventory-card" style="border-right-color: ${item.color || '#ffc107'};">
                <div class="card-header">
                    <h3 class="item-name">${item.name}</h3>
                    <div class="action-buttons">
                        <button class="edit-card-btn" onclick="editWarehouseItem(${item.id})">
                           <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-card-btn" onclick="deleteWarehouseItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="card-body">
                    
                    <div class="info-group type-group">
                        <span class="info-label"><i class="fas fa-tags"></i> جۆر:</span>
                        <span class="info-value">${item.type || '—'}</span>
                    </div>
                    
                    <div class="info-group brand-group">
                        <span class="info-label"><i class="fas fa-registered"></i> براند:</span>
                        <span class="info-value">${item.brand || '—'}</span>
                    </div>

                    <div class="info-group quality-group">
                        <span class="info-label"><i class="fas fa-star"></i> کوالێتی:</span>
                        <span class="info-value">${item.quality || '—'}</span>
                    </div>
                    
                    <div class="info-group total-value">
                        <span class="info-label">کۆی بەها:</span>
                        <span class="info-value total-cost-value">${totalItemCost.toLocaleString()} دینار</span>
                    </div>
                    
                    <div class="info-group quantity-row">
                        <span class="info-label"><i class="fas fa-cubes"></i> بڕی بەردەست:</span>
                        <span class="info-value quantity-value">${quantity.toLocaleString()}</span>
                    </div>

                    <div class="info-group location-group">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="info-label">شوێن:</span>
                        <span class="info-value">${item.location || 'دیاری نەکراوە'}</span>
                    </div>
                    <div class="info-group note-group">
                        <i class="fas fa-sticky-note"></i>
                        <span class="info-label">تێبینی:</span>
                        <span class="info-value note-text">${item.note || '—'}</span>
                    </div>

                    <div class="transfer-section">
                        <form onsubmit="
                            event.preventDefault(); 
                            const input = document.getElementById('transfer-qty-${item.id}');
                            transferItemToStore(${item.id}, parseInt(input.value));
                        ">
                            <input type="number" 
                                id="transfer-qty-${item.id}"
                                min="1" 
                                max="${quantity}" 
                                value="1"
                                placeholder="بڕی گواستنەوە"
                                required 
                                class="transfer-input">
                            <button type="submit" class="transfer-btn" title="گواستنەوە بۆ پەرەی فرۆشتنی دوکان">
                                گواستنەوە <i class="fas fa-arrow-left"></i>
                            </button>
                        </form>
                    </div>
                    </div>
            </div>
        `;
        
        gridContainer.insertAdjacentHTML('beforeend', cardHTML);
    });

    const existingSummary = document.querySelector('.inventory-total-summary');
    if (existingSummary) existingSummary.remove();
    
    const totalDisplay = document.createElement('div');
    totalDisplay.className = 'inventory-total-summary';
    totalDisplay.innerHTML = `
        <span class="total-label">کۆی گشتی بەهای مەخزەنی ماڵەوە:</span>
        <span class="total-value-final">${totalInventoryValue.toLocaleString()} دینار</span>
    `;
    container.insertAdjacentElement('beforeend', totalDisplay);
}


function deleteWarehouseItem(itemId) {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم کاڵایەی مەخزەن؟')) {
        let items = getWarehouseInventory(); 
        items = items.filter(item => item.id !== itemId);
        saveWarehouseInventory(items); 
        loadWarehouseItems(); 
    }
}


// بارکردنی داتاکان کاتێک پەڕەکە دەکرێتەوە
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('inventoryListTableContainer')) {
        loadWarehouseItems();
        populateWarehouseSelects(); 
    }
});



// --- داتا Access بۆ کاڵای دوکان (دەبێت لە item.jsەوە بیهێنین) ---
// ⚠️ ئەم فەنکشنانە لەبەر ئەوە لێرە دووبارە کرانەوە کە تۆ ناتەوێت item.js بگۆڕیت.
function getStoreInventory() { return getFromStorage(INVENTORY_KEY, []); } 
function saveStoreInventory(data) { saveToStorage(INVENTORY_KEY, data); }


function transferItemToStore(itemId, transferQuantity) {
    let warehouseItems = getWarehouseInventory();
    const itemIndex = warehouseItems.findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
        alert("کاڵاکە لە مەخزەندا نەدۆزرایەوە!");
        return;
    }

    const warehouseItem = warehouseItems[itemIndex];
    
    // 1. پشکنینی بڕ
    if (transferQuantity <= 0 || transferQuantity > warehouseItem.quantity) {
        alert(`تکایە بڕێکی دروست داخڵ بکە. زۆرترین بڕ: ${warehouseItem.quantity}`);
        return;
    }

    // 2. دروستکردنی کاڵای نوێ بۆ دوکان
    const itemToTransfer = {
        name: warehouseItem.name,
        brand: warehouseItem.brand,
        type: warehouseItem.type,
        quality: warehouseItem.quality,
        purchasePrice: warehouseItem.purchasePrice,
        salePrice: 0, // ⚠️ نرخی فرۆشتن لە مەخزەن نییە، دەبێت دواتر لە item.html دیاری بکرێت
        quantity: transferQuantity,
        color: warehouseItem.color,
        storageLocation: warehouseItem.location || 'گوازراوەتەوە',
        // IDی نوێ بۆ کاڵای دوکان
        id: Date.now() 
    };

    // 3. لۆژیکی زیادکردنی کاڵا بۆ دوکان (لۆژیکی item.js)
    let storeItems = getStoreInventory();
    const existingStoreIndex = storeItems.findIndex(item => 
        item.name === itemToTransfer.name && 
        item.brand === itemToTransfer.brand && 
        item.type === itemToTransfer.type && 
        item.quality === itemToTransfer.quality
    );

    if (existingStoreIndex !== -1) {
        // تێکەڵکردن (Merging) و نوێکردنەوەی نرخی کڕین
        const existingItem = storeItems[existingStoreIndex];
        const totalOldCost = existingItem.purchasePrice * existingItem.quantity;
        const totalNewCost = itemToTransfer.purchasePrice * transferQuantity;
        const totalQuantity = existingItem.quantity + transferQuantity;
        
        const averagePurchasePrice = Math.round((totalOldCost + totalNewCost) / totalQuantity);
        
        storeItems[existingStoreIndex].quantity = totalQuantity;
        storeItems[existingStoreIndex].purchasePrice = averagePurchasePrice;
        storeItems[existingStoreIndex].color = itemToTransfer.color; 
        
        alert(`بڕی ${transferQuantity} کاڵای "${warehouseItem.name}" گوازراوەتەوە بۆ دوکان. کۆی بڕی دوکان: ${totalQuantity}.`);

    } else {
        // زیادکردنی کاڵای نوێ بۆ دوکان
        storeItems.push(itemToTransfer);
    }

    // 4. کەمکردنەوەی بڕ لە مەخزەن و سەیڤکردنی داتا
    warehouseItem.quantity -= transferQuantity;

    if (warehouseItem.quantity <= 0) {
        warehouseItems.splice(itemIndex, 1); // سڕینەوەی کاڵا ئەگەر بڕەکەی بوو بە سفر
    } else {
        warehouseItems[itemIndex] = warehouseItem;
    }

    saveStoreInventory(storeItems);
    saveWarehouseInventory(warehouseItems);
    loadWarehouseItems(); // فرێشکردنەوەی لیستی مەخزەن
}