// data/SidebarMenuData.ts
import {
  FileText,
  Image,
  LayoutDashboard,
  Link2,
  Package,
  PackageOpen,
  Settings,
  ShoppingCart,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import type { MenuItem } from "../types/sidebar/sidebar.types";

export const sidebarMenuData: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    path: "/",
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
    icon: <PackageOpen className="w-4 h-4" />,
    path: "/stock",
  },
  {
    id: "stock-in",
    label: "Purchase / Import",
    icon: <Package className="w-4 h-4" />,
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
    icon: <ShoppingCart className="w-4 h-4" />,
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
        icon: <Link2 className="w-4 h-4" />,
        path: "/web-settings/logo-&-social",
      },
      {
        id: "slider",
        label: "Slider",
        icon: <Image className="w-4 h-4" />,
        path: "/web-settings/slider",
      },
    ],
  },
  {
    id: "report",
    label: "Report",
    icon: <FileText className="w-4 h-4" />,
    path: "/report",
  },
];
