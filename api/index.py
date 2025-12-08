import os
import sys
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import uuid
from datetime import datetime

# Debug: Print Python info
print("Python version:", sys.version)
print("Current directory:", os.getcwd())
print("Files in directory:", os.listdir('.'))

# Fix path issues
if __name__ == '__main__':
    # Running locally
    template_dir = '../templates'
    static_dir = '../static'
else:
    # Running on Vercel
    template_dir = 'templates'
    static_dir = 'static'

print(f"Template dir: {template_dir}, exists: {os.path.exists(template_dir)}")
print(f"Static dir: {static_dir}, exists: {os.path.exists(static_dir)}")

# Initialize Flask with explicit paths
app = Flask(__name__, 
            template_folder=template_dir,
            static_folder=static_dir)
CORS(app)

# Add this middleware to handle missing static/template folders
@app.before_request
def before_request():
    pass  # Placeholder for debugging

# Simple in-memory storage
products_db = [
    {"id": "1", "code": "P001", "name": "Product A", "price": 10.99},
    {"id": "2", "code": "P002", "name": "Product B", "price": 15.50}
]

customers_db = []
purchases_db = []

@app.route('/')
def home():
    """Main page - simplified for testing"""
    try:
        # First, return a simple HTML to test
        return """
        <!DOCTYPE html>
        <html>
        <head>
            <title>POS System</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
        </head>
        <body>
            <div class="container mt-5">
                <h1>Marnie POS System</h1>
                <p>Backend is running successfully!</p>
                <p>Test API endpoints:</p>
                <ul>
                    <li><a href="/api/health">/api/health</a> - Health check</li>
                    <li><a href="/api/products">/api/products</a> - Products</li>
                </ul>
            </div>
        </body>
        </html>
        """
    except Exception as e:
        print(f"Error in home route: {e}")
        return f"Error loading page: {str(e)}", 500

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Marnie POS System",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/products')
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
        print(f"Error creating product: {e}")
        return jsonify({"success": False, "error": str(e)}), 400

# Vercel requires this
app = app

if __name__ == '__main__':
    app.run(debug=True, port=8080)
