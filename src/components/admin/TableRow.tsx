// components/TableRow.tsx
import React from 'react';
import { ActionMenu } from '../../components/admin/ActionMenu';

type Action<T> = {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
};

type TableRowProps<T> = {
  index: number;
  row: T;
  columns: React.ReactNode[];
  actions?: Action<T>[];
};

const TableRow = <T,>({ index, row, columns, actions }: TableRowProps<T>) => {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-2 text-sm text-gray-700">{index}</td>
      {columns.map((col, colIndex) => (
        <td key={colIndex} className="px-4 py-2 text-sm text-gray-500 font-medium">
          {col}
        </td>
      ))}
      {actions && (
        <td className="px-4 py-2">
          <div className="flex justify-start">
            <ActionMenu row={row} actions={actions} />
          </div>
        </td>
      )}
    </tr>
  );
};

export default TableRow;