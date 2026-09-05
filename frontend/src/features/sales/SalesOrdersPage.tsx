import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { SalesOrder, Contact, Product, AnalyticAccount, OrderStatus } from '../../types';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  AlertCircle,
  Calendar,
  UserCheck,
  Receipt
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export const SalesOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailSOId, setDetailSOId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    customerId: 0,
    soDate: new Date().toISOString().split('T')[0],
    notes: '',
    lines: [
      { productId: 0, analyticAccountId: null as number | null, quantity: 1, unitPrice: 0, taxRate: 18 },
    ],
  });

  // Fetch SOs
  const { data: sos, isLoading } = useQuery<SalesOrder[]>({
    queryKey: ['sales-orders', debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await api.get('/sales', { 
        params: { 
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined 
        } 
      });
      return res.data.data;
    },
  });

  // Fetch Customers
  const { data: customers } = useQuery<Contact[]>({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get('/contacts', { params: { type: 'CUSTOMER' } });
      return res.data.data;
    },
  });

  // Fetch Products
  const { data: products } = useQuery<Product[]>({
    queryKey: ['products-list'],
    queryFn: async () => {
      const res = await api.get('/products');
      return res.data.data;
    },
  });

  // Fetch Analytics
  const { data: analytics } = useQuery<AnalyticAccount[]>({
    queryKey: ['analytics-list'],
    queryFn: async () => {
      const res = await api.get('/analytics');
      return res.data.data;
    },
  });

  // Single SO detail
  const { data: soDetail } = useQuery<SalesOrder>({
    queryKey: ['sales-order', detailSOId],
    queryFn: async () => {
      if (!detailSOId) return null;
      const res = await api.get(`/sales/${detailSOId}`);
      return res.data.data;
    },
    enabled: !!detailSOId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/sales', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      setModalOpen(false);
      setError(null);
      setDetailSOId(data.data.id);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create Sales Order.');
    },
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/sales/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-order', detailSOId] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Could not confirm Sales Order.');
    },
  });

  // Convert to Invoice mutation
  const convertMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/sales/${id}/convert-to-invoice`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      setDetailSOId(null);
      alert(`Customer Invoice ${data.data.invoiceNumber} generated successfully! You can find it under Sales > Customer Invoices.`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Could not convert to Customer Invoice.');
    },
  });

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { 
          productId: products && products.length > 0 ? products[0].id : 0, 
          analyticAccountId: null, 
          quantity: 1, 
          unitPrice: products && products.length > 0 ? Number(products[0].salesPrice) : 0, 
          taxRate: 18 
        },
      ],
    });
  };

  const handleRemoveLine = (index: number) => {
    if (formData.lines.length === 1) return;
    setFormData({
      ...formData,
      lines: formData.lines.filter((_, i) => i !== index),
    });
  };

  const handleProductChange = (index: number, productId: number) => {
    const selectedProd = products?.find((p) => p.id === productId);
    const updatedLines = [...formData.lines];
    updatedLines[index].productId = productId;
    if (selectedProd) {
      updatedLines[index].unitPrice = Number(selectedProd.salesPrice);
    }
    setFormData({ ...formData, lines: updatedLines });
  };

  const handleLineChange = (index: number, field: string, val: any) => {
    const updatedLines = [...formData.lines];
    (updatedLines[index] as any)[field] = val;
    setFormData({ ...formData, lines: updatedLines });
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let taxAmount = 0;
    formData.lines.forEach((l) => {
      const lineSub = Number(l.quantity) * Number(l.unitPrice);
      const lineTax = (lineSub * Number(l.taxRate || 0)) / 100;
      subtotal += lineSub;
      taxAmount += lineTax;
    });
    return { subtotal, taxAmount, totalAmount: subtotal + taxAmount };
  };

  const openNewSOModal = () => {
    const defaultCust = customers && customers.length > 0 ? customers[0].id : 0;
    const defaultProd = products && products.length > 0 ? products[0] : null;
    setFormData({
      customerId: defaultCust,
      soDate: new Date().toISOString().split('T')[0],
      notes: '',
      lines: [
        {
          productId: defaultProd ? defaultProd.id : 0,
          analyticAccountId: null,
          quantity: 1,
          unitPrice: defaultProd ? Number(defaultProd.salesPrice) : 0,
          taxRate: 18,
        },
      ],
    });
    setError(null);
    setModalOpen(true);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Draft</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Confirmed</span>;
      case 'INVOICED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Invoiced</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Cancelled</span>;
      default:
        return null;
    }
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-[#714B67]" />
            Sales Orders
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage customer quotations, confirm sales, and generate tax invoices
          </p>
        </div>

        <button
          onClick={openNewSOModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Sales Order
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by SO number or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'DRAFT', 'CONFIRMED', 'INVOICED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-[#714B67] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading sales orders...</div>
        ) : !sos || sos.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No sales orders found</p>
            <p className="text-gray-400 text-sm mt-1">
              Create a sales order to record customer commitments
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">SO Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Untaxed Amount</th>
                  <th className="py-3 px-4">Tax Amount</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sos.map((so) => (
                  <tr
                    key={so.id}
                    onClick={() => setDetailSOId(so.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#714B67]">
                      {so.soNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {so.customer?.name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {new Date(so.soDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">
                      ₹{Number(so.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-gray-700">
                      ₹{Number(so.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      ₹{Number(so.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(so.status)}</td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailSOId(so.id)}
                        className="text-xs font-medium text-[#714B67] hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sales Order Detail Modal */}
      {detailSOId && soDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{soDetail.soNumber}</h2>
                    {getStatusBadge(soDetail.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customer: <span className="font-medium text-gray-700">{soDetail.customer?.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {soDetail.status === 'DRAFT' && (
                  <button
                    onClick={() => confirmMutation.mutate(soDetail.id)}
                    disabled={confirmMutation.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {confirmMutation.isPending ? 'Confirming...' : 'Confirm Order'}
                  </button>
                )}

                {soDetail.status === 'CONFIRMED' && (
                  <button
                    onClick={() => convertMutation.mutate(soDetail.id)}
                    disabled={convertMutation.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    {convertMutation.isPending ? 'Generating...' : 'Create Invoice'}
                  </button>
                )}

                <button
                  onClick={() => setDetailSOId(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Order Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(soDetail.soDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Customer Email</span>
                  <span className="font-semibold text-gray-800">
                    {soDetail.customer?.email || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Invoicing Status</span>
                  <span className="font-semibold text-gray-800">
                    {soDetail.customerInvoice ? (
                      <span className="text-emerald-700 font-mono">
                        Invoiced: {soDetail.customerInvoice.invoiceNumber}
                      </span>
                    ) : (
                      'Pending Invoice'
                    )}
                  </span>
                </div>
              </div>

              {soDetail.customerInvoice && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-700" />
                    <span>
                      Customer Invoice Generated: <strong className="font-mono">{soDetail.customerInvoice.invoiceNumber}</strong>
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-800">
                    Status: {soDetail.customerInvoice.status}
                  </span>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Order Lines
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Analytic Account</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Tax Rate (%)</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {soDetail.lines?.map((line, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-medium text-gray-900">
                            {line.product?.name}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {line.analyticAccount ? (
                              <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[11px]">
                                {line.analyticAccount.name}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-gray-800">
                            {line.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700">
                            ₹{Number(line.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right text-gray-700">
                            {Number(line.taxRate)}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-gray-900">
                            ₹{Number(line.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Untaxed Subtotal:</span>
                    <span>₹{Number(soDetail.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Taxes:</span>
                    <span>₹{Number(soDetail.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Order Value:</span>
                    <span className="text-[#714B67]">
                      ₹{Number(soDetail.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetailSOId(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Sales Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">New Sales Order</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Create quotation or confirm customer order</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="m-6 mb-0 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Customer *
                    </label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => setFormData({ ...formData, customerId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    >
                      <option value={0} disabled>Select Customer</option>
                      {customers?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Order Date *
                    </label>
                    <input
                      type="date"
                      value={formData.soDate}
                      onChange={(e) => setFormData({ ...formData, soDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    />
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Product Lines
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="flex items-center gap-1 text-xs font-semibold text-[#714B67] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Line
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 w-52">Product</th>
                          <th className="py-2.5 px-3 w-48">Analytic Account</th>
                          <th className="py-2.5 px-3 w-20 text-right">Quantity</th>
                          <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 w-24 text-right">Tax (%)</th>
                          <th className="py-2.5 px-3 w-28 text-right">Total</th>
                          <th className="py-2.5 px-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.lines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2">
                              <select
                                value={line.productId}
                                onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs"
                                required
                              >
                                <option value={0} disabled>Select Product</option>
                                {products?.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <select
                                value={line.analyticAccountId || ''}
                                onChange={(e) => handleLineChange(idx, 'analyticAccountId', e.target.value ? Number(e.target.value) : null)}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs"
                              >
                                <option value="">None</option>
                                {analytics?.map((an) => (
                                  <option key={an.id} value={an.id}>{an.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min={1}
                                value={line.quantity}
                                onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs text-right"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                value={line.unitPrice}
                                onChange={(e) => handleLineChange(idx, 'unitPrice', Number(e.target.value))}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs text-right"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
                                value={line.taxRate}
                                onChange={(e) => handleLineChange(idx, 'taxRate', Number(e.target.value))}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs text-right"
                              />
                            </td>
                            <td className="p-2 text-right font-semibold text-gray-900">
                              ₹{(
                                Number(line.quantity) * Number(line.unitPrice) * (1 + Number(line.taxRate || 0) / 100)
                              ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(idx)}
                                disabled={formData.lines.length === 1}
                                className="text-gray-400 hover:text-rose-600 disabled:opacity-30"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-gray-600">
                      <span>Untaxed:</span>
                      <span className="font-semibold">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>GST Taxes:</span>
                      <span className="font-semibold">₹{totals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total Amount:</span>
                      <span className="text-[#714B67]">₹{totals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Sales Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
