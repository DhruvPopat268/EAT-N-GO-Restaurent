"use client";
import React from "react";
import Image from "next/image";

interface Dish {
  id: number;
  name: string;
  orders: number;
  revenue: string;
  image: string;
  category: string;
}

const dishData: Dish[] = [
  {
    id: 1,
    name: "Margherita Pizza",
    orders: 45,
    revenue: "$675.00",
    image: "/images/product/product-01.jpg",
    category: "Pizza"
  },
  {
    id: 2,
    name: "Chicken Burger",
    orders: 38,
    revenue: "$532.50",
    image: "/images/product/product-02.jpg", 
    category: "Burger"
  },
  {
    id: 3,
    name: "Caesar Salad",
    orders: 32,
    revenue: "$384.00",
    image: "/images/product/product-03.jpg",
    category: "Salad"
  },
  {
    id: 4,
    name: "Pasta Carbonara",
    orders: 28,
    revenue: "$448.00",
    image: "/images/product/product-04.jpg",
    category: "Pasta"
  }
];

export default function PopularDishes() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Popular Dishes Today
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Top performing menu items
        </p>
      </div>
      
      <div className="space-y-4">
        {dishData.map((dish, index) => (
          <div key={dish.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium text-gray-600 dark:text-gray-400">
              {index + 1}
            </div>
            
            <div className="h-12 w-12 overflow-hidden rounded-lg">
              <Image
                width={48}
                height={48}
                src={dish.image}
                className="h-12 w-12 object-cover"
                alt={dish.name}
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 dark:text-white/90 truncate">
                {dish.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {dish.category}
              </p>
            </div>
            
            <div className="text-right">
              <p className="font-medium text-gray-800 dark:text-white/90">
                {dish.orders} orders
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {dish.revenue}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button className="w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          View Full Menu Analytics
        </button>
      </div>
    </div>
  );
}