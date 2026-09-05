import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BudgetsList = () => {
  const [budgets, setBudgets] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportBudget, setReportBudget] = useState(null);
  const [reviseAmount, setReviseAmount] = useState('');
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'

  const [formData, setFormData] = useState({
    name: '', period_start: '', period_end: '', analytic_account_id: '', planned_amount: '', status: 'draft', notes: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [budgRes, anaRes] = await Promise.all([
        api.get('/analyticals/budgets'),
        api.get('/analyticals/accounts')
      ]);
      setBudgets(budgRes.data);
      setAnalyticAccounts(anaRes.data.filter(a => a.is_active));
    } catch (err) {
      console.error(err);
      alert('Failed to fetch budgets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setFormData({
        name: budget.name,
        period_start: budget.period_start.split('T')[0],
        period_end: budget.period_end.split('T')[0],
        analytic_account_id: budget.analytic_account_id || '',
        planned_amount: budget.planned_amount,
        status: budget.status,
        notes: budget.notes || ''
      });
    } else {
      setEditingBudget(null);
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 1);
      
      setFormData({
        name: '', 
        period_start: start.toISOString().split('T')[0], 
        period_end: end.toISOString().split('T')[0], 
        analytic_account_id: '', 
        planned_amount: '', 
        status: 'draft',
        notes: ''
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await api.put(`/analyticals/budgets/${editingBudget.id}`, formData);
      } else {
        await api.post('/analyticals/budgets', formData);
      }
      handleCloseForm();
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to save budget');
    }
  };

  const handleRevise = async (id, currentAmount) => {
    const newAmount = prompt(`Enter new committed amount for this budget (current: $${currentAmount}):`, currentAmount);
    if (!newAmount || isNaN(parseFloat(newAmount))) return;
    
    try {
      await api.post(`/analyticals/budgets/${id}/revise`, { new_committed_amount: parseFloat(newAmount) });
      fetchData();
      if (showForm) handleCloseForm();
    } catch (err) {
      console.error(err);
      alert('Failed to revise budget');
    }
  };

  const openReport = (budget) => {
    setReportBudget(budget);
    setShowReport(true);
  };

  const handleConfirm = async (id) => {
    try {
      await api.put(`/analyticals/budgets/${id}`, { status: 'confirmed' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to confirm budget');
    }
  };

  const columns = [
    { header: 'Budget Name', accessor: 'name' },
    { header: 'Period Start', render: (row) => new Date(row.period_start).toLocaleDateString() },
    { header: 'Period End', render: (row) => new Date(row.period_end).toLocaleDateString() },
    { header: 'Analytic Account', render: (row) => row.analytic_account ? row.analytic_account.name : '-' },
    { header: 'Committed', render: (row) => `$${Number(row.committed_amount || row.planned_amount).toFixed(2)}` },
    { header: 'Achieved', render: (row) => row.status === 'confirmed' ? `$${Number(row.achieved_amount || 0).toFixed(2)}` : '-' },
    { header: 'Achieved %', render: (row) => row.status === 'confirmed' ? `${Number(row.achieved_percent || 0).toFixed(1)}%` : '-' },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
          row.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
          row.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
          row.status === 'revised' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
        }`}>
          {row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'draft' && (
            <button onClick={() => handleConfirm(row.id)} className="text-green-600 hover:text-green-900 font-medium">Confirm</button>
          )}
          {row.status !== 'revised' && <button onClick={() => handleOpenForm(row)} className="text-indigo-600 hover:text-indigo-900">Edit</button>}
          {row.status === 'confirmed' && (
            <>
              <button onClick={() => handleRevise(row.id, row.committed_amount)} className="text-orange-600 hover:text-orange-900">Revise</button>
              <button onClick={() => openReport(row)} className="text-emerald-600 hover:text-emerald-900" title="Report">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  if (showForm) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-odoo-primary">
            {editingBudget ? 'Edit Budget' : 'New Analytical Budget'}
          </h2>
          <button onClick={handleCloseForm} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Discard
          </button>
        </div>

        <div className="bg-white p-6 rounded shadow border border-odoo-border">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Budget Name *</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Period Start *</label>
                <input required type="date" name="period_start" value={formData.period_start} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Period End *</label>
                <input required type="date" name="period_end" value={formData.period_end} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Analytic Account *</label>
                <select required name="analytic_account_id" value={formData.analytic_account_id} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                  <option value="">-- Select Analytic Account --</option>
                  {analyticAccounts.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Planned Amount *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input required type="number" step="0.01" name="planned_amount" value={formData.planned_amount} onChange={handleChange} className="pl-7 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm" placeholder="0.00" />
                </div>
              </div>

              {editingBudget && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white">
                    <option value="draft">Draft</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="revised">Revised</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="mt-1 block w-full border border-odoo-border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm"></textarea>
              </div>
            </div>

            <div className="pt-4 flex gap-3 border-t border-odoo-border">
              <button type="submit" className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium">
                Save Budget
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
        <h2 className="text-2xl font-light text-odoo-primary">Analytical Budgets</h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded p-1 border border-gray-200">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === 'kanban' ? 'bg-white shadow text-odoo-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kanban
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow text-odoo-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              List
            </button>
          </div>
          <button 
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium"
          >
            New Budget
          </button>
        </div>
      </div>

      {showReport && reportBudget && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative p-8 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-light text-odoo-primary">Budget Report: {reportBudget.name}</h3>
              <button onClick={() => setShowReport(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-gray-700 mb-4">Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Period</span>
                    <span className="font-semibold">{new Date(reportBudget.period_start).toLocaleDateString()} to {new Date(reportBudget.period_end).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Committed Amount</span>
                    <span className="font-semibold">${Number(reportBudget.committed_amount || reportBudget.planned_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Achieved Amount</span>
                    <span className="font-semibold text-emerald-600">${Number(reportBudget.achieved_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Amount Remaining</span>
                    <span className="font-semibold text-orange-500">${Math.max(0, Number(reportBudget.amount_to_achieve)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Achieved %</span>
                    <span className="font-semibold">{Number(reportBudget.achieved_percent).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Achieved', value: Number(reportBudget.achieved_amount) },
                        { name: 'Remaining', value: Math.max(0, Number(reportBudget.amount_to_achieve)) }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#10b981" /> {/* Emerald 500 */}
                      <Cell fill="#e5e7eb" /> {/* Gray 200 */}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="mt-8 text-center">
               <button onClick={() => setShowReport(false)} className="px-6 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium">Close Report</button>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : viewMode === 'list' ? (
        <DataTable 
          columns={columns} 
          data={budgets} 
          isLoading={isLoading}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {budgets.map(budget => (
            <div 
              key={budget.id} 
              className={`bg-white rounded border ${budget.status === 'confirmed' ? 'border-blue-300 shadow-sm' : 'border-gray-200'} hover:shadow-md transition-shadow p-4 relative cursor-pointer`}
              onClick={() => budget.status === 'confirmed' ? openReport(budget) : handleOpenForm(budget)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{budget.name}</h3>
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                  budget.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                  budget.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                  budget.status === 'revised' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {budget.status}
                </span>
              </div>
              
              <div className="space-y-1 text-sm text-gray-600 mb-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Start Date</span>
                  <span className="font-medium">{new Date(budget.period_start).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">End Date</span>
                  <span className="font-medium">{new Date(budget.period_end).toLocaleDateString()}</span>
                </div>
              </div>

              {budget.status === 'draft' && (
                <div className="pt-3 border-t border-gray-100 mt-3 text-center">
                   <button 
                    onClick={(e) => { e.stopPropagation(); handleConfirm(budget.id); }} 
                    className="text-sm text-green-600 hover:text-green-800 font-medium"
                   >
                     Confirm Budget
                   </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetsList;
