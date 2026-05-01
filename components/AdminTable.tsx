'use client';

import type { ReactNode } from 'react';

type AdminTableColumn<T> = {
  header: string;
  render: (row: T) => ReactNode;
};

type AdminTableProps<T> = {
  data: T[];
  columns: AdminTableColumn<T>[];
};

export default function AdminTable<T extends { id?: string }>({ data, columns }: AdminTableProps<T>) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                  No records found.
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row.id ?? rowIndex} className="hover:bg-slate-50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.header} className="px-4 py-3 text-sm text-slate-700 align-top">
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
