// TableRow.tsx

import { useState, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';
import { MoreVertical, TrashIcon, EditIcon } from 'lucide-react';

// Define the interface for a Unit object
interface Unit {
  id: string; // Assuming 'id' exists and is a string or number for identification
  unit_name: string;
  short_name: string;
  status: boolean;
  // Add any other properties that your 'unit' object might have
}

// Define the props interface for the TableRow component
interface TableRowProps {
  index: number;
  unit: Unit;
  onToggle: (unit: Unit) => void; // Function that takes a Unit and returns void
  onEdit: (unit: Unit) => void;   // Function that takes a Unit and returns void
  handleDeleteClick: (unit: Unit) => void; // Function that takes a Unit and returns void
}

const TableRow = ({ index, unit, onToggle, onEdit, handleDeleteClick }: TableRowProps) => {
  const [showActions, setShowActions] = useState<boolean>(false);
  // useRef can be typed to HTMLDivElement or null
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => { // Type 'event' as MouseEvent
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Type 'event.target' as Node for contains() method
        setShowActions(false);
      }
    };
    // Add event listener for mousedown on the document
    document.addEventListener('mousedown', handleClickOutside as EventListener);
    return () => {
      // Clean up the event listener on component unmount
      document.removeEventListener('mousedown', handleClickOutside as EventListener);
    };
  }, []);

  return (
    <tr className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
      <td className="px-4 py-1">{index}</td>
      <td className="px-4 py-1 font-semibold text-gray-500">{unit.unit_name}</td>
      <td className="px-4 py-1 font-semibold text-gray-500">{unit.short_name}</td>
      <td className="px-4 py-1">
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={unit.status}
            onChange={() => onToggle(unit)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-checked:bg-purple-600 rounded-full peer-focus:ring-2 peer-focus:ring-purple-500 transition-all duration-300">
            <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${unit.status ? 'translate-x-5' : 'translate-x-1'}`}></div>
          </div>
        </label>
      </td>
      <td className="px-4 py-1">
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          >
            <MoreVertical size={18} className="text-gray-600 dark:text-gray-300 cursor-pointer" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-32 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
              <button
                onClick={() => {
                  onEdit(unit);
                  setShowActions(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-semibold hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer"
              >
                <EditIcon className="inline-block mr-2 text-gray-600 dark:text-gray-300" size={16} /> Edit
              </button>
              <button
                onClick={() => {
                  setShowActions(false);
                  handleDeleteClick(unit);
                }}
                className="w-full px-4 py-2 text-left text-xs text-semibold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              >
                <TrashIcon className="inline-block mr-2" size={16}/> Delete
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};

export default TableRow;