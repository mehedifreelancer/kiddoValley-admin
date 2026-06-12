import React, { useState, useEffect, useRef } from "react";
import { Calendar } from "primereact/calendar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronDown,
  CalendarDays,
  Clock,
  CalendarRange,
  X,
  Check
} from "lucide-react";

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last7days"
  | "last30days"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "custom";

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface AdvancedDatePickerProps {
  onChange?: (range: DateRange, preset?: DateRangePreset) => void;
  initialPreset?: DateRangePreset;
  className?: string;
  buttonClassName?: string;
  popupClassName?: string;
}

const AdvancedDatePicker: React.FC<AdvancedDatePickerProps> = ({
  onChange,
  initialPreset = "thisMonth",
  className = "",
  buttonClassName = "",
  popupClassName = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] =
    useState<DateRangePreset>(initialPreset);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });

  const [showCustomRange, setShowCustomRange] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const calendarWrapperRef = useRef<HTMLDivElement>(null);

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        calendarWrapperRef.current &&
        calendarWrapperRef.current.contains(target)
      ) {
        return;
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setShowCustomRange(false);
        setTempStartDate(null);
        setTempEndDate(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDateRangeForPreset = (
    preset: DateRangePreset
  ): DateRange => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const result: DateRange = { startDate: null, endDate: null };

    switch (preset) {
      case "today":
        result.startDate = today;
        result.endDate = today;  // Same date for both
        break;

      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        result.startDate = yesterday;
        result.endDate = yesterday;  // Same date for both
        break;
      }

      case "last7days": {
        const d = new Date(today);
        d.setDate(d.getDate() - 6);
        result.startDate = d;
        result.endDate = today;
        break;
      }

      case "last30days": {
        const d = new Date(today);
        d.setDate(d.getDate() - 29);
        result.startDate = d;
        result.endDate = today;
        break;
      }

      case "thisMonth":
        result.startDate = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        result.endDate = today;
        break;

      case "lastMonth": {
        const firstDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastDayOfLastMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          0
        );
        result.startDate = firstDayOfLastMonth;
        result.endDate = lastDayOfLastMonth;
        break;
      }

      case "thisYear":
        result.startDate = new Date(today.getFullYear(), 0, 1);
        result.endDate = today;
        break;

      case "lastYear":
        result.startDate = new Date(today.getFullYear() - 1, 0, 1);
        result.endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      
      case "custom":
        break;
    }

    return result;
  };

  useEffect(() => {
    if (initialPreset !== "custom") {
      const newRange = getDateRangeForPreset(initialPreset);
      setDateRange(newRange);
    }
  }, []);

  const handlePresetSelect = (preset: DateRangePreset) => {
    setSelectedPreset(preset);

    if (preset !== "custom") {
      const newRange = getDateRangeForPreset(preset);
      setDateRange(newRange);
      onChange?.(newRange, preset);
      setIsOpen(false);
    } else {
      setShowCustomRange(true);
      setTempStartDate(dateRange.startDate);
      setTempEndDate(dateRange.endDate);
    }
  };

  const handleCustomDateChange = (e: any) => {
    const dates = e.value as (Date | null)[];
    if (dates) {
      setTempStartDate(dates[0] || null);
      setTempEndDate(dates[1] || null);
    }
  };

  const handleApplyCustomRange = () => {
    if (tempStartDate && tempEndDate) {
      const newRange = {
        startDate: tempStartDate,
        endDate: tempEndDate,
      };

      setDateRange(newRange);
      setSelectedPreset("custom");
      setShowCustomRange(false);
      setIsOpen(false);
      onChange?.(newRange, "custom");
    }
  };

  const handleCancelCustomRange = () => {
    setShowCustomRange(false);
    setTempStartDate(null);
    setTempEndDate(null);
  };

  const formatDateRange = () => {
    if (!dateRange.startDate || !dateRange.endDate)
      return "Select date range";

    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    };

    // For single-day ranges (today, yesterday)
    if (dateRange.startDate.toDateString() === dateRange.endDate.toDateString()) {
      return dateRange.startDate.toLocaleDateString(undefined, options);
    }

    return `${dateRange.startDate.toLocaleDateString(undefined, options)} - ${dateRange.endDate.toLocaleDateString(undefined, options)}`;
  };

  const presets = [
    { value: "today", label: "Today", icon: <CalendarDays size={16} /> },
    { value: "yesterday", label: "Yesterday", icon: <Clock size={16} /> },
    { value: "last7days", label: "Last 7 Days", icon: <CalendarRange size={16} /> },
    { value: "last30days", label: "Last 30 Days", icon: <CalendarRange size={16} /> },
    { value: "thisMonth", label: "This Month", icon: <CalendarIcon size={16} /> },
    { value: "lastMonth", label: "Last Month", icon: <CalendarIcon size={16} /> },
    { value: "thisYear", label: "This Year", icon: <CalendarDays size={16} /> },
    { value: "lastYear", label: "Last Year", icon: <CalendarDays size={16} /> },
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowCustomRange(false);
        }}
        className={`
          flex items-center justify-between w-full
          bg-white dark:bg-gray-800
          border border-gray-300 dark:border-gray-600
          rounded-lg px-3 py-2 text-sm
          hover:border-gray-400 dark:hover:border-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-500/20
          transition-all duration-200
          ${buttonClassName}
        `}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-200">
            {formatDateRange()}
          </span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {/* Presets Dropdown */}
      <AnimatePresence>
        {isOpen && !showCustomRange && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute right-0 mt-2 w-64 z-50
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-lg shadow-xl overflow-hidden
              ${popupClassName}
            `}
          >
            <div className="p-2">
              {presets.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePresetSelect(p.value as DateRangePreset)}
                  className={`
                    flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
                    transition-all duration-200
                    ${selectedPreset === p.value
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <span className={selectedPreset === p.value ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}>
                    {p.icon}
                  </span>
                  <span>{p.label}</span>
                </button>
              ))}
              
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
              
              <button
                onClick={() => handlePresetSelect("custom")}
                className={`
                  flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm
                  transition-all duration-200
                  ${selectedPreset === "custom"
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }
                `}
              >
                <CalendarRange className="w-4 h-4" />
                <span>Custom Range</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Range Modal */}
      <AnimatePresence>
        {showCustomRange && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`
              absolute right-0 mt-2 w-[520px] z-50
              bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700
              rounded-lg shadow-xl overflow-hidden
              ${popupClassName}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
                Select Date Range
              </h3>
              <button
                onClick={handleCancelCustomRange}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Calendar Wrapper */}
            <div className="p-4" ref={calendarWrapperRef}>
              <Calendar
                value={tempStartDate && tempEndDate ? [tempStartDate, tempEndDate] : 
                        tempStartDate ? [tempStartDate, null] : null}
                onChange={handleCustomDateChange}
                selectionMode="range"
                hideOnRangeSelection={false}
                appendTo="self"
                inline
                className="w-full"
                dateFormat="mm/dd/yy"
              />

              {/* Selected Dates Display */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Start Date:</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {tempStartDate ? tempStartDate.toLocaleDateString() : "Not selected"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400">End Date:</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {tempEndDate ? tempEndDate.toLocaleDateString() : "Not selected"}
                  </span>
                </div>
                {tempStartDate && !tempEndDate && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 text-center">
                    ✓ Start date selected. Now select end date.
                  </div>
                )}
                {tempStartDate && tempEndDate && (
                  <div className="text-xs text-green-600 dark:text-green-400 text-center">
                    ✓ Both dates selected. Click Apply to confirm.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancelCustomRange}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomRange}
                disabled={!tempStartDate || !tempEndDate}
                className={`
                  flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg
                  transition-colors
                  ${tempStartDate && tempEndDate
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-400 cursor-not-allowed"
                  }
                `}
              >
                <Check className="w-4 h-4" />
                Apply Range
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedDatePicker;