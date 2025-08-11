import React from 'react';

// Define the props the component will accept
interface InputFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value?: string | number;
  type?: string; // Optional: defaults to 'text'
  required?: boolean; // Optional: for the red asterisk
  className?: string; // Optional: for custom container styling (like grid spans)
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  label,
  placeholder,
  type = 'text',
  value,
  required = false,
  className = '',
  onChange,
  error
}) => {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        placeholder={placeholder}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 text-gray-800 dark:focus:ring-purple-500 dark:focus:border-purple-500"
        onChange={onChange}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default InputField;