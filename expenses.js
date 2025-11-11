// expenses.js - FINAL FIREBASE FIRESTORE VERSION (ASYNC)

// NOTE: We assume getFromStorage and saveToStorage are defined in script.js

// --- Expense Storage API (Now relies on async/await) ---
async function getExpenses() { return await getFromStorage('expensesData', []); } // 🚨 async/await
async function saveExpenses(expenses) { return await saveToStorage('expensesData', expenses); } // 🚨 async/await

// Function to add a new expense
async function addExpense(event) { // 🚨 async
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

    let expenses = await getExpenses(); // 🚨 await
    expenses.push(newExpense);
    await saveExpenses(expenses); // 🚨 await

    document.getElementById('expenseForm').reset();
    await displayExpenses(); // 🚨 await
    alert('خەرجی بە سەرکەوتوویی تۆمار کرا.');
}

// Function to delete an expense
async function deleteExpense(expenseId) { // 🚨 async
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم خەرجییە؟')) {
        return;
    }

    let expenses = await getExpenses(); // 🚨 await
    expenses = expenses.filter(e => e.id !== expenseId);
    await saveExpenses(expenses); // 🚨 await
    await displayExpenses(); // 🚨 await
}

// Function to display the list of expenses
async function displayExpenses() { // 🚨 async
    const container = document.getElementById('expenseList');
    const kpiElement = document.getElementById('kpi-total-expenses'); 
    if (!container) return;

    const expenses = await getExpenses(); // 🚨 await
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