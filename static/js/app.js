// Simple test JavaScript
console.log('POS System JavaScript loaded');

// Update date
function updateCurrentDate() {
    const now = new Date();
    const dateElement = document.getElementById('current-date');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
    }
}

// Update every second
setInterval(updateCurrentDate, 1000);
updateCurrentDate();

// Test API call
async function testAPI() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('Health check:', data);
        document.getElementById('connection-status').textContent = 'API Connected';
    } catch (error) {
        console.error('API test failed:', error);
        document.getElementById('connection-status').textContent = 'API Connection Failed';
    }
}

testAPI();
