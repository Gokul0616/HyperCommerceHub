import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BarChart3,
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import {
  insertProductSchema,
  insertCategorySchema,
  type Category,
  type ProductWithCategory,
  type OrderWithItems,
} from "@shared/schema";
import { z } from "zod";

// Form schemas
const productFormSchema = insertProductSchema.extend({
  imageUrl: z.string().url().optional().or(z.literal("")),
});

const categoryFormSchema = insertCategorySchema;

const stockFormSchema = z.object({
  quantity: z.number().min(0, "Stock quantity cannot be negative"),
  lowStockThreshold: z.number().min(0, "Low stock threshold cannot be negative").optional(),
});

export default function Admin() {
  const { user, isAdmin } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [isOrderDetailsDialogOpen, setIsOrderDetailsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCategory | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);

  // Redirect if not admin - TEMPORARILY DISABLED FOR DEBUGGING
  // if (!isAdmin) {
  //   setLocation("/");
  //   return null;
  // }

  console.log("Admin page - Debug info:", { 
    user: user, 
    isAdmin: isAdmin, 
    isAuthenticated: !!user,
    userRole: user?.role 
  });

  // Queries
  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: orders = [] } = useQuery<OrderWithItems[]>({
    queryKey: ["/api/admin/orders"],
  });

  const { data: lowStockProducts = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/inventory/low-stock"],
  });

  // Forms
  const productForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: undefined,
      price: "",
      unit: "",
      minQuantity: 1,
      maxQuantity: undefined,
      imageUrl: "",
    },
  });

  const categoryForm = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "package",
    },
  });

  const stockForm = useForm<z.infer<typeof stockFormSchema>>({
    resolver: zodResolver(stockFormSchema),
    defaultValues: {
      quantity: 0,
      lowStockThreshold: 10,
    },
  });

  // Mutations
  const createProduct = useMutation({
    mutationFn: async (data: z.infer<typeof productFormSchema>) => {
      await apiRequest("POST", "/api/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDialogOpen(false);
      productForm.reset();
      toast({
        title: "Product created",
        description: "The product has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async (data: z.infer<typeof productFormSchema>) => {
      if (!editingProduct) return;
      await apiRequest("PUT", `/api/products/${editingProduct.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleProductStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      await apiRequest("PUT", `/api/products/${id}/status`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      toast({
        title: "Product status updated",
        description: "The product status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCategory = useMutation({
    mutationFn: async (data: z.infer<typeof categoryFormSchema>) => {
      await apiRequest("POST", "/api/categories", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      toast({
        title: "Category created",
        description: "The category has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/admin/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order updated",
        description: "The order status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fetchOrderDetails = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("GET", `/api/orders/${id}`);
      return response.json();
    },
    onSuccess: (data: OrderWithItems) => {
      setSelectedOrder(data);
      setIsOrderDetailsDialogOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ productId, quantity, lowStockThreshold }: { productId: number; quantity: number; lowStockThreshold?: number }) => {
      await apiRequest("PUT", `/api/inventory/${productId}`, { quantity, lowStockThreshold });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory/low-stock"] });
      setIsStockDialogOpen(false);
      setSelectedProduct(null);
      stockForm.reset();
      toast({
        title: "Stock updated",
        description: "The product stock has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleEditProduct = (product: ProductWithCategory) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId,
      price: product.price,
      unit: product.unit,
      minQuantity: product.minQuantity,
      maxQuantity: product.maxQuantity || undefined,
      imageUrl: product.imageUrl || "",
    });
    setIsProductDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      description: category.description || "",
      icon: category.icon,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleUpdateStock = (product: ProductWithCategory) => {
    setSelectedProduct(product);
    stockForm.reset({
      quantity: product.inventory?.quantity || 0,
      lowStockThreshold: product.inventory?.lowStockThreshold || 10,
    });
    setIsStockDialogOpen(true);
  };

  const onProductSubmit = (data: z.infer<typeof productFormSchema>) => {
    if (editingProduct) {
      updateProduct.mutate(data);
    } else {
      createProduct.mutate(data);
    }
  };

  const onCategorySubmit = (data: z.infer<typeof categoryFormSchema>) => {
    createCategory.mutate(data);
  };

  const onStockSubmit = (data: z.infer<typeof stockFormSchema>) => {
    if (selectedProduct) {
      updateStock.mutate({
        productId: selectedProduct.id,
        quantity: data.quantity,
        lowStockThreshold: data.lowStockThreshold,
      });
    }
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your HyperPure platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-primary">
                    {stats?.totalOrders || 0}
                  </p>
                </div>
                <ShoppingCart className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{stats?.totalRevenue?.toLocaleString() || 0}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.totalProducts || 0}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-600/60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats?.totalCustomers || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Low Stock Alert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-700 mb-3">
                {lowStockProducts.length} products are running low on stock
              </p>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <Badge
                    key={product.id}
                    variant="outline"
                    className="border-orange-300 text-orange-800"
                  >
                    {product.name} ({product.inventory?.quantity} left)
                  </Badge>
                ))}
                {lowStockProducts.length > 5 && (
                  <Badge
                    variant="outline"
                    className="border-orange-300 text-orange-800"
                  >
                    +{lowStockProducts.length - 5} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Product Management
              </h2>
              <Dialog
                open={isProductDialogOpen}
                onOpenChange={setIsProductDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingProduct(null);
                      productForm.reset();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...productForm}>
                    <form
                      onSubmit={productForm.handleSubmit(onProductSubmit)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={productForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Product Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="categoryId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select
                                onValueChange={(value) =>
                                  field.onChange(parseInt(value))
                                }
                                value={field?.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id.toString()}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={productForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={productForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (₹)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" step="0.01" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="kg, pieces, liters"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={productForm.control}
                          name="minQuantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min Quantity</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value))
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={productForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} type="url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsProductDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={
                            createProduct.isPending || updateProduct.isPending
                          }
                        >
                          {editingProduct ? "Update" : "Create"} Product
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {product.unit}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{product.category?.name}</TableCell>
                        <TableCell>₹{product.price}</TableCell>
                        <TableCell>
                          {product.inventory ? (
                            <span
                              className={
                                product.inventory.quantity <=
                                product.inventory.lowStockThreshold
                                  ? "text-orange-600"
                                  : ""
                              }
                            >
                              {product.inventory.quantity}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleProductStatus.mutate({
                                id: product.id,
                                isActive: !product.isActive,
                              })
                            }
                            disabled={toggleProductStatus.isPending}
                          >
                            {product.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateStock(product)}
                            >
                              <Package className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteProduct.mutate(product.id)}
                              disabled={deleteProduct.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Stock Update Dialog */}
            <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Stock for {selectedProduct?.name}</DialogTitle>
                </DialogHeader>
                <Form {...stockForm}>
                  <form
                    onSubmit={stockForm.handleSubmit(onStockSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={stockForm.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={stockForm.control}
                      name="lowStockThreshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Low Stock Threshold (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsStockDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateStock.isPending}>
                        Update Stock
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Category Management
              </h2>
              <Dialog
                open={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingCategory(null);
                      categoryForm.reset();
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form
                      onSubmit={categoryForm.handleSubmit(onCategorySubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an icon" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="apple">
                                  Apple (Fruits)
                                </SelectItem>
                                <SelectItem value="milk">
                                  Milk (Dairy)
                                </SelectItem>
                                <SelectItem value="egg">
                                  Egg (Poultry)
                                </SelectItem>
                                <SelectItem value="wheat">
                                  Wheat (Grains)
                                </SelectItem>
                                <SelectItem value="droplets">
                                  Droplets (Liquids)
                                </SelectItem>
                                <SelectItem value="package">
                                  Package (General)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCategoryDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCategory.isPending}
                        >
                          Create Category
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-gray-600">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Order Management
            </h2>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>{order.user.businessName}</TableCell>
                        <TableCell>{order.items.length} items</TableCell>
                        <TableCell>
                          ₹{parseFloat(order.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={order.status}
                            onValueChange={(status) =>
                              updateOrderStatus.mutate({ id: order.id, status })
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="shipped">Shipped</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {format(new Date(order.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchOrderDetails.mutate(order.id)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Order Details Dialog */}
            <Dialog
              open={isOrderDetailsDialogOpen}
              onOpenChange={setIsOrderDetailsDialogOpen}
            >
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Order Details - {selectedOrder?.orderNumber}</DialogTitle>
                </DialogHeader>
                {selectedOrder && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold">Customer Information</h3>
                      <p>Business Name: {selectedOrder.user.businessName}</p>
                      <p>Email: {selectedOrder.user.email}</p>
                      <p>Delivery Address: {selectedOrder.deliveryAddress}</p>
                      <p>Notes: {selectedOrder.notes || "N/A"}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Order Items</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.product.name}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>₹{parseFloat(item.price).toFixed(2)}</TableCell>
                              <TableCell>₹{parseFloat(item.total).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-between">
                      <div>
                        <p>Order Date: {format(new Date(selectedOrder.createdAt), "MMM dd, yyyy")}</p>
                        <p>Status: <Badge className={statusColors[selectedOrder.status as keyof typeof statusColors]}>{selectedOrder.status}</Badge></p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">Total: ₹{parseFloat(selectedOrder.totalAmount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsOrderDetailsDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Analytics & Reports
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats?.recentOrders?.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {order.user.businessName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ₹{parseFloat(order.totalAmount).toFixed(2)}
                          </p>
                          <Badge
                            className={
                              statusColors[
                                order.status as keyof typeof statusColors
                              ]
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categories.slice(0, 5).map((category) => {
                      const categoryProducts = products.filter(
                        (p) => p.categoryId === category.id,
                      );
                      return (
                        <div
                          key={category.id}
                          className="flex items-center justify-between"
                        >
                          <span className="font-medium">{category.name}</span>
                          <span className="text-gray-600">
                            {categoryProducts.length} products
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}