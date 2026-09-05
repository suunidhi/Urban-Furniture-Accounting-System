import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { 
  VendorBill, 
  Contact, 
  Product, 
  Account, 
  Journal, 
  AnalyticAccount, 
  InvoiceStatus, 
  PaymentMethod 
} from '../../types';
import { 
  Receipt, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  X, 
  AlertCircle, 
  Calendar, 
  Building2, 
  DollarSign, 
  Layers 
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export const VendorBillsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailBillId, setDetailBillId] = useState<number | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Direct Bill Form State
  const [formData, setFormData] = useState({
    vendorId: 0,
    billDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    journalId: 0,
    reference: '',
    paymentTerms: '30 Days',
    lines: [
      {
        productId: 0,
        description: '',
        accountId: 0,
        analyticAccountId: null as number | null,
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
      },
    ],
  });

  // Payment Form State
  const [paymentData, setPaymentData] = useState({
    journalId: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: 'BANK' as PaymentMethod,
    reference: '',
    notes: '',
  });

  // Fetch Bills
  const { data: bills, isLoading } = useQuery<VendorBill[]>({
    queryKey: ['vendor-bills', debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await api.get('/vendor-bills', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      return res.data.data;
    },
  });

  // Fetch Vendors
  const { data: vendors } = useQuery<Contact[]>({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      const res = await api.get('/contacts', { params: { type: 'VENDOR' } });
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

  // Fetch Accounts
  const { data: accounts } = useQuery<Account[]>({
    queryKey: ['accounts-list'],
    queryFn: async () => {
      const res = await api.get('/accounts');
      return res.data.data;
    },
  });

  // Fetch Journals
  const { data: journals } = useQuery<Journal[]>({
    queryKey: ['journals-list'],
    queryFn: async () => {
      const res = await api.get('/journals');
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

  // Single Bill Detail
  const { data: billDetail } = useQuery<VendorBill>({
    queryKey: ['vendor-bill', detailBillId],
    queryFn: async () => {
      if (!detailBillId) return null;
      const res = await api.get(`/vendor-bills/${detailBillId}`);
      return res.data.data;
    },
    enabled: !!detailBillId,
  });

  // Create Bill Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/vendor-bills', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      setModalOpen(false);
      setError(null);
      setDetailBillId(data.data.id);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create vendor bill.');
    },
  });

  // Post Bill Mutation
  const postMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/vendor-bills/${id}/post`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bill', detailBillId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to post bill.');
    },
  });

  // Register Payment Mutation
  const payMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/payments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bill', detailBillId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPaymentModalOpen(false);
      alert('Payment registered and allocated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to register payment.');
    },
  });

  const handleAddLine = () => {
    const defaultAccount = accounts?.find(a => a.type === 'EXPENSE');
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        {
          productId: products && products.length > 0 ? products[0].id : 0,
          description: '',
          accountId: defaultAccount ? defaultAccount.id : (accounts?.[0]?.id || 0),
          analyticAccountId: null,
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
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
      updatedLines[index].unitPrice = Number(selectedProd.costPrice);
      updatedLines[index].description = selectedProd.name;
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
    let taxTotal = 0;
    formData.lines.forEach((l) => {
      const lineSub = Number(l.quantity) * Number(l.unitPrice);
      const lineTax = (lineSub * Number(l.taxRate || 0)) / 100;
      subtotal += lineSub;
      taxTotal += lineTax;
    });
    return { subtotal, taxTotal, total: subtotal + taxTotal };
  };

  const openNewBillModal = () => {
    const defaultVendor = vendors && vendors.length > 0 ? vendors[0].id : 0;
    const purchaseJournal = journals?.find(j => j.type === 'PURCHASE') || journals?.[0];
    const expenseAccount = accounts?.find(a => a.type === 'EXPENSE') || accounts?.[0];
    const defaultProd = products && products.length > 0 ? products[0] : null;

    setFormData({
      vendorId: defaultVendor,
      billDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      journalId: purchaseJournal ? purchaseJournal.id : 0,
      reference: '',
      paymentTerms: '30 Days',
      lines: [
        {
          productId: defaultProd ? defaultProd.id : 0,
          description: defaultProd ? defaultProd.name : '',
          accountId: expenseAccount ? expenseAccount.id : 0,
          analyticAccountId: null,
          quantity: 1,
          unitPrice: defaultProd ? Number(defaultProd.costPrice) : 0,
          taxRate: 0,
        },
      ],
    });
    setError(null);
    setModalOpen(true);
  };

  const openPaymentDialog = (bill: VendorBill) => {
    const bankJournal = journals?.find(j => j.type === 'BANK') || journals?.[0];
    setPaymentData({
      journalId: bankJournal ? bankJournal.id : 0,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: Number(bill.amountDue),
      paymentMethod: 'BANK',
      reference: `Payment for ${bill.billNumber}`,
      notes: '',
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billDetail) return;
    payMutation.mutate({
      type: 'VENDOR',
      partnerId: billDetail.vendorId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      journalId: paymentData.journalId,
      paymentDate: paymentData.paymentDate,
      reference: paymentData.reference,
      notes: paymentData.notes,
      vendorBillId: billDetail.id,
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Draft</span>;
      case 'POSTED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Posted</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Partially Paid</span>;
      case 'PAID':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Paid</span>;
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
            <Receipt className="w-7 h-7 text-[#714B67]" />
            Vendor Bills
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage incoming supplier bills, post to General Ledger, and track payments
          </p>
        </div>

        <button
          onClick={openNewBillModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Direct Bill
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by bill number, vendor, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#714B67]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {['ALL', 'DRAFT', 'POSTED', 'PARTIALLY_PAID', 'PAID'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-[#714B67] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bills Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading vendor bills...</div>
        ) : !bills || bills.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No vendor bills found</p>
            <p className="text-gray-400 text-sm mt-1">
              Create a direct bill or convert an approved Purchase Order
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Bill Number</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Bill Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Source PO</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Amount Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bills.map((bill) => (
                  <tr
                    key={bill.id}
                    onClick={() => setDetailBillId(bill.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#714B67]">
                      {bill.billNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {bill.vendor?.name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {new Date(bill.billDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {new Date(bill.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {bill.purchaseOrder ? (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                          {bill.purchaseOrder.poNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Direct</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      ₹{Number(bill.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-rose-600">
                      ₹{Number(bill.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(bill.status)}</td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailBillId(bill.id)}
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

      {/* Bill Detail Modal / Drawer */}
      {detailBillId && billDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{billDetail.billNumber}</h2>
                    {getStatusBadge(billDetail.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Vendor: <span className="font-medium text-gray-700">{billDetail.vendor?.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {billDetail.status === 'DRAFT' && (
                  <button
                    onClick={() => postMutation.mutate(billDetail.id)}
                    disabled={postMutation.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {postMutation.isPending ? 'Posting...' : 'Post to Ledger'}
                  </button>
                )}

                {(billDetail.status === 'POSTED' || billDetail.status === 'PARTIALLY_PAID') && (
                  <button
                    onClick={() => openPaymentDialog(billDetail)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Register Payment
                  </button>
                )}

                <button
                  onClick={() => setDetailBillId(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block mb-1">Bill Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(billDetail.billDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Due Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(billDetail.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Journal</span>
                  <span className="font-semibold text-gray-800">
                    {billDetail.journal?.name} ({billDetail.journal?.code})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Reference</span>
                  <span className="font-semibold text-gray-800">
                    {billDetail.reference || 'None'}
                  </span>
                </div>
              </div>

              {/* Accounting Traceability Alert */}
              {billDetail.journalEntry && (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    <span>
                      Posted to General Ledger Entry:{' '}
                      <strong className="font-mono">{billDetail.journalEntry.entryNumber}</strong> (Balanced Dr = Cr)
                    </span>
                  </div>
                  <span className="text-purple-700 font-medium">Verified Double-Entry</span>
                </div>
              )}

              {/* Bill Items Table */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Bill Lines
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Expense Account</th>
                        <th className="py-2.5 px-3">Analytic Account</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Tax (%)</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {billDetail.lines?.map((line, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-medium text-gray-900">
                            {line.product?.name || line.description}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600">
                            {line.account?.name} ({line.account?.code})
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

              {/* Payments History */}
              {billDetail.allocations && billDetail.allocations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Payment Allocations
                  </h3>
                  <div className="space-y-1.5">
                    {billDetail.allocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs"
                      >
                        <span className="text-emerald-800 font-medium">
                          Allocated from Payment #{alloc.paymentId}
                        </span>
                        <span className="font-bold text-emerald-900">
                          ₹{Number(alloc.amountAllocated).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Block */}
              <div className="flex justify-end pt-4 border-t border-gray-100">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span>₹{Number(billDetail.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Tax:</span>
                    <span>₹{Number(billDetail.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Total Amount:</span>
                    <span className="text-[#714B67]">
                      ₹{Number(billDetail.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-emerald-600">
                    <span>Paid to Date:</span>
                    <span>₹{Number(billDetail.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t border-dashed border-gray-200">
                    <span>Amount Due:</span>
                    <span>₹{Number(billDetail.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetailBillId(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Bill Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">New Vendor Bill</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Enter vendor invoice details directly</p>
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
                {/* Header Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Vendor *
                    </label>
                    <select
                      value={formData.vendorId}
                      onChange={(e) => setFormData({ ...formData, vendorId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    >
                      <option value={0} disabled>Select Vendor</option>
                      {vendors?.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Bill Date *
                    </label>
                    <input
                      type="date"
                      value={formData.billDate}
                      onChange={(e) => setFormData({ ...formData, billDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    >
                    </input>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    >
                    </input>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Purchase Journal *
                    </label>
                    <select
                      value={formData.journalId}
                      onChange={(e) => setFormData({ ...formData, journalId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    >
                      {journals?.filter(j => j.type === 'PURCHASE').map((j) => (
                        <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Vendor Reference / Invoice #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AZ-99201"
                      value={formData.reference}
                      onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Payment Terms
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 30 Days"
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                    />
                  </div>
                </div>

                {/* Line Items Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Lines
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddLine}
                      className="flex items-center gap-1 text-xs font-semibold text-[#714B67] hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Product Line
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-xl overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3 w-44">Product</th>
                          <th className="py-2.5 px-3 w-40">Expense Account</th>
                          <th className="py-2.5 px-3 w-36">Analytic Account</th>
                          <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                          <th className="py-2.5 px-3 w-28 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 w-20 text-right">Tax (%)</th>
                          <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
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
                                value={line.accountId}
                                onChange={(e) => handleLineChange(idx, 'accountId', Number(e.target.value))}
                                className="w-full p-1.5 border border-gray-200 rounded text-xs"
                                required
                              >
                                {accounts?.filter(a => a.type === 'EXPENSE' || a.type === 'OTHER_EXPENSE' || a.type === 'ASSET').map((a) => (
                                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
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
                              ₹{(Number(line.quantity) * Number(line.unitPrice)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

                {/* Calculation Box */}
                <div className="flex justify-end">
                  <div className="w-72 space-y-1.5 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between text-gray-600">
                      <span>Untaxed Amount:</span>
                      <span className="font-semibold">₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Taxes:</span>
                      <span className="font-semibold">₹{totals.taxTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span className="text-[#714B67]">₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
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
                  {createMutation.isPending ? 'Saving...' : 'Save Draft Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Registration Modal */}
      {paymentModalOpen && billDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Register Payment</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Pay {billDetail.vendor?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['BANK', 'CASH'] as PaymentMethod[]).map((method) => (
                    <button
                      type="button"
                      key={method}
                      onClick={() => setPaymentData({ ...paymentData, paymentMethod: method })}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        paymentData.paymentMethod === method
                          ? 'border-[#714B67] bg-[#714B67]/5 text-[#714B67]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Journal *
                </label>
                <select
                  value={paymentData.journalId}
                  onChange={(e) => setPaymentData({ ...paymentData, journalId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                  required
                >
                  {journals?.filter(j => j.type === paymentData.paymentMethod).map((j) => (
                    <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(billDetail.amountDue)}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                    required
                  />
                  <span className="text-[10px] text-gray-400">
                    Max due: ₹{Number(billDetail.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reference / Cheque #
                </label>
                <input
                  type="text"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payMutation.isPending}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {payMutation.isPending ? 'Processing...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
