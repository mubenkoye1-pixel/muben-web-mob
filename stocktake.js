// NOTE: We assume getFromStorage and saveToStorage are loaded from item.js
// We assume INVENTORY_COLLECTION is defined globally (e.g., in item.js)

let inventoryData = []; // Global array to hold the current inventory data for processing

// Function to load and display all items for stocktake
async function loadStocktakeData() {
    // CRITICAL FIX 1: Ensure safe fetching and fallback to an empty array
    // We assume INVENTORY_COLLECTION is available globally
    const INVENTORY_COLLECTION = "inventory"; 
    
    // We ensure getFromStorage is awaited and defaults to an empty array
    const fetchedItems = await getFromStorage(INVENTORY_COLLECTION) || []; 
    inventoryData = Array.isArray(fetchedItems) ? fetchedItems : [];
    
    const tableBody = document.getElementById('stocktakeBody');
    const itemCountSpan = document.getElementById('itemCount');
    
    if (!tableBody || !itemCountSpan) return;

    itemCountSpan.textContent = inventoryData.length;
    tableBody.innerHTML = '';

    if (inventoryData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ ئایتمێک لە عەمباردا نییە.</td></tr>';
        return;
    }

    inventoryData.forEach((item, index) => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>
                <strong>${item.name} ${item.brand} ${item.quality}</strong>
                <br><small style="color: #6c757d;">جۆر: ${item.type}</small>
            </td>
            <td>${item.quantity}</td>
            <td>
                <input type="number" 
                       id="actual-qty-${item.id}" 
                       value="${item.quantity}" 
                       data-item-id="${item.id}" 
                       data-old-qty="${item.quantity}"
                       min="0"
                       oninput="calculateVariance(${item.id})">
            </td>
            <td id="variance-${item.id}">0</td>
            <td>
                <button class="action-btn edit-btn" onclick="updateSingleStock(${item.id})">نوێکردنەوەی تاکەکەسی</button>
            </td>
        `;
    });
    
    updateVarianceSummary();
}

// Function to calculate variance for a single item (Synchronous)
function calculateVariance(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    const inputElement = document.getElementById(`actual-qty-${itemId}`);
    const varianceElement = document.getElementById(`variance-${itemId}`);
    
    if (!item || !inputElement || !varianceElement) return;
    
    const actualCount = parseInt(inputElement.value) || 0;
    const recordedCount = item.quantity;
    const variance = actualCount - recordedCount;

    varianceElement.textContent = variance;
    
    if (variance > 0) {
        varianceElement.className = 'variance-positive';
    } else if (variance < 0) {
        varianceElement.className = 'variance-negative';
    } else {
        varianceElement.className = '';
    }
    
    updateVarianceSummary();
}

// Function to update the total variance summary bar (Synchronous)
function updateVarianceSummary() {
    const varianceElements = document.querySelectorAll('[id^="variance-"]');
    let totalVariance = 0;
    
    varianceElements.forEach(el => {
        totalVariance += parseInt(el.textContent) || 0;
    });

    const varianceSpan = document.getElementById('varianceCount');
    if (varianceSpan) {
        varianceSpan.textContent = totalVariance.toLocaleString();
    }
}

// Action: Update single item stock in the inventory data structure
async function updateSingleStock(itemId) {
    const item = inventoryData.find(i => i.id === itemId);
    const inputElement = document.getElementById(`actual-qty-${itemId}`);
    
    if (!item || !inputElement) return;
    
    const actualCount = parseInt(inputElement.value) || 0;
    const oldQuantity = item.quantity;
    
    if (actualCount === oldQuantity) {
        alert('ژمارەی ڕاستەقینە و تۆمارکراو وەک یەکن. گۆڕانکاری نەکرا.');
        return;
    }
    
    if (confirm(`ئایا دڵنیایت لە نوێکردنەوەی ستۆکی ${item.name} لە ${oldQuantity} بۆ ${actualCount}`)) {
        let inventory = await getFromStorage(INVENTORY_COLLECTION); 
        const inventoryIndex = inventory.findIndex(i => i.id === itemId);
        
        if (inventoryIndex !== -1) {
            inventory[inventoryIndex].quantity = actualCount;
            
            // CRITICAL FIX: saveToStorage needs collection name
            await saveToStorage(INVENTORY_COLLECTION, inventory); 
            alert('ستۆکی ئایتمەکە نوێ کرایەوە!');
            await loadStocktakeData(); 
        }
    }
}

// Action: Commit the entire stocktake (Final save)
async function commitStocktake() {
    if (!confirm('ئایا دڵنیایت لە تۆمارکردنی هەموو گۆڕانکارییەکانی جەرد؟ ئەمە ستۆکی عەمبارەکەتان دەگۆڕێت.')) {
        return;
    }
    
    const INVENTORY_COLLECTION = "inventory"; 

    let finalInventory = await getFromStorage(INVENTORY_COLLECTION); 
    let hasChanges = false;

    // Iterate over the DOM inputs to find changes
    for (const item of inventoryData) {
        const inputElement = document.getElementById(`actual-qty-${item.id}`);
        if (inputElement) {
            const actualCount = parseInt(inputElement.value) || 0;
            const currentQuantity = item.quantity;

            if (actualCount !== currentQuantity) {
                const inventoryIndex = finalInventory.findIndex(i => i.id === item.id);
                if (inventoryIndex !== -1) {
                    finalInventory[inventoryIndex].quantity = actualCount;
                    hasChanges = true;
                }
            }
        }
    }

    if (hasChanges) {
        await saveToStorage(INVENTORY_COLLECTION, finalInventory); 
        alert('جەردەکە بە سەرکەوتوویی تۆمار کرا و عەمبار نوێ کرایەوە!');
    } else {
        alert('هیچ گۆڕانکارییەک لە نێوان ژمێردراو و تۆمارکراودا نەبوو.');
    }
    
    await loadStocktakeData(); 
}


// Initial Load
// Initial Load and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Data Load
    if (document.getElementById('stocktakeBody')) {
        (async () => {
            await loadStocktakeData();
            // After loading initial data, set up the search listener
            setupSearchListener(); 
        })();
    }
});

// Function to set up the search input event listener
function setupSearchListener() {
    const searchInput = document.getElementById('search-stock');
    if (searchInput) {
        // Use 'input' event to filter results instantly as user types
        searchInput.addEventListener('input', (event) => {
            const searchTerm = event.target.value;
            filterStocktake(searchTerm);
        });
    }
}






// Function to filter and display items based on search term
function filterStocktake(searchTerm) {
    const tableBody = document.getElementById('stocktakeBody');
    if (!tableBody) return;

    // Convert search term to lowercase for case-insensitive search
    const lowerCaseSearchTerm = searchTerm.toLowerCase().trim();
    tableBody.innerHTML = ''; // Clear current display

    if (lowerCaseSearchTerm === '') {
        // If search box is empty, load all data again
        loadStocktakeData();
        return;
    }

    // Filter the global inventoryData array
    const filteredItems = inventoryData.filter(item => {
        // Concatenate relevant fields into a single search string
        const itemText = `${item.name} ${item.brand} ${item.quality} ${item.type}`.toLowerCase();
        
        // Check if the search term is included in the item's text
        return itemText.includes(lowerCaseSearchTerm);
    });

    if (filteredItems.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">هیچ ئایتمێک بەو وشانەی گەڕان نەدۆزرایەوە.</td></tr>';
        document.getElementById('itemCount').textContent = 0;
        updateVarianceSummary();
        return;
    }

    // Display the filtered results
    filteredItems.forEach(item => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>
                <strong>${item.name} ${item.brand} ${item.quality}</strong>
                <br><small style="color: #6c757d;">جۆر: ${item.type}</small>
            </td>
            <td>${item.quantity}</td>
            <td>
                <input type="number" 
                        id="actual-qty-${item.id}" 
                        value="${item.quantity}" 
                        data-item-id="${item.id}" 
                        data-old-qty="${item.quantity}"
                        min="0"
                        oninput="calculateVariance(${item.id})">
            </td>
            <td id="variance-${item.id}">0</td>
            <td>
                <button class="action-btn edit-btn" onclick="updateSingleStock(${item.id})">نوێکردنەوەی تاکەکەسی</button>
            </td>
        `;
    });

    // Update summary counts based on filtered list (if needed)
    document.getElementById('itemCount').textContent = filteredItems.length;
    updateVarianceSummary(); // Recalculate variance count
}