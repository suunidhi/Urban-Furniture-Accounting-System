import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

const JournalsList = () => {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);

  const [formData, setFormData] = useState({
    name: '', type: 'sale', code: '', default_debit_account_id: '', default_credit_account_id: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [jourRes, accRes] = await Promise.all([
        api.get('/accounting/journals'),
        api.get('/accounting/accounts')
      ]);
      setJournals(jourRes.data);
      setAccounts(accRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (journal = null) => {
    if (journal) {
      setEditingJournal(journal);
      setFormData({
        name: journal.name,
        type: journal.type,
        code: journal.code,
        default_debit_account_id: journal.default_debit_account_id || '',
        default_credit_account_id: journal.default_credit_account_id || ''
      });
    } else {
      setEditingJournal(null);
      setFormData({
        name: '', type: 'sale', code: '', default_debit_account_id: '', default_credit_account_id: ''
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingJournal(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJournal) {
        await api.put(`/accounting/journals/${editingJournal.id}`, formData);
      } else {
        await api.post('/accounting/journals', formData);
      }
      handleCloseForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save journal');
    }
  };

  const columns = [
    { header: 'Journal Name', accessor: 'name' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className="px-2 py-1 rounded text-xs font-semibold capitalize bg-gray-100 text-gray-800">
          {row.type}
        </span>
      )
    },
    { header: 'Short Code', accessor: 'code' },
    { header: 'Default Debit', render: (row) => row.default_debit_account ? row.default_debit_account.name : '-' },
    { header: 'Default Credit', render: (row) => row.default_credit_account ? row.default_credit_account.name : '-' },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={(e) => { e.stopPropagation(); handleOpenForm(row); }} className="text-indigo-600 hover:text-indigo-900">Edit</button>
        </div>
      )
    }
  ];

  if (showForm) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-odoo-primary">
            {editingJournal ? 'Edit Journal' : 'New Journal'}
          </h2>
          <button onClick={handleCloseForm} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Discard
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow border border-odoo-border max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Journal Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Type *</label>
                <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                  <option value="sale">Sale</option>
                  <option value="purchase">Purchase</option>
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="general">Miscellaneous/General</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Short Code *</label>
                <input required type="text" name="code" value={formData.code} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" placeholder="e.g., INV" />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-200 pt-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Debit Account</label>
                  <select name="default_debit_account_id" value={formData.default_debit_account_id} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                    <option value="">-- None --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Default Credit Account</label>
                  <select name="default_credit_account_id" value={formData.default_credit_account_id} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                    <option value="">-- None --</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-odoo-border">
              <button type="submit" className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light text-odoo-primary">Journals</h2>
        <button 
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium"
        >
          New Journal
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={journals} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default JournalsList;
