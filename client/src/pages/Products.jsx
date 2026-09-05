import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, LayoutList, LayoutGrid, X, Package,
  Edit2, Archive, Upload, ChevronDown, Tag
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const SERVER = 'http://localhost:5000';
const PRODUCT_TYPES = ['goods', 'service', 'combo'];

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── Product Image ────────────────────────────────────────────────────────────
function ProductImage({ src, name, size = 'md' }) {
  const sz = size === 'lg' ? 'w-20 h-20' : size === 'sm' ? 'w-9 h-9' : 'w-12 h-12';
  if (src) return <img src={`${SERVER}${src}`} alt={name} className={clsx(sz, 'rounded-xl object-cover border border-gray-100 flex-shrink-0')} />;
  return (
    <div className={clsx(sz, 'rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0')}>
      <Package size={size === 'lg' ? 28 : size === 'sm' ? 14 : 20} className="text-slate-300" />
    </div>
  );
}

// ── Type Badge ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const colors = { goods: 'bg-green-100 text-green-700', service: 'bg-blue-100 text-blue-700', combo: 'bg-purple-100 text-purple-700' };
  return <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', colors[type] || 'bg-slate-100 text-slate-600')}>{type}</span>;
}

// ── Category Selector (with create on-the-fly) ───────────────────────────────
function CategorySelect({ value, onChange, categories, onNewCategory }) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await onNewCategory(newName.trim());
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-slate-600">Category</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select value={value} onChange={e => onChange(e.target.value)} className={inputCls}>
            <option value="">— No Category —</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button
          type="button"
          onClick={() => setCreating(!creating)}
          title="Create new category"
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-primary hover:bg-primary/5 transition-colors flex items-center gap-1"
        >
          <Tag size={12} /> New
        </button>
      </div>
      {creating && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
            className={clsx(inputCls, 'flex-1')}
            placeholder="Category name..."
          />
          <button type="button" onClick={handleCreate} className="px-3 py-2 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors">Add</button>
          <button type="button" onClick={() => setCreating(false)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Product Modal ────────────────────────────────────────────────────────────
function ProductModal({ product, categories, onClose, onSave, onNewCategory }) {
  const [form, setForm] = useState({
    name: product?.name || '',
    type: product?.type || 'goods',
    sales_price: product?.sales_price || '',
    cost_price: product?.cost_price || '',
    category_id: product?.category_id || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(product?.image ? `${SERVER}${product.image}` : null);
  const fileRef = useRef();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleImageChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (imageFile) fd.append('image', imageFile);
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-slate-800 text-lg">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image upload */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden hover:border-primary transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                : <div className="text-center"><Upload size={20} className="text-gray-300 mx-auto mb-1" /><p className="text-[10px] text-gray-400">Image</p></div>
              }
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Product Image</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 text-xs text-primary hover:underline">Choose file</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Product Name *</label>
            <input value={form.name} onChange={set('name')} required className={inputCls} placeholder="Product name" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Product Type</label>
            <div className="relative">
              <select value={form.type} onChange={set('type')} className={inputCls}>
                {PRODUCT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <CategorySelect
            value={form.category_id}
            onChange={(v) => setForm({ ...form, category_id: v })}
            categories={categories}
            onNewCategory={onNewCategory}
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sales Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" step="0.01" min="0" value={form.sales_price} onChange={set('sales_price')} className={clsx(inputCls, 'pl-7')} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cost</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input type="number" step="0.01" min="0" value={form.cost_price} onChange={set('cost_price')} className={clsx(inputCls, 'pl-7')} placeholder="0.00" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              {product ? 'Update Product' : 'Create Product'}
            </button>
            <button type="button" onClick={onClose} className="px-5 py-2.5 border border-gray-200 text-slate-600 rounded-xl text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Kanban Card ──────────────────────────────────────────────────────────────
function KanbanCard({ product, isAdmin, onEdit, onArchive }) {
  const margin = ((product.sales_price - product.cost_price) / (product.sales_price || 1) * 100).toFixed(0);
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <ProductImage src={product.image} name={product.name} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{product.name}</p>
          <TypeBadge type={product.type} />
          {product.category && (
            <p className="text-xs text-slate-400 mt-1">{product.category.name}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="text-slate-400">Sales Price</p>
          <p className="font-bold text-slate-800">{fmt(product.sales_price)}</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-2 text-center">
          <p className="text-slate-400">Cost</p>
          <p className="font-bold text-slate-800">{fmt(product.cost_price)}</p>
        </div>
      </div>
      {isAdmin && (
        <div className="flex gap-2 pt-1 border-t border-gray-50">
          <button onClick={() => onEdit(product)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
            <Edit2 size={12} /> Edit
          </button>
          <button onClick={() => onArchive(product.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Archive size={12} /> Archive
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function Products() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', filterType, search],
    queryFn: async () => (await api.get(`/products?type=${filterType}&search=${search}`)).data
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/product-categories')).data
  });

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries(['products']); setShowModal(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => api.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries(['products']); setEditProduct(null); }
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => api.patch(`/products/${id}/archive`),
    onSuccess: () => qc.invalidateQueries(['products'])
  });

  const newCategoryMutation = useMutation({
    mutationFn: (name) => api.post('/product-categories', { name }),
    onSuccess: () => qc.invalidateQueries(['categories'])
  });

  const handleSave = (fd) => {
    if (editProduct) updateMutation.mutate({ id: editProduct.id, fd });
    else createMutation.mutate(fd);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Products</h1>
          <p className="text-sm text-slate-500 mt-0.5">Goods, services and combinations</p>
        </div>
        <button
          onClick={() => { setEditProduct(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Search products..." />
        </div>

        <div className="relative">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white">
            <option value="all">All Types</option>
            {PRODUCT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* View Toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setView('list')} className={clsx('p-2 transition-colors', view === 'list' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-50')}>
            <LayoutList size={16} />
          </button>
          <button onClick={() => setView('kanban')} className={clsx('p-2 transition-colors', view === 'kanban' ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-50')}>
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <Package size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No products found. Click "New Product" to add one.</p>
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <KanbanCard
              key={p.id}
              product={p}
              isAdmin={isAdmin}
              onEdit={(prod) => { setEditProduct(prod); setShowModal(true); }}
              onArchive={(id) => { if (window.confirm('Archive this product?')) archiveMutation.mutate(id); }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th className="w-14 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Sales Price</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Cost</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <ProductImage src={p.image} name={p.name} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.category?.name || '—'}</td>
                  <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-800 text-right">{fmt(p.sales_price)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 text-right">{fmt(p.cost_price)}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditProduct(p); setShowModal(true); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => { if (window.confirm('Archive this product?')) archiveMutation.mutate(p.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Archive size={14} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {(showModal || editProduct) && (
        <ProductModal
          product={editProduct}
          categories={categories}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={handleSave}
          onNewCategory={(name) => newCategoryMutation.mutateAsync(name).then(() => qc.invalidateQueries(['categories']))}
        />
      )}
    </div>
  );
}
