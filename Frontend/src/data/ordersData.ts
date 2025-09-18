export interface CustomerLocation {
  latitude: number;
  longitude: number;
  address: string;
  distanceFromRestaurant: number; // in km
  estimatedArrivalTime: string; // in minutes
  lastUpdated: string;
}

export interface Order {
  id: string;
  customerName: string;
  product: string;
  category: string;
  subcategory: string;
  quantity: number;
  attribute: string;
  amount: string;
  date: string;
  status: "pending" | "ongoing" | "complete" | "cancelled";
  customerLocation?: CustomerLocation;
}

export const ordersData: Order[] = [
  {
    id: "ORD001",
    customerName: "John Smith",
    product: "Margherita Pizza",
    category: "Veg",
    subcategory: "Pizza",
    quantity: 2,
    attribute: "Large",
    amount: "12.99",
    date: "2024-01-15",
    status: "pending",
    customerLocation: {
      latitude: 13.0827,
      longitude: 80.2707,
      address: "654 Pine Road, Chennai, Tamil Nadu",
      distanceFromRestaurant: 2.5,
      estimatedArrivalTime: "15",
      lastUpdated: new Date().toISOString()
    }
  },
  {
    id: "ORD002",
    customerName: "Sarah Johnson",
    product: "Chicken Burger",
    category: "Non-Veg",
    subcategory: "Burger",
    quantity: 1,
    attribute: "Medium",
    amount: "8.99",
    date: "2024-01-14",
    status: "ongoing",
    customerLocation: {
      latitude: 13.0878,
      longitude: 80.2785,
      address: "123 Oak Street, Chennai, Tamil Nadu",
      distanceFromRestaurant: 1.8,
      estimatedArrivalTime: "12",
      lastUpdated: new Date().toISOString()
    }
  },
  {
    id: "ORD003",
    customerName: "Mike Davis",
    product: "Butter Chicken",
    category: "Non-Veg",
    subcategory: "Punjabi",
    quantity: 1,
    attribute: "Spicy",
    amount: "15.99",
    date: "2024-01-13",
    status: "complete"
  },
  {
    id: "ORD004",
    customerName: "Emily Brown",
    product: "Pepperoni Pizza",
    category: "Non-Veg",
    subcategory: "Pizza",
    quantity: 3,
    attribute: "Extra Large",
    amount: "14.99",
    date: "2024-01-12",
    status: "cancelled"
  },
  {
    id: "ORD005",
    customerName: "David Wilson",
    product: "Veggie Burger",
    category: "Veg",
    subcategory: "Burger",
    quantity: 2,
    attribute: "Regular",
    amount: "7.99",
    date: "2024-01-11",
    status: "pending"
  },
  {
    id: "ORD006",
    customerName: "Lisa Garcia",
    product: "Dal Makhani",
    category: "Veg",
    subcategory: "Punjabi",
    quantity: 1,
    attribute: "Mild",
    amount: "11.99",
    date: "2024-01-10",
    status: "ongoing"
  },
  {
    id: "ORD007",
    customerName: "Tom Anderson",
    product: "BBQ Chicken Pizza",
    category: "Non-Veg",
    subcategory: "Pizza",
    quantity: 1,
    attribute: "Large",
    amount: "16.99",
    date: "2024-01-09",
    status: "complete"
  },
  {
    id: "ORD008",
    customerName: "Anna Martinez",
    product: "Cheese Burger",
    category: "Veg",
    subcategory: "Burger",
    quantity: 4,
    attribute: "Extra Cheese",
    amount: "6.99",
    date: "2024-01-08",
    status: "pending"
  },
  {
    id: "ORD009",
    customerName: "Chris Taylor",
    product: "Palak Paneer",
    category: "Veg",
    subcategory: "Punjabi",
    quantity: 2,
    attribute: "No Onion",
    amount: "13.99",
    date: "2024-01-07",
    status: "ongoing"
  },
  {
    id: "ORD010",
    customerName: "Jessica Lee",
    product: "Hakka Noodles",
    category: "Mixed",
    subcategory: "Chinese",
    quantity: 1,
    attribute: "Spicy",
    amount: "15.99",
    date: "2024-01-06",
    status: "complete"
  },
  {
    id: "ORD011",
    customerName: "Robert Clark",
    product: "Fish Burger",
    category: "Non-Veg",
    subcategory: "Burger",
    quantity: 1,
    attribute: "Medium",
    amount: "9.99",
    date: "2024-01-05",
    status: "cancelled"
  },
  {
    id: "ORD012",
    customerName: "Michelle White",
    product: "Fried Rice",
    category: "Mixed",
    subcategory: "Chinese",
    quantity: 2,
    attribute: "Regular",
    amount: "10.99",
    date: "2024-01-04",
    status: "pending"
  }
];

export const getPendingOrders = () => ordersData.filter(order => order.status === "pending");
export const getOngoingOrders = () => ordersData.filter(order => order.status === "ongoing");
export const getCompleteOrders = () => ordersData.filter(order => order.status === "complete");
export const getCancelledOrders = () => ordersData.filter(order => order.status === "cancelled");