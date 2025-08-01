import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

type Props = {
  label?: string;
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  required?: boolean;
  id?: string;
  name?: string;
  disabled?: boolean;
  className?: string;
};

const ReactDateInput: React.FC<Props> = ({
  label = 'Select Date',
  selected,
  onChange,
  placeholder = 'Select date',
  minDate,
  maxDate,
  required = false,
  id = 'date',
  name = 'date',
  disabled = false,
  className = '',
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1"
        >
          {label}
        </label>
      )}

      <div className="relative">
        <DatePicker
          id={id}
          name={name}
          selected={selected}
          onChange={onChange}
          placeholderText={placeholder}
          minDate={minDate}
          maxDate={maxDate}
          required={required}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white py-2 pl-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          calendarClassName="dark:bg-gray-800 dark:text-white"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default ReactDateInput;