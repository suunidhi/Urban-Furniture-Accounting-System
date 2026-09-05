import React, { useState, useEffect } from 'react';
import api from '../../api';
import DataTable from '../../components/DataTable';

const BillsList = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [errorMsg, setErrorMsg] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const handleSendEmail = async () => {
    const email = window.prompt("Enter recipient email address:");
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address (e.g., name@gmail.com)");
      return;
    }

    try {
      setIsSendingEmail(true);
      await api.post('/email/send-receipt', {
        email,
        type: 'bill',
        data: reportData
      });
      alert('Email sent successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to send email. Ensure backend is configured.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.get('/bills');
      setBills(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to fetch vendor bills');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const confirmBill = async (id) => {
    try {
      setErrorMsg(null);
      await api.post(`/bills/${id}/confirm`);
      fetchData();
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || 'Failed to confirm vendor bill';
      setErrorMsg(backendMessage);
    }
  };

  const submitPayment = async () => {
    if (!selectedRow) return;
    try {
      setErrorMsg(null);
      await api.post(`/payments/register`, {
        type: 'vendor',
        partner_id: selectedRow.vendor_id,
        amount: selectedRow.outstanding_amount,
        payment_method: paymentMethod,
        date: new Date().toISOString().split('T')[0],
        reference: selectedRow.bill_number,
        bill_id: selectedRow.id
      });
      fetchData();
      setPaymentModalOpen(false);
      setSelectedRow(null);
    } catch (err) {
      const backendMessage = err.response?.data?.message || 'Failed to register payment';
      setErrorMsg(backendMessage);
      setPaymentModalOpen(false);
    }
  };

  const openReport = async (id) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/bills/${id}`);
      setReportData(res.data);
      setShowReport(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load bill details for report');
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { header: 'Bill Number', accessor: 'bill_number' },
    { header: 'Vendor', render: (row) => row.vendor ? row.vendor.name : '-' },
    { header: 'Bill Date', render: (row) => new Date(row.invoice_date).toLocaleDateString() },
    { header: 'Total', render: (row) => `$${Number(row.total).toFixed(2)}` },
    { 
      header: 'Status', 
      render: (row) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${
          row.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
          row.status === 'posted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
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
            <button 
              onClick={(e) => { e.stopPropagation(); confirmBill(row.id); }} 
              className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded"
            >
              Post Bill
            </button>
          )}
          {row.status === 'posted' && row.outstanding_amount > 0 && (
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setSelectedRow(row);
                setPaymentMethod('bank');
                setPaymentModalOpen(true);
              }} 
              className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded"
            >
              Register Payment
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); openReport(row.id); }} 
            className="text-xs px-2 py-1 bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded flex items-center gap-1"
            title="View Bill Report"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            Report
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light text-odoo-primary">Vendor Bills</h2>
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

      {paymentModalOpen && selectedRow && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center print:hidden">
          <div className="relative p-5 border w-[32rem] shadow-lg rounded-xl bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-800">Register Payment</h3>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Vendor</p>
                <p className="text-gray-900 font-semibold">{selectedRow.vendor ? selectedRow.vendor.name : 'Unknown'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Amount Due</p>
                <p className="text-2xl font-bold text-odoo-primary">${Number(selectedRow.outstanding_amount).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-odoo-primary focus:ring-odoo-primary h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Bank</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="text-odoo-primary focus:ring-odoo-primary h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">Cash</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                <input 
                  type="date"
                  disabled
                  value={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
              <button onClick={() => setPaymentModalOpen(false)} className="px-5 py-2 bg-gray-100 text-gray-700 font-medium rounded hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={submitPayment} className="px-5 py-2 bg-odoo-primary text-white font-medium rounded hover:bg-odoo-primaryHover shadow-sm transition-colors">Confirm Payment</button>
            </div>
          </div>
        </div>
      )}

      {/* Bill Report Modal / PDF View */}
      {showReport && reportData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center print:static print:bg-white print:h-auto print:w-auto print:block">
          <div className="relative p-10 border w-[48rem] shadow-2xl rounded-xl bg-white print:w-full print:border-none print:shadow-none print:p-0">
            {/* Action Bar - Hidden on Print */}
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200 print:hidden">
              <h3 className="text-2xl font-light text-gray-800">Vendor Bill Report</h3>
              <div className="flex gap-3">
                <button 
                  onClick={handleSendEmail}
                  disabled={isSendingEmail}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded hover:bg-emerald-100 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  {isSendingEmail ? 'Sending...' : 'Email Receipt'}
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 font-medium rounded hover:bg-indigo-100 transition-colors flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
                  </svg>
                  Print / Save PDF
                </button>
                <button onClick={() => setShowReport(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold px-2">&times;</button>
              </div>
            </div>
            
            {/* Printable Area */}
            <div className="print-section">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl font-bold text-odoo-primary mb-2">{reportData.bill_number}</h1>
                  <p className="text-gray-500 font-medium mb-4">Date: {new Date(reportData.invoice_date).toLocaleDateString()}</p>
                  
                  <div className="flex gap-2 text-sm font-bold mt-2">
                    {(() => {
                      const totalAmt = Number(reportData.total || 0);
                      const outAmt = Number(reportData.outstanding_amount || 0);
                      const paidAmt = totalAmt - outAmt;
                      const isPaid = paidAmt >= totalAmt && totalAmt > 0;
                      const isPartial = paidAmt > 0 && paidAmt < totalAmt;
                      const isNotPaid = paidAmt === 0 || totalAmt === 0;

                      return (
                        <>
                          <span className={`px-3 py-1 border ${isPaid ? 'border-green-500 text-green-700 bg-green-50' : 'border-gray-200 text-gray-400'}`}>Paid</span>
                          <span className={`px-3 py-1 border ${isPartial ? 'border-orange-500 text-orange-700 bg-orange-50' : 'border-gray-200 text-gray-400'}`}>Partial</span>
                          <span className={`px-3 py-1 border ${isNotPaid ? 'border-red-500 text-red-700 bg-red-50' : 'border-gray-200 text-gray-400'}`}>Not Paid</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="text-right text-gray-600">
                  <p className="font-bold text-gray-800 text-lg mb-1">{reportData.vendor?.name}</p>
                  <p className="text-sm">Vendor ID: {reportData.vendor?.id}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse mb-8 border border-gray-200">
                <thead>
                  <tr className="border-b-2 border-odoo-primary text-odoo-primary bg-gray-50">
                    <th className="py-3 px-2 font-semibold border-r border-gray-200 text-center">Sr. No.</th>
                    <th className="py-3 px-2 font-semibold border-r border-gray-200">Product</th>
                    <th className="py-3 px-2 font-semibold border-r border-gray-200">Chart of Account</th>
                    <th className="py-3 px-2 font-semibold border-r border-gray-200">Budget Analytics</th>
                    <th className="py-3 px-2 font-semibold border-r border-gray-200 text-right">Qty</th>
                    <th className="py-3 px-2 font-semibold border-r border-gray-200 text-right">Unit Price</th>
                    <th className="py-3 px-2 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.lines && reportData.lines.map((line, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-3 px-2 text-gray-600 border-r border-gray-200 text-center">{idx + 1}</td>
                      <td className="py-3 px-2 text-gray-800 border-r border-gray-200">{line.product?.name || 'Unknown Product'}</td>
                      <td className="py-3 px-2 text-gray-500 border-r border-gray-200 text-sm">Purchase a/c</td>
                      <td className="py-3 px-2 text-gray-500 border-r border-gray-200 text-sm">-</td>
                      <td className="py-3 px-2 text-right text-gray-600 border-r border-gray-200">{line.quantity}</td>
                      <td className="py-3 px-2 text-right text-gray-600 border-r border-gray-200">${Number(line.unit_price).toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-gray-800 font-medium">${(Number(line.total) || Number(line.subtotal) || (Number(line.quantity) * Number(line.unit_price)) || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end">
                <div className="w-64 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between mb-2 text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${Number(reportData.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm text-gray-600">
                    <span>Amount Paid</span>
                    <span>${(Number(reportData.total || 0) - Number(reportData.outstanding_amount || 0)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-lg text-odoo-primary">
                    <span>Total Due</span>
                    <span>${Number(reportData.outstanding_amount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-400 text-sm">
                <p>Generated by Urban Furniture Analytics Platform</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow p-4 border border-odoo-border print:hidden">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : viewMode === 'list' ? (
          <DataTable columns={columns} data={bills} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bills.map(bill => (
              <div key={bill.id} onClick={() => openReport(bill.id)} className="bg-white rounded border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer relative">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{bill.bill_number}</h3>
                    <p className="text-sm text-gray-500">{new Date(bill.invoice_date).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                    bill.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                    bill.status === 'posted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {bill.status}
                  </span>
                </div>
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700">Vendor: {bill.vendor ? bill.vendor.name : '-'}</p>
                </div>
                <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Amount Due</p>
                    <p className="font-bold text-odoo-primary">${Number(bill.outstanding_amount).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    {bill.status === 'draft' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); confirmBill(bill.id); }} 
                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded font-medium"
                      >
                        Confirm
                      </button>
                    )}
                    {bill.status === 'posted' && bill.outstanding_amount > 0 && (
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setSelectedRow(bill);
                          setPaymentMethod('bank');
                          setPaymentModalOpen(true);
                        }} 
                        className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-medium"
                      >
                        Pay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillsList;
