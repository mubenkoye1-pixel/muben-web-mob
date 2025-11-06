// --- General LocalStorage Functions (Duplicated for access) ---

function getFromStorage(key, defaultValue = []) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ==========================================================
// --- CUSTOMER MANAGEMENT LOGIC (customer.html) ---
// ==========================================================

function getCustomers() {
    // Key used by sales.js for loading customers
    const customers = localStorage.getItem('customerData'); 
    return customers ? JSON.parse(customers) : [];
}

function saveCustomers(customers) {
    localStorage.setItem('customerData', JSON.stringify(customers));
}

function addCustomer(event) {
    event.preventDefault();
    
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    if (!name) {
        alert('تکایە ناوی کریار بنووسە.');
        return;
    }

    let customers = getCustomers();

    // Check if customer already exists (case-insensitive name check)
    const exists = customers.some(c => c.name.toLowerCase() === name.toLowerCase());
    if (exists) {
        alert(`کریارێک بە ناوی "${name}" پێشتر تۆمار کراوە.`);
        return;
    }

    const newCustomer = {
        id: Date.now(),
        name: name,
        phone: phone,
        address: address
    };

    customers.push(newCustomer);
    saveCustomers(customers);
    
    document.getElementById('customerForm').reset();
    displayCustomers();
    alert('کریار "${name}" بە سەرکەوتوویی تۆمار کرا.');
}

function deleteCustomer(customerId) {
    if (!confirm('دڵنیایت لە سڕینەوەی ئەم کریارە؟')) {
        return;
    }

    let customers = getCustomers();
    customers = customers.filter(c => c.id !== customerId);
    saveCustomers(customers);
    displayCustomers();
}


// ... (لە ناو customer.js) ...

function displayCustomers() {
    const container = document.getElementById('customerListContainer');
    if (!container) return;

    const customers = getCustomers();

    if (customers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #555;">هیچ کریارێک تۆمار نەکراوە.</p>';
        return;
    }

    let tableHTML = `
        <table class="customer-table">
            <thead>
                <tr>
                    <th>ناوی کریار</th>
                    <th>ژمارەی مۆبایل</th>
                    <th>ناونیشان</th>
                    <th>کردار</th>
                </tr>
            </thead>
            <tbody>
    `;

    customers.forEach(customer => {
        tableHTML += `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.phone || '—'}</td>
                <td>${customer.address || '—'}</td>
                <td>
                    <button class="delete-btn" onclick="deleteCustomer(${customer.id})">سڕینەوە</button>
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

// ... (باقی کۆدەکە هەمانە) ...


// Initial load for customer page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('customerForm')) {
        displayCustomers();
    }
});