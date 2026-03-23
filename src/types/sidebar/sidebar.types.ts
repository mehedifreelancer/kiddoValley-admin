import type { ReactNode } from "react";

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  path?: string;  // For navigation
  badge?: number; // For notifications
  children?: MenuItem[];
}

export interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}