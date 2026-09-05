import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

const AccountsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [formData, setFormData] = useState({
    code: '', name: '', type: 'asset', reconcile: false
  });

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/accounting/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenForm = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        reconcile: account.reconcile
      });
    } else {
      setEditingAccount(null);
      setFormData({
        code: '', name: '', type: 'asset', reconcile: false
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await api.put(`/accounting/accounts/${editingAccount.id}`, formData);
      } else {
        await api.post('/accounting/accounts', formData);
      }
      handleCloseForm();
      fetchAccounts();
    } catch (err) {
      console.error(err);
      alert('Failed to save account');
    }
  };

  const columns = [
    { header: 'Code', accessor: 'code' },
    { header: 'Account Name', accessor: 'name' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
          row.type === 'asset' ? 'bg-green-100 text-green-800' : 
          row.type === 'liability' ? 'bg-red-100 text-red-800' :
          row.type === 'equity' ? 'bg-blue-100 text-blue-800' :
          row.type === 'income' ? 'bg-indigo-100 text-indigo-800' :
          'bg-orange-100 text-orange-800'
        }`}>
          {row.type}
        </span>
      )
    },
    { 
      header: 'Allow Reconciliation', 
      render: (row) => (
        <span className={row.reconcile ? 'text-green-600' : 'text-gray-400'}>
          {row.reconcile ? 'Yes' : 'No'}
        </span>
      )
    },
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
            {editingAccount ? 'Edit Account' : 'New Account'}
          </h2>
          <button onClick={handleCloseForm} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Discard
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow border border-odoo-border max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Code *</label>
              <input required type="text" name="code" value={formData.code} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" placeholder="e.g., 100000" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" placeholder="e.g., Bank" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="flex items-center">
              <input id="reconcile" name="reconcile" type="checkbox" checked={formData.reconcile} onChange={handleChange} className="h-4 w-4 text-odoo-primary focus:ring-odoo-primary border-gray-300 rounded" />
              <label htmlFor="reconcile" className="ml-2 block text-sm text-gray-900">
                Allow Reconciliation
              </label>
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
        <h2 className="text-2xl font-light text-odoo-primary">Chart of Accounts</h2>
        <button 
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium"
        >
          New Account
        </button>
      </div>
      <DataTable 
        columns={columns} 
        data={accounts} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default AccountsList;
