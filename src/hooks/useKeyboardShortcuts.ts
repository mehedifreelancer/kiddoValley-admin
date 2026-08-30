// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from "react";
import { useNavigate } from "react-router-dom"; // 👈 matches routes.tsx

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  path: string;
  label?: string;
}

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isTyping) return;

      const match = shortcuts.find((s) => {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const ctrlOk = !!s.ctrl === (e.ctrlKey || e.metaKey);
        const shiftOk = !!s.shift === e.shiftKey;
        const altOk = !!s.alt === e.altKey;
        return keyMatch && ctrlOk && shiftOk && altOk;
      });

      if (match) {
        e.preventDefault();
        navigate(match.path);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, navigate]);
};
