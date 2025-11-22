// item.js - FINAL LOCAL STORAGE VERSION WITH STORAGE LOCATION FEATURE

// --- Constants ---
const INVENTORY_KEY = "inventory";
const COMPONENTS_KEY = "componentsData"; 

// --- Shared Storage Access (Synchronous Base) ---

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

// --- Data Access Utilities (Synchronous) ---
function getInventory() { return getFromStorage(INVENTORY_KEY, []); }

function getComponentData() {
    return getFromStorage(COMPONENTS_KEY, {
        brands: [],
        types: [{ name: 'شاشە', color: '#007bff' }],
        qualities: ['بیلادی', 'نۆڕماڵ']
    });
}
function saveComponentData(data) { saveToStorage(COMPONENTS_KEY, data); }

// Cache used by item form to lookup type colors and names (populated by loadComponents)
let COMPONENTS_CACHE = { typesObjects: [], brandsObjects: [], qualitiesObjects: [] };

// --- Transaction/Loan Access (Defined here to avoid redundancy) ---
function getTransactions() { return getFromStorage('salesTransactions', []); }
function saveTransactions(transactions) { saveToStorage('salesTransactions', transactions); }
function getLoanTransactions() { return getFromStorage('loanTransactions', []); }
function saveLoanTransactions(loans) { saveToStorage('loanTransactions', loans); }
function getCustomers() { return getFromStorage('customerData', []); } 

// ==========================================================
// --- ITEM MANAGEMENT LOGIC (item.html) ---
// ==========================================================

let editingItemId = null; // Global variable for edit mode

// --- Component Management ---

function loadComponents() { 
    // Try to read the newer separated keys (used by brand.js) first
    const components = getComponentData();
    const brandsKey = getFromStorage('brands', []);
    const typesKey = getFromStorage('types', []);
    const qualitiesKey = getFromStorage('qualities', []);

    // Determine brands list (brand.js stores objects {id,name,description})
    let brands = [];
    let brandsObjects = [];
    if (Array.isArray(brandsKey) && brandsKey.length) {
        brandsObjects = brandsKey;
        brands = brandsKey.map(b => (typeof b === 'string' ? b : (b.name || ''))).filter(Boolean);
    } else {
        brandsObjects = components.brands || [];
        brands = Array.isArray(brandsObjects) ? brandsObjects : [];
    }

    // Types may be objects {id,name,color} or legacy objects {name,color}
    let types = [];
    let typesObjects = [];
    if (Array.isArray(typesKey) && typesKey.length) {
        typesObjects = typesKey;
        types = typesKey.map(t => (typeof t === 'string' ? t : (t.name || ''))).filter(Boolean);
    } else {
        typesObjects = components.types || [];
        types = (typesObjects || []).map(t => (typeof t === 'string' ? t : (t.name || ''))).filter(Boolean);
    }

    // Qualities may be strings or objects {id,label,score}
    let qualities = [];
    let qualitiesObjects = [];
    if (Array.isArray(qualitiesKey) && qualitiesKey.length) {
        qualitiesObjects = qualitiesKey;
        qualities = qualitiesKey.map(q => (typeof q === 'string' ? q : (q.label || q))).filter(Boolean);
    } else {
        qualitiesObjects = components.qualities || [];
        qualities = Array.isArray(qualitiesObjects) ? qualitiesObjects : [];
    }

    // Update cache used for color lookups
    COMPONENTS_CACHE.typesObjects = typesObjects;
    COMPONENTS_CACHE.brandsObjects = brandsObjects;
    COMPONENTS_CACHE.qualitiesObjects = qualitiesObjects;

    // Populate Item Form Selects if present (use names for values to keep existing item schema)
    if (document.getElementById('itemBrand')) populateSelect('itemBrand', brands);
    if (document.getElementById('itemType')) populateSelect('itemType', types);
    if (document.getElementById('itemQuality')) populateSelect('itemQuality', qualities);
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
    const selectedType = document.getElementById('itemType')?.value;
    const colorInput = document.getElementById('itemColor');
    if (!colorInput) return;

    const types = COMPONENTS_CACHE.typesObjects || [];
    // typesObjects may be array of strings or objects
    const typeObject = types.find(t => (typeof t === 'string' ? t === selectedType : (t.name === selectedType)));
    if (typeObject && typeof typeObject === 'object') {
        colorInput.value = typeObject.color || '#ccc';
    } else {
        colorInput.value = '#ccc';
    }
}


// --- Inventory CRUD (Synchronous LocalStorage calls) ---

// لە item.js: گۆڕینی فەنکشنی loadItems()

 function loadItems() { // 🚨 async
    const items =  getInventory(); // 🚨 await
    
    // 1. وەرگرتنی نرخی گەڕان
    const searchInput = document.getElementById('itemSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let itemsToDisplay = items;

    // 2. فلتەرکردنی داتا ئەگەر گەڕان هەبێت
    if (searchTerm) {
        itemsToDisplay = items.filter(item => {
            const itemString = [
                item.name, 
                item.brand, 
                item.quality,
                item.type, 
                item.storageLocation // ⚠️ شوێنی هەڵگرتنی نوێ زیاد کرا
            ].join(' ').toLowerCase();

            return itemString.includes(searchTerm);
        });
    }
    
    // 3. نیشاندانی خشتەی فلتەرکراو
    displayItemsTable(itemsToDisplay);
    
    // ensure components cache exists (for inline row creation)
    if (!COMPONENTS_CACHE.typesObjects) COMPONENTS_CACHE.typesObjects = [];
}

function saveOrUpdateItem(event) { 
    event.preventDefault();

    const name = document.getElementById('itemName').value;
    const brand = document.getElementById('itemBrand').value;
    const type = document.getElementById('itemType').value; 
    const quality = document.getElementById('itemQuality').value;
    
    // ⚠️ New Input for Storage Location
    const storageLocation = document.getElementById('storageLocation').value.trim();

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
        name, brand, type, quality, salePrice, color, 
        storageLocation // ✅ زیادکردنی شوێنی هەڵگرتن
    };

    if (editingItemId) {
        const index = items.findIndex(item => item.id === editingItemId);
        if (index !== -1) {
            items[index] = { 
                id: editingItemId, 
                ...itemData, 
                purchasePrice: newPurchasePrice,
                quantity: newQuantity,
                storageLocation // ✅ نوێکردنەوەی شوێن
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
            items[existingItemIndex].storageLocation = storageLocation; // ✅ نوێکردنەوەی شوێن
            
            alert(`ژمارەی ئایتمی "${name}" زیاد کرا. ژمارەی نوێ: ${totalQuantity}. تێکڕای نرخی کڕینی نوێ: ${averagePurchasePrice.toLocaleString()} دینار.`);

        } else {
            const newItem = { 
                id: Date.now(), 
                ...itemData,
                purchasePrice: newPurchasePrice,
                quantity: newQuantity,
                storageLocation // ✅ زیادکردنی شوێنی هەڵگرتن
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
    // Open an inline edit row prefilled with item data
    const items = getInventory();
    const itemToEdit = items.find(item => item.id === itemId);
    if (!itemToEdit) return;

    // Remove any existing inline row
    const existingInline = document.querySelector('tr.inline-create-row');
    if (existingInline) existingInline.remove();

    addInlineRow(itemToEdit);
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
    // No central form anymore. Clear editing state.
    editingItemId = null;
}

// Display table (Synchronous)
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
                    <th>شوێنی هەڵگرتن</th>                     <th>کردار</th>
                </tr>
            </thead>
            <tbody id="itemTableBody">
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
                <td>${item.storageLocation || '—'}</td>                 <td>
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


// ----------------------
// Inline row creation
// ----------------------

function addInlineRow(prefill = null) {
    const tbody = document.getElementById('itemTableBody');
    // If no table exists (no items), re-render an empty table then get tbody
    if (!tbody) {
        displayItemsTable(getInventory());
    }

    // remove existing inline row if present
    const existing = document.querySelector('tr.inline-create-row');
    if (existing) return existing.querySelector('input')?.focus();

    const tableBody = document.getElementById('itemTableBody');
    if (!tableBody) return;

    const tr = document.createElement('tr');
    tr.classList.add('inline-create-row');

    // helper to create inputs/selects
    const createInput = (value = '', type = 'text', attrs = {}) => {
        const el = document.createElement('input');
        el.type = type;
        el.className = 'inline-input';
        el.value = value || '';
        Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
        return el;
    };

    // Prepare component option lists from cache
    const brands = (COMPONENTS_CACHE.brandsObjects || []).map(b => (typeof b === 'object' ? (b.name || '') : b)).filter(Boolean);
    const types = (COMPONENTS_CACHE.typesObjects || []).map(t => (typeof t === 'object' ? (t.name || '') : t)).filter(Boolean);
    const qualities = (COMPONENTS_CACHE.qualitiesObjects || []).map(q => (typeof q === 'object' ? (q.label || q) : q)).filter(Boolean);

    const nameInput = createInput(prefill?.name || '', 'text', { placeholder: 'ناوی ئایتم' });
    const typeSelect = document.createElement('select');
    typeSelect.className = 'inline-input';
    const brandSelect = document.createElement('select');
    brandSelect.className = 'inline-input';
    const qualitySelect = document.createElement('select');
    qualitySelect.className = 'inline-input';

    const makeOptions = (sel, items) => {
        sel.innerHTML = '';
        const empty = document.createElement('option'); empty.value = ''; empty.textContent = '—'; sel.appendChild(empty);
        items.forEach(it => { const opt = document.createElement('option'); opt.value = it; opt.textContent = it; sel.appendChild(opt); });
    };

    makeOptions(typeSelect, types);
    makeOptions(brandSelect, brands);
    makeOptions(qualitySelect, qualities);

    if (prefill) {
        nameInput.value = prefill.name || '';
        typeSelect.value = prefill.type || '';
        brandSelect.value = prefill.brand || '';
        qualitySelect.value = prefill.quality || '';
    }

    const purchaseInput = createInput(prefill?.purchasePrice || '', 'number', { min: 0, placeholder: 'قیمەتی کڕین' });
    const saleInput = createInput(prefill?.salePrice || '', 'number', { min: 0, placeholder: 'نرخ' });
    const qtyInput = createInput(prefill?.quantity || 1, 'number', { min: 1, placeholder: 'ژمارە' });
    const storageInput = createInput(prefill?.storageLocation || '', 'text', { placeholder: 'شوێن' });

    const profitCell = document.createElement('td');
    const updateProfit = () => {
        const pp = parseInt(purchaseInput.value) || 0;
        const sp = parseInt(saleInput.value) || 0;
        profitCell.textContent = (sp - pp).toLocaleString();
    };
    purchaseInput.addEventListener('input', updateProfit);
    saleInput.addEventListener('input', updateProfit);
    updateProfit();

    // Build cells (first color cell placeholder)
    tr.innerHTML = `<td style="width:10px;background:#eee"></td>`;
    const tdName = document.createElement('td'); tdName.appendChild(nameInput); tr.appendChild(tdName);
    const tdType = document.createElement('td'); tdType.appendChild(typeSelect); tr.appendChild(tdType);
    const tdBrand = document.createElement('td'); tdBrand.appendChild(brandSelect); tr.appendChild(tdBrand);
    const tdQuality = document.createElement('td'); tdQuality.appendChild(qualitySelect); tr.appendChild(tdQuality);
    const tdPurchase = document.createElement('td'); tdPurchase.appendChild(purchaseInput); tr.appendChild(tdPurchase);
    const tdSale = document.createElement('td'); tdSale.appendChild(saleInput); tr.appendChild(tdSale);
    tr.appendChild(profitCell);
    const tdQty = document.createElement('td'); tdQty.appendChild(qtyInput); tr.appendChild(tdQty);
    const tdStorage = document.createElement('td'); tdStorage.appendChild(storageInput); tr.appendChild(tdStorage);

    const tdActions = document.createElement('td');
    const saveBtn = document.createElement('button'); saveBtn.textContent = '💾'; saveBtn.className = 'submit-btn';
    const cancelBtn = document.createElement('button'); cancelBtn.textContent = '✖'; cancelBtn.className = 'cancel-btn';
    tdActions.appendChild(saveBtn); tdActions.appendChild(cancelBtn);
    tr.appendChild(tdActions);

    // If editing, mark the row with data-id
    if (prefill && prefill.id) tr.dataset.editingId = prefill.id;

    // Save handler
    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const brand = brandSelect.value;
        const type = typeSelect.value;
        const quality = qualitySelect.value;
        const purchasePrice = parseInt(purchaseInput.value) || 0;
        const salePrice = parseInt(saleInput.value) || 0;
        const quantity = parseInt(qtyInput.value) || 0;
        const storageLocation = storageInput.value.trim();

        if (!name || !brand || !type || !quality || quantity < 1) {
            alert('تکایە خانەکان پڕبکە تا رێک بێت (ناو, براند, جۆر, کوالێتی, ژمارە).');
            return;
        }

        const itemObj = { name, brand, type, quality, purchasePrice, salePrice, quantity, storageLocation };

        const editingId = tr.dataset.editingId;
        if (editingId) {
            updateItemInline(parseInt(editingId), itemObj);
        } else {
            addOrMergeItem(itemObj);
        }

        tr.remove();
        loadItems();
    });

    cancelBtn.addEventListener('click', () => { tr.remove(); });

    // prepend the row to top
    tableBody.insertBefore(tr, tableBody.firstChild);
    // focus first input
    nameInput.focus();
}

function addOrMergeItem(itemData) {
    const items = getInventory();
    const components = getComponentData();
    const typeObj = (COMPONENTS_CACHE.typesObjects || []).find(t => (typeof t === 'string' ? t === itemData.type : (t.name === itemData.type)));
    const color = typeObj && typeof typeObj === 'object' ? (typeObj.color || '#007bff') : '#007bff';

    const existingIndex = items.findIndex(item => item.name === itemData.name && item.brand === itemData.brand && item.type === itemData.type && item.quality === itemData.quality);
    if (existingIndex !== -1) {
        const existingItem = items[existingIndex];
        const totalOldCost = (existingItem.purchasePrice || 0) * (existingItem.quantity || 0);
        const totalNewCost = (itemData.purchasePrice || 0) * (itemData.quantity || 0);
        const totalQuantity = (existingItem.quantity || 0) + (itemData.quantity || 0);
        const averagePurchasePrice = totalQuantity ? Math.round((totalOldCost + totalNewCost) / totalQuantity) : (itemData.purchasePrice || 0);

        items[existingIndex].quantity = totalQuantity;
        items[existingIndex].purchasePrice = averagePurchasePrice;
        items[existingIndex].salePrice = itemData.salePrice;
        items[existingIndex].color = color;
        items[existingIndex].storageLocation = itemData.storageLocation;
        alert(`ژمارەی ئایتمی "${itemData.name}" زیاد کرا. ژمارەی نوێ: ${totalQuantity}.`);
    } else {
        const newItem = { id: Date.now(), name: itemData.name, brand: itemData.brand, type: itemData.type, quality: itemData.quality, purchasePrice: itemData.purchasePrice, salePrice: itemData.salePrice, quantity: itemData.quantity, color, storageLocation: itemData.storageLocation };
        items.push(newItem);
        alert('ئایتمی نوێ زیاد کرا');
    }

    saveToStorage(INVENTORY_KEY, items);
}

function updateItemInline(itemId, itemData) {
    const items = getInventory();
    const idx = items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const typeObj = (COMPONENTS_CACHE.typesObjects || []).find(t => (typeof t === 'string' ? t === itemData.type : (t.name === itemData.type)));
    const color = typeObj && typeof typeObj === 'object' ? (typeObj.color || '#007bff') : '#007bff';

    items[idx] = { id: itemId, name: itemData.name, brand: itemData.brand, type: itemData.type, quality: itemData.quality, purchasePrice: itemData.purchasePrice, salePrice: itemData.salePrice, quantity: itemData.quantity, color, storageLocation: itemData.storageLocation };
    saveToStorage(INVENTORY_KEY, items);
    alert('ئایتم نوێکرایەوە');
}

// Initial Load for Item Management Page
document.addEventListener('DOMContentLoaded', () => {
    // Always load components and items on this page
    loadComponents();
    loadItems();

    // Wire the inline add button (if present)
    const addBtn = document.getElementById('inlineAddBtn');
    if (addBtn) addBtn.addEventListener('click', (e) => { e.preventDefault(); addInlineRow(); });
});