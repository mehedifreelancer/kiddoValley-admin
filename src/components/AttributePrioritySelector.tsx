// components/ui/AttributePrioritySelector.tsx
"use client";

import React, { useState, useEffect } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { GripVertical, X } from "lucide-react";

const ItemType = "ATTRIBUTE";

interface DraggableAttrProps {
  name: string;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  removeItem: (index: number) => void;
}

const DraggableAttr: React.FC<DraggableAttrProps> = ({
  name,
  index,
  moveItem,
  removeItem,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  const [, drop] = useDrop({
    accept: ItemType,
    hover: (item: { index: number }) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-opacity ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">
        {name}
      </span>
      <button
        type="button"
        onClick={() => removeItem(index)}
        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface AttributePrioritySelectorProps {
  value: string[];
  onChange: (newOrder: string[]) => void;
  availableAttributes: string[]; // শুধু সেকেন্ড স্টেপ থেকে আসা অ্যাট্রিবিউট
  disabled?: boolean;
}

export const AttributePrioritySelector: React.FC<
  AttributePrioritySelectorProps
> = ({ value, onChange, availableAttributes, disabled = false }) => {
  const [items, setItems] = useState<string[]>(value.length > 0 ? value : []);

  useEffect(() => {
    setItems(value.length > 0 ? value : []);
  }, [value]);

  const remaining = availableAttributes.filter((attr) => !items.includes(attr));

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const newItems = [...items];
    const dragged = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragged);
    setItems(newItems);
    onChange(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    onChange(newItems);
  };

  const addAttribute = (attrName: string) => {
    if (items.includes(attrName)) return;
    const newItems = [...items, attrName];
    setItems(newItems);
    onChange(newItems);
  };

  if (disabled) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Attribute Priority (Order)
        </label>
        <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {items.length === 0 ? (
            <span className="text-sm text-gray-400">No attributes selected</span>
          ) : (
            items.map((name) => (
              <span
                key={name}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm"
              >
                {name}
              </span>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Attribute Priority (Drag to reorder)
          </label>
          <span className="text-xs text-gray-400">{items.length} selected</span>
        </div>

        <div className="space-y-2 min-h-[60px] p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/30">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-12 text-sm text-gray-400">
              Drag attributes here or add from below
            </div>
          ) : (
            items.map((name, idx) => (
              <DraggableAttr
                key={name}
                name={name}
                index={idx}
                moveItem={moveItem}
                removeItem={removeItem}
              />
            ))
          )}
        </div>

        {remaining.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Add more attributes
            </label>
            <div className="flex flex-wrap gap-2">
              {remaining.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => addAttribute(name)}
                  className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  + {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400">
          Tip: The first attribute will be shown as primary filter on product
          cards.
        </p>
      </div>
    </DndProvider>
  );
};

export default AttributePrioritySelector;