import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

const JournalEntriesList = () => {
  const [entries, setEntries] = useState([]);
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [journalId, setJournalId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const [jeRes, jrnRes, accRes, conRes, anaRes] = await Promise.all([
        api.get('/accounting/journal-entries'),
        api.get('/accounting/journals'),
        api.get('/accounting/accounts'),
        api.get('/contacts'),
        api.get('/analyticals/accounts')
      ]);
      setEntries(jeRes.data);
      setJournals(jrnRes.data);
      setAccounts(accRes.data);
      setContacts(conRes.data);
      setAnalyticAccounts(anaRes.data.filter(a => a.is_active));
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddLine = () => {
    setLines([...lines, { account_id: '', analytic_account_id: '', partner_id: '', debit: 0, credit: 0, description: '' }]);
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    
    // Auto-balance if they enter debit, wipe credit and vice versa
    if (field === 'debit' && parseFloat(value) > 0) {
      newLines[index].credit = 0;
    } else if (field === 'credit' && parseFloat(value) > 0) {
      newLines[index].debit = 0;
    }

    setLines(newLines);
  };

  const handleRemoveLine = (index) => {
    const newLines = lines.filter((_, i) => i !== index);
    setLines(newLines);
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    lines.forEach(line => {
      totalDebit += parseFloat(line.debit) || 0;
      totalCredit += parseFloat(line.credit) || 0;
    });
    return { totalDebit, totalCredit };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!journalId) return setErrorMsg('Please select a journal');
    if (lines.length < 2) return setErrorMsg('Please add at least two lines to balance the entry');

    const { totalDebit, totalCredit } = calculateTotals();
    
    // Round to 2 decimals to avoid floating point issues
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return setErrorMsg(`Cannot save: Debit (${totalDebit.toFixed(2)}) and Credit (${totalCredit.toFixed(2)}) do not match.`);
    }

    try {
      setErrorMsg(null);
      await api.post('/accounting/journal-entries', {
        journal_id: journalId,
        date,
        reference,
        items: lines
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to create journal entry');
    }
  };

  const handlePostEntry = async (id) => {
    try {
      setErrorMsg(null);
      await api.post(`/accounting/journal-entries/${id}/post`);
      fetchData();
    } catch (err) {
      setErrorMsg('Failed to post entry');
    }
  };

  const columns = [
    { header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Number', accessor: 'reference' },
    { header: 'Journal', render: (row) => row.journal ? row.journal.name : '-' },
    { header: 'Total', render: (row) => `$${Number(row.total_debit).toFixed(2)}` },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
          row.state === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
        }`}>
          {row.state}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.state === 'draft' && (
            <button 
              onClick={(e) => { e.stopPropagation(); handlePostEntry(row.id); }} 
              className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded"
            >
              Post
            </button>
          )}
        </div>
      )
    }
  ];

  if (showForm) {
    const { totalDebit, totalCredit } = calculateTotals();
    const isBalanced = Math.abs(totalDebit - totalCredit) <= 0.01;

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-odoo-primary">New Journal Entry</h2>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Discard
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded flex items-center justify-between">
            <span className="font-semibold">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow border border-odoo-border">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Accounting Date *</label>
              <input 
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Journal *</label>
              <select 
                value={journalId} 
                onChange={(e) => setJournalId(e.target.value)} 
                className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white"
                required
              >
                <option value="">-- Select Journal --</option>
                {journals.map(j => (
                  <option key={j.id} value={j.id}>{j.name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Reference</label>
              <input 
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Opening Balance"
                className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white"
              />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Journal Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Analytic Account</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Debit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credit</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <select 
                          value={line.account_id}
                          onChange={(e) => handleLineChange(index, 'account_id', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary"
                          required
                        >
                          <option value="">-- Select --</option>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select 
                          value={line.analytic_account_id}
                          onChange={(e) => handleLineChange(index, 'analytic_account_id', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary"
                        >
                          <option value="">-- None --</option>
                          {analyticAccounts.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select 
                          value={line.partner_id}
                          onChange={(e) => handleLineChange(index, 'partner_id', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary"
                        >
                          <option value="">-- None --</option>
                          {contacts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input type="text" value={line.description} onChange={(e) => handleLineChange(index, 'description', e.target.value)} className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" min="0" value={line.debit} onChange={(e) => handleLineChange(index, 'debit', e.target.value)} className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary" required />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" min="0" value={line.credit} onChange={(e) => handleLineChange(index, 'credit', e.target.value)} className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary" required />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button type="button" onClick={() => handleRemoveLine(index)} className="text-red-500 hover:text-red-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={handleAddLine} className="text-sm font-medium text-odoo-primary hover:text-odoo-primaryHover">
                Add a line
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-64 border-t border-gray-200 pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-500">Total Debit:</span>
                <span>${totalDebit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-500">Total Credit:</span>
                <span>${totalCredit.toFixed(2)}</span>
              </div>
              {!isBalanced && (
                <div className="text-red-600 text-sm font-bold mt-2">
                  Out of balance by ${Math.abs(totalDebit - totalCredit).toFixed(2)}
                </div>
              )}
              {isBalanced && totalDebit > 0 && (
                <div className="text-green-600 text-sm font-bold mt-2">
                  Balanced!
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-odoo-border flex gap-3">
            <button 
              type="submit" 
              disabled={!isBalanced || totalDebit === 0}
              className={`px-4 py-2 text-white rounded shadow-sm text-sm font-medium ${
                isBalanced && totalDebit > 0 ? 'bg-odoo-primary hover:bg-odoo-primaryHover' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Post Entry
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light text-odoo-primary">Journal Entries</h2>
        <button 
          onClick={() => {
            setJournalId('');
            setDate(new Date().toISOString().split('T')[0]);
            setReference('');
            setLines([]);
            setShowForm(true);
            setErrorMsg(null);
          }}
          className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium"
        >
          New
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded flex items-center justify-between">
          <span className="font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={entries} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default JournalEntriesList;
