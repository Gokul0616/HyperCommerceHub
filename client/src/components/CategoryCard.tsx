import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Apple, 
  Milk, 
  Egg, 
  Wheat, 
  Droplets, 
  Package,
  Beef,
  Fish,
  Soup,
  Cookie
} from "lucide-react";
import type { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
}

const iconMap: Record<string, any> = {
  'apple': Apple,
  'milk': Milk,
  'egg': Egg,
  'wheat': Wheat,
  'droplets': Droplets,
  'package': Package,
  'beef': Beef,
  'fish': Fish,
  'soup': Soup,
  'cookie': Cookie,
};

export default function CategoryCard({ category }: CategoryCardProps) {
  const IconComponent = iconMap[category.icon] || Package;

  return (
    <Link href={`/products?category=${category.id}`}>
      <Card className="category-card cursor-pointer">
        <CardContent className="p-4 text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <IconComponent className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-sm font-medium text-gray-900">{category.name}</h3>
          {category.description && (
            <p className="text-xs text-gray-600 mt-1">{category.description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
