// item.js - FINAL LOCAL STORAGE VERSION WITH ALTERNATIVE NAMES

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

// Cache used by item form to lookup type colors and names
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

// --- Component Management (Code remains largely the same) ---

function loadComponents() { 
    // ... [هەمان لۆژیکی loadComponents() لێرە دەمێنێتەوە] ...
    const components = getComponentData();
    const brandsKey = getFromStorage('brands', []);
    const typesKey = getFromStorage('types', []);
    const qualitiesKey = getFromStorage('qualities', []);

    // Determine brands list 
    let brands = [];
    let brandsObjects = [];
    if (Array.isArray(brandsKey) && brandsKey.length) {
        brandsObjects = brandsKey;
        brands = brandsKey.map(b => (typeof b === 'string' ? b : (b.name || ''))).filter(Boolean);
    } else {
        brandsObjects = components.brands || [];
        brands = Array.isArray(brandsObjects) ? brandsObjects : [];
    }

    // Types 
    let types = [];
    let typesObjects = [];
    if (Array.isArray(typesKey) && typesKey.length) {
        typesObjects = typesKey;
        types = typesKey.map(t => (typeof t === 'string' ? t : (t.name || ''))).filter(Boolean);
    } else {
        typesObjects = components.types || [];
        types = (typesObjects || []).map(t => (typeof t === 'string' ? t : (t.name || ''))).filter(Boolean);
    }

    // Qualities
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

    // Populate Item Form Selects if present 
    if (document.getElementById('itemBrand')) populateSelect('itemBrand', brands);
    if (document.getElementById('itemType')) populateSelect('itemType', types);
    if (document.getElementById('itemQuality')) populateSelect('itemQuality', qualities);
}

function updateComponents(newComponents) { 
    saveComponentData(newComponents); 
    loadComponents(); // Synchronous reload
}


// --- Component Display Functions (Code remains largely the same) ---
// ... [displayComponents, displayTypes, populateSelect] ...

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


// --- Component CRUD (Code remains largely the same) ---
// ... [addBrand, deleteBrand, addQuality, deleteQuality, addType, deleteType, setItemColorByType] ...

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

// گۆڕانکاری لە loadItems: زیادکردنی alternativeNames بۆ گەڕان
function loadItems() { // 🚨 async
    const items = getInventory(); // 🚨 await
    
    // 1. وەرگرتنی نرخی گەڕان
    const searchInput = document.getElementById('itemSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let itemsToDisplay = items;

    // 2. فلتەرکردنی داتا ئەگەر گەڕان هەبێت
    if (searchTerm) {
        itemsToDisplay = items.filter(item => {
            // ✅ نوێکردنەوەی گەڕان: گۆڕینی ناوی جێگرەوەکان بۆ String
            const altNamesString = Array.isArray(item.alternativeNames) ? item.alternativeNames.join(' ') : '';
            
            const itemString = [
                item.name, 
                item.brand, 
                item.quality,
                item.type, 
                item.storageLocation, 
                altNamesString // ✅ زیادکردنی ناوی جێگرەوەکان بۆ پشکنین
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
    
    const storageLocation = document.getElementById('storageLocation').value.trim();

    // ⚠️ ئەم فۆڕمە سەرەکییە هیڵدراوەتەوە، بەڵام بۆ inline row زیاتر بەکار دێت
    const newPurchasePrice = parseInt(document.getElementById('itemPurchasePrice').value);
    const salePrice = parseInt(document.getElementById('itemSalePrice').value);
    const newQuantity = parseInt(document.getElementById('itemQuantity').value); 
    
    // لێرە کێڵدێک بۆ ناوی جێگرەوەکان زیاد بکە
    const alternativeNamesInput = document.getElementById('alternativeNames');
    const alternativeNames = alternativeNamesInput ? alternativeNamesInput.value.split(',').map(n => n.trim()).filter(n => n.length > 0) : [];


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
        storageLocation, 
        alternativeNames // ✅ زیادکردنی ناوی جێگرەوەکان
    };

    if (editingItemId) {
        const index = items.findIndex(item => item.id === editingItemId);
        if (index !== -1) {
            items[index] = { 
                id: editingItemId, 
                ...itemData, 
                purchasePrice: newPurchasePrice,
                quantity: newQuantity,
                storageLocation,
                alternativeNames // ✅ نوێکردنەوە
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
            items[existingItemIndex].storageLocation = storageLocation;
            items[existingItemIndex].alternativeNames = alternativeNames; // ✅ نوێکردنەوە
            
            alert(`ژمارەی ئایتمی "${name}" زیاد کرا. ژمارەی نوێ: ${totalQuantity}. تێکڕای نرخی کڕینی نوێ: ${averagePurchasePrice.toLocaleString()} دینار.`);

        } else {
            const newItem = { 
                id: Date.now(), 
                ...itemData,
                purchasePrice: newPurchasePrice,
                quantity: newQuantity,
                storageLocation,
                alternativeNames // ✅ زیادکردن
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


function leckchw(itemId) {
    
}


function resetForm() {
    // No central form anymore. Clear editing state.
    editingItemId = null;
}

// گۆڕانکاری لە displayItemsTable: زیادکردنی ستوونی ناوی جێگرەوەکان
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
                    <th>شوێنی هەڵگرتن</th>
                    <th>کرارەکان</th>
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
        
        // ئامادەکردنی ناوی جێگرەوەکان بۆ نیشاندان
        const altNamesDisplay = Array.isArray(item.alternativeNames) && item.alternativeNames.length > 0
            ? item.alternativeNames.join(', ') 
            : '—';
        
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
                <td>${item.storageLocation || '—'}</td>
                 <td>
                    <div class="action-btns">
                        <button class="edit-btn" onclick="editItem(${item.id})">دەستکاری</button>
                        <button class="delete-item-btn" onclick="deleteItem(${item.id})">سڕینەوە</button>
                     
                        <button type="button" class="btn-secondary" onclick="openAlternativeNamesModal(${item.id})">
        <i class="fas fa-tags"></i>  لێکچووەکان
    </button>

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
    if (!tbody) {
        displayItemsTable(getInventory());
    }

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
    
    // ✅ زیادکردنی خانەی ناوی جێگرەوەکان
    const altNamesValue = Array.isArray(prefill?.alternativeNames) ? prefill.alternativeNames.join(', ') : '';
    const alternativeNamesInput = createInput(altNamesValue, 'text', { placeholder: 'ناوه‌ جێگره‌وه‌كان (به‌ كۆما)' });


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
    // ✅ زیادکردنی خانەی ناوی جێگرەوەکان
    const tdAltNames = document.createElement('td'); tdAltNames.appendChild(alternativeNamesInput); tr.appendChild(tdAltNames);

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
        // ✅ گۆڕینی ڕستە بۆ Array
        const alternativeNames = alternativeNamesInput.value.split(',').map(n => n.trim()).filter(n => n.length > 0);

        if (!name || !brand || !type || !quality || quantity < 1) {
            alert('تکایە خانەکان پڕبکە تا رێک بێت (ناو, براند, جۆر, کوالێتی, ژمارە).');
            return;
        }

        const itemObj = { name, brand, type, quality, purchasePrice, salePrice, quantity, storageLocation, alternativeNames }; // ✅ گواستنەوەی ناوی جێگرەوەکان

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
        items[existingIndex].alternativeNames = itemData.alternativeNames; // ✅ یەکخستنی ناوی جێگرەوە
        alert(`ژمارەی ئایتمی "${itemData.name}" زیاد کرا. ژمارەی نوێ: ${totalQuantity}.`);
    } else {
        const newItem = { 
            id: Date.now(), 
            ...itemData, // ItemData ئێستا alternativeNames لەخۆ دەگرێت
            color 
        }; 
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

    // ✅ نوێکردنەوەی هەموو کێڵگەکان، لەوانە ناوی جێگرەوەکان
    items[idx] = { 
        id: itemId, 
        ...itemData, // ItemData ئێستا alternativeNames لەخۆ دەگرێت
        color 
    }; 
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



// --- Alternative Names Modal Functions ---
let currentItemIdForAltNames = null; // بۆ پاراستنی ئایدی ئەو ئایتمەی کە لە مۆدالەکەدا دەستکاری دەکرێت

function openAlternativeNamesModal(itemId) {
    const items = getInventory();
    const itemToEdit = items.find(item => item.id === itemId);

    if (!itemToEdit) {
        alert('ئایتمەکە نەدۆزرایەوە.');
        return;
    }

    // گواستنەوەی داتا بۆ ناو مۆدالەکە
    const altNames = Array.isArray(itemToEdit.alternativeNames) ? itemToEdit.alternativeNames.join(', ') : '';
    document.getElementById('modalAlternativeNamesInput').value = altNames;
    document.getElementById('modalItemId').value = itemId; // هەڵگرتنی ئایدی
    currentItemIdForAltNames = itemId; // هەڵگرتنی ئایدی

    // نیشاندانی مۆدالەکە
    document.getElementById('alternativeNamesModal').style.display = 'block';
}

function closeAlternativeNamesModal() {
    // شاردنەوەی مۆدالەکە
    document.getElementById('alternativeNamesModal').style.display = 'none';
    currentItemIdForAltNames = null;
    document.getElementById('modalAlternativeNamesInput').value = ''; // چۆڵکردنی ناوەڕۆک
    document.getElementById('modalItemId').value = '';
}

function saveAlternativeNames() {
    const itemId = parseInt(document.getElementById('modalItemId').value);
    const altNamesInput = document.getElementById('modalAlternativeNamesInput').value;

    if (!itemId) {
        alert('هەڵەی ئایدی ئایتم. تکایە دووبارە هەوڵ بدەوە.');
        return;
    }

    // گۆڕینی ڕستەی ئینپوت بۆ Array بە بەکارهێنانی کۆما بۆ جیاکردنەوە
    const newAlternativeNames = altNamesInput
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0); // لابردنی ناوە بەتاڵەکان

    let items = getInventory();
    const itemIndex = items.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
        // نوێکردنەوەی ناوی جێگرەوەکان
        items[itemIndex].alternativeNames = newAlternativeNames;

        // پاشەکەوتکردن لە Local Storage و نوێکردنەوەی خشتەکە
        saveToStorage(INVENTORY_KEY, items);
        loadItems(); // نوێکردنەوەی خشتەی ئایتمەکان
        closeAlternativeNamesModal();
        alert('ناوی جێگرەوەکان بە سەرکەوتوویی نوێ کرانەوە.');
    } else {
        alert('ئایتمەکە نەدۆزرایەوە بۆ نوێکردنەوە.');
    }
}