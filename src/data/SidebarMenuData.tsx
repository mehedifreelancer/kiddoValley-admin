import {
  Box,
  ChartArea,
  ChartLine,
  ClipboardList,
  Coins,
  FileChartColumn,
  Home,
  Image,
  Package,
  PackageOpen,
  Settings,
  Share2,
  ShoppingCart,
  Tag,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import type { MenuItem } from "../types/sidebar/sidebar.types";

export const sidebarMenuData: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Home className="w-4 h-4" />,
    path: "/",
  },
  {
    id: "accounts",
    label: "Accounts",
    icon: <Wallet className="w-4 h-4" />,
    children: [
      {
        id: "transaction-categories",
        label: "Transaction Categories",
        icon: <Tag className="w-4 h-4" />,
        path: "/account/transaction-categories",
      },
      {
        id: "balance",
        label: "Balance",
        icon: <Coins className="w-4 h-4" />,
        path: "/account/balance",
      },
      {
        id: "asset",
        label: "Asset",
        icon: <Coins className="w-4 h-4" />,
        path: "/account/asset",
      },
      {
        id: "employee-bills",
        label: "Employee Bills",
        icon: <Users />,
        path: "/account/employee-bill",
      },
      {
        id: "raw-materials",
        label: "Raw Materials",
        icon: <Package />,
        path: "/account/raw-material",
      },
    ],
  },
  {
    id: "report",
    label: "Reports",
    icon: <ChartArea className="w-4 h-4" />,
    children: [
      {
        id: "sells-report",
        label: "Sells Report",
        icon: <ChartLine className="w-4 h-4" />,
        path: "/report/sells-report",
      },
      {
        id: "annual-report",
        label: "Annual Report",
        icon: <FileChartColumn className="w-4 h-4" />,
        path: "/report/annual-report",
      },
    ],
  },
  {
    id: "category",
    label: "Category",
    icon: <Tag className="w-4 h-4" />,
    path: "/products/category",
  },
  {
    id: "product",
    label: "Product",
    icon: <Package className="w-4 h-4" />,
    path: "/products/product-list",
  },
  {
    id: "customer",
    label: "Customer",
    icon: <Users className="w-4 h-4" />,
    path: "/customer",
  },
  {
    id: "supplier",
    label: "Supplier",
    icon: <Truck className="w-4 h-4" />,
    path: "/supplier",
  },
  {
    id: "stock",
    label: "Stock",
    icon: <Warehouse className="w-4 h-4" />,
    path: "/stock",
  },
  {
    id: "stock-in",
    label: "Purchase / Import",
    icon: <PackageOpen className="w-4 h-4" />,
    path: "/stock-in",
  },
  {
    id: "Create Order",
    label: "Sells",
    icon: <ShoppingCart className="w-4 h-4" />,
    path: "/create-order",
  },
  {
    id: "Orders",
    label: "Orders",
    icon: <ClipboardList className="w-4 h-4" />,
    path: "/order-list",
  },

  {
    id: "web-settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    children: [
      {
        id: "logo-social",
        label: "Logo & Social",
        icon: <Share2 className="w-4 h-4" />,
        path: "/web-settings/logo-&-social",
      },
      {
        id: "slider",
        label: "Slider",
        icon: <Image className="w-4 h-4" />,
        path: "/web-settings/slider",
      },
      {
        id: "hero-slider",
        label: "Hero Slider",
        icon: <Image className="w-4 h-4" />,
        path: "/web-settings/hero-slider",
      },

      {
        id: "delivery-settings",
        label: "Delivery Settings",
        icon: <Truck className="w-4 h-4" />,
        path: "/web-settings/delivery-settings",
      },
      {
        id: "packaging-settings",
        label: "Packaging Settings",
        icon: <Box className="w-4 h-4" />,
        path: "/web-settings/packaging-settings",
      },
    ],
  },
];
