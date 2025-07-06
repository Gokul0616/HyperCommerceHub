import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Minus } from "lucide-react";
import { useState } from "react";
import type { CartWithProduct } from "@shared/schema";

interface CartItemProps {
  item: CartWithProduct;
}

export default function CartItem({ item }: CartItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(item.quantity);

  const updateQuantity = useMutation({
    mutationFn: async (newQuantity: number) => {
      await apiRequest("PUT", `/api/cart/${item.id}`, { quantity: newQuantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setQuantity(item.quantity); // Reset to original quantity
    },
  });

  const removeItem = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/cart/${item.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({
        title: "Removed from cart",
        description: `${item.product.name} has been removed from your cart.`,
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

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
    updateQuantity.mutate(newQuantity);
  };

  const total = parseFloat(item.product.price) * quantity;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
            {item.product.imageUrl ? (
              <img 
                src={item.product.imageUrl} 
                alt={item.product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
            <p className="text-sm text-gray-600">{item.product.category.name}</p>
            <p className="text-sm text-gray-600">₹{item.product.price} per {item.product.unit}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1 || updateQuantity.isPending}
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <Input
              type="number"
              value={quantity}
              onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
              className="w-16 text-center"
              min="1"
            />
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={updateQuantity.isPending}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-right">
            <p className="font-semibold text-lg text-primary">₹{total.toFixed(2)}</p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => removeItem.mutate()}
              disabled={removeItem.isPending}
              className="mt-2"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
