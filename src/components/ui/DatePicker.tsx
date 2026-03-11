import React from "react";
import { Calendar as PrimeCalendar } from "primereact/calendar";

interface CalendarProps {
  value?: Date | Date[] | null;
  onChange?: (e: any) => void;
  selectionMode?: "single" | "multiple" | "range";
  placeholder?: string;
  showTime?: boolean;
  showIcon?: boolean;
  dateFormat?: string;
  disabled?: boolean;
  readOnlyInput?: boolean;
  className?: string;
}

const DatePicker: React.FC<CalendarProps> = ({
  value,
  onChange,
  selectionMode = "single",
  placeholder = "Select date",
  showTime = false,
  showIcon = true,
  dateFormat = "mm/dd/yy",
  disabled = false,
  readOnlyInput = false,
  className = "",
}) => {
  return (
    <PrimeCalendar
      value={value}
      onChange={onChange}
      selectionMode={selectionMode}
      placeholder={placeholder}
      showTime={showTime}
      showIcon={showIcon}
      dateFormat={dateFormat}
      disabled={disabled}
      readOnlyInput={readOnlyInput}
      className={className}
    />
  );
};

export default DatePicker;