import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { ProductWithCategory } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithCategory;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToCart = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/cart", {
        productId: product.id,
        quantity: 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
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

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please login to add items to cart.",
        variant: "destructive",
      });
      return;
    }
    addToCart.mutate();
  };

  const isLowStock = product.inventory && product.inventory.quantity <= product.inventory.lowStockThreshold;

  return (
    <Card className="product-card overflow-hidden">
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square bg-gray-100 relative">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-sm">No image</span>
            </div>
          )}
          {isLowStock && (
            <Badge className="absolute top-2 right-2 bg-accent text-white">
              Low Stock
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-600 mt-1">
          {product.category?.name} • {product.unit}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-primary">
            ₹{product.price}
          </span>
          <Button 
            onClick={handleAddToCart} 
            disabled={addToCart.isPending || isLowStock}
            className="button-add"
          >
            {addToCart.isPending ? "Adding..." : "ADD+"}
          </Button>
        </div>
        
        {product.inventory && (
          <div className="mt-2 text-xs text-gray-500">
            {product.inventory.quantity} units available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
