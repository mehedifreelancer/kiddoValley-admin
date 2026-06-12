import { useState } from "react";
import ListCard from "./ListCard";

export default function ProductList() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = [
    {
      id: 1,
      title: "Wireless Headphones",
      description:
        "Premium noise-cancelling wireless headphones with 30-hour battery life",
      price: 199.99,
      stock: 45,
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150&h=150&fit=crop",
    },
    {
      id: 2,
      title: "Smart Watch Series 5",
      description: "Fitness tracker with heart rate monitor and GPS",
      price: 299.99,
      stock: 8,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&h=150&fit=crop",
    },
    {
      id: 3,
      title: "Organic Cotton T-Shirt",
      description: "100% organic cotton, comfortable fit",
      price: 29.99,
      stock: 0,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=150&h=150&fit=crop",
      unit: "piece",
    },
    {
      id: 4,
      title: "Coffee Maker",
      description: "Programmable coffee maker with thermal carafe",
      price: 89.99,
      stock: 12,
      // No image - will show placeholder
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
        Product Inventory
      </h2>

      {products.map((product) => (
        <ListCard
          key={product.id}
          title={product.title}
          description={product.description}
          price={product.price}
          stock={product.stock}
          image={product.image}
          currency="$"
          unit={product.unit || "pcs"}
          hoverable
          onClick={() => setSelectedProduct(product)}
          className="mb-3"
        />
      ))}

      {/* Compact view example */}
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mt-8 mb-4">
        Compact List
      </h3>
      <div className="space-y-2">
        {products.slice(0, 3).map((product) => (
          <ListCard
            key={product.id}
            title={product.title}
            price={product.price}
            stock={product.stock}
            image={product.image}
            hoverable={false}
          />
        ))}
      </div>
    </div>
  );
}
