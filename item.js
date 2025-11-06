// item.js - FINAL STABLE LOCAL STORAGE VERSION (Item Management & Base Storage)

// --- General Local Storage Functions (Synchronous Base) ---
// Define all keys here for consistency
const INVENTORY_KEY = "inventory";
const COMPONENTS_KEY = "componentsData"; 

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

// --- Data Access Utilities ---
function getInventory() { return getFromStorage(INVENTORY_KEY, []); }
function getComponentData() {
    return getFromStorage(COMPONENTS_KEY, {
        brands: ['سامسونگ', 'ئەپڵ'],
        types: [{ name: 'شاشە', color: '#007bff' }],
        qualities: ['بیلادی', 'نۆڕماڵ']
    });
}
function saveComponentData(data) { saveToStorage(COMPONENTS_KEY, data); }

// --- Transaction/Loan Access (Defined here to avoid redundancy) ---
function getTransactions() { return getFromStorage('salesTransactions', []); }
function saveTransactions(transactions) { saveToStorage('salesTransactions', transactions); }
function getLoanTransactions() { return getFromStorage('loanTransactions', []); }
function saveLoanTransactions(loans) { saveToStorage('loanTransactions', loans); }
function getCustomers() { return getFromStorage('customerData', []); } 

// ==========================================================
// --- ITEM MANAGEMENT LOGIC (item.html) ---
// (All Item CRUD and Component Management functions must follow here)
// ...
// ==========================================================
// --- ITEM MANAGEMENT PAGE LOGIC (item.html) ---
// ==========================================================

let editingItemId = null; // Global variable for edit mode

// --- Component Management ---

function loadComponents() {
    const components = getComponentData(); 
    
    const brands = components.brands || ['سامسونگ', 'ئەپڵ'];
    const types = components.types || [{ name: 'شاشە', color: '#007bff' }];
    const qualities = components.qualities || ['بیلادی', 'نۆڕماڵ'];
    
    // Display in side panel 
    displayComponents('brandList', brands, 'deleteBrand', false);
    displayComponents('qualityList', qualities, 'deleteQuality', false);
    displayTypes('typeList', types); 
    
    // Populate Item Form Selects
    populateSelect('itemBrand', brands);
    populateSelect('itemType', types.map(t => t.name));
    populateSelect('itemQuality', qualities);
}

function updateComponents(newComponents) {
    saveComponentData(newComponents);
    loadComponents(); // Synchronous reload
}


// --- Component Display Functions (Synchronous) ---
function displayComponents(listId, items, deleteFunctionName, includeColor = false) {
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = '';
    items.forEach(item => {
        const itemName = typeof item === 'object' ? item.name : item;
        const color = typeof item === 'object' ? item.color : null;
        
        const colorIndicator = color ? `<span class="type-color-indicator" style="background-color: ${color};"></span> `: '';
        const li = document.createElement('li');
        // FIX: Ensure deleteFunctionName is defined before passing to onclick (was a potential source of error)
        li.innerHTML = `
            <span>
                ${colorIndicator}
                ${itemName}
            </span>
            <button class="delete-btn" onclick="${deleteFunctionName}('${itemName}')">سڕینەوە</button>
        `;
        list.appendChild(li);
    });
}

function displayTypes(listId, types) {
    const list = document.getElementById(listId);
    if (!list) return;

    list.innerHTML = '';
    types.forEach(type => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>
                <span class="type-color-indicator" style="background-color: ${type.color};"></span>
                ${type.name}
            </span>
            <button class="delete-btn" onclick="deleteType('${type.name}')">سڕینەوە</button>
        `;
        list.appendChild(li);
    });
}

function populateSelect(selectId, items) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>هەڵبژێرە...</option>';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}


// --- Component CRUD (Synchronous) ---

function addBrand(event) {
    event.preventDefault();
    const input = document.getElementById('newBrand');
    const newBrand = input.value.trim();

    if (newBrand) {
        const components = getComponentData();
        const brands = components.brands || [];
        if (!brands.includes(newBrand)) {
            brands.push(newBrand);
            components.brands = brands;
            saveComponentData(components);
            input.value = '';
            loadComponents();
        } else {
            alert('ئەو براندە پێشتر بوونی هەیە.');
        }
    }
}

function deleteBrand(brandToDelete) {
    if (confirm(`دڵنیایت لە سڕینەوەی براندی "${brandToDelete}"؟`)) {
        const components = getComponentData();
        let brands = components.brands || [];
        brands = brands.filter(b => b !== brandToDelete);
        components.brands = brands;
        saveComponentData(components);
        loadComponents();
    }
}

function addQuality(event) {
    event.preventDefault();
    const input = document.getElementById('newQuality');
    const newQuality = input.value.trim();

    if (newQuality) {
        const components = getComponentData();
        const qualities = components.qualities || [];
        if (!qualities.includes(newQuality)) {
            qualities.push(newQuality);
            components.qualities = qualities;
            saveComponentData(components);
            input.value = '';
            loadComponents();
        } else {
            alert('ئەو کوالێتییە پێشتر بوونی هەیە.');
        }
    }
}

function deleteQuality(qualityToDelete) {
    if (confirm(`دڵنیایت لە سڕینەوەی کوالێتی "${qualityToDelete}"`)) {
        const components = getComponentData();
        let qualities = components.qualities || [];
        qualities = qualities.filter(q => q !== qualityToDelete);
        components.qualities = qualities;
        saveComponentData(components);
        loadComponents();
    }
}

function addType(event) {
    event.preventDefault();
    const input = document.getElementById('newType');
    const colorInput = document.getElementById('newTypeColor');
    const newTypeName = input.value.trim();
    const newTypeColor = colorInput.value;

    if (newTypeName) {
        const components = getComponentData();
        const types = components.types || [];
        if (!types.some(t => t.name === newTypeName)) {
            types.push({ name: newTypeName, color: newTypeColor });
            components.types = types;
            saveComponentData(components);
            input.value = '';
            loadComponents();
        } else {
            alert('ئەو جۆرە پێشتر بوونی هەیە.');
        }
    }
}

function deleteType(typeToDelete) {
    if (confirm(`دڵنیایت لە سڕینەوەی جۆری "${typeToDelete}"`)) {
        const components = getComponentData();
        let types = components.types || [];
        types = types.filter(t => t.name !== typeToDelete);
        components.types = types;
        saveComponentData(components);
        loadComponents();
    }
}

function setItemColorByType() {
    const selectedType = document.getElementById('itemType').value;
    const colorInput = document.getElementById('itemColor');
    const types = getFromStorage('types');

    const typeObject = types.find(t => t.name === selectedType);
    
    if (typeObject) {
        colorInput.value = typeObject.color;
    } else {
        colorInput.value = '#ccc'; // Default if none selected
    }
}


// --- Inventory CRUD (Synchronous LocalStorage calls) ---

function loadItems() {
    const items = getInventory(); 
    displayItemsTable(items);
    // Only set color if the item form is present (i.e., on item.html)
    if (document.getElementById('itemForm')) { 
        setItemColorByType(); 
    }
}

function saveOrUpdateItem(event) {
    event.preventDefault();

    const name = document.getElementById('itemName').value;
    const brand = document.getElementById('itemBrand').value;
    const type = document.getElementById('itemType').value; 
    const quality = document.getElementById('itemQuality').value;
    
    const newPurchasePrice = parseInt(document.getElementById('itemPurchasePrice').value);
    const salePrice = parseInt(document.getElementById('itemSalePrice').value);
    const newQuantity = parseInt(document.getElementById('itemQuantity').value); 
    
    if (isNaN(newPurchasePrice) || isNaN(salePrice) || isNaN(newQuantity) || newPurchasePrice < 0 || salePrice < 0 || newQuantity < 1) {
        alert('تکایە دڵنیابە لەوەی هەموو نرخ و ژمارەکان بە دروستی داخڵ کراون (ژمارەی موجەب).');
        return; 
    }

    const components = getComponentData();
    const itemType = (components.types || []).find(t => t.name === type);
    const color = itemType ? itemType.color : '#007bff';

    let items = getInventory(); 

    const itemData = {
        name, brand, type, quality, salePrice, color 
    };

    if (editingItemId) {
        const index = items.findIndex(item => item.id === editingItemId);
        if (index !== -1) {
            items[index] = { 
                id: editingItemId, 
                ...itemData, 
                purchasePrice: newPurchasePrice,
                quantity: newQuantity
            };
            alert('ئایتمەکە بە سەرکەوتوویی نوێ کرایەوە!');
        }
        editingItemId = null;
    } else {
        const existingItemIndex = items.findIndex(item => 
            item.name === name && item.brand === brand && item.type === type && item.quality === quality
        );

        if (existingItemIndex !== -1) {
            const existingItem = items[existingItemIndex];
            
            const totalOldCost = existingItem.purchasePrice * existingItem.quantity;
            const totalNewCost = newPurchasePrice * newQuantity;
            const totalQuantity = existingItem.quantity + newQuantity;
            
            const averagePurchasePrice = Math.round((totalOldCost + totalNewCost) / totalQuantity);
            
            items[existingItemIndex].quantity = totalQuantity;
            items[existingItemIndex].purchasePrice = averagePurchasePrice;
            items[existingItemIndex].salePrice = salePrice;
            items[existingItemIndex].color = color;
            
            alert(`ژمارەی ئایتمی "${name}" زیاد کرا. ژمارەی نوێ: ${totalQuantity}. تێکڕای نرخی کڕینی نوێ: ${averagePurchasePrice.toLocaleString()} دینار.`);

        } else {
            const newItem = { 
                id: Date.now(), 
                ...itemData,
                purchasePrice: newPurchasePrice,
                quantity: newQuantity
            };
            items.push(newItem);
            alert('ئایتمی نوێ بە سەرکەوتوویی زیاد کرا!');
        }
    }

    saveToStorage(INVENTORY_KEY, items); 
    resetForm();
    loadItems();
}


function editItem(itemId) {
    const items = getInventory(); 
    const itemToEdit = items.find(item => item.id === itemId);

    if (itemToEdit) {
        document.getElementById('itemName').value = itemToEdit.name;
        document.getElementById('itemBrand').value = itemToEdit.brand;
        document.getElementById('itemType').value = itemToEdit.type; 
        document.getElementById('itemQuality').value = itemToEdit.quality;
        
        document.getElementById('itemPurchasePrice').value = itemToEdit.purchasePrice;
        document.getElementById('itemSalePrice').value = itemToEdit.salePrice;
        
        document.getElementById('itemQuantity').value = itemToEdit.quantity;
        document.getElementById('itemColor').value = itemToEdit.color; 
        
        editingItemId = itemId;
        document.getElementById('formTitle').textContent =` دەستکاریکردنی ئایتم: ${itemToEdit.name}`;
        document.getElementById('submitBtn').textContent = '💾 نوێکردنەوە';
        document.getElementById('submitBtn').style.backgroundColor = '#ffc107'; 
        
        document.getElementById('itemPurchasePrice').readOnly = false; 
        document.getElementById('itemQuantity').readOnly = false;
    }
}

function deleteItem(itemId) {
    if (confirm('دڵنیایت لە سڕینەوەی ئەم ئایتمە بە یەکجاری؟')) {
        let items = getInventory(); 
        items = items.filter(item => item.id !== itemId);
        saveToStorage(INVENTORY_KEY, items);
        loadItems();
    }
}

function resetForm() {
    document.getElementById('itemForm').reset();
    editingItemId = null;
    document.getElementById('formTitle').textContent = 'زیادکردنی ئایتمی نوێ';
    document.getElementById('submitBtn').textContent = '✅ زیادکردن';
    document.getElementById('submitBtn').style.backgroundColor = '#28a745';
    document.getElementById('itemColor').value = '#007bff'; 
}

// Display table (Modified to handle missing purchasePrice/salePrice)
function displayItemsTable(items) {
    const container = document.getElementById('itemListTableContainer');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #555;">هیچ ئایتمێک تۆمار نەکراوە.</p>';
        return;
    }

    let tableHTML = `
        <table class="item-table">
            <thead>
                <tr>
                    <th></th>
                    <th>ناوی ئایتم</th>
                    <th>جۆر</th>
                    <th>براند</th>
                    <th>کوالێتی</th>
                    <th>نرخی کڕین</th>
                    <th>نرخی فرۆشتن</th>
                    <th>قازانجی یەکەیی</th>
                    <th>بەردەست (عدد)</th>
                    <th>کردار</th>
                </tr>
            </thead>
            <tbody>
    `;

    items.forEach(item => {
        const purchasePrice = item.purchasePrice || 0;
        const salePrice = item.salePrice || 0;

        const unitProfit = salePrice - purchasePrice;
        let profitStyle = 'color: black; font-weight: bold;';
        if (unitProfit > 0) {
            profitStyle = 'color: #28a745; font-weight: bold;'; 
        } else if (unitProfit < 0) {
            profitStyle = 'color: #dc3545; font-weight: bold;'; 
        }
        
        tableHTML += `
            <tr style="border-right: 5px solid ${item.color || '#ccc'};">
                <td style="background-color: ${item.color || '#ccc'}; width: 10px;"></td>
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${item.brand}</td>
                <td>${item.quality}</td>
                <td>${purchasePrice.toLocaleString()}</td>
                <td>${salePrice.toLocaleString()}</td>
                <td style="${profitStyle}">${unitProfit.toLocaleString()}</td>
                <td>${item.quantity}</td>
                <td>
                    <div class="action-btns">
                        <button class="edit-btn" onclick="editItem(${item.id})">دەستکاری</button>
                        <button class="delete-item-btn" onclick="deleteItem(${item.id})">سڕینەوە</button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    container.innerHTML = tableHTML;
}

// Initial Load for Item Management Page
document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the item management page
    if (document.getElementById('itemForm')) {
        loadComponents();
        loadItems();
    }
});