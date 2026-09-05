import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

const AnalyticalsList = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  const [formData, setFormData] = useState({
    name: '', type: 'income', is_active: true
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/analyticals/accounts');
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch analytic accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (account = null) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        name: account.name,
        type: account.type,
        is_active: account.is_active
      });
    } else {
      setEditingAccount(null);
      setFormData({
        name: '', type: 'income', is_active: true
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
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await api.put(`/analyticals/accounts/${editingAccount.id}`, formData);
      } else {
        await api.post('/analyticals/accounts', formData);
      }
      handleCloseForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save analytic account');
    }
  };

  const columns = [
    { header: 'ID', render: (row) => row.id },
    { header: 'Account Name', accessor: 'name' },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`capitalize px-2 py-1 rounded text-xs font-semibold ${row.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {row.type}
        </span>
      )
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={row.is_active ? 'text-green-600' : 'text-gray-400'}>
          {row.is_active ? 'Active' : 'Archived'}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <button onClick={() => handleOpenForm(row)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
      )
    }
  ];

  if (showForm) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-odoo-primary">
            {editingAccount ? 'Edit Analytic Account' : 'New Analytic Account'}
          </h2>
          <button onClick={handleCloseForm} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Discard
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow border border-odoo-border max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            {editingAccount && (
              <div className="flex items-center">
                <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-odoo-primary focus:ring-odoo-primary border-gray-300 rounded" />
                <label className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
            )}

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
        <h2 className="text-2xl font-light text-odoo-primary">Analytic Accounts</h2>
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

export default AnalyticalsList;
