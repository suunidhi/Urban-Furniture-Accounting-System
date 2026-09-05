import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';

export default function JournalEntries() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const { data } = await api.get('/journal-entries');
      return data;
    }
  });

  const filteredEntries = entries?.filter(entry => 
    entry.reference?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    entry.journal?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Journal Entries</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-light overflow-hidden">
        <div className="p-4 border-b border-gray-light">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-DEFAULT" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-light rounded-md sm:text-sm"
              placeholder="Search reference or journal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="p-8 text-center text-gray-DEFAULT">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-light">
            <thead className="bg-background-secondary">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-dark uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-dark uppercase tracking-wider">Journal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-dark uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-dark uppercase tracking-wider">Source Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-dark uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-dark uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-light">
              {filteredEntries?.map((entry) => (
                <tr key={entry.id} className="hover:bg-background-secondary">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-dark">{entry.journal?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{entry.reference || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-dark capitalize">{entry.source_type.replace('_', ' ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">${parseFloat(entry.total_debit).toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      entry.state === 'posted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.state}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
