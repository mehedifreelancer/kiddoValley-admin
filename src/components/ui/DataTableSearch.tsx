import React from "react";
import { InputText } from "primereact/inputtext";
import { Search } from "lucide-react";

interface DataTableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const DataTableSearch: React.FC<DataTableSearchProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
      <InputText
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className=" outline-0  w-full pl-9 pr-3 py-2 text-gray-700 dark:text-gray-200  text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded   transition-all"
      />
    </div>
  );
};

export default DataTableSearch;