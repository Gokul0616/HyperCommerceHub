import requests
import sys
import json
from datetime import datetime

class HyperPureAPITester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_credentials = {
            "email": "admin@hyperpure.com",
            "password": "admin123"
        }
        self.customer_credentials = {
            "email": "customer@example.com",
            "password": "customer123"
        }

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=False, admin_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"Response: {response.json()}")
                except:
                    print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def login(self, email, password):
        """Test login functionality"""
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        if success and 'user' in response:
            print(f"Logged in as {response['user']['email']} with role {response['user']['role']}")
            return True
        return False

    def get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success and 'user' in response:
            print(f"Current user: {response['user']['email']}")
            return response['user']
        return None

    def logout(self):
        """Test logout functionality"""
        success, _ = self.run_test(
            "Logout",
            "POST",
            "auth/logout",
            200
        )
        return success

    def test_admin_access(self):
        """Test admin-specific endpoints"""
        # Test admin stats
        success, response = self.run_test(
            "Admin Stats",
            "GET",
            "admin/stats",
            200
        )
        if not success:
            return False

        # Test admin orders
        success, response = self.run_test(
            "Admin Orders",
            "GET",
            "admin/orders",
            200
        )
        if not success:
            return False

        return True

    def test_products(self):
        """Test getting products"""
        success, products = self.run_test(
            "Get Products",
            "GET",
            "products",
            200
        )
        return success, products
        
    def test_categories(self):
        """Test getting categories"""
        success, categories = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        return success, categories
        
    def test_add_to_cart(self, product_id, quantity=1):
        """Test adding a product to cart"""
        success, cart_item = self.run_test(
            "Add to Cart",
            "POST",
            "cart",
            200,
            data={"productId": product_id, "quantity": quantity}
        )
        return success, cart_item
        
    def test_get_cart(self):
        """Test getting cart items"""
        success, cart = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200
        )
        return success, cart
        
    def test_checkout(self, delivery_address="Test Address"):
        """Test checkout process"""
        success, order = self.run_test(
            "Checkout",
            "POST",
            "orders",
            200,
            data={"deliveryAddress": delivery_address, "notes": "Test order"}
        )
        return success, order

def main():
    # Setup
    tester = HyperPureAPITester("http://localhost:5001")
    
    print("=== Testing HyperPure API ===")
    
    # Test 1: Admin Login
    print("\n=== Testing Admin Login ===")
    if not tester.login(tester.admin_credentials["email"], tester.admin_credentials["password"]):
        print("❌ Admin login failed, stopping tests")
        return 1
    
    # Test 2: Get Current User (Admin)
    print("\n=== Testing Get Current User (Admin) ===")
    admin_user = tester.get_current_user()
    if not admin_user:
        print("❌ Failed to get admin user info")
        return 1
    
    # Test 3: Admin Access
    print("\n=== Testing Admin Access ===")
    if not tester.test_admin_access():
        print("❌ Admin access test failed")
    
    # Test 4: Get Categories
    print("\n=== Testing Categories ===")
    success, categories = tester.test_categories()
    if not success:
        print("❌ Failed to get categories")
    else:
        print(f"✅ Found {len(categories)} categories")
    
    # Test 5: Get Products
    print("\n=== Testing Products ===")
    success, products = tester.test_products()
    if not success:
        print("❌ Failed to get products")
    else:
        print(f"✅ Found {len(products)} products")
    
    # Test 6: Admin Logout
    print("\n=== Testing Admin Logout ===")
    if not tester.logout():
        print("❌ Admin logout failed")
    
    # Test 7: Customer Login
    print("\n=== Testing Customer Login ===")
    if not tester.login(tester.customer_credentials["email"], tester.customer_credentials["password"]):
        print("❌ Customer login failed")
        return 1
    
    # Test 8: Get Current User (Customer)
    print("\n=== Testing Get Current User (Customer) ===")
    customer_user = tester.get_current_user()
    if not customer_user:
        print("❌ Failed to get customer user info")
        return 1
    
    # Test 9: Add to Cart
    print("\n=== Testing Add to Cart ===")
    if products and len(products) > 0:
        success, cart_item = tester.test_add_to_cart(products[0]["id"])
        if not success:
            print(f"❌ Failed to add product to cart")
    
    # Test 10: Get Cart
    print("\n=== Testing Get Cart ===")
    success, cart = tester.test_get_cart()
    if not success:
        print("❌ Failed to get cart")
    else:
        print(f"✅ Cart has {len(cart)} items")
    
    # Test 11: Checkout
    print("\n=== Testing Checkout ===")
    success, order = tester.test_checkout("Test Delivery Address")
    if not success:
        print("❌ Checkout failed")
    else:
        print(f"✅ Order created with ID: {order['id']}")
    
    # Test 12: Get Orders
    print("\n=== Testing Get Orders ===")
    success, orders = tester.run_test(
        "Get Orders",
        "GET",
        "orders",
        200
    )
    if not success:
        print("❌ Failed to get orders")
    else:
        print(f"✅ Found {len(orders)} orders")
    
    # Test 13: Customer Logout
    print("\n=== Testing Customer Logout ===")
    if not tester.logout():
        print("❌ Customer logout failed")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())