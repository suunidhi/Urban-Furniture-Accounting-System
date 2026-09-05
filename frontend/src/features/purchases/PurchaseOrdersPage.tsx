import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { PurchaseOrder, Contact, Product, AnalyticAccount, OrderStatus } from '../../types';
import { 
  Truck, 
  Plus, 
  Search, 
  Trash2, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  AlertCircle,
  Clock,
  Check
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

export const PurchaseOrdersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailPOId, setDetailPOId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    vendorId: 0,
    poDate: new Date().toISOString().split('T')[0],
    paymentTerms: '30 Days',
    notes: '',
    lines: [
      { productId: 0, analyticAccountId: null as number | null, quantity: 1, unitPrice: 0 },
    ],
  });

  // Fetch POs
  const { data: pos, isLoading } = useQuery<PurchaseOrder[]>({
    queryKey: ['purchase-orders', debouncedSearch],
    queryFn: async () => {
      const res = await api.get('/purchases', { params: { search: debouncedSearch || undefined } });
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

  // Fetch Analytics
  const { data: analytics } = useQuery<AnalyticAccount[]>({
    queryKey: ['analytics-list'],
    queryFn: async () => {
      const res = await api.get('/analytics');
      return res.data.data;
    },
  });

  // Single PO detail
  const { data: poDetail } = useQuery<PurchaseOrder>({
    queryKey: ['purchase-order', detailPOId],
    queryFn: async () => {
      if (!detailPOId) return null;
      const res = await api.get(`/purchases/${detailPOId}`);
      return res.data.data;
    },
    enabled: !!detailPOId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/purchases', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setModalOpen(false);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Failed to create PO.');
    },
  });

  // Confirm mutation
  const confirmMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/purchases/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-order', detailPOId] });
    },
  });

  // Convert to Bill mutation
  const convertMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/purchases/${id}/convert-to-bill`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-bills'] });
      setDetailPOId(null);
      alert(`Vendor Bill ${data.data.billNumber} created successfully! You can find it under Purchases > Vendor Bills.`);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Could not convert to Vendor Bill.');
    },
  });

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [
        ...formData.lines,
        { productId: products && products.length > 0 ? products[0].id : 0, analyticAccountId: null, quantity: 1, unitPrice: 0 },
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
    }
    setFormData({ ...formData, lines: updatedLines });
  };

  const handleLineChange = (index: number, field: string, val: any) => {
    const updatedLines = [...formData.lines];
    (updatedLines[index] as any)[field] = val;
    setFormData({ ...formData, lines: updatedLines });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendorId && vendors && vendors.length > 0) {
      formData.vendorId = vendors[0].id;
    }
    createMutation.mutate(formData);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="badge-gray">Draft</span>;
      case 'CONFIRMED':
        return <span className="badge-teal">Confirmed</span>;
      case 'BILLED':
        return <span className="badge-purple">Billed (Converted)</span>;
      case 'CANCELLED':
        return <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-semibold">Cancelled</span>;
    }
  };

  const orderTotal = formData.lines.reduce(
    (sum, l) => sum + Number(l.quantity || 0) * Number(l.unitPrice || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#2F2F2F] tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#714B67]" />
            Purchase Orders
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Create vendor procurement orders, line item pricing, and convert directly to Vendor Bills.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            if (vendors && vendors.length > 0 && !formData.vendorId) {
              setFormData((prev) => ({ ...prev, vendorId: vendors[0].id }));
            }
            if (products && products.length > 0 && formData.lines[0].productId === 0) {
              formData.lines[0].productId = products[0].id;
              formData.lines[0].unitPrice = Number(products[0].costPrice);
            }
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          New Purchase Order
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search PO Number, Vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">PO Number</th>
                <th className="py-3 px-4">Vendor</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : !pos || pos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                pos.map((po) => (
                  <tr
                    key={po.id}
                    onClick={() => setDetailPOId(po.id)}
                    className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#714B67]">{po.poNumber}</td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{po.vendor?.name}</td>
                    <td className="py-3 px-4 text-xs text-gray-600">
                      {new Date(po.poDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600">{po.paymentTerms || '30 Days'}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                      ₹{Number(po.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(po.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailPOId(po.id);
                        }}
                        className="text-xs text-[#714B67] hover:underline font-semibold"
                      >
                        Open Form View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Order Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full border border-[#E5E7EB] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#714B67]" />
                New Purchase Order Form
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm flex-1 overflow-y-auto">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Vendor (Contact Master) *
                  </label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => setFormData({ ...formData, vendorId: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  >
                    {vendors?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    PO Date
                  </label>
                  <input
                    type="date"
                    value={formData.poDate}
                    onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                    placeholder="30 Days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
                    Order Line Items
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-[#714B67] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Line
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F9FA] text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Budget Analytic</th>
                        <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                        <th className="py-2.5 px-3 w-32 text-right">Unit Price (₹)</th>
                        <th className="py-2.5 px-3 w-32 text-right">Line Total (₹)</th>
                        <th className="py-2.5 px-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {formData.lines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={line.productId}
                              onChange={(e) => handleProductChange(idx, parseInt(e.target.value, 10))}
                              className="w-full p-1.5 border border-gray-300 rounded text-xs"
                            >
                              {products?.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <select
                              value={line.analyticAccountId || ''}
                              onChange={(e) =>
                                handleLineChange(
                                  idx,
                                  'analyticAccountId',
                                  e.target.value ? parseInt(e.target.value, 10) : null
                                )
                              }
                              className="w-full p-1.5 border border-gray-300 rounded text-xs"
                            >
                              <option value="">None</option>
                              {analytics?.map((an) => (
                                <option key={an.id} value={an.id}>
                                  {an.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handleLineChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                              className="w-full text-center p-1.5 border border-gray-300 rounded text-xs"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.unitPrice}
                              onChange={(e) => handleLineChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                              className="w-full text-right p-1.5 border border-gray-300 rounded text-xs font-mono"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-gray-900">
                            ₹{(Number(line.quantity) * Number(line.unitPrice)).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              disabled={formData.lines.length === 1}
                              className="text-gray-400 hover:text-red-600 disabled:opacity-30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex justify-end">
                  <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 text-right">
                    <span className="text-xs text-gray-500 font-medium">Order Total:</span>
                    <div className="text-lg font-bold font-mono text-gray-900">
                      ₹{orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Saving...' : 'Save Draft PO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Detail View Modal */}
      {detailPOId && poDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full border border-[#E5E7EB] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Action Bar Header matching Excalidraw */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xl text-[#714B67]">{poDetail.poNumber}</span>
                {getStatusBadge(poDetail.status)}
              </div>
              <div className="flex items-center gap-2">
                {poDetail.status === 'DRAFT' && (
                  <button
                    onClick={() => confirmMutation.mutate(poDetail.id)}
                    disabled={confirmMutation.isPending}
                    className="btn-secondary text-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Confirm PO
                  </button>
                )}

                {poDetail.status === 'CONFIRMED' && (
                  <button
                    onClick={() => convertMutation.mutate(poDetail.id)}
                    disabled={convertMutation.isPending}
                    className="btn-primary text-xs"
                  >
                    <FileText className="w-3.5 h-3.5" /> Create Vendor Bill
                  </button>
                )}

                <button onClick={() => setDetailPOId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Information Body */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500">Vendor:</span>
                  <p className="font-bold text-gray-900 text-sm mt-0.5">{poDetail.vendor?.name}</p>
                  <p className="text-gray-600">{poDetail.vendor?.mobile || poDetail.vendor?.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">PO Date:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{new Date(poDetail.poDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Payment Terms:</span>
                  <p className="font-semibold text-gray-900 mt-0.5">{poDetail.paymentTerms || '30 Days'}</p>
                </div>
              </div>

              {/* Lines Table */}
              <div>
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-2">
                  Line Items
                </h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Budget Analytic</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-mono">
                      {poDetail.lines?.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2.5 px-3 font-sans font-semibold text-gray-900">{l.product?.name}</td>
                          <td className="py-2.5 px-3 font-sans text-gray-600">{l.analyticAccount?.name || '—'}</td>
                          <td className="py-2.5 px-3 text-center">{l.quantity}</td>
                          <td className="py-2.5 px-3 text-right">₹{Number(l.unitPrice).toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-gray-900">₹{Number(l.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end">
                  <div className="text-right">
                    <span className="text-xs text-gray-500">Total Purchase Value:</span>
                    <div className="text-xl font-bold font-mono text-[#714B67]">
                      ₹{Number(poDetail.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setDetailPOId(null)} className="btn-outline text-xs">
                Back to List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
