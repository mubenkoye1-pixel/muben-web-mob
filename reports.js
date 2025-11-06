// reports.js - FINANCIAL REPORTING LOGIC (Synchronous Local Storage)

// NOTE: We assume getTransactions, getExpenses, and getInventory are defined globally (e.g., in item.js or data.js).

// --- Storage Access Helpers (Defined here for independence) ---
function getFromStorage(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    try {
        const parsed = JSON.parse(data);
        return parsed || defaultValue;
    } catch (e) {
        return defaultValue;
    }
}
function getTransactions() { return getFromStorage('salesTransactions', []); }
function getExpenses() { return getFromStorage('expensesData', []); }
function getInventory() { return getFromStorage('inventory', []); } 


// Function to calculate all financial metrics and group profits
function calculateAllMetrics() {
    const transactions = getTransactions();
    const expenses = getExpenses();
    const inventory = getInventory(); 

    let totalGrossRevenue = 0;
    let totalCostOfSales = 0;
    let totalDiscount = 0;
    let totalExpense = 0;
    let totalCurrentInventoryValue = 0;
    
    let groupedProfit = {}; 

    // 1. Process Transactions
    transactions.forEach(t => {
        totalGrossRevenue += t.subTotalSale || 0;
        totalDiscount += t.discount || 0;
        
        (t.items || []).forEach(item => {
            const cost = item.purchasePrice || 0;
            const revenue = item.salePrice || 0;
            const quantity = item.quantity || 0;
            
            totalCostOfSales += (cost * quantity); 
            const itemProfit = (revenue - cost) * quantity;

            const typeName = item.type || 'Undefined Type';
            const brandName = item.brand || 'Undefined Brand';

            if (!groupedProfit[typeName]) groupedProfit[typeName] = {};
            if (!groupedProfit[typeName][brandName]) {
                groupedProfit[typeName][brandName] = { profit: 0, itemsSold: 0 };
            }
            
            groupedProfit[typeName][brandName].profit += itemProfit;
            groupedProfit[typeName][brandName].itemsSold += quantity;
        });
    });

    // 2. Process Expenses
    expenses.forEach(e => {
        totalExpense += e.amount || 0;
    });

    // 3. Inventory Valuation 
    inventory.forEach(item => {
         totalCurrentInventoryValue += (item.purchasePrice || 0) * (item.quantity || 0);
    });


    // 4. Final Calculations
    const finalRevenue = totalGrossRevenue - totalDiscount; // Net Sales
    const grossProfit = finalRevenue - totalCostOfSales;    // Gross Profit (before expenses)
    const netProfit = grossProfit - totalExpense;           // Net Profit (the bottom line)

    return {
        totalRevenue: finalRevenue,
        totalGrossProfit: grossProfit,
        totalExpense: totalExpense,
        netProfit: netProfit,
        inventoryValue: totalCurrentInventoryValue,
        groupedProfit: groupedProfit
    };
}

// Function to display metrics in the HTML
function displayReportMetrics() {
    const metrics = calculateAllMetrics();

    // 1. Display KPIs 
    document.getElementById('report-revenue').textContent = metrics.totalRevenue.toLocaleString() + ' IQD';
    document.getElementById('report-expense').textContent = metrics.totalExpense.toLocaleString() + ' IQD';
    
    const profitElement = document.getElementById('report-profit');
    if (profitElement) {
        profitElement.textContent = metrics.netProfit.toLocaleString() + ' IQD';
        profitElement.style.color = metrics.netProfit >= 0 ? '#28a745' : '#dc3545';
    }
    
    // 2. Display Detailed Profit Table
    displayProfitAnalysis(metrics.groupedProfit);
    
    // 3. Display Inventory Summary
    displayInventoryValuation(metrics.inventoryValue);
}

// NEW FUNCTION: Inventory Valuation Summary
function displayInventoryValuation(totalValue) {
    const container = document.getElementById('inventorySummaryContainer');
    if (!container) return;
    
    container.innerHTML = `
        <table class="report-analysis-table">
            <thead>
                <tr>
                    <th>کۆی بەهای کڕینی عەمبار</th>
                    <th>وردەکاری</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="profit-positive">${totalValue.toLocaleString()} IQD</td>
                    <td>ئەمە کۆی نرخی کڕینی ئەو ئایتمانەیە کە ئێستا لە ستۆکدان.</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Function to display detailed profit table by Type and Brand
function displayProfitAnalysis(groupedProfit) {
    const container = document.getElementById('profitAnalysisContainer');
    if (!container) return;

    const types = Object.keys(groupedProfit);
    if (types.length === 0) {
        container.innerHTML = '<p>هیچ داتایەکی فرۆشتن نییە بۆ شیکارکردن.</p>';
        return;
    }

    let tableHTML = `
        <table class="report-analysis-table">
            <thead>
                <tr class="table-header">
                    <th style="width: 20%;">جۆر (Type)</th>
                    <th style="width: 20%;">براند (Brand)</th>
                    <th style="width: 30%;">کۆی قازانج (IQD)</th>
                    <th style="width: 30%;">یەکەی فرۆشراو</th>
                </tr>
            </thead>
            <tbody>
    `;

    types.forEach(type => {
        const brands = Object.keys(groupedProfit[type]);
        let firstRow = true;

        brands.forEach(brand => {
            const data = groupedProfit[type][brand]; 
            const profitClass = data.profit >= 0 ? 'profit-positive' : 'profit-negative';
            const rowSpan = brands.length;

            tableHTML += `
                <tr>
                    ${firstRow ? `<td rowspan="${rowSpan}" class="type-group-cell">${type}</td>` : ''}
                    <td>${brand}</td>
                    <td class="${profitClass}">${data.profit.toLocaleString()}</td>
                    <td>${data.itemsSold.toLocaleString()}</td>
                </tr>
            `;
            firstRow = false;
        });
    });

    tableHTML += `
            </tbody>
        </table>
    `;
    container.innerHTML = tableHTML;
}


// Initial Load for Reports Page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('report-revenue')) {
        displayReportMetrics();
    }
});