import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  CustomerInvoice, 
  Contact, 
  Product, 
  Account, 
  Journal, 
  AnalyticAccount, 
  InvoiceStatus, 
  PaymentMethod 
} from '../../types';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  CreditCard, 
  ArrowRight, 
  X, 
  AlertCircle, 
  Calendar, 
  Building2, 
  Printer, 
  Download 
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../../components/ui/Pagination';

export const CustomerInvoicesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [detailInvoiceId, setDetailInvoiceId] = useState<number | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);
  
  const { isAdmin } = useAuth() || { isAdmin: false };

  // Direct Invoice Form State
  const [formData, setFormData] = useState({
    customerId: 0,
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    journalId: 0,
    reference: '',
    paymentTerms: 'Immediate / 15 Days',
    lines: [
      {
        productId: 0,
        description: '',
        accountId: 0,
        analyticAccountId: null as number | null,
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
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

  // Fetch Invoices
  const { data: invoices, isLoading } = useQuery<CustomerInvoice[]>({
    queryKey: ['customer-invoices', debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await api.get('/invoices', {
        params: {
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
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

  // Single Invoice Detail
  const { data: invoiceDetail } = useQuery<CustomerInvoice>({
    queryKey: ['customer-invoice', detailInvoiceId],
    queryFn: async () => {
      if (!detailInvoiceId) return null;
      const res = await api.get(`/invoices/${detailInvoiceId}`);
      return res.data.data;
    },
    enabled: !!detailInvoiceId,
  });

  // Create Invoice Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/invoices', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      setModalOpen(false);
      setError(null);
      setDetailInvoiceId(data.data.id);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create customer invoice.');
    },
  });

  // Post Invoice Mutation
  const postMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/invoices/${id}/post`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoice', detailInvoiceId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to post customer invoice.');
    },
  });

  // Update Invoice Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: any }) => {
      const res = await api.put(`/invoices/${id}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoice', detailInvoiceId] });
      setModalOpen(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to update customer invoice.');
    },
  });

  // Submit Approval Mutation
  const submitApprovalMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/invoices/${id}/submit-approval`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoice', detailInvoiceId] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to submit customer invoice for approval.');
    },
  });

  // Register Payment Mutation
  const payMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/payments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['customer-invoice', detailInvoiceId] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPaymentModalOpen(false);
      alert('Payment received and allocated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to record customer payment.');
    },
  });

  const handleAddLine = () => {
    const defaultAccount = accounts?.find(a => a.type === 'INCOME');
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
          taxRate: 18,
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

  const openNewInvoiceModal = () => {
    const defaultCust = customers && customers.length > 0 ? customers[0].id : 0;
    const salesJournal = journals?.find(j => j.type === 'SALES') || journals?.[0];
    const incomeAccount = accounts?.find(a => a.type === 'INCOME') || accounts?.[0];
    const defaultProd = products && products.length > 0 ? products[0] : null;

    setFormData({
      customerId: defaultCust,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      journalId: salesJournal ? salesJournal.id : 0,
      reference: '',
      paymentTerms: 'Immediate / 15 Days',
      lines: [
        {
          productId: defaultProd ? defaultProd.id : 0,
          description: defaultProd ? defaultProd.name : '',
          accountId: incomeAccount ? incomeAccount.id : 0,
          analyticAccountId: null,
          quantity: 1,
          unitPrice: defaultProd ? Number(defaultProd.salesPrice) : 0,
          taxRate: 18,
        },
      ],
    });
    setError(null);
    setIsEditMode(false);
    setModalOpen(true);
  };

  const openEditDialog = (inv: CustomerInvoice) => {
    setFormData({
      customerId: inv.customerId,
      invoiceDate: new Date(inv.invoiceDate).toISOString().split('T')[0],
      dueDate: new Date(inv.dueDate).toISOString().split('T')[0],
      journalId: inv.journalId,
      reference: inv.reference || '',
      paymentTerms: inv.paymentTerms || '',
      lines: (inv.lines || []).map((l: any) => ({
        productId: l.productId,
        description: l.description || '',
        accountId: l.accountId,
        analyticAccountId: l.analyticAccountId || null,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRate: l.taxRate,
      })),
    });
    setError(null);
    setIsEditMode(true);
    setDetailInvoiceId(inv.id);
    setModalOpen(true);
  };

  const openPaymentDialog = (inv: CustomerInvoice) => {
    const bankJournal = journals?.find(j => j.type === 'BANK') || journals?.[0];
    setPaymentData({
      journalId: bankJournal ? bankJournal.id : 0,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: Number(inv.amountDue),
      paymentMethod: 'BANK',
      reference: `Receipt for ${inv.invoiceNumber}`,
      notes: '',
    });
    setPaymentModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.lines.length === 0) {
      setError('At least one line item is required.');
      return;
    }
    
    if (isEditMode && detailInvoiceId) {
      updateMutation.mutate({ id: detailInvoiceId, payload: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceDetail) return;
    payMutation.mutate({
      type: 'CUSTOMER',
      partnerId: invoiceDetail.customerId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      journalId: paymentData.journalId,
      paymentDate: paymentData.paymentDate,
      reference: paymentData.reference,
      notes: paymentData.notes,
      customerInvoiceId: invoiceDetail.id,
    });
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">Draft</span>;
      case 'PENDING_APPROVAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">Pending Approval</span>;
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
            <FileText className="w-7 h-7 text-[#714B67]" />
            Customer Invoices
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage client billing, post to General Ledger, and track receivables & collections
          </p>
        </div>

        <button
          onClick={openNewInvoiceModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#714B67] hover:bg-[#5a3b52] text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Create Direct Invoice
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice number, customer, or reference..."
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

      {/* Main Invoices Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500">Loading customer invoices...</div>
        ) : !invoices || invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No customer invoices found</p>
            <p className="text-gray-400 text-sm mt-1">
              Create a direct invoice or convert a confirmed Sales Order
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Invoice Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Source SO</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Amount Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(invoices?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setDetailInvoiceId(inv.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-[#714B67]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-800">
                      {inv.customer?.name}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.salesOrder ? (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono">
                          {inv.salesOrder.soNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Direct</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      ₹{Number(inv.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-rose-600">
                      ₹{Number(inv.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(inv.status)}</td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetailInvoiceId(inv.id)}
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
        {invoices && invoices.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={invoices.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Invoice Detail Modal / Drawer */}
      {detailInvoiceId && invoiceDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{invoiceDetail.invoiceNumber}</h2>
                    {getStatusBadge(invoiceDetail.status)}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customer: <span className="font-medium text-gray-700">{invoiceDetail.customer?.name}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(invoiceDetail.status === 'DRAFT' || (invoiceDetail.status === 'PENDING_APPROVAL' && isAdmin)) && (
                  <button
                    onClick={() => {
                      setDetailInvoiceId(null);
                      openEditDialog(invoiceDetail);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    Edit
                  </button>
                )}

                {invoiceDetail.status === 'DRAFT' && (
                  <button
                    onClick={() => submitApprovalMutation.mutate(invoiceDetail.id)}
                    disabled={submitApprovalMutation.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    {submitApprovalMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                )}

                {(invoiceDetail.status === 'PENDING_APPROVAL' || invoiceDetail.status === 'DRAFT') && isAdmin && (
                  <button
                    onClick={() => postMutation.mutate(invoiceDetail.id)}
                    disabled={postMutation.isPending}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {postMutation.isPending ? 'Posting...' : 'Post to Ledger'}
                  </button>
                )}

                {(invoiceDetail.status === 'POSTED' || invoiceDetail.status === 'PARTIALLY_PAID') && (
                  <button
                    onClick={() => openPaymentDialog(invoiceDetail)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    Register Payment
                  </button>
                )}

                <button
                  onClick={() => window.print()}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setDetailInvoiceId(null)}
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
                  <span className="text-gray-400 block mb-1">Invoice Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(invoiceDetail.invoiceDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Due Date</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(invoiceDetail.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Journal</span>
                  <span className="font-semibold text-gray-800">
                    {invoiceDetail.journal?.name} ({invoiceDetail.journal?.code})
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-1">Reference</span>
                  <span className="font-semibold text-gray-800">
                    {invoiceDetail.reference || 'None'}
                  </span>
                </div>
              </div>

              {/* Accounting Traceability Alert */}
              {invoiceDetail.journalEntry && (
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs text-purple-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-700" />
                    <span>
                      Posted to General Ledger Entry:{' '}
                      <strong className="font-mono">{invoiceDetail.journalEntry.entryNumber}</strong> (Balanced Dr = Cr)
                    </span>
                  </div>
                  <span className="text-purple-700 font-medium">Verified Double-Entry</span>
                </div>
              )}

              {/* Invoice Lines Table */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                  Invoice Lines
                </h3>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Income Account</th>
                        <th className="py-2.5 px-3">Analytic Account</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Tax (%)</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoiceDetail.lines?.map((line, idx) => (
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
              {invoiceDetail.allocations && invoiceDetail.allocations.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Payment Receipts
                  </h3>
                  <div className="space-y-1.5">
                    {invoiceDetail.allocations.map((alloc) => (
                      <div
                        key={alloc.id}
                        className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs"
                      >
                        <span className="text-emerald-800 font-medium">
                          Allocated from Receipt Payment #{alloc.paymentId}
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
                    <span>Subtotal (Untaxed):</span>
                    <span>₹{Number(invoiceDetail.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Output GST Tax:</span>
                    <span>₹{Number(invoiceDetail.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                    <span>Invoice Total:</span>
                    <span className="text-[#714B67]">
                      ₹{Number(invoiceDetail.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-medium text-emerald-600">
                    <span>Total Received:</span>
                    <span>₹{Number(invoiceDetail.paidAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-rose-600 pt-1 border-t border-dashed border-gray-200">
                    <span>Balance Due:</span>
                    <span>₹{Number(invoiceDetail.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                onClick={() => setDetailInvoiceId(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Invoice Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#714B67]/10 text-[#714B67] rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{isEditMode ? 'Edit Customer Invoice' : 'New Customer Invoice'}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{isEditMode ? 'Edit direct billing details for customer' : 'Enter direct billing details for customer'}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
                      Invoice Date *
                    </label>
                    <input
                      type="date"
                      value={formData.invoiceDate}
                      onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    />
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
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Sales Journal *
                    </label>
                    <select
                      value={formData.journalId}
                      onChange={(e) => setFormData({ ...formData, journalId: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#714B67]"
                      required
                    >
                      {journals?.filter(j => j.type === 'SALES').map((j) => (
                        <option key={j.id} value={j.id}>{j.name} ({j.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Reference / PO Ref
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CUST-PO-4481"
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
                      placeholder="e.g. 15 Days"
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
                      Invoice Lines
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
                          <th className="py-2.5 px-3 w-40">Income Account</th>
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
                                {accounts?.filter(a => a.type === 'INCOME' || a.type === 'LIABILITY' || a.type === 'ASSET').map((a) => (
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
                  {createMutation.isPending ? 'Saving...' : 'Save Draft Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Registration Modal */}
      {paymentModalOpen && invoiceDetail && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Record Customer Payment</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Received from {invoiceDetail.customer?.name}</p>
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
                  Payment Mode
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
                  Deposit Account / Journal *
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
                    Amount Received (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(invoiceDetail.amountDue)}
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#714B67]"
                    required
                  />
                  <span className="text-[10px] text-gray-400">
                    Max due: ₹{Number(invoiceDetail.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
                  Transaction / UTR #
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
                  {payMutation.isPending ? 'Processing...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
