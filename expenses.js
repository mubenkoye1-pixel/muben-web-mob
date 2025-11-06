// expenses.js - FINAL STABLE LOCAL STORAGE VERSION

// NOTE: We assume getFromStorage and saveToStorage are defined in item.js or a shared file

// --- Expense Storage API (Relies on shared base functions) ---
function getExpenses() { return getFromStorage('expensesData', []); }
function saveExpenses(expenses) { saveToStorage('expensesData', expenses); }

// Function to add a new expense
function addExpense(event) {
    event.preventDefault();
    
    const description = document.getElementById('expenseDescription').value.trim();
    const amount = parseInt(document.getElementById('expenseAmount').value);
    const category = document.getElementById('expenseCategory').value;

    if (!description || isNaN(amount) || amount <= 0) {
        alert('تکایە هەموو خانەکانی خەرجی بە دروستی پڕ بکەوە.');
        return;
    }

    const newExpense = {
        id: Date.now(),
        date: new Date().toLocaleString('ckb-IQ', { timeZone: 'Asia/Baghdad' }),
        description: description,
        amount: amount,
        category: category
    };

    let expenses = getExpenses();
    expenses.push(newExpense);
    saveExpenses(expenses);

    document.getElementById('expenseForm').reset();
    displayExpenses();
    alert('خەرجی بە سەرکەوتوویی تۆمار کرا.');
}

// Function to delete an expense
function deleteExpense(expenseId) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم خەرجییە؟')) {
        return;
    }

    let expenses = getExpenses();
    expenses = expenses.filter(e => e.id !== expenseId);
    saveExpenses(expenses);
    displayExpenses();
}

// Function to display the list of expenses
function displayExpenses() {
    const container = document.getElementById('expenseList');
    const kpiElement = document.getElementById('kpi-total-expenses'); 
    if (!container) return;

    const expenses = getExpenses();
    let totalExpensesAmount = 0; 

    if (expenses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #555;">هیچ خەرجییەک تۆمار نەکراوە.</p>';
        if (kpiElement) kpiElement.textContent = '0 IQD';
        return;
    }

    // Calculate total
    expenses.forEach(expense => {
        totalExpensesAmount += expense.amount;
    });

    // Display KPI Total
    if (kpiElement) {
        kpiElement.textContent = totalExpensesAmount.toLocaleString() + ' IQD';
    }

    let tableHTML = `
        <table class="expense-table">
            <thead>
                <tr>
                    <th>بەروار</th>
                    <th>پێناسە</th>
                    <th>جۆر</th>
                    <th>بڕی خەرجکراو (IQD)</th>
                    <th>کردار</th>
                </tr>
            </thead>
            <tbody>
    `;

    // Sort by newest first
    expenses.sort((a, b) => b.id - a.id);

    expenses.forEach(expense => {
        tableHTML += `
            <tr>
                <td>${expense.date}</td>
                <td>${expense.description}</td>
                <td>${expense.category}</td>
                <td class="amount-col">${expense.amount.toLocaleString()}</td>
                <td>
                    <button class="delete-btn" onclick="deleteExpense(${expense.id})">سڕینەوە</button>
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

// Initial Load for Expense Page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('expenseForm')) {
        displayExpenses(); 
    }
});