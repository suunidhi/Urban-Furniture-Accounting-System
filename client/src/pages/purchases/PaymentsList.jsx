import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PaymentsList = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'graph'
  const [graphType, setGraphType] = useState('cashflow_line'); // 'cashflow_line', 'cashflow_bar', 'customer_pie', 'vendor_pie'

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.get('/payments');
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch payments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { header: 'Payment No', accessor: 'payment_number' },
    { 
      header: 'Date', 
      render: (row) => new Date(row.date).toLocaleDateString() 
    },
    { 
      header: 'Partner', 
      render: (row) => row.partner ? row.partner.name : '-' 
    },
    { 
      header: 'Type', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
          row.type === 'customer' ? 'bg-indigo-100 text-indigo-800' : 'bg-orange-100 text-orange-800'
        }`}>
          {row.type === 'customer' ? 'Receive Money' : 'Send Money'}
        </span>
      )
    },
    { 
      header: 'Method', 
      render: (row) => (
        <span className="capitalize font-medium text-gray-700">
          {row.payment_method}
        </span>
      )
    },
    { 
      header: 'Amount', 
      render: (row) => <span className="font-semibold text-gray-900">${Number(row.amount).toFixed(2)}</span>
    },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
          row.status === 'draft' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  const timeSeriesData = useMemo(() => {
    const dataMap = {};
    payments.forEach(p => {
      const dateStr = new Date(p.date).toLocaleDateString();
      if (!dataMap[dateStr]) dataMap[dateStr] = { date: dateStr, 'Receive Money': 0, 'Send Money': 0 };
      
      if (p.type === 'customer') {
        dataMap[dateStr]['Receive Money'] += Number(p.amount);
      } else {
        dataMap[dateStr]['Send Money'] += Number(p.amount);
      }
    });
    return Object.values(dataMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [payments]);

  const customerPieData = useMemo(() => {
    const dataMap = {};
    payments.filter(p => p.type === 'customer').forEach(p => {
      const name = p.partner ? p.partner.name : 'Unknown';
      if (!dataMap[name]) dataMap[name] = 0;
      dataMap[name] += Number(p.amount);
    });
    return Object.entries(dataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [payments]);

  const vendorPieData = useMemo(() => {
    const dataMap = {};
    payments.filter(p => p.type === 'vendor').forEach(p => {
      const name = p.partner ? p.partner.name : 'Unknown';
      if (!dataMap[name]) dataMap[name] = 0;
      dataMap[name] += Number(p.amount);
    });
    return Object.entries(dataMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [payments]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const renderChart = () => {
    if (graphType === 'cashflow_bar' || graphType === 'cashflow_line') {
      if (timeSeriesData.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">No payment data available</div>;
      
      const ChartComponent = graphType === 'cashflow_bar' ? BarChart : LineChart;
      
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={timeSeriesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} tickFormatter={(value) => `$${value}`} />
            <Tooltip 
              cursor={{fill: '#f3f4f6'}}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              formatter={(value) => [`$${value.toFixed(2)}`, undefined]}
            />
            <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
            {graphType === 'cashflow_bar' ? (
              <>
                <Bar dataKey="Receive Money" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Send Money" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </>
            ) : (
              <>
                <Line type="monotone" dataKey="Receive Money" stroke="#10b981" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Send Money" stroke="#f97316" strokeWidth={3} activeDot={{ r: 8 }} />
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      );
    } else if (graphType === 'customer_pie' || graphType === 'vendor_pie') {
      const data = graphType === 'customer_pie' ? customerPieData : vendorPieData;
      if (data.length === 0) return <div className="h-full flex items-center justify-center text-gray-400">No data available for this breakdown</div>;

      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={true}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light text-odoo-primary">Payments</h2>
        <div className="flex bg-gray-100 rounded p-1 border border-gray-200">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${viewMode === 'list' ? 'bg-white shadow text-odoo-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </button>
          <button 
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1 text-sm rounded transition-colors flex items-center gap-1 ${viewMode === 'graph' ? 'bg-white shadow text-odoo-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Graph
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
          {errorMsg}
        </div>
      )}

      <div className="bg-white rounded shadow p-4 border border-odoo-border">
        {isLoading ? (
          <div className="text-center py-4">Loading payments...</div>
        ) : viewMode === 'list' ? (
          <DataTable columns={columns} data={payments} />
        ) : (
          <div className="flex flex-col h-[600px] w-full pt-2 pr-4">
            <div className="flex justify-end mb-4 pr-6">
              <select 
                value={graphType} 
                onChange={(e) => setGraphType(e.target.value)}
                className="border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-odoo-primary shadow-sm"
              >
                <option value="cashflow_line">Cash Flow Over Time (Line)</option>
                <option value="cashflow_bar">Cash Flow Over Time (Bar)</option>
                <option value="customer_pie">Income by Customer (Pie)</option>
                <option value="vendor_pie">Expenses by Vendor (Pie)</option>
              </select>
            </div>
            <div className="flex-1 w-full">
              {renderChart()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsList;
