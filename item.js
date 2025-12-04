// item.js - FINAL LOCAL STORAGE VERSION WITH MODEL SELECT

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
    // This is the fallback/initial data structure for componentsData
    return getFromStorage(COMPONENTS_KEY, {
        brands: [],
        types: [{ name: 'شاشە', color: '#007bff' }],
        qualities: ['بیلادی', 'نۆڕماڵ']
    });
}
function saveComponentData(data) { saveToStorage(COMPONENTS_KEY, data); }

// Cache used by item form to lookup type colors and names
let COMPONENTS_CACHE = { 
    typesObjects: [], 
    brandsObjects: [], 
    qualitiesObjects: [],
    modelsObjects: [] // 🆕 زیادکراو بۆ مۆدێلەکان
};

// --- Component Management ---

function loadComponents() { 
    const components = getComponentData();
    
    // ⚠️ وەرگرتنی داتا لەو کلیلانەی کە لە brand.js دروست کراون
    const brandsKey = getFromStorage('brands', []);
    const typesKey = getFromStorage('categories', []); // گۆڕینی 'types' بۆ 'categories'
    const qualitiesKey = getFromStorage('qualities', []);
    const modelsKey = getFromStorage('models', []); // 🆕 وەرگرتنی مۆدێلەکان

    // --- Brands ---
    let brands = [];
    let brandsObjects = [];
    if (Array.isArray(brandsKey) && brandsKey.length) {
        brandsObjects = brandsKey;
        brands = brandsKey.map(b => (typeof b === 'string' ? b : (b.name || ''))).filter(Boolean);
    } else {
        brandsObjects = components.brands || [];
        brands = Array.isArray(brandsObjects) ? brandsObjects : [];
    }

    // --- Types (Categories) --- 
    let types = [];
    let typesObjects = [];
    if (Array.isArray(typesKey) && typesKey.length) {
        typesObjects = typesKey;
        types = typesKey.map(t => (typeof t === 'string' ? t : (t.name || ''))).filter(Boolean);
    } else {
        typesObjects = components.types || [];
        types = (typesObjects || []).map(t => (typeof t === 'string' ? t : (t.name || ''))).filter(Boolean);
    }

    // --- Qualities ---
    let qualities = [];
    let qualitiesObjects = [];
    if (Array.isArray(qualitiesKey) && qualitiesKey.length) {
        qualitiesObjects = qualitiesKey;
        // Qualities لەوانەیە label یان name بێت (بەکارهێنانی label وەک لە brand.js)
        qualities = qualitiesKey.map(q => (typeof q === 'string' ? q : (q.label || q.name || q))).filter(Boolean);
    } else {
        qualitiesObjects = components.qualities || [];
        qualities = Array.isArray(qualitiesObjects) ? qualitiesObjects : [];
    }
    
    // --- Models (Item Name) --- 🆕
    let models = [];
    let modelsObjects = [];
    if (Array.isArray(modelsKey) && modelsKey.length) {
        modelsObjects = modelsKey;
        // Models ناوەکەی بەکار دەهێنێت
        models = modelsKey.map(m => (typeof m === 'string' ? m : (m.name || ''))).filter(Boolean);
    } else {
        modelsObjects = [];
        models = [];
    }

    // Update cache
    COMPONENTS_CACHE.typesObjects = typesObjects;
    COMPONENTS_CACHE.brandsObjects = brandsObjects;
    COMPONENTS_CACHE.qualitiesObjects = qualitiesObjects;
    COMPONENTS_CACHE.modelsObjects = modelsObjects; // 🆕 زیادکردنی مۆدێلەکان

    // Populate Item Form Selects if present 
    // 🛑 Item Name ئێستا سێلێکتە بۆ مۆدێل
    if (document.getElementById('itemName')) populateSelect('itemName', models, 'هەڵبژاردنی مۆدێل...'); 
    if (document.getElementById('itemBrand')) populateSelect('itemBrand', brands);
    if (document.getElementById('itemType')) populateSelect('itemType', types);
    if (document.getElementById('itemQuality')) populateSelect('itemQuality', qualities);
}

function updateComponents(newComponents) { 
    saveComponentData(newComponents); 
    loadComponents(); // Synchronous reload
}


// --- Component Display Functions ---

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

function populateSelect(selectId, items, defaultText = 'هەڵبژێرە...') { // 🆕 زیادکردنی defaultText
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = `<option value="" disabled selected>${defaultText}</option>`;
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}


// --- Component CRUD (لێرەدا وەک خۆی دەمێنێتەوە) ---

function addBrand(event) { 
    event.preventDefault();
    const input = document.getElementById('newBrand');
    const newBrand = input.value.trim();
    // لۆژیکی پاشەکەوتکردن لێرە سادەیە و ڕاستەوخۆ دەبێت، بەڵام بۆ کۆدی سەرەکی ئەمە بگۆڕە بۆ بەکارهێنانی 'brands' لە LocalStorage
}

// ... [addBrand, deleteBrand, addQuality, deleteQuality, addType, deleteType وەک خۆیان دەمێننەوە]

function setItemColorByType() {
    const selectedType = document.getElementById('itemType')?.value;
    const colorInput = document.getElementById('itemColor');
    if (!colorInput) return;

    const types = COMPONENTS_CACHE.typesObjects || [];
    const typeObject = types.find(t => (typeof t === 'string' ? t === selectedType : (t.name === selectedType)));
    if (typeObject && typeof typeObject === 'object') {
        colorInput.value = typeObject.color || '#ccc';
    } else {
        colorInput.value = '#ccc';
    }
}


// --- Inventory CRUD (Synchronous LocalStorage calls) ---

function loadItems() { 
    const items = getInventory(); 
    
    // 1. وەرگرتنی نرخی گەڕان
    const searchInput = document.getElementById('itemSearchInput');
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let itemsToDisplay = items;

    // 2. فلتەرکردنی داتا ئەگەر گەڕان هەبێت
    if (searchTerm) {
        itemsToDisplay = items.filter(item => {
            const altNamesString = Array.isArray(item.alternativeNames) ? item.alternativeNames.join(' ') : '';
            
            const itemString = [
                item.name, // Item.name ئێستا ناوی مۆدێلەکەیە
                item.brand, 
                item.quality,
                item.type, 
                item.storageLocation, 
                altNamesString 
            ].join(' ').toLowerCase();

            return itemString.includes(searchTerm);
        });
    }
    
    // 3. نیشاندانی خشتەی فلتەرکراو
    displayItemsTable(itemsToDisplay);
    
    if (!COMPONENTS_CACHE.typesObjects) COMPONENTS_CACHE.typesObjects = [];
}


function saveOrUpdateItem(event) { 
    event.preventDefault();
    // ئەم فەنکشنە سەرەکییە هیڵدراوەتەوە بەڵام لۆژیکی هەمان لۆژیکی Inlineیە
    // ...
    // ئەگەر ئەم فۆرمە لە HTML بوونی نەبوو، ئەم فەنکشنە لۆژیکێکی بۆ نییە.
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
                    <th>ناوی مۆدێل</th>
                    <th>جۆر</th>
                    <th>براند</th>
                    <th>کوالێتی</th>
                    <th>نرخی فرۆشتن</th>
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
        
        tableHTML += `
            <tr style="border-right: 5px solid ${item.color || '#ccc'};">
                <td style="background-color: ${item.color || '#ccc'}; width: 10px;"></td>
                <td>${item.name}</td>
                <td>${item.type}</td>
                <td>${item.brand}</td>
                <td>${item.quality}</td>
                <td>${salePrice.toLocaleString()}</td>
                <td>${item.quantity}</td>
                <td>${item.storageLocation || '—'}</td>
                   <td>
                        <div class="action-btns">
                            <button class="edit-btn" onclick="editItem(${item.id})">دەستکاری</button>
                            <button class="delete-item-btn" onclick="deleteItem(${item.id})">سڕینەوە</button>
                          
                            <button type="button" class="btn-secondary" onclick="openAlternativeNamesModal(${item.id})">
                                لێکچووەکان
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
// Inline row creation (دروستکردنی ڕیزی ناوخۆیی)
// ----------------------

// ----------------------
// Inline row creation (دروستکردنی ڕیزی ناوخۆیی)
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
        el.dir = 'rtl'; // بۆ کوردی
        Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
        return el;
    };

    // Prepare component option lists from cache
    const models = (COMPONENTS_CACHE.modelsObjects || []).map(m => (typeof m === 'object' ? (m.name || '') : m)).filter(Boolean); // 🆕 وەرگرتنی مۆدێلەکان
    const brands = (COMPONENTS_CACHE.brandsObjects || []).map(b => (typeof b === 'object' ? (b.name || '') : b)).filter(Boolean);
    const types = (COMPONENTS_CACHE.typesObjects || []).map(t => (typeof t === 'object' ? (t.name || '') : t)).filter(Boolean);
    const qualities = (COMPONENTS_CACHE.qualitiesObjects || []).map(q => (typeof q === 'object' ? (q.label || q) : q)).filter(Boolean);

    // 🛑 گۆڕینی Input بۆ Select
    const modelSelect = document.createElement('select');
    modelSelect.className = 'inline-input';
    
    const typeSelect = document.createElement('select');
    typeSelect.className = 'inline-input';
    const brandSelect = document.createElement('select');
    brandSelect.className = 'inline-input';
    const qualitySelect = document.createElement('select');
    qualitySelect.className = 'inline-input';

    const makeOptions = (sel, items, defaultText = '—') => {
        sel.innerHTML = '';
        const empty = document.createElement('option'); empty.value = ''; empty.textContent = defaultText; sel.appendChild(empty);
        items.forEach(it => { const opt = document.createElement('option'); opt.value = it; opt.textContent = it; sel.appendChild(opt); });
    };

    makeOptions(modelSelect, models, 'هەڵبژاردنی مۆدێل...'); // 🆕 پڕکردنەوەی سێلێکتی مۆدێل
    makeOptions(typeSelect, types);
    makeOptions(brandSelect, brands);
    makeOptions(qualitySelect, qualities);

    if (prefill) {
        modelSelect.value = prefill.name || ''; // 🆕 ناوی ئایتم دەبێتە مۆدێلی هەڵبژێردراو
        typeSelect.value = prefill.type || '';
        brandSelect.value = prefill.brand || '';
        qualitySelect.value = prefill.quality || '';
    }

    // 🛑 لابردنی purchaseInput و qtyInput
    // ⚠️ نرخی فرۆشتن دەمێنێتەوە
    const saleInput = createInput(prefill?.salePrice || '', 'number', { min: 0, placeholder: 'نرخی فرۆشتن' });
    
    // 🛑 لابردنی quantityInput
    
    const storageInput = createInput(prefill?.storageLocation || '', 'text', { placeholder: 'شوێن' });
    
    const altNamesValue = Array.isArray(prefill?.alternativeNames) ? prefill.alternativeNames.join(', ') : '';
    // 🛑 لابردنی alternativeNamesInput لێرە، چونکە لۆژیکەکە دەڵێت لە فۆرمی جیاوازدا بێت

    
    // 🛑 گۆڕینی حیسابکردنی قازانج: تەنها بە نرخی فرۆشتن حیساب دەکرێت، نرخی کڕین وەک سفر سەیر دەکرێت.
    const profitCell = document.createElement('td');
    const updateProfit = () => {
        // وادادەنێین نرخی کڕینی سەرەتایی 0 بێت لە پەڕەی ئایتم.
        const pp = 0; 
        const sp = parseInt(saleInput.value) || 0;
        profitCell.textContent = (sp - pp).toLocaleString();
    };
    saleInput.addEventListener('input', updateProfit);
    updateProfit(); // بانگکردنی بۆ نرخی سەرەتایی

    // Build cells 
    tr.innerHTML = `<td style="width:10px;background:#eee"></td>`;
    
    const tdName = document.createElement('td'); tdName.appendChild(modelSelect); tr.appendChild(tdName); 
    const tdType = document.createElement('td'); tdType.appendChild(typeSelect); tr.appendChild(tdType);
    const tdBrand = document.createElement('td'); tdBrand.appendChild(brandSelect); tr.appendChild(tdBrand);
    const tdQuality = document.createElement('td'); tdQuality.appendChild(qualitySelect); tr.appendChild(tdQuality);
    
    // 🛑 لابردنی خانەی نرخی کڕین
    // tr.appendChild(tdPurchase); 

    const tdSale = document.createElement('td'); tdSale.appendChild(saleInput); tr.appendChild(tdSale);
    
    tr.appendChild(profitCell);
    
    // 🛑 لابردنی خانەی ژمارە (Quantity)
    // tr.appendChild(tdQty); 
    
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
        const name = modelSelect.value; // 🛑 وەرگرتنی بەها لە Select
        const brand = brandSelect.value;
        const type = typeSelect.value;
        const quality = qualitySelect.value;
        
        // 🛑 لێرەدا نرخی کڕین و ژمارە بە 0 دادەنرێت بۆ ئەوەی لە پەڕەی کڕینەوە نوێ بکرێتەوە
        const purchasePrice = prefill?.purchasePrice || 0; 
        const salePrice = parseInt(saleInput.value) || 0;
        const quantity = prefill?.quantity || 0; // وەک خۆی بهێڵرێتەوە یان بە 0 دابنرێت
        
        const storageLocation = storageInput.value.trim();
        
        // وەرگرتنەوەی ناوی جێگرەوەی کۆن گەر دەستکاری کرابێت (بۆ ئەوەی نەفەوتێت)
        let alternativeNames = prefill?.alternativeNames || []; 

        if (!name || !brand || !type || !quality) {
            alert('تکایە خانە سەرەکییەکان پڕبکە (مۆدێل, براند, جۆر, کوالێتی).');
            return;
        }
        
        // وەرگرتنەوەی نرخی کڕین و ژمارەی کۆن لە کاتی دەستکاریکردندا
        if(prefill && prefill.id){
            const originalItem = getInventory().find(i => i.id === prefill.id);
            // پاراستنی نرخی کڕین و ژمارە لەکاتی دەستکاریکردنی تەنها زانیاری وەسفی.
            purchasePrice = originalItem.purchasePrice || 0; 
            quantity = originalItem.quantity || 0;
        }


        const itemObj = { name, brand, type, quality, purchasePrice, salePrice, quantity, storageLocation, alternativeNames }; 

        const editingId = tr.dataset.editingId;
        if (editingId) {
            updateItemInline(parseInt(editingId), itemObj);
        } else {
            // لە کاتی زیادکردنی ئایتمی نوێدا، نرخی کڕین و ژمارە بە 0 دادەنرێت
            itemObj.purchasePrice = 0;
            itemObj.quantity = 0;
            addOrMergeItem(itemObj); // ئەگەر ئایتمەکە نەبوو، زیاد دەکرێت.
        }

        tr.remove();
        loadItems();
    });

    cancelBtn.addEventListener('click', () => { tr.remove(); });

    // prepend the row to top
    tableBody.insertBefore(tr, tableBody.firstChild);
    // focus first select
    modelSelect.focus();
}

function addOrMergeItem(itemData) {
    const items = getInventory();
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
        items[existingIndex].alternativeNames = existingItem.alternativeNames || []; // پاراستنی ناوی جێگرەوەی کۆن
        alert(`ژمارەی ئایتمی "${itemData.name}" زیاد کرا. ژمارەی نوێ: ${totalQuantity}.`);
    } else {
        const newItem = { 
            id: Date.now(), 
            ...itemData, 
            color,
            alternativeNames: itemData.alternativeNames || [] // دڵنیابوون لەوەی Arrayیە
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

    const existingItem = items[idx];
    
    // پاراستنی ناوی جێگرەوەی کۆن لە کاتی دەستکاریکردنی خێرا
    const updatedAlternativeNames = existingItem.alternativeNames || []; 

    items[idx] = { 
        id: itemId, 
        ...itemData, 
        color,
        alternativeNames: updatedAlternativeNames // بەکارهێنانی ناوی جێگرەوەی پارێزراو
    }; 
    saveToStorage(INVENTORY_KEY, items);
    alert('ئایتم نوێکرایەوە');
}

// Initial Load for Item Management Page
document.addEventListener('DOMContentLoaded', () => {
    loadComponents();
    loadItems();

    const addBtn = document.getElementById('inlineAddBtn');
    if (addBtn) addBtn.addEventListener('click', (e) => { e.preventDefault(); addInlineRow(); });
});



// --- Alternative Names Modal Functions (وەک خۆی دەمێنێتەوە) ---

let currentItemIdForAltNames = null; 

function openAlternativeNamesModal(itemId) {
    const items = getInventory();
    const itemToEdit = items.find(item => item.id === itemId);

    if (!itemToEdit) {
        alert('ئایتمەکە نەدۆزرایەوە.');
        return;
    }

    const altNames = Array.isArray(itemToEdit.alternativeNames) ? itemToEdit.alternativeNames.join(', ') : '';
    document.getElementById('modalAlternativeNamesInput').value = altNames;
    document.getElementById('modalItemId').value = itemId; 
    currentItemIdForAltNames = itemId; 

    document.getElementById('alternativeNamesModal').style.display = 'block';
}

function closeAlternativeNamesModal() {
    document.getElementById('alternativeNamesModal').style.display = 'none';
    currentItemIdForAltNames = null;
    document.getElementById('modalAlternativeNamesInput').value = ''; 
    document.getElementById('modalItemId').value = '';
}

function saveAlternativeNames() {
    const itemId = parseInt(document.getElementById('modalItemId').value);
    const altNamesInput = document.getElementById('modalAlternativeNamesInput').value;

    if (!itemId) {
        alert('هەڵەی ئایدی ئایتم. تکایە دووبارە هەوڵ بدەوە.');
        return;
    }

    const newAlternativeNames = altNamesInput
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0); 

    let items = getInventory();
    const itemIndex = items.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
        items[itemIndex].alternativeNames = newAlternativeNames;

        saveToStorage(INVENTORY_KEY, items);
        loadItems(); 
        closeAlternativeNamesModal();
        alert('ناوی جێگرەوەکان بە سەرکەوتوویی نوێ کرانەوە.');
    } else {
        alert('ئایتمەکە نەدۆزرایەوە بۆ نوێکردنەوە.');
    }
}