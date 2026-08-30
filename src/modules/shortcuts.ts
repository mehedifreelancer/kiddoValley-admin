// src/config/shortcuts.ts
import { ShortcutConfig } from "../hooks/useKeyboardShortcuts";

export const APP_SHORTCUTS: ShortcutConfig[] = [
  {
    key: "b",
    ctrl: true,
    shift: true,
    path: "/account/balance",
    label: "Account / Balance",
  },
  {
    key: "s",
    ctrl: true,
    shift: true,
    path: "/create-order",
    label: "Sell / Create Order",
  },
  {
    key: "o",
    ctrl: true,
    shift: true,
    path: "/order-list",
    label: "Order List",
  },
  { key: "k", ctrl: true, shift: true, path: "/stock", label: "Stock List" },
  { key: "i", ctrl: true, shift: true, path: "/stock-in", label: "Stock In" },
  {
    key: "p",
    ctrl: true,
    shift: true,
    path: "/products/product-list",
    label: "Products",
  },
  { key: "c", ctrl: true, shift: true, path: "/customer", label: "Customers" },
  { key: "u", ctrl: true, shift: true, path: "/supplier", label: "Suppliers" },
  { key: "d", ctrl: true, shift: true, path: "/", label: "Dashboard" },
];
