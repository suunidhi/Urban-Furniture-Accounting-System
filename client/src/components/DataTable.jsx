import React from 'react';
import { exportToCSV } from '../utils/exportUtils';

const DataTable = ({ columns, data, onRowClick, isLoading }) => {
  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading data...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded border border-odoo-border overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          No records found.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded border border-odoo-border overflow-hidden shadow-sm">
      <div className="flex justify-end p-2 bg-gray-50 border-b border-odoo-border">
        <button
          onClick={() => exportToCSV(data, 'export.csv')}
          className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded hover:bg-gray-100 border border-gray-300 transition-colors flex items-center gap-1 shadow-sm"
          title="Export to CSV"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-odoo-border">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, index) => (
              <th 
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-odoo-border">
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? "cursor-pointer hover:bg-gray-50 transition-colors" : ""}
            >
              {columns.map((col, colIndex) => (
                <td 
                  key={colIndex} 
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-700"
                >
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default DataTable;
