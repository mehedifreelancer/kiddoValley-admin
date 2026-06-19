import { useEffect, useRef, RefObject } from "react";

interface UseBarcodeScannerOptions {
  inputRef: RefObject<HTMLInputElement | null>;
  onBarcodeScanned?: (barcode: string) => void;
  onSearchChange?: (value: string) => void;
  onClear?: () => void;
  scanDelay?: number;
  minLength?: number;
}

export const useBarcodeScanner = ({
  inputRef,
  onBarcodeScanned,
  onSearchChange,
  onClear,
  scanDelay = 50,
  minLength = 4,
}: UseBarcodeScannerOptions) => {
  const bufferRef = useRef<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setInputValue = (value: string) => {
    const input = inputRef.current;
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    // Do NOT focus – we want to blur after setting
  };

  const clearInput = () => {
    const input = inputRef.current;
    if (!input) return;
    input.value = "";
    if (onClear) onClear();
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      // Ignore if input is focused (user typing manually)
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Start of a new scan – clear input and React state
      if (event.key.length === 1 && bufferRef.current === "") {
        const input = inputRef.current;
        if (input) {
          input.value = "";
        }
        if (onSearchChange) onSearchChange("");
        bufferRef.current = "";
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }

      // Handle Enter (barcode complete)
      if (event.key === "Enter") {
        event.preventDefault();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        const barcode = bufferRef.current.trim();
        bufferRef.current = "";

        if (barcode.length >= minLength) {
          const input = inputRef.current;
          if (input) {
            input.value = "";
          }
          setInputValue(barcode);
          if (onSearchChange) onSearchChange(barcode);
          if (onBarcodeScanned) onBarcodeScanned(barcode);
          // ✅ BLUR the input so scanner doesn't keep focus
          if (inputRef.current) {
            inputRef.current.blur();
          }
          document.dispatchEvent(new CustomEvent("barcode-scanned", { detail: { barcode } }));
        }
        return;
      }

      // Buffer printable characters
      if (event.key.length === 1) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        bufferRef.current += event.key;
        timerRef.current = setTimeout(() => {
          bufferRef.current = "";
          timerRef.current = null;
        }, scanDelay);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("barcode-scanner-clear", () => clearInput());

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("barcode-scanner-clear", () => clearInput());
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [inputRef, onBarcodeScanned, onSearchChange, onClear, scanDelay, minLength]);

  return { clearInput, setInputValue };
};