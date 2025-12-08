// POS System JavaScript
class MarniePOS {
    constructor() {
        this.apiBase = window.location.origin;
        this.products = [];
        this.customers = [];
        this.purchases = [];
        this.cart = [];
        this.selectedCustomerId = null;
        
        this.init();
    }
    
    async init() {
        this.updateCurrentDate();
        setInterval(() => this.updateCurrentDate(), 60000);
        
        await this.loadProducts();
        await this.loadCustomers();
        await this.loadDashboardStats();
        
        this.setupEventListeners();
        this.updateConnectionStatus();
        
        console.log('POS System initialized. API Base:', this.apiBase);
    }
    
    updateCurrentDate() {
        const now = new Date();
        document.getElementById('current-date').textContent = 
            now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }
    
    updateConnectionStatus() {
        document.getElementById('connection-status').textContent = 'Connected to Backend';
    }
    
    async fetchAPI(endpoint, options = {}) {
        try {
            console.log('Fetching:', `${this.apiBase}${endpoint}`);
            const response = await fetch(`${this.apiBase}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            const data = await response.json();
            console.log('Response:', data);
            return data;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Network error: ' + error.message };
        }
    }
    
    async loadProducts() {
        console.log('Loading products...');
        const result = await this.fetchAPI('/api/products');
        if (result.success) {
            this.products = result.products;
            this.renderProducts();
            this.populateProductSelect();
        } else {
            console.error('Failed to load products:', result.error);
        }
    }
    
    async loadCustomers() {
        console.log('Loading customers...');
        const result = await this.fetchAPI('/api/customers');
        if (result.success) {
            this.customers = result.customers;
            this.renderCustomers();
        } else {
            console.error('Failed to load customers:', result.error);
        }
    }
    
    async loadDashboardStats() {
        console.log('Loading dashboard stats...');
        const result = await this.fetchAPI('/api/dashboard/stats');
        if (result.success) {
            this.updateDashboard(result.stats);
        } else {
            console.error('Failed to load dashboard stats:', result.error);
        }
    }
    
    updateDashboard(stats) {
        console.log('Updating dashboard with stats:', stats);
        document.getElementById('total-sales').textContent = `$${stats.total_sales.toFixed(2)}`;
        document.getElementById('total-customers').textContent = stats.total_customers;
        document.getElementById('total-products').textContent = stats.total_products;
        document.getElementById('pending-payments').textContent = stats.pending_payments;
        
        this.renderRecentTransactions(stats.recent_transactions);
    }
    
    renderRecentTransactions(transactions) {
        const tbody = document.getElementById('recent-transactions-body');
        tbody.innerHTML = '';
        
        transactions.forEach(transaction => {
            const customer = this.customers.find(c => c.id === transaction.customer_id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer?.name || transaction.customer_name || 'Unknown'}</td>
                <td>$${transaction.total_amount?.toFixed(2) || '0.00'}</td>
                <td>${new Date(transaction.purchase_date).toLocaleDateString()}</td>
                <td>
                    <span class="badge ${transaction.status === 'paid' ? 'bg-success' : 'bg-warning'}">
                        ${transaction.status || 'pending'}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }
    
    renderProducts() {
        const tbody = document.getElementById('products-table-body');
        tbody.innerHTML = '';
        
        this.products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.code}</td>
                <td>${product.name}</td>
                <td>$${product.price?.toFixed(2) || '0.00'}</td>
                <td>
                    <div class="edit-actions">
                        <button class="btn btn-sm btn-primary edit-product" data-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.getElementById('total-products').textContent = this.products.length;
    }
    
    renderCustomers() {
        const tbody = document.getElementById('customers-table-body');
        tbody.innerHTML = '';
        
        this.customers.forEach(customer => {
            const row = document.createElement('tr');
            row.className = 'customer-row';
            row.setAttribute('data-id', customer.id);
            row.innerHTML = `
                <td>${customer.name}</td>
                <td>${customer.phone || 'N/A'}</td>
                <td>$${customer.total_purchases?.toFixed(2) || '0.00'}</td>
            `;
            tbody.appendChild(row);
        });
        
        document.getElementById('total-customers').textContent = this.customers.length;
    }
    
    populateProductSelect() {
        const select = document.getElementById('product-select');
        select.innerHTML = '<option value="">Select a product...</option>';
        
        this.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.code} - ${product.name} - $${product.price}`;
            select.appendChild(option);
        });
    }
    
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Product form
        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProduct();
        });
        
        // Product search
        document.getElementById('product-search').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });
        
        // Add to cart
        document.getElementById('add-to-cart-btn').addEventListener('click', () => {
            this.addToCart();
        });
        
        // Clear cart
        document.getElementById('clear-cart-btn').addEventListener('click', () => {
            this.clearCart();
        });
        
        // Finalize purchase
        document.getElementById('finalize-purchase-btn').addEventListener('click', () => {
            this.finalizePurchase();
        });
        
        // Customer selection
        document.addEventListener('click', (e) => {
            if (e.target.closest('.customer-row')) {
                const row = e.target.closest('.customer-row');
                const customerId = row.getAttribute('data-id');
                this.selectedCustomerId = customerId;
                this.showCustomerDetails(customerId);
            }
            
            if (e.target.closest('.edit-product')) {
                const productId = e.target.closest('.edit-product').getAttribute('data-id');
                this.editProduct(productId);
            }
            
            if (e.target.closest('.delete-product')) {
                const productId = e.target.closest('.delete-product').getAttribute('data-id');
                this.deleteProduct(productId);
            }
        });
        
        // Print receipt
        document.getElementById('print-receipt-btn').addEventListener('click', () => {
            this.printReceipt();
        });
    }
    
    async addProduct() {
        const code = document.getElementById('product-code').value;
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        
        if (!code || !name || isNaN(price)) {
            alert('Please fill in all fields correctly');
            return;
        }
        
        const result = await this.fetchAPI('/api/products', {
            method: 'POST',
            body: JSON.stringify({ code, name, price })
        });
        
        if (result.success) {
            this.products.push(result.product);
            this.renderProducts();
            this.populateProductSelect();
            document.getElementById('product-form').reset();
            alert('Product added successfully!');
        } else {
            alert('Error adding product: ' + result.error);
        }
    }
    
    filterProducts(searchTerm) {
        const rows = document.querySelectorAll('#products-table-body tr');
        const search = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const code = row.cells[0].textContent.toLowerCase();
            const name = row.cells[1].textContent.toLowerCase();
            
            if (code.includes(search) || name.includes(search)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    addToCart() {
        const productId = document.getElementById('product-select').value;
        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        
        if (!productId) {
            alert('Please select a product');
            return;
        }
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        // Check if already in cart
        const existingItem = this.cart.find(item => item.product_id === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
            existingItem.subtotal = existingItem.price * existingItem.quantity;
        } else {
            this.cart.push({
                product_id: productId,
                name: product.name,
                price: product.price,
                quantity: quantity,
                subtotal: product.price * quantity
            });
        }
        
        this.renderCart();
        document.getElementById('quantity').value = 1;
    }
    
    renderCart() {
        const tbody = document.getElementById('cart-table-body');
        tbody.innerHTML = '';
        
        let total = 0;
        
        this.cart.forEach((item, index) => {
            total += item.subtotal;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.name}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>
                    <input type="number" class="form-control form-control-sm quantity-input" 
                           value="${item.quantity}" min="1" data-index="${index}">
                </td>
                <td>$${item.subtotal.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-danger remove-cart-item" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        document.getElementById('cart-total').textContent = `Total: $${total.toFixed(2)}`;
        
        // Add event listeners for quantity changes
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.cart[index].quantity = parseInt(e.target.value) || 1;
                this.cart[index].subtotal = this.cart[index].price * this.cart[index].quantity;
                this.renderCart();
            });
        });
        
        // Add event listeners for remove buttons
        document.querySelectorAll('.remove-cart-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.remove-cart-item').getAttribute('data-index'));
                this.cart.splice(index, 1);
                this.renderCart();
            });
        });
    }
    
    clearCart() {
        this.cart = [];
        this.renderCart();
    }
    
    async finalizePurchase() {
        if (this.cart.length === 0) {
            alert('Cart is empty');
            return;
        }
        
        const customerName = document.getElementById('customer-name').value;
        if (!customerName) {
            alert('Please enter customer name');
            return;
        }
        
        // Find or create customer
        let customer = this.customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        const phone = document.getElementById('customer-phone').value;
        const email = document.getElementById('customer-email').value;
        
        if (!customer) {
            const result = await this.fetchAPI('/api/customers', {
                method: 'POST',
                body: JSON.stringify({ name: customerName, phone, email })
            });
            
            if (result.success) {
                customer = result.customer;
                this.customers.push(customer);
                this.renderCustomers();
            } else {
                alert('Error creating customer: ' + result.error);
                return;
            }
        }
        
        // Calculate total
        const total = this.cart.reduce((sum, item) => sum + item.subtotal, 0);
        
        // Create purchase
        const purchaseData = {
            customer_id: customer.id,
            customer_name: customer.name,
            products: this.cart,
            total_amount: total,
            status: 'pending'
        };
        
        console.log('Creating purchase:', purchaseData);
        
        const result = await this.fetchAPI('/api/purchases', {
            method: 'POST',
            body: JSON.stringify(purchaseData)
        });
        
        if (result.success) {
            this.purchases.push(result.purchase);
            this.showReceipt(customer, total);
            this.clearCart();
            document.getElementById('customer-name').value = '';
            document.getElementById('customer-phone').value = '';
            document.getElementById('customer-email').value = '';
            
            // Refresh dashboard
            await this.loadDashboardStats();
            alert('Purchase completed successfully!');
        } else {
            alert('Error creating purchase: ' + result.error);
        }
    }
    
    showReceipt(customer, total) {
        const now = new Date();
        let receiptHTML = `
            <div class="text-center mb-3">
                <h4>Marnie Store</h4>
                <p>Purchase Receipt</p>
            </div>
            <hr>
            <p><strong>Customer:</strong> ${customer.name}</p>
            <p><strong>Date:</strong> ${now.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${now.toLocaleTimeString()}</p>
            <hr>
            <table width="100%">
        `;
        
        this.cart.forEach(item => {
            receiptHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td align="right">${item.quantity} x $${item.price.toFixed(2)}</td>
                    <td align="right">$${item.subtotal.toFixed(2)}</td>
                </tr>
            `;
        });
        
        receiptHTML += `
                <tr>
                    <td colspan="3"><hr></td>
                </tr>
                <tr>
                    <td><strong>Total:</strong></td>
                    <td></td>
                    <td align="right"><strong>$${total.toFixed(2)}</strong></td>
                </tr>
            </table>
            <hr>
            <p class="text-center">Thank you for your business!</p>
            <p class="text-center"><strong>Status: PENDING PAYMENT</strong></p>
        `;
        
        document.getElementById('receipt-content').innerHTML = receiptHTML;
        new bootstrap.Modal(document.getElementById('receiptModal')).show();
    }
    
    printReceipt() {
        const receiptContent = document.getElementById('receipt-content').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Receipt</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { width: 100%; }
                    hr { border-top: 1px dashed #000; }
                    .text-center { text-align: center; }
                </style>
            </head>
            <body>${receiptContent}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
    
    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;
        
        const newCode = prompt('Enter new product code:', product.code);
        if (!newCode) return;
        
        const newName = prompt('Enter new product name:', product.name);
        if (!newName) return;
        
        const newPrice = parseFloat(prompt('Enter new price:', product.price));
        if (isNaN(newPrice)) return;
        
        const result = await this.fetchAPI(`/api/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ code: newCode, name: newName, price: newPrice })
        });
        
        if (result.success) {
            Object.assign(product, result.product);
            this.renderProducts();
            this.populateProductSelect();
            alert('Product updated successfully!');
        } else {
            alert('Error updating product: ' + result.error);
        }
    }
    
    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        
        const result = await this.fetchAPI(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            this.products = this.products.filter(p => p.id !== productId);
            this.renderProducts();
            this.populateProductSelect();
            alert('Product deleted successfully!');
        } else {
            alert('Error deleting product: ' + result.error);
        }
    }
    
    showCustomerDetails(customerId) {
        const customer = this.customers.find(c => c.id === customerId);
        if (!customer) return;
        
        const detailsDiv = document.getElementById('customer-details');
        detailsDiv.innerHTML = `
            <h5>${customer.name}</h5>
            <p><strong>Phone:</strong> ${customer.phone || 'N/A'}</p>
            <p><strong>Email:</strong> ${customer.email || 'N/A'}</p>
            <p><strong>Total Purchases:</strong> $${customer.total_purchases?.toFixed(2) || '0.00'}</p>
        `;
    }
}

// Initialize the POS system
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing POS system...');
    window.posSystem = new MarniePOS();
});
