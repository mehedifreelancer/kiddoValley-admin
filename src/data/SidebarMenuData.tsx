import {
  LayoutDashboard,
  Package,
  Barcode,
  Users,
  Truck,
  Tag,
  ShoppingCart,
  PackageOpen,
  Settings,
  Upload,
  Link2,
  FileText,
} from "lucide-react";
import type { MenuItem } from "../types/sidebar/sidebar.types";

export const sidebarMenuData: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: "category",
    label: "Category",
    icon: <Tag className="w-4 h-4" />,

  },
  {
    id: "product",
    label: "Product",
    icon: <Package className="w-4 h-4" />,
  },

  {
    id: "customer",
    label: "Customer",
    icon: <Users className="w-4 h-4" />,
  },
  {
    id: "supplier",
    label: "Supplier",
    icon: <Truck className="w-4 h-4" />,
  },

  {
    id: "stock",
    label: "Stock",
    icon: <PackageOpen className="w-4 h-4" />,
  },
  {
    id: "sells",
    label: "Sells",
    icon: <ShoppingCart className="w-4 h-4" />,
  },
  {
    id: "purchase",
    label: "Purchase",
    icon: <Package className="w-4 h-4" />,
  },
  {
    id: "web-settings",
    label: "Web Settings",
    icon: <Settings className="w-4 h-4" />,
    children: [
      {
        id: "upload-logo",
        label: "Upload Logo",
        icon: <Upload className="w-4 h-4" />,
      },
      {
        id: "social-links",
        label: "Social Media Links",
        icon: <Link2 className="w-4 h-4" />,
      },
    ],
  },
  {
    id: "report",
    label: "Report",
    icon: <FileText className="w-4 h-4" />,
  },
];