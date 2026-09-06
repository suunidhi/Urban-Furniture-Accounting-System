import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Product, ProductCategory, ProductType, RecordStatus, PaymentMethod } from '../../types';
import { 
  Package, 
  Plus, 
  Search, 
  LayoutList, 
  LayoutGrid, 
  Tag, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  X, 
  AlertCircle,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  Edit2,
  Archive,
  RotateCcw,
  DollarSign
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../../components/ui/Pagination';

export const ProductsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalProduct, setEditModalProduct] = useState<Product | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [detailModalProductId, setDetailModalProductId] = useState<number | null>(null);
  const [paymentModalTx, setPaymentModalTx] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCategory, statusFilter, viewMode]);

  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentMethod: 'BANK' as PaymentMethod,
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'GOODS' as ProductType,
    salesPrice: 0,
    costPrice: 0,
    categoryId: 0,
    imageUrl: '',
    paymentTerms: '30 Days',
    allowPartialPayment: true,
    defaultDueDate: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'GOODS' as ProductType,
    salesPrice: 0,
    costPrice: 0,
    categoryId: 0,
    imageUrl: '',
    paymentTerms: '30 Days',
    allowPartialPayment: true,
    defaultDueDate: '',
  });

  const [newCatName, setNewCatName] = useState('');

  // Fetch categories
  const { data: categories } = useQuery<ProductCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data.data;
    },
  });

  // Fetch products
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['products', selectedCategory, debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await api.get('/products', {
        params: {
          categoryId: selectedCategory !== 'ALL' ? selectedCategory : undefined,
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      return res.data.data;
    },
  });

  // Fetch single product details with stock metrics and related transactions
  const { data: productDetail } = useQuery<any>({
    queryKey: ['product', detailModalProductId],
    queryFn: async () => {
      if (!detailModalProductId) return null;
      const res = await api.get(`/products/${detailModalProductId}`);
      return res.data.data;
    },
    enabled: !!detailModalProductId,
  });

  // Create product mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/products', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setModalOpen(false);
      setFormData({
        name: '',
        type: 'GOODS',
        salesPrice: 0,
        costPrice: 0,
        categoryId: categories && categories.length > 0 ? categories[0].id : 0,
        imageUrl: '',
        paymentTerms: '30 Days',
        allowPartialPayment: true,
        defaultDueDate: '',
      });
      setError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create product.';
      setError(msg);
    },
  });

  // Admin Update Product mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: typeof editFormData }) => {
      const res = await api.put(`/products/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', detailModalProductId] });
      setEditModalProduct(null);
      setError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update product.';
      setError(msg);
    },
  });

  // Admin Toggle status (Archive / Restore) mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: RecordStatus }) => {
      const res = await api.patch(`/products/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update product status.');
    },
  });

  // Add partial payment (Add Money action) mutation
  const addPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/payments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', detailModalProductId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setPaymentModalTx(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to record payment.');
    },
  });

  const handleOpenEdit = (p: Product) => {
    setEditModalProduct(p);
    setEditFormData({
      name: p.name,
      type: p.type,
      salesPrice: Number(p.salesPrice) || 0,
      costPrice: Number(p.costPrice) || 0,
      categoryId: p.categoryId,
      imageUrl: p.imageUrl || '',
      paymentTerms: p.paymentTerms || '30 Days',
      allowPartialPayment: p.allowPartialPayment !== false,
      defaultDueDate: p.defaultDueDate ? new Date(p.defaultDueDate).toISOString().split('T')[0] : '',
    });
    setError(null);
  };

  const handleOpenPaymentModal = (tx: any) => {
    setPaymentModalTx(tx);
    setPaymentFormData({
      amount: Number(tx.amountDue) || 0,
      paymentMethod: 'BANK',
      paymentDate: new Date().toISOString().split('T')[0],
      reference: `PARTIAL-${tx.reference}`,
      notes: `Installment for ${tx.reference}`,
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalTx) return;

    const payload: any = {
      type: paymentModalTx.type,
      partnerId: paymentModalTx.partnerId,
      amount: Number(paymentFormData.amount),
      paymentMethod: paymentFormData.paymentMethod,
      paymentDate: paymentFormData.paymentDate,
      reference: paymentFormData.reference || undefined,
      notes: paymentFormData.notes || undefined,
    };

    if (paymentModalTx.type === 'CUSTOMER') {
      payload.invoiceId = paymentModalTx.id;
    } else {
      payload.billId = paymentModalTx.id;
    }

    addPaymentMutation.mutate(payload);
  };

  // Create on-the-fly category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/categories', { name });
      return res.data.data;
    },
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormData((prev) => ({ ...prev, categoryId: newCat.id }));
      setCategoryModalOpen(false);
      setNewCatName('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId && categories && categories.length > 0) {
      formData.categoryId = categories[0].id;
    }
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalProduct) return;
    updateMutation.mutate({ id: editModalProduct.id, payload: editFormData });
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#2F2F2F] tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#714B67]" />
            Products Master
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Furniture goods, combo packages, service assembly, sales prices, and purchase costs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#714B67] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="List View"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-[#714B67] text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setError(null);
              if (categories && categories.length > 0 && !formData.categoryId) {
                setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
              }
              setModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-[#F3EAF0] text-[#714B67] font-semibold border border-[#714B67]/30'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id.toString())}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id.toString()
                  ? 'bg-[#F3EAF0] text-[#714B67] font-semibold border border-[#714B67]/30'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs ml-0 sm:ml-2">
            {(['ACTIVE', 'ARCHIVED', 'ALL'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-[#714B67] font-bold shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {s === 'ACTIVE' ? 'Active' : s === 'ARCHIVED' ? 'Archived' : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]"
          />
        </div>
      </div>

      {/* Main View: List or Kanban */}
      {isLoading ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-lg border border-gray-200">
          Loading products...
        </div>
      ) : !products || products.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-lg border border-gray-200">
          No products found.
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Terms / Due Policy</th>
                <th className="py-3 px-4 text-right">Sales Price</th>
                <th className="py-3 px-4 text-right">Cost Price</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {(products?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setDetailModalProductId(p.id)}
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500">
                      <Package className="w-4 h-4 text-[#714B67]" />
                    </div>
                    <span>{p.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="badge-purple">{p.category?.name}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                      {p.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {p.type === 'GOODS' ? (
                      <span className={`font-mono font-semibold ${p.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {p.stockQuantity || 0}
                      </span>
                    ) : (
                      <span className="text-gray-400 font-mono">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {p.status === 'ARCHIVED' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        Archived
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-gray-800 font-medium">
                        {p.paymentTerms || '30 Days'}
                      </span>
                      {p.allowPartialPayment !== false ? (
                        <span className="text-[10px] text-emerald-700 font-medium">
                          Partial Payments: Enabled
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          Full Payment Only
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                    ₹{Number(p.salesPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-600">
                    ₹{Number(p.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetailModalProductId(p.id)}
                        className="text-xs text-[#714B67] hover:underline font-semibold"
                      >
                        Details & Settlement
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Product (Admin)"
                            className="p-1 text-gray-500 hover:text-[#714B67] rounded hover:bg-gray-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const newStatus = p.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
                              if (confirm(`Are you sure you want to ${newStatus === 'ARCHIVED' ? 'archive' : 'restore'} ${p.name}?`)) {
                                toggleStatusMutation.mutate({ id: p.id, status: newStatus });
                              }
                            }}
                            title={p.status === 'ACTIVE' ? 'Archive Product (Admin)' : 'Restore Product (Admin)'}
                            className={`p-1 rounded transition-colors ${
                              p.status === 'ACTIVE'
                                ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {(products?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((p) => (
            <div
              key={p.id}
              onClick={() => setDetailModalProductId(p.id)}
              className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm hover:border-[#714B67]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="badge-purple">{p.category?.name}</span>
                  <div className="flex items-center gap-1">
                    {p.status === 'ARCHIVED' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        Archived
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    )}
                    {isAdmin && (
                      <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          title="Edit Product (Admin)"
                          className="p-1 text-gray-400 hover:text-[#714B67] rounded hover:bg-gray-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = p.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
                            if (confirm(`Are you sure you want to ${newStatus === 'ARCHIVED' ? 'archive' : 'restore'} ${p.name}?`)) {
                              toggleStatusMutation.mutate({ id: p.id, status: newStatus });
                            }
                          }}
                          title={p.status === 'ACTIVE' ? 'Archive Product (Admin)' : 'Restore Product (Admin)'}
                          className={`p-1 rounded ${
                            p.status === 'ACTIVE'
                              ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {p.status === 'ACTIVE' ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#714B67]">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{p.name}</h3>
                    <span className="text-xs text-gray-500">{p.type}</span>
                  </div>
                </div>

                {p.type === 'GOODS' && (
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold px-2 py-1.5 rounded bg-gray-50 border border-gray-100">
                    <span className="text-gray-600">In Stock:</span>
                    <span className={`font-mono ${p.stockQuantity > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {p.stockQuantity || 0}
                    </span>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                  <span>Terms: <strong>{p.paymentTerms || '30 Days'}</strong></span>
                  <span className={p.allowPartialPayment !== false ? 'text-emerald-700 font-medium' : 'text-gray-400'}>
                    {p.allowPartialPayment !== false ? 'Partials: Yes' : 'Full Only'}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Sales Price:</span>
                    <div className="font-bold font-mono text-emerald-700 mt-0.5">
                      ₹{Number(p.salesPrice).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Cost:</span>
                    <div className="font-semibold font-mono text-gray-700 mt-0.5">
                      ₹{Number(p.costPrice).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {products && products.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={products.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create Product Modal - Exactly as Mockup Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#714B67]" />
                Product Master Form
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Office Chair, Wooden Table"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category (Many2One) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="text-xs text-[#017E84] hover:underline font-semibold"
                  >
                    + Create on-the-fly
                  </button>
                </div>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Product Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ProductType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="GOODS">Goods (Physical Furniture)</option>
                  <option value="SERVICE">Service (Assembly, Maintenance)</option>
                  <option value="COMBO">Combo Package</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Sales Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.salesPrice}
                    onChange={(e) => setFormData({ ...formData, salesPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 5000.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Cost / Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 3000.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
              </div>

              {/* Due Dates & Partial Payments Configuration */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#714B67]" />
                  Due Dates & Partial Payments Policy
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={formData.paymentTerms}
                      onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    >
                      <option value="Immediate Payment">Immediate Payment</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="45 Days">45 Days</option>
                      <option value="60 Days">60 Days</option>
                      <option value="Custom Due Date">Custom Due Date</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Default Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.defaultDueDate}
                      onChange={(e) => setFormData({ ...formData, defaultDueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={formData.allowPartialPayment}
                    onChange={(e) => setFormData({ ...formData, allowPartialPayment: e.target.checked })}
                    className="w-4 h-4 text-[#714B67] rounded border-gray-300 focus:ring-[#714B67]"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Enable Partial Payments & Installment Settlements for this Product
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal (Admin) */}
      {editModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#714B67]" />
                Edit Product Master
              </h2>
              <button onClick={() => setEditModalProduct(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4 text-sm">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={editFormData.categoryId}
                  onChange={(e) => setEditFormData({ ...editFormData, categoryId: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Product Type *
                </label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as ProductType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="GOODS">Goods (Physical Furniture)</option>
                  <option value="SERVICE">Service (Assembly, Maintenance)</option>
                  <option value="COMBO">Combo Package</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Sales Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editFormData.salesPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, salesPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Cost / Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editFormData.costPrice}
                    onChange={(e) => setEditFormData({ ...editFormData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
              </div>

              {/* Due Dates & Partial Payments Configuration */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#714B67]" />
                  Due Dates & Partial Payments Policy
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Payment Terms
                    </label>
                    <select
                      value={editFormData.paymentTerms}
                      onChange={(e) => setEditFormData({ ...editFormData, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    >
                      <option value="Immediate Payment">Immediate Payment</option>
                      <option value="15 Days">15 Days</option>
                      <option value="30 Days">30 Days</option>
                      <option value="45 Days">45 Days</option>
                      <option value="60 Days">60 Days</option>
                      <option value="Custom Due Date">Custom Due Date</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Default Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={editFormData.defaultDueDate}
                      onChange={(e) => setEditFormData({ ...editFormData, defaultDueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editFormData.allowPartialPayment}
                    onChange={(e) => setEditFormData({ ...editFormData, allowPartialPayment: e.target.checked })}
                    className="w-4 h-4 text-[#714B67] rounded border-gray-300 focus:ring-[#714B67]"
                  />
                  <span className="text-xs font-medium text-gray-700">
                    Enable Partial Payments & Installment Settlements for this Product
                  </span>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setEditModalProduct(null)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                  {updateMutation.isPending ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* On-The-Fly Category Creation Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full border border-[#E5E7EB] p-6">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Create Category on-the-fly</h3>
            <input
              type="text"
              placeholder="e.g. Wardrobes, Desks"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] mb-4"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newCatName.trim() || createCategoryMutation.isPending}
                onClick={() => createCategoryMutation.mutate(newCatName.trim())}
                className="btn-secondary"
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Stock & Financial Drilldown Modal */}
      {detailModalProductId && productDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full border border-[#E5E7EB] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{productDetail.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="badge-purple">{productDetail.category?.name}</span>
                  <span className="text-xs text-gray-500 font-medium">{productDetail.type}</span>
                  {productDetail.status === 'ARCHIVED' && (
                    <span className="px-2 py-0.2 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200">
                      Archived
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => setDetailModalProductId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs overflow-y-auto">
              {/* Pricing & Terms Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                  <span className="text-emerald-800 font-semibold uppercase tracking-wider text-[10px]">
                    Sales Price
                  </span>
                  <div className="text-xl font-bold font-mono text-emerald-950 mt-1">
                    ₹{Number(productDetail.salesPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <span className="text-[#714B67] font-semibold uppercase tracking-wider text-[10px]">
                    Purchase Cost
                  </span>
                  <div className="text-xl font-bold font-mono text-gray-900 mt-1">
                    ₹{Number(productDetail.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <span className="text-blue-800 font-semibold uppercase tracking-wider text-[10px]">
                    Settlement Terms
                  </span>
                  <div className="text-sm font-bold text-blue-950 mt-1">
                    {productDetail.paymentTerms || '30 Days'}
                  </div>
                  <span className="text-[10px] text-blue-700 block mt-0.5">
                    {productDetail.allowPartialPayment !== false ? '✓ Partial Payments Allowed' : 'Full Payment Only'}
                  </span>
                </div>
              </div>

              {/* Dynamic Stock Aggregation */}
              <div>
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-3">
                  Transaction Activity & Stock Aggregation
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Qty Purchased:</span>
                    <div className="text-lg font-bold text-gray-900 font-mono mt-1">
                      {productDetail.stockMetrics?.quantityPurchased || 0}
                    </div>
                    <span className="text-[10px] text-gray-400">From posted bills</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Qty Sold:</span>
                    <div className="text-lg font-bold text-gray-900 font-mono mt-1">
                      {productDetail.stockMetrics?.quantitySold || 0}
                    </div>
                    <span className="text-[10px] text-gray-400">From posted invoices</span>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                    <span className="text-gray-500">Current Stock:</span>
                    <div className="text-lg font-bold font-mono mt-1 text-[#017E84]">
                      {productDetail.stockMetrics?.currentStock || 0} units
                    </div>
                    <span className="text-[10px] text-gray-400">Purchased - Sold</span>
                  </div>
                </div>
              </div>

              {/* Due Dates & Partial Payments Tracking Table */}
              <div className="border-t border-gray-100 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#714B67]" />
                      Due Dates & Partial Payment Records
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Track payment maturity dates, installments, and add money until the full amount is settled.
                    </p>
                  </div>
                  {productDetail.allowPartialPayment !== false && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E6F4F4] text-[#017E84] border border-[#017E84]/20 self-start sm:self-auto">
                      Partial Settlements Active
                    </span>
                  )}
                </div>

                {!productDetail.relatedTransactions || productDetail.relatedTransactions.length === 0 ? (
                  <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 text-center text-gray-500">
                    <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium text-xs">No pending or completed transactions found for this product</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      When customer invoices or vendor bills containing this product are created, payment records appear here.
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                        <tr>
                          <th className="py-2.5 px-3">Document</th>
                          <th className="py-2.5 px-3">Partner</th>
                          <th className="py-2.5 px-3">Due Date</th>
                          <th className="py-2.5 px-3 text-right">Total</th>
                          <th className="py-2.5 px-3 text-right">Paid</th>
                          <th className="py-2.5 px-3 text-right">Amount Due</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productDetail.relatedTransactions.map((tx: any) => {
                          const isComplete = Number(tx.amountDue) <= 0.01;
                          const isOverdue = tx.dueDate && new Date(tx.dueDate).getTime() < Date.now() && !isComplete;
                          const progress = tx.totalAmount > 0 ? Math.min(100, Math.round((tx.paidAmount / tx.totalAmount) * 100)) : 100;

                          return (
                            <tr key={`${tx.type}-${tx.id}`} className="hover:bg-gray-50/70">
                              <td className="py-2.5 px-3 font-semibold text-gray-900">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[#714B67]">{tx.reference}</span>
                                  <span className="text-[10px] text-gray-400">
                                    ({tx.type === 'CUSTOMER' ? 'Sale' : 'Purchase'})
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-gray-700 font-medium">
                                {tx.partnerName}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-700">
                                    {tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : 'Immediate'}
                                  </span>
                                  {isOverdue && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      Overdue
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-gray-900 font-semibold">
                                ₹{Number(tx.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-medium">
                                ₹{Number(tx.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-bold">
                                ₹{Number(tx.amountDue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="space-y-1">
                                  {isComplete ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      <CheckCircle2 className="w-3 h-3" /> Complete
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      {progress > 0 ? `${progress}% Paid` : 'Unpaid'}
                                    </span>
                                  )}
                                  <div className="w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-1.5 rounded-full ${isComplete ? 'bg-emerald-500' : 'bg-[#714B67]'}`}
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {!isComplete ? (
                                  <button
                                    onClick={() => handleOpenPaymentModal(tx)}
                                    className="px-2.5 py-1 bg-[#714B67] hover:bg-[#5b3b53] text-white rounded text-[11px] font-bold shadow-xs transition-colors flex items-center gap-1 ml-auto"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add Money
                                  </button>
                                ) : (
                                  <span className="text-emerald-700 font-bold text-[11px] inline-flex items-center gap-0.5">
                                    ✓ Complete
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button onClick={() => setDetailModalProductId(null)} className="btn-outline text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Money (Partial Payment Installment) Modal */}
      {paymentModalTx && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#714B67]" />
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Add Installment / Money</h3>
                  <p className="text-[11px] text-gray-500">Document #{paymentModalTx.reference}</p>
                </div>
              </div>
              <button onClick={() => setPaymentModalTx(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4 text-xs">
              {/* Settlement Summary */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Partner:</span>
                  <span className="font-semibold text-gray-800">{paymentModalTx.partnerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Amount:</span>
                  <span className="font-mono font-semibold">₹{Number(paymentModalTx.totalAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Already Paid:</span>
                  <span className="font-mono font-semibold text-emerald-700">₹{Number(paymentModalTx.paidAmount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5">
                  <span className="font-bold text-gray-700">Remaining Balance:</span>
                  <span className="font-mono font-bold text-rose-700">₹{Number(paymentModalTx.amountDue).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Payment Amount to Add (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={paymentModalTx.amountDue}
                  required
                  value={paymentFormData.amount}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono font-bold text-gray-900 focus:ring-2 focus:ring-[#714B67] focus:outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Add any partial payment amount. The status marks "Complete" when the sum reaches total amount.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                  >
                    <option value="BANK">Bank Transfer</option>
                    <option value="CASH">Cash Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Reference / UTR / Cheque #
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-982173 or Cash Rcpt"
                  value={paymentFormData.reference}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setPaymentModalTx(null)} className="btn-outline text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addPaymentMutation.isPending || paymentFormData.amount <= 0}
                  className="btn-primary text-xs"
                >
                  {addPaymentMutation.isPending ? 'Posting Payment...' : 'Record Payment / Add Money'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
