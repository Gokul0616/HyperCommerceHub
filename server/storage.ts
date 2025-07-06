import {
  users,
  categories,
  products,
  inventory,
  orders,
  orderItems,
  cart,
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
import { db } from "./db";
import { eq, and, desc, asc, like, sql, count, sum } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  
  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;
  
  // Product operations
  getProducts(categoryId?: number, search?: string): Promise<ProductWithCategory[]>;
  getProductById(id: number): Promise<ProductWithCategory | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;
  
  // Inventory operations
  getInventoryByProductId(productId: number): Promise<Inventory | undefined>;
  updateInventory(productId: number, inventory: Partial<InsertInventory>): Promise<Inventory>;
  getLowStockProducts(): Promise<ProductWithCategory[]>;
  
  // Cart operations
  getCartByUserId(userId: number): Promise<CartWithProduct[]>;
  addToCart(cartItem: InsertCart): Promise<Cart>;
  updateCartItem(id: number, quantity: number): Promise<Cart>;
  removeFromCart(id: number): Promise<void>;
  clearCart(userId: number): Promise<void>;
  
  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  createOrderItems(orderItems: InsertOrderItem[]): Promise<OrderItem[]>;
  getOrdersByUserId(userId: number): Promise<OrderWithItems[]>;
  getOrderById(id: number): Promise<OrderWithItems | undefined>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  getAllOrders(): Promise<OrderWithItems[]>;
  
  // Admin operations
  getAdminStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalCustomers: number;
    recentOrders: OrderWithItems[];
  }>;
  
  // Authentication
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    // Check if this is the first user, make them admin
    const existingUsers = await db.select().from(users).limit(1);
    const role = existingUsers.length === 0 ? 'admin' : 'customer';
    
    const [user] = await db
      .insert(users)
      .values({ ...userData, password: hashedPassword, role })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(asc(categories.name));
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category> {
    const [category] = await db
      .update(categories)
      .set(categoryData)
      .where(eq(categories.id, id))
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.update(categories).set({ isActive: false }).where(eq(categories.id, id));
  }

  // Product operations
  async getProducts(categoryId?: number, search?: string): Promise<ProductWithCategory[]> {
    let whereConditions = [eq(products.isActive, true)];

    if (categoryId) {
      whereConditions.push(eq(products.categoryId, categoryId));
    }

    if (search) {
      whereConditions.push(like(products.name, `%${search}%`));
    }

    const results = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .where(and(...whereConditions))
      .orderBy(asc(products.name));
    
    return results.map(row => ({
      ...row.products,
      category: row.categories!,
      inventory: row.inventory!,
    }));
  }

  async getProductById(id: number): Promise<ProductWithCategory | undefined> {
    const [result] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .where(eq(products.id, id));

    if (!result) return undefined;

    return {
      ...result.products,
      category: result.categories!,
      inventory: result.inventory!,
    };
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(productData).returning();
    
    // Create initial inventory entry
    await db.insert(inventory).values({
      productId: product.id,
      quantity: 0,
      reservedQuantity: 0,
      lowStockThreshold: 10,
    });
    
    return product;
  }

  async updateProduct(id: number, productData: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set({ ...productData, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
  }

  // Inventory operations
  async getInventoryByProductId(productId: number): Promise<Inventory | undefined> {
    const [inv] = await db.select().from(inventory).where(eq(inventory.productId, productId));
    return inv;
  }

  async updateInventory(productId: number, inventoryData: Partial<InsertInventory>): Promise<Inventory> {
    const [inv] = await db
      .update(inventory)
      .set({ ...inventoryData, updatedAt: new Date() })
      .where(eq(inventory.productId, productId))
      .returning();
    return inv;
  }

  async getLowStockProducts(): Promise<ProductWithCategory[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(inventory, eq(products.id, inventory.productId))
      .where(
        and(
          eq(products.isActive, true),
          sql`${inventory.quantity} <= ${inventory.lowStockThreshold}`
        )
      );

    return results.map(row => ({
      ...row.products,
      category: row.categories!,
      inventory: row.inventory!,
    }));
  }

  // Cart operations
  async getCartByUserId(userId: number): Promise<CartWithProduct[]> {
    const results = await db
      .select()
      .from(cart)
      .leftJoin(products, eq(cart.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(cart.userId, userId))
      .orderBy(desc(cart.createdAt));

    return results.map(row => ({
      ...row.cart,
      product: {
        ...row.products!,
        category: row.categories!,
      },
    }));
  }

  async addToCart(cartData: InsertCart): Promise<Cart> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cart)
      .where(and(eq(cart.userId, cartData.userId), eq(cart.productId, cartData.productId)));

    if (existingItem) {
      // Update existing item
      const [updatedItem] = await db
        .update(cart)
        .set({ 
          quantity: existingItem.quantity + cartData.quantity,
          updatedAt: new Date()
        })
        .where(eq(cart.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new item
      const [newItem] = await db.insert(cart).values(cartData).returning();
      return newItem;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<Cart> {
    const [item] = await db
      .update(cart)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cart.id, id))
      .returning();
    return item;
  }

  async removeFromCart(id: number): Promise<void> {
    await db.delete(cart).where(eq(cart.id, id));
  }

  async clearCart(userId: number): Promise<void> {
    await db.delete(cart).where(eq(cart.userId, userId));
  }

  // Order operations
  async createOrder(orderData: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  }

  async createOrderItems(orderItemsData: InsertOrderItem[]): Promise<OrderItem[]> {
    const items = await db.insert(orderItems).values(orderItemsData).returning();
    return items;
  }

  async getOrdersByUserId(userId: number): Promise<OrderWithItems[]> {
    const results = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    // Group by order
    const orderMap = new Map<number, OrderWithItems>();
    
    results.forEach(row => {
      if (!orderMap.has(row.orders.id)) {
        orderMap.set(row.orders.id, {
          ...row.orders,
          items: [],
          user: row.users!,
        });
      }
      
      if (row.order_items && row.products) {
        orderMap.get(row.orders.id)!.items.push({
          ...row.order_items,
          product: row.products,
        });
      }
    });

    return Array.from(orderMap.values());
  }

  async getOrderById(id: number): Promise<OrderWithItems | undefined> {
    const results = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, id));

    if (results.length === 0) return undefined;

    const order: OrderWithItems = {
      ...results[0].orders,
      items: [],
      user: results[0].users!,
    };

    results.forEach(row => {
      if (row.order_items && row.products) {
        order.items.push({
          ...row.order_items,
          product: row.products,
        });
      }
    });

    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [order] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order;
  }

  async getAllOrders(): Promise<OrderWithItems[]> {
    const results = await db
      .select()
      .from(orders)
      .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .orderBy(desc(orders.createdAt));

    // Group by order
    const orderMap = new Map<number, OrderWithItems>();
    
    results.forEach(row => {
      if (!orderMap.has(row.orders.id)) {
        orderMap.set(row.orders.id, {
          ...row.orders,
          items: [],
          user: row.users!,
        });
      }
      
      if (row.order_items && row.products) {
        orderMap.get(row.orders.id)!.items.push({
          ...row.order_items,
          product: row.products,
        });
      }
    });

    return Array.from(orderMap.values());
  }

  // Admin operations
  async getAdminStats() {
    const [totalOrdersResult] = await db.select({ count: count() }).from(orders);
    const [totalRevenueResult] = await db.select({ sum: sum(orders.totalAmount) }).from(orders);
    const [totalProductsResult] = await db.select({ count: count() }).from(products).where(eq(products.isActive, true));
    const [totalCustomersResult] = await db.select({ count: count() }).from(users).where(eq(users.role, 'customer'));
    
    const recentOrders = await this.getAllOrders();
    
    return {
      totalOrders: totalOrdersResult.count,
      totalRevenue: Number(totalRevenueResult.sum || 0),
      totalProducts: totalProductsResult.count,
      totalCustomers: totalCustomersResult.count,
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

export const storage = new DatabaseStorage();
