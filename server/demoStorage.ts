import {
  type User,
  type InsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type ProductWithCategory,
  type Inventory,
  type InsertInventory,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderWithItems,
  type Cart,
  type InsertCart,
  type CartWithProduct,
} from "@shared/schema";
import { IStorage } from "./storage";
import bcrypt from "bcrypt";

export class DemoStorage implements IStorage {
  private users: User[] = [];
  private categories: Category[] = [];
  private products: Product[] = [];
  private inventory: Inventory[] = [];
  private orders: Order[] = [];
  private orderItems: OrderItem[] = [];
  private cart: Cart[] = [];
  private nextId = 1;

  constructor() {
    this.initializeDemoData();
  }

  private async initializeDemoData() {
    // Create demo admin user
    const adminUser: User = {
      id: this.nextId++,
      email: "admin@hyperpure.com",
      password: await this.hashPassword("admin123"),
      firstName: "Admin",
      lastName: "User",
      businessName: "HyperPure Admin",
      phone: "1234567890",
      address: "123 Admin St",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      role: "admin",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(adminUser);

    // Create demo customer
    const customerUser: User = {
      id: this.nextId++,
      email: "customer@example.com",
      password: await this.hashPassword("customer123"),
      firstName: "Demo",
      lastName: "Customer",
      businessName: "Demo Business",
      phone: "9876543210",
      address: "456 Customer St",
      city: "Delhi",
      state: "Delhi",
      pincode: "110001",
      role: "customer",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(customerUser);

    // Create demo categories
    const fruitsCategory: Category = {
      id: this.nextId++,
      name: "Fruits",
      description: "Fresh fruits",
      icon: "apple",
      isActive: true,
      createdAt: new Date(),
    };
    this.categories.push(fruitsCategory);

    const vegetablesCategory: Category = {
      id: this.nextId++,
      name: "Vegetables",
      description: "Fresh vegetables",
      icon: "package",
      isActive: true,
      createdAt: new Date(),
    };
    this.categories.push(vegetablesCategory);

    const dairyCategory: Category = {
      id: this.nextId++,
      name: "Dairy",
      description: "Dairy products",
      icon: "milk",
      isActive: true,
      createdAt: new Date(),
    };
    this.categories.push(dairyCategory);

    // Create demo products
    const products = [
      {
        name: "Fresh Apples",
        description: "Crisp and sweet apples",
        categoryId: fruitsCategory.id,
        price: "120.00",
        unit: "kg",
        minQuantity: 1,
        maxQuantity: 10,
        imageUrl: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400",
        isActive: true,
      },
      {
        name: "Bananas",
        description: "Ripe yellow bananas",
        categoryId: fruitsCategory.id,
        price: "60.00",
        unit: "dozen",
        minQuantity: 1,
        maxQuantity: 5,
        imageUrl: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400",
        isActive: true,
      },
      {
        name: "Tomatoes",
        description: "Fresh red tomatoes",
        categoryId: vegetablesCategory.id,
        price: "80.00",
        unit: "kg",
        minQuantity: 1,
        maxQuantity: 5,
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400",
        isActive: true,
      },
      {
        name: "Fresh Milk",
        description: "Pure cow milk",
        categoryId: dairyCategory.id,
        price: "55.00",
        unit: "liter",
        minQuantity: 1,
        maxQuantity: 10,
        imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400",
        isActive: true,
      },
    ];

    for (const productData of products) {
      const product: Product = {
        id: this.nextId++,
        ...productData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.products.push(product);

      // Create inventory for each product
      const inventoryItem: Inventory = {
        id: this.nextId++,
        productId: product.id,
        quantity: Math.floor(Math.random() * 100) + 10,
        reservedQuantity: 0,
        lowStockThreshold: 10,
        updatedAt: new Date(),
      };
      this.inventory.push(inventoryItem);
    }

    // Create demo orders
    const demoOrder: Order = {
      id: this.nextId++,
      userId: customerUser.id,
      orderNumber: `HP${Date.now()}`,
      status: "pending",
      totalAmount: "240.00",
      deliveryAddress: "456 Customer St, Delhi, Delhi 110001",
      deliveryDate: null,
      notes: "Demo order for testing",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.push(demoOrder);

    // Create demo order items
    const orderItem: OrderItem = {
      id: this.nextId++,
      orderId: demoOrder.id,
      productId: this.products[0].id,
      quantity: 2,
      price: "120.00",
      total: "240.00",
    };
    this.orderItems.push(orderItem);
  }

  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    const user: User = {
      id: this.nextId++,
      ...userData,
      password: hashedPassword,
      role: this.users.length === 0 ? "admin" : "customer",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error("User not found");
    
    this.users[index] = { 
      ...this.users[index], 
      ...userData, 
      updatedAt: new Date() 
    };
    return this.users[index];
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return this.categories.filter(c => c.isActive);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    return this.categories.find(c => c.id === id);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const category: Category = {
      id: this.nextId++,
      ...categoryData,
      createdAt: new Date(),
    };
    this.categories.push(category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Category not found");
    
    this.categories[index] = { ...this.categories[index], ...categoryData };
    return this.categories[index];
  }

  async deleteCategory(id: number): Promise<void> {
    const index = this.categories.findIndex(c => c.id === id);
    if (index !== -1) {
      this.categories[index].isActive = false;
    }
  }

  async toggleProductStatus(id: number, isActive: boolean): Promise<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    
    this.products[index].isActive = isActive;
    this.products[index].updatedAt = new Date();
    return this.products[index];
  }

  // Product operations
  async getProducts(categoryId?: number, search?: string): Promise<ProductWithCategory[]> {
    let filtered = this.products.filter(p => p.isActive);
    
    if (categoryId) {
      filtered = filtered.filter(p => p.categoryId === categoryId);
    }
    
    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    return filtered.map(product => ({
      ...product,
      category: this.categories.find(c => c.id === product.categoryId)!,
      inventory: this.inventory.find(i => i.productId === product.id)!,
    }));
  }

  async getProductById(id: number): Promise<ProductWithCategory | undefined> {
    const product = this.products.find(p => p.id === id);
    if (!product) return undefined;
    
    return {
      ...product,
      category: this.categories.find(c => c.id === product.categoryId)!,
      inventory: this.inventory.find(i => i.productId === product.id)!,
    };
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const product: Product = {
      id: this.nextId++,
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(product);
    
    // Create inventory
    const inventoryItem: Inventory = {
      id: this.nextId++,
      productId: product.id,
      quantity: 0,
      reservedQuantity: 0,
      lowStockThreshold: 10,
      updatedAt: new Date(),
    };
    this.inventory.push(inventoryItem);
    
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
    const index = this.products.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    
    this.products[index] = { 
      ...this.products[index], 
      ...productData, 
      updatedAt: new Date() 
    };
    return this.products[index];
  }

  async deleteProduct(id: number): Promise<void> {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products[index].isActive = false;
    }
  }

  // Inventory operations
  async getInventoryByProductId(productId: number): Promise<Inventory | undefined> {
    return this.inventory.find(i => i.productId === productId);
  }

  async updateInventory(productId: number, inventoryData: Partial<InsertInventory>): Promise<Inventory> {
    const index = this.inventory.findIndex(i => i.productId === productId);
    if (index === -1) throw new Error("Inventory not found");
    
    this.inventory[index] = { 
      ...this.inventory[index], 
      ...inventoryData, 
      updatedAt: new Date() 
    };
    return this.inventory[index];
  }

  async getLowStockProducts(): Promise<ProductWithCategory[]> {
    const lowStockInventory = this.inventory.filter(i => i.quantity <= i.lowStockThreshold);
    const products = [];
    
    for (const inv of lowStockInventory) {
      const product = this.products.find(p => p.id === inv.productId && p.isActive);
      if (product) {
        products.push({
          ...product,
          category: this.categories.find(c => c.id === product.categoryId)!,
          inventory: inv,
        });
      }
    }
    
    return products;
  }

  // Cart operations
  async getCartByUserId(userId: number): Promise<CartWithProduct[]> {
    return this.cart
      .filter(c => c.userId === userId)
      .map(cartItem => ({
        ...cartItem,
        product: {
          ...this.products.find(p => p.id === cartItem.productId)!,
          category: this.categories.find(c => c.id === this.products.find(p => p.id === cartItem.productId)!.categoryId)!,
        },
      }));
  }

  async addToCart(cartData: InsertCart): Promise<Cart> {
    const existing = this.cart.find(c => c.userId === cartData.userId && c.productId === cartData.productId);
    
    if (existing) {
      existing.quantity += cartData.quantity;
      existing.updatedAt = new Date();
      return existing;
    }
    
    const cartItem: Cart = {
      id: this.nextId++,
      ...cartData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cart.push(cartItem);
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<Cart> {
    const index = this.cart.findIndex(c => c.id === id);
    if (index === -1) throw new Error("Cart item not found");
    
    this.cart[index].quantity = quantity;
    this.cart[index].updatedAt = new Date();
    return this.cart[index];
  }

  async removeFromCart(id: number): Promise<void> {
    const index = this.cart.findIndex(c => c.id === id);
    if (index !== -1) {
      this.cart.splice(index, 1);
    }
  }

  async clearCart(userId: number): Promise<void> {
    this.cart = this.cart.filter(c => c.userId !== userId);
  }

  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const order: Order = {
      id: this.nextId++,
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orders.push(order);
    return order;
  }

  async createOrderItems(orderItemsData: InsertOrderItem[]): Promise<OrderItem[]> {
    const items = orderItemsData.map(item => ({
      id: this.nextId++,
      ...item,
    }));
    this.orderItems.push(...items);
    return items;
  }

  async getOrdersByUserId(userId: number): Promise<OrderWithItems[]> {
    return this.orders
      .filter(o => o.userId === userId)
      .map(order => ({
        ...order,
        items: this.orderItems
          .filter(oi => oi.orderId === order.id)
          .map(oi => ({
            ...oi,
            product: this.products.find(p => p.id === oi.productId)!,
          })),
        user: this.users.find(u => u.id === order.userId)!,
      }));
  }

  async getOrderById(id: number): Promise<OrderWithItems | undefined> {
    const order = this.orders.find(o => o.id === id);
    if (!order) return undefined;
    
    return {
      ...order,
      items: this.orderItems
        .filter(oi => oi.orderId === order.id)
        .map(oi => ({
          ...oi,
          product: this.products.find(p => p.id === oi.productId)!,
        })),
      user: this.users.find(u => u.id === order.userId)!,
    };
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const index = this.orders.findIndex(o => o.id === id);
    if (index === -1) throw new Error("Order not found");
    
    this.orders[index].status = status;
    this.orders[index].updatedAt = new Date();
    return this.orders[index];
  }

  async getAllOrders(): Promise<OrderWithItems[]> {
    return this.orders.map(order => ({
      ...order,
      items: this.orderItems
        .filter(oi => oi.orderId === order.id)
        .map(oi => ({
          ...oi,
          product: this.products.find(p => p.id === oi.productId)!,
        })),
      user: this.users.find(u => u.id === order.userId)!,
    }));
  }

  // Admin operations
  async getAdminStats() {
    const totalOrders = this.orders.length;
    const totalRevenue = this.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const totalProducts = this.products.filter(p => p.isActive).length;
    const totalCustomers = this.users.filter(u => u.role === "customer").length;
    const recentOrders = await this.getAllOrders();
    
    return {
      totalOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      recentOrders: recentOrders.slice(0, 5),
    };
  }

  // Authentication
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12);
  }
}