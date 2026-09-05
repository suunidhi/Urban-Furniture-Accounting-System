import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ShoppingCart, FileText, Banknote, X, Check, AlertCircle, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import clsx from 'clsx';

// ─── Status Badge ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  invoiced: 'bg-purple-100 text-purple-700',
  posted: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700',
  partly_paid: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }) {
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', STATUS_COLORS[status] || 'bg-gray-100 text-gray-700')}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Sales Order Lines Editor (with tax rate) ──────────────────────────────
function SalesLinesEditor({ lines, setLines, products }) {
  const addLine = () => setLines([...lines, { product_id: '', description: '', quantity: 1, unit_price: '', tax_rate: 0 }]);
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, value) => {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'product_id' && value) {
      const prod = products?.find(p => p.id === Number(value));
      if (prod) {
        updated[i].description = prod.name;
        updated[i].unit_price = prod.sales_price ?? '';
      }
    }
    setLines(updated);
  };

  const subtotal = lines.reduce((acc, l) => acc + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);
  const taxTotal = lines.reduce((acc, l) => {
    const base = (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0);
    return acc + base * ((parseFloat(l.tax_rate) || 0) / 100);
  }, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Order Lines</span>
        <button type="button" onClick={addLine} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus size={14} /> Add Line
        </button>
      </div>
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Product</th>
              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium">Description</th>
              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium w-16">Qty</th>
              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium w-24">Price</th>
              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium w-16">Tax%</th>
              <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium w-24">Total</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const base = (parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0);
              const tax = base * ((parseFloat(line.tax_rate) || 0) / 100);
              return (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-2 py-1">
                    <select value={line.product_id} onChange={e => updateLine(i, 'product_id', e.target.value)} className="w-full text-xs border-0 bg-transparent focus:outline-none">
                      <option value="">— Select —</option>
                      {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <input value={line.description} onChange={e => updateLine(i, 'description', e.target.value)} className="w-full text-xs border-0 bg-transparent focus:outline-none" placeholder="Description" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min="1" value={line.quantity} onChange={e => updateLine(i, 'quantity', e.target.value)} className="w-full text-xs border-0 bg-transparent focus:outline-none" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min="0" step="0.01" value={line.unit_price} onChange={e => updateLine(i, 'unit_price', e.target.value)} className="w-full text-xs border-0 bg-transparent focus:outline-none" placeholder="0.00" />
                  </td>
                  <td className="px-2 py-1">
                    <input type="number" min="0" max="100" step="0.01" value={line.tax_rate} onChange={e => updateLine(i, 'tax_rate', e.target.value)} className="w-full text-xs border-0 bg-transparent focus:outline-none" placeholder="0" />
                  </td>
                  <td className="px-3 py-1 text-right text-xs text-slate-700 font-medium">${(base + tax).toFixed(2)}</td>
                  <td className="px-1 py-1 text-center">
                    <button type="button" onClick={() => removeLine(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-gray-200">
            <tr>
              <td colSpan={5} className="px-3 py-1 text-right text-xs text-slate-500">Subtotal</td>
              <td className="px-3 py-1 text-right text-xs text-slate-700">${subtotal.toFixed(2)}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="px-3 py-1 text-right text-xs text-slate-500">Tax</td>
              <td className="px-3 py-1 text-right text-xs text-slate-700">${taxTotal.toFixed(2)}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={5} className="px-3 py-2 text-right text-sm font-semibold text-slate-700">Total</td>
              <td className="px-3 py-2 text-right text-sm font-bold text-slate-900">${(subtotal + taxTotal).toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-colors";

// ─── Sales Orders Tab ──────────────────────────────────────────────────────
function SalesOrdersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ customer_id: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const [lines, setLines] = useState([{ product_id: '', description: '', quantity: 1, unit_price: '', tax_rate: 0 }]);
  const [error, setError] = useState('');

  const { data: orders, isLoading } = useQuery({ queryKey: ['sales'], queryFn: async () => (await api.get('/sales')).data });
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: async () => (await api.get('/contacts')).data });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get('/products')).data });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/sales', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      setShowCreate(false);
      setForm({ customer_id: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
      setLines([{ product_id: '', description: '', quantity: 1, unit_price: '', tax_rate: 0 }]);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create order')
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => api.post(`/sales/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries(['sales']),
    onError: (err) => alert(err.response?.data?.message || 'Failed to confirm order')
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (id) => api.post(`/sales/${id}/create-invoice`),
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['invoices']);
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to create invoice')
  });

  const filtered = orders?.filter(o =>
    o.so_number?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className={clsx(inputCls, 'pl-9')} placeholder="Search SO number or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium">
          <Plus size={16} /> New Sales Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading sales orders...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                {['SO Number', 'Customer', 'Date', 'Subtotal', 'Tax', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No sales orders found</td></tr>}
              {filtered?.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{order.so_number}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{order.customer?.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{format(new Date(order.date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">${parseFloat(order.subtotal).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">${parseFloat(order.tax_amount).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-800">${parseFloat(order.total).toFixed(2)}</td>
                  <td className="px-4 py-4"><StatusBadge status={order.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {order.status === 'draft' && (
                        <button onClick={() => confirmMutation.mutate(order.id)} className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 font-medium transition-colors">Confirm</button>
                      )}
                      {order.status === 'confirmed' && (
                        <button onClick={() => createInvoiceMutation.mutate(order.id)} className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 font-medium transition-colors">Invoice</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <Modal title="New Sales Order" onClose={() => { setShowCreate(false); setError(''); }}>
          <form onSubmit={e => { e.preventDefault(); setError(''); createMutation.mutate({ ...form, lines }); }} className="space-y-5">
            {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg"><AlertCircle size={16} />{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Customer *">
                <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className={inputCls}>
                  <option value="">Select customer...</option>
                  {customers?.filter(c => c.type === 'customer' || c.type === 'both').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Order Date *">
                <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={clsx(inputCls, 'resize-none')} rows={2} placeholder="Optional notes..." />
            </Field>
            <SalesLinesEditor lines={lines} setLines={setLines} products={products} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 disabled:opacity-60">
                {createMutation.isPending ? 'Creating...' : 'Create Sales Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Customer Invoices Tab ─────────────────────────────────────────────────
function CustomerInvoicesTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showCollect, setShowCollect] = useState(null);
  const [form, setForm] = useState({ customer_id: '', so_id: '', invoice_date: format(new Date(), 'yyyy-MM-dd'), due_date: '' });
  const [lines, setLines] = useState([{ product_id: '', description: '', quantity: 1, unit_price: '', tax_rate: 0 }]);
  const [collectForm, setCollectForm] = useState({ amount: '', payment_method: 'bank', date: format(new Date(), 'yyyy-MM-dd'), reference: '' });
  const [error, setError] = useState('');
  const [collectError, setCollectError] = useState('');

  const { data: invoices, isLoading } = useQuery({ queryKey: ['invoices'], queryFn: async () => (await api.get('/invoices')).data });
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: async () => (await api.get('/contacts')).data });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get('/products')).data });
  const { data: salesOrders } = useQuery({ queryKey: ['sales'], queryFn: async () => (await api.get('/sales')).data });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/invoices', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      setShowCreate(false);
      setForm({ customer_id: '', so_id: '', invoice_date: format(new Date(), 'yyyy-MM-dd'), due_date: '' });
      setLines([{ product_id: '', description: '', quantity: 1, unit_price: '', tax_rate: 0 }]);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create invoice')
  });

  const postMutation = useMutation({
    mutationFn: (id) => api.post(`/invoices/${id}/post`),
    onSuccess: () => queryClient.invalidateQueries(['invoices']),
    onError: (err) => alert(err.response?.data?.message || 'Failed to post invoice')
  });

  const collectMutation = useMutation({
    mutationFn: ({ invoiceId, data }) => api.post('/receipts', {
      invoice_id: invoiceId,
      customer_id: showCollect?.customer_id,
      ...data
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices']);
      queryClient.invalidateQueries(['receipts']);
      setShowCollect(null);
      setCollectForm({ amount: '', payment_method: 'bank', date: format(new Date(), 'yyyy-MM-dd'), reference: '' });
      setCollectError('');
    },
    onError: (err) => setCollectError(err.response?.data?.message || 'Failed to register payment')
  });

  const openCollect = (inv) => {
    setShowCollect(inv);
    setCollectForm({ amount: parseFloat(inv.outstanding_amount).toFixed(2), payment_method: 'bank', date: format(new Date(), 'yyyy-MM-dd'), reference: '' });
    setCollectError('');
  };

  const filtered = invoices?.filter(i =>
    i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.customer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className={clsx(inputCls, 'pl-9')} placeholder="Search invoice or customer..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 text-sm font-medium">
          <Plus size={16} /> New Invoice
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading invoices...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                {['Invoice No.', 'Customer', 'Date', 'Due Date', 'Total', 'Outstanding', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No invoices found</td></tr>}
              {filtered?.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{inv.invoice_number}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{inv.customer?.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{format(new Date(inv.invoice_date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{inv.due_date ? format(new Date(inv.due_date), 'MMM dd, yyyy') : '—'}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-800">${parseFloat(inv.total).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-orange-600">${parseFloat(inv.outstanding_amount).toFixed(2)}</td>
                  <td className="px-4 py-4"><StatusBadge status={inv.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      {inv.status === 'draft' && (
                        <button onClick={() => postMutation.mutate(inv.id)} className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 font-medium">Post</button>
                      )}
                      {(inv.status === 'posted' || inv.status === 'partly_paid') && (
                        <button onClick={() => openCollect(inv)} className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 font-medium">Collect</button>
                      )}
                      {(inv.status === 'posted' || inv.status === 'partly_paid' || inv.status === 'paid') && (
                        <a
                          href={`http://localhost:5000/api/pdf/invoice/${inv.id}?token=${localStorage.getItem('token')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 font-medium flex items-center gap-1"
                          title="Download Invoice PDF"
                        >
                          <FileDown size={12} /> PDF
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Invoice Modal */}
      {showCreate && (
        <Modal title="New Customer Invoice" onClose={() => { setShowCreate(false); setError(''); }}>
          <form onSubmit={e => { e.preventDefault(); setError(''); createMutation.mutate({ ...form, lines }); }} className="space-y-5">
            {error && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg"><AlertCircle size={16} />{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Customer *">
                <select required value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className={inputCls}>
                  <option value="">Select customer...</option>
                  {customers?.filter(c => c.type === 'customer' || c.type === 'both').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Sales Order (optional)">
                <select value={form.so_id} onChange={e => setForm({ ...form, so_id: e.target.value })} className={inputCls}>
                  <option value="">None</option>
                  {salesOrders?.filter(s => s.status === 'confirmed').map(s => (
                    <option key={s.id} value={s.id}>{s.so_number} — {s.customer?.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Invoice Date *">
                <input type="date" required value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Due Date">
                <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className={inputCls} />
              </Field>
            </div>
            <SalesLinesEditor lines={lines} setLines={setLines} products={products} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 disabled:opacity-60">
                {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Collect Payment Modal */}
      {showCollect && (
        <Modal title={`Collect Payment — ${showCollect.invoice_number}`} onClose={() => { setShowCollect(null); setCollectError(''); }}>
          <form onSubmit={e => { e.preventDefault(); setCollectError(''); collectMutation.mutate({ invoiceId: showCollect.id, data: collectForm }); }} className="space-y-5">
            {collectError && <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg"><AlertCircle size={16} />{collectError}</div>}
            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Customer</span>
                <span className="font-medium text-slate-800">{showCollect.customer?.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Invoice Total</span>
                <span className="font-medium text-slate-800">${parseFloat(showCollect.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                <span>Outstanding Amount</span>
                <span className="font-bold text-orange-600">${parseFloat(showCollect.outstanding_amount).toFixed(2)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount *">
                <input type="number" required min="0.01" step="0.01" max={parseFloat(showCollect.outstanding_amount)} value={collectForm.amount} onChange={e => setCollectForm({ ...collectForm, amount: e.target.value })} className={inputCls} placeholder="0.00" />
              </Field>
              <Field label="Payment Method *">
                <select required value={collectForm.payment_method} onChange={e => setCollectForm({ ...collectForm, payment_method: e.target.value })} className={inputCls}>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </Field>
              <Field label="Date *">
                <input type="date" required value={collectForm.date} onChange={e => setCollectForm({ ...collectForm, date: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Reference">
                <input value={collectForm.reference} onChange={e => setCollectForm({ ...collectForm, reference: e.target.value })} className={inputCls} placeholder="e.g. TXN-001" />
              </Field>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCollect(null); setCollectError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={collectMutation.isPending} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
                {collectMutation.isPending ? 'Processing...' : <><Check size={16} /> Collect Payment</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Receipts Tab ──────────────────────────────────────────────────────────
function ReceiptsTab() {
  const [search, setSearch] = useState('');
  const { data: receipts, isLoading } = useQuery({ queryKey: ['receipts'], queryFn: async () => (await api.get('/receipts')).data });

  const filtered = receipts?.filter(r =>
    r.payment_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.partner?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input className={clsx(inputCls, 'pl-9')} placeholder="Search receipt..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading receipts...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                {['Receipt No.', 'Customer', 'Date', 'Method', 'Amount', 'Reference', 'Invoices', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.length === 0 && <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No receipts found</td></tr>}
              {filtered?.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{r.payment_number}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{r.partner?.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{format(new Date(r.date), 'MMM dd, yyyy')}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 capitalize">{r.payment_method}</td>
                  <td className="px-5 py-4 text-sm font-bold text-green-700">${parseFloat(r.amount).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{r.reference || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {r.allocations?.map(a => a.customerInvoice?.invoice_number).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 capitalize">{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Sales Page ───────────────────────────────────────────────────────
const TABS = [
  { id: 'orders', label: 'Sales Orders', icon: ShoppingCart },
  { id: 'invoices', label: 'Customer Invoices', icon: FileText },
  { id: 'receipts', label: 'Receipts', icon: Banknote },
];

export default function Sales() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage sales orders, customer invoices, and receipts</p>
      </div>

      <div className="flex border-b border-gray-200 gap-1">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'orders' && <SalesOrdersTab />}
      {activeTab === 'invoices' && <CustomerInvoicesTab />}
      {activeTab === 'receipts' && <ReceiptsTab />}
    </div>
  );
}
