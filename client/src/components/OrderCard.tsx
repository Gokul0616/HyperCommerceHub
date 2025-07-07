import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Package, Calendar, MapPin, CreditCard } from "lucide-react";
import type { OrderWithItems } from "@shared/schema";

interface OrderCardProps {
  order: OrderWithItems;
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OrderCard({ order }: OrderCardProps) {
  const statusColor =
    statusColors[order.status as keyof typeof statusColors] ||
    "bg-gray-100 text-gray-800";

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              Order #{order.orderNumber}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {format(new Date(order.createdAt), "MMM dd, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge className={statusColor}>
            {order?.status?.charAt(0).toUpperCase() + order?.status?.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              {order.items.length} item{order?.items?.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-lg text-primary">
              ₹{parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {order.items.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-gray-700">
                {item.product.name} x {item.quantity}
              </span>
              <span className="text-gray-600">
                ₹{parseFloat(item.total).toFixed(2)}
              </span>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="text-sm text-gray-600">
              +{order.items.length - 3} more items
            </div>
          )}
        </div>

        {order.deliveryAddress && (
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-gray-600 mt-0.5" />
            <span className="text-sm text-gray-600">
              {order.deliveryAddress}
            </span>
          </div>
        )}

        {order.deliveryDate && (
          <div className="text-sm text-gray-600">
            Expected delivery:{" "}
            {format(new Date(order.deliveryDate), "MMM dd, yyyy")}
          </div>
        )}

        <div className="flex space-x-2 pt-2">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          {order.status === "delivered" && (
            <Button variant="outline" size="sm">
              Reorder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
