import type { ReactNode } from 'react';

// Define the props interface for the Table component
interface TableProps {
  headers: string[]; // headers is an array of strings
  children: ReactNode; // children can be any valid React node (e.g., table rows)
}

const Table = ({ headers, children }: TableProps) => {
  return (
    <div className="overflow-x-auto rounded-xl shadow border border-gray-200 dark:border-gray-700">
      <table className="min-w-full bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100">
        <thead className="bg-gray-100 dark:bg-gray-800 uppercase text-xs font-semibold">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-4 py-3 text-left">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children}
        </tbody>
      </table>
    </div>
  );
};

export default Table;