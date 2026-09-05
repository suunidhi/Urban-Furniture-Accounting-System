import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

const SalesList = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState([]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [soRes, conRes, prodRes, anaRes] = await Promise.all([
        api.get('/sales'),
        api.get('/contacts'),
        api.get('/products'),
        api.get('/analyticals/accounts')
      ]);
      setSales(soRes.data);
      setCustomers(conRes.data.filter(c => c.type === 'customer' || c.type === 'both'));
      setProducts(prodRes.data);
      setAnalyticAccounts(anaRes.data.filter(a => a.is_active));
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

  const handleAddLine = () => {
    setLines([...lines, { product_id: '', analytic_account_id: '', description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;

    // Auto-fill price and description when product is selected
    if (field === 'product_id' && value) {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        newLines[index].unit_price = product.sales_price || 0;
        newLines[index].description = product.name;
      }
    }

    setLines(newLines);
  };

  const handleRemoveLine = (index) => {
    const newLines = lines.filter((_, i) => i !== index);
    setLines(newLines);
  };

  const calculateTotal = () => {
    return lines.reduce((total, line) => {
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unit_price) || 0;
      return total + (qty * price);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) return alert('Please select a customer');
    if (lines.length === 0) return alert('Please add at least one product');

    try {
      await api.post('/sales', {
        customer_id: customerId,
        date: orderDate,
        lines: lines
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create sales order');
    }
  };

  const confirmOrder = async (id) => {
    try {
      setErrorMsg(null);
      await api.post(`/sales/${id}/confirm`);
      fetchData();
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || 'Failed to confirm order';
      setErrorMsg(backendMessage);
    }
  };

  const columns = [
    { header: 'Order Number', accessor: 'so_number' },
    { header: 'Customer', render: (row) => row.customer ? row.customer.name : '-' },
    { header: 'Order Date', render: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Total', render: (row) => `$${Number(row.total).toFixed(2)}` },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
          row.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
          row.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
          row.status === 'invoiced' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
        }`}>
          {row.status === 'draft' ? 'Quotation' : row.status === 'confirmed' ? 'Sale' : row.status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {row.status === 'draft' && (
            <button 
              onClick={(e) => { e.stopPropagation(); confirmOrder(row.id); }} 
              className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded"
            >
              Confirm
            </button>
          )}
          {row.status === 'confirmed' && (
            <button 
              onClick={async (e) => { 
                e.stopPropagation(); 
                try {
                  setErrorMsg(null);
                  await api.post(`/invoices/from-so/${row.id}`);
                  fetchData();
                } catch(err) {
                  const backendMessage = err.response?.data?.message || 'Failed to create invoice';
                  setErrorMsg(backendMessage);
                }
              }} 
              className="text-xs px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 rounded"
            >
              Create Invoice
            </button>
          )}
        </div>
      )
    }
  ];

  if (showForm) {
    const total = calculateTotal();

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-light text-odoo-primary">New Quotation</h2>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Discard
          </button>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow border border-odoo-border">
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Customer *</label>
              <select 
                value={customerId} 
                onChange={(e) => setCustomerId(e.target.value)} 
                className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white"
                required
              >
                <option value="">-- Select Customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Order Date *</label>
              <input 
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="mt-1 block w-full border border-odoo-border rounded-md py-2 px-3 focus:outline-none focus:ring-odoo-primary sm:text-sm bg-white"
              />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Order Lines</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 mb-4">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Analytic Account</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2">
                        <select 
                          value={line.product_id}
                          onChange={(e) => handleLineChange(index, 'product_id', e.target.value)}
                          className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary"
                          required
                        >
                          <option value="">-- Select --</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
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
                        <input type="text" value={line.description} onChange={(e) => handleLineChange(index, 'description', e.target.value)} className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary" />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" min="1" step="any" value={line.quantity} onChange={(e) => handleLineChange(index, 'quantity', e.target.value)} className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary" required />
                      </td>
                      <td className="px-3 py-2">
                        <input type="number" step="0.01" value={line.unit_price} onChange={(e) => handleLineChange(index, 'unit_price', e.target.value)} className="block w-full border border-gray-300 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-odoo-primary" required />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 font-medium">
                        ${((parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0)).toFixed(2)}
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
                Add a product
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-64 border-t border-gray-200 pt-4">
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-odoo-border flex gap-3">
            <button type="submit" className="px-4 py-2 bg-odoo-primary text-white rounded hover:bg-odoo-primaryHover shadow-sm text-sm font-medium">
              Save Quotation
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light text-odoo-primary">Quotations / Sales Orders</h2>
        <button 
          onClick={() => {
            setCustomerId('');
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
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
        </div>
      )}
      <DataTable 
        columns={columns} 
        data={sales} 
        isLoading={isLoading}
      />
    </div>
  );
};

export default SalesList;
