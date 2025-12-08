import os
import sys
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import uuid
from datetime import datetime

# Debug: Print current directory
print("=== Vercel Flask Debug ===")
print("Python version:", sys.version)
print("Current directory:", os.getcwd())
print("Files in current directory:", os.listdir('.'))

# Check if we're running on Vercel
is_vercel = os.environ.get('VERCEL') == '1'
print("Running on Vercel:", is_vercel)

# Initialize Flask app with correct paths
app = Flask(__name__)
CORS(app)

# Set paths based on environment
if is_vercel:
    # On Vercel, files are at the same level as api folder
    app.template_folder = '../templates'
    app.static_folder = '../static'
else:
    # Running locally
    app.template_folder = 'templates'
    app.static_folder = 'static'

print(f"Template folder: {app.template_folder}")
print(f"Static folder: {app.static_folder}")

# Check if folders exist
print(f"Templates exist: {os.path.exists(app.template_folder)}")
print(f"Static exist: {os.path.exists(app.static_folder)}")

# In-memory data storage
products_db = [
    {"id": "1", "code": "P001", "name": "Product A", "price": 10.99},
    {"id": "2", "code": "P002", "name": "Product B", "price": 15.50},
    {"id": "3", "code": "P003", "name": "Product C", "price": 8.75}
]

customers_db = [
    {"id": "1", "name": "John Doe", "phone": "123-456-7890", "email": "john@example.com"},
    {"id": "2", "name": "Jane Smith", "phone": "098-765-4321", "email": "jane@example.com"}
]

purchases_db = []

@app.route('/')
def home():
    """Main POS interface"""
    try:
        return render_template('index.html')
    except Exception as e:
        error_msg = f"Error loading template: {str(e)}"
        print(error_msg)
        return f"""
        <html>
        <body>
            <h1>Marnie POS System</h1>
            <p>Backend is running but template error: {e}</p>
            <p><a href="/api/health">Health Check</a></p>
            <p><a href="/api/products">Products API</a></p>
        </body>
        </html>
        """, 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Marnie POS System",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    return jsonify({
        "success": True,
        "products": products_db,
        "count": len(products_db)
    })

@app.route('/api/products', methods=['POST'])
def create_product():
    """Create a new product"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        new_product = {
            "id": str(uuid.uuid4()),
            "code": data.get('code', ''),
            "name": data.get('name', ''),
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
    return jsonify({
        "success": True,
        "customers": customers_db,
        "count": len(customers_db)
    })

@app.route('/api/customers', methods=['POST'])
def create_customer():
    """Create a new customer"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        new_customer = {
            "id": str(uuid.uuid4()),
            "name": data.get('name', ''),
            "phone": data.get('phone', ''),
            "email": data.get('email', ''),
            "created_at": datetime.now().isoformat()
        }
        customers_db.append(new_customer)
        return jsonify({"success": True, "customer": new_customer})
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

# Test endpoint to check static files
@app.route('/api/debug')
def debug():
    """Debug endpoint"""
    return jsonify({
        "cwd": os.getcwd(),
        "files": os.listdir('.'),
        "templates_exists": os.path.exists(app.template_folder),
        "static_exists": os.path.exists(app.static_folder),
        "is_vercel": is_vercel
    })

# This is REQUIRED for Vercel
app = app

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080)
