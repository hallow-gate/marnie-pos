from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import uuid
from datetime import datetime
import os

app = Flask(__name__, 
            static_folder='../static',
            template_folder='../templates')
CORS(app)

# In-memory data storage
products_db = []
customers_db = []
purchases_db = []

# Add some sample data
if not products_db:
    products_db = [
        {"id": "1", "code": "P001", "name": "Product A", "price": 10.99},
        {"id": "2", "code": "P002", "name": "Product B", "price": 15.50},
        {"id": "3", "code": "P003", "name": "Product C", "price": 8.75}
    ]

if not customers_db:
    customers_db = [
        {"id": "1", "name": "John Doe", "phone": "123-456-7890", "email": "john@example.com"},
        {"id": "2", "name": "Jane Smith", "phone": "098-765-4321", "email": "jane@example.com"}
    ]

@app.route('/')
def home():
    """Render the main POS interface"""
    return render_template('index.html')

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    return jsonify({"success": True, "products": products_db})

@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product"""
    try:
        data = request.get_json()
        new_product = {
            "id": str(uuid.uuid4()),
            "code": data.get('code'),
            "name": data.get('name'),
            "price": float(data.get('price', 0)),
            "created_at": datetime.now().isoformat()
        }
        products_db.append(new_product)
        return jsonify({"success": True, "product": new_product})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/customers', methods=['GET'])
def get_customers():
    """Get all customers"""
    return jsonify({"success": True, "customers": customers_db})

@app.route('/api/customers', methods=['POST'])
def create_customer():
    """Create a new customer"""
    try:
        data = request.get_json()
        new_customer = {
            "id": str(uuid.uuid4()),
            "name": data.get('name'),
            "phone": data.get('phone', ''),
            "email": data.get('email', ''),
            "created_at": datetime.now().isoformat()
        }
        customers_db.append(new_customer)
        return jsonify({"success": True, "customer": new_customer})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/purchases', methods=['GET'])
def get_purchases():
    """Get all purchases"""
    return jsonify({"success": True, "purchases": purchases_db})

@app.route('/api/purchases', methods=['POST'])
def create_purchase():
    """Create a new purchase"""
    try:
        data = request.get_json()
        new_purchase = {
            "id": str(uuid.uuid4()),
            "customer_id": data.get('customer_id'),
            "customer_name": data.get('customer_name'),
            "products": data.get('products', []),
            "total_amount": float(data.get('total_amount', 0)),
            "status": 'pending',
            "purchase_date": datetime.now().isoformat()
        }
        purchases_db.append(new_purchase)
        return jsonify({"success": True, "purchase": new_purchase})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    total_sales = sum(p.get('total_amount', 0) for p in purchases_db)
    pending_payments = len([p for p in purchases_db if p.get('status') == 'pending'])
    
    stats = {
        "total_sales": total_sales,
        "total_customers": len(customers_db),
        "total_products": len(products_db),
        "pending_payments": pending_payments,
        "recent_transactions": purchases_db[-10:][::-1] if purchases_db else []
    }
    return jsonify({"success": True, "stats": stats})

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "service": "Marnie POS System"
    })

# For Vercel deployment
handler = app

if __name__ == '__main__':
    app.run(debug=True)
