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
  Layers,
  Plus,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import type { MenuItem } from "../types/sidebar/sidebar.types";

export const sidebarMenuData: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    section: "main",
  },
  {
    id: "master-data",
    label: "Master Data",
    icon: <Layers className="w-4 h-4" />,
    section: "main",
    children: [
      {
        id: "category",
        label: "Category",
        icon: <Tag className="w-4 h-4" />,
        description: "Manage product categories",
        actions: {
          create: { label: "New Category", icon: <Plus className="w-4 h-4" /> },
          update: { label: "Edit", icon: <Edit className="w-4 h-4" /> },
          delete: { label: "Delete", icon: <Trash2 className="w-4 h-4" /> },
          view: { label: "View", icon: <Eye className="w-4 h-4" /> },
        },
      },
      {
        id: "barcode",
        label: "Barcode (Products)",
        icon: <Barcode className="w-4 h-4" />,
        description: "Manage products with barcode",
        actions: {
          create: { label: "New Product", icon: <Plus className="w-4 h-4" /> },
          update: { label: "Edit", icon: <Edit className="w-4 h-4" /> },
          delete: { label: "Delete", icon: <Trash2 className="w-4 h-4" /> },
          view: { label: "Scan", icon: <Barcode className="w-4 h-4" /> },
        },
      },
      {
        id: "customer",
        label: "Customer",
        icon: <Users className="w-4 h-4" />,
        description: "Manage customers",
        actions: {
          create: { label: "New Customer", icon: <Plus className="w-4 h-4" /> },
          update: { label: "Edit", icon: <Edit className="w-4 h-4" /> },
          delete: { label: "Delete", icon: <Trash2 className="w-4 h-4" /> },
        },
      },
      {
        id: "supplier",
        label: "Supplier",
        icon: <Truck className="w-4 h-4" />,
        description: "Manage suppliers",
        actions: {
          create: { label: "New Supplier", icon: <Plus className="w-4 h-4" /> },
          update: { label: "Edit", icon: <Edit className="w-4 h-4" /> },
          delete: { label: "Delete", icon: <Trash2 className="w-4 h-4" /> },
        },
      },
    ],
  },
  {
    id: "stock",
    label: "Stock",
    icon: <PackageOpen className="w-4 h-4" />,
    section: "main",
  },
  {
    id: "sells",
    label: "Sells",
    icon: <ShoppingCart className="w-4 h-4" />,
    section: "main",
  },
  {
    id: "purchase",
    label: "Purchase",
    icon: <Package className="w-4 h-4" />,
    section: "main",
  },
  {
    id: "web-settings",
    label: "Web Settings",
    icon: <Settings className="w-4 h-4" />,
    section: "settings",
    children: [
      {
        id: "upload-logo",
        label: "Upload Logo",
        icon: <Upload className="w-4 h-4" />,
        description: "Upload store logo",
      },
      {
        id: "social-links",
        label: "Social Media Links",
        icon: <Link2 className="w-4 h-4" />,
        description: "Manage social media URLs",
      },
    ],
  },
  {
    id: "report",
    label: "Report",
    icon: <FileText className="w-4 h-4" />,
    section: "reports",
  },
];