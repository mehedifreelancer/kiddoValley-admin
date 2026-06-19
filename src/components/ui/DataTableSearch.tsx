import React, { forwardRef } from "react";
import { InputText } from "primereact/inputtext";

interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const DataTableSearch = forwardRef<HTMLInputElement, DataTableSearchProps>(
  ({ value, onChange, placeholder, className }, ref) => {
    return (
      <InputText
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-md  outline-0  w-full  p-2  text-gray-700 dark:text-gray-200  text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600    transition-all"


      />
    );
  }
);

DataTableSearch.displayName = "DataTableSearch";

export default DataTableSearch;