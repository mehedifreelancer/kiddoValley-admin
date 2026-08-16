import type { ReactNode } from "react";

export interface MenuItem {
  id: string;
  label: string;
  icon: ReactNode;
  path?: string;
  badge?: number;
  children?: MenuItem[];
  roles?: string[]; // ✅ roles array added (optional – if not present, everyone can see)
}

export interface SidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}
