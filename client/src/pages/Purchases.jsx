import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ShoppingBag, FileText, CreditCard, X, ChevronDown, Check, AlertCircle, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import clsx from 'clsx';

// ─── Status Badge ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700',
  confirmed: 'bg-blue-100 text-blue-700',
  billed: 'bg-purple-100 text-purple-700',
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

// ─── Modal Wrapper ─────────────────────────────────────────────────────────
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

// ─── Order Lines Editor ────────────────────────────────────────────────────
function LinesEditor({ lines, setLines, products }) {
  const addLine = () => setLines([...lines, { product_id: '', description: '', quantity: 1, unit_price: '' }]);
  const removeLine = (i) => setLines(lines.filter((_, idx) => idx !== i));
  const updateLine = (i, field, value) => {
    const updated = [...lines];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'product_id' && value) {
      const prod = products?.find(p => p.id === Number(value));
      if (prod) {
        updated[i].description = prod.name;
        updated[i].unit_price = prod.cost_price ?? '';
      }
    }
    setLines(updated);
  };

  const total = lines.reduce((acc, l) => acc + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);

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
              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium w-20">Qty</th>
              <th className="px-3 py-2 text-left text-xs text-slate-500 font-medium w-28">Unit Price</th>
              <th className="px-3 py-2 text-right text-xs text-slate-500 font-medium w-28">Subtotal</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i} className="border-t border-gray-100">
                <td className="px-2 py-1">
                  <select
                    value={line.product_id}
                    onChange={e => updateLine(i, 'product_id', e.target.value)}
                    className="w-full text-xs border-0 bg-transparent focus:outline-none"
                  >
                    <option value="">— Select —</option>
                    {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <input
                    value={line.description}
                    onChange={e => updateLine(i, 'description', e.target.value)}
                    className="w-full text-xs border-0 bg-transparent focus:outline-none"
                    placeholder="Description"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number" min="1" value={line.quantity}
                    onChange={e => updateLine(i, 'quantity', e.target.value)}
                    className="w-full text-xs border-0 bg-transparent focus:outline-none"
                  />
                </td>
                <td className="px-2 py-1">
                  <input
                    type="number" min="0" step="0.01" value={line.unit_price}
                    onChange={e => updateLine(i, 'unit_price', e.target.value)}
                    className="w-full text-xs border-0 bg-transparent focus:outline-none"
                    placeholder="0.00"
                  />
                </td>
                <td className="px-3 py-1 text-right text-xs text-slate-700 font-medium">
                  ${((parseFloat(line.quantity) || 0) * (parseFloat(line.unit_price) || 0)).toFixed(2)}
                </td>
                <td className="px-1 py-1 text-center">
                  <button type="button" onClick={() => removeLine(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t border-gray-200">
            <tr>
              <td colSpan={4} className="px-3 py-2 text-right text-sm font-semibold text-slate-700">Total</td>
              <td className="px-3 py-2 text-right text-sm font-bold text-slate-900">${total.toFixed(2)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Input Field ───────────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

// ─── Purchase Orders Tab ───────────────────────────────────────────────────
function PurchaseOrdersTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ vendor_id: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const [lines, setLines] = useState([{ product_id: '', description: '', quantity: 1, unit_price: '' }]);
  const [error, setError] = useState('');

  const { data: pos, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => (await api.get('/purchases')).data
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => (await api.get('/contacts?type=vendor')).data
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products')).data
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/purchases', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      setShowCreate(false);
      setForm({ vendor_id: '', date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
      setLines([{ product_id: '', description: '', quantity: 1, unit_price: '' }]);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create purchase order')
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => api.post(`/purchases/${id}/confirm`),
    onSuccess: () => queryClient.invalidateQueries(['purchases'])
  });

  const createBillMutation = useMutation({
    mutationFn: (id) => api.post(`/purchases/${id}/create-bill`),
    onSuccess: () => {
      queryClient.invalidateQueries(['purchases']);
      queryClient.invalidateQueries(['bills']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({ ...form, lines });
  };

  const filtered = pos?.filter(p =>
    p.po_number.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className={clsx(inputCls, 'pl-9')} placeholder="Search PO number or vendor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading purchase orders...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                {['PO Number', 'Vendor', 'Date', 'Total', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-400">No purchase orders found</td></tr>
              )}
              {filtered?.map(po => (
                <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{po.po_number}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{po.vendor?.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{format(new Date(po.date), 'MMM dd, yyyy')}</td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-800">${parseFloat(po.total).toFixed(2)}</td>
                  <td className="px-5 py-4"><StatusBadge status={po.status} /></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {po.status === 'draft' && (
                        <button
                          onClick={() => confirmMutation.mutate(po.id)}
                          className="text-xs px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors font-medium"
                        >
                          Confirm
                        </button>
                      )}
                      {po.status === 'confirmed' && (
                        <button
                          onClick={() => createBillMutation.mutate(po.id)}
                          className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors font-medium"
                        >
                          Create Bill
                        </button>
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
        <Modal title="New Purchase Order" onClose={() => { setShowCreate(false); setError(''); }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vendor *">
                <select required value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })} className={inputCls}>
                  <option value="">Select vendor...</option>
                  {vendors?.filter(v => v.type === 'vendor' || v.type === 'both').map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
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
            <LinesEditor lines={lines} setLines={setLines} products={products} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
                {createMutation.isPending ? 'Creating...' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Vendor Bills Tab ──────────────────────────────────────────────────────
function VendorBillsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showPay, setShowPay] = useState(null); // bill being paid
  const [form, setForm] = useState({ vendor_id: '', invoice_date: format(new Date(), 'yyyy-MM-dd'), due_date: '', po_id: '' });
  const [lines, setLines] = useState([{ product_id: '', description: '', quantity: 1, unit_price: '' }]);
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'bank', date: format(new Date(), 'yyyy-MM-dd'), reference: '' });
  const [error, setError] = useState('');
  const [payError, setPayError] = useState('');

  const { data: bills, isLoading } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => (await api.get('/bills')).data
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => (await api.get('/contacts')).data
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => (await api.get('/products')).data
  });

  const { data: pos } = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => (await api.get('/purchases')).data
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/bills', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      setShowCreate(false);
      setForm({ vendor_id: '', invoice_date: format(new Date(), 'yyyy-MM-dd'), due_date: '', po_id: '' });
      setLines([{ product_id: '', description: '', quantity: 1, unit_price: '' }]);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create bill')
  });

  const postMutation = useMutation({
    mutationFn: (id) => api.post(`/bills/${id}/post`),
    onSuccess: () => queryClient.invalidateQueries(['bills']),
    onError: (err) => alert(err.response?.data?.message || 'Failed to post bill')
  });

  const payMutation = useMutation({
    mutationFn: ({ billId, data }) => api.post('/payments', { bill_id: billId, vendor_id: showPay?.vendor_id, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bills']);
      queryClient.invalidateQueries(['payments']);
      setShowPay(null);
      setPayForm({ amount: '', payment_method: 'bank', date: format(new Date(), 'yyyy-MM-dd'), reference: '' });
      setPayError('');
    },
    onError: (err) => setPayError(err.response?.data?.message || 'Failed to register payment')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    createMutation.mutate({ ...form, lines });
  };

  const handlePay = (e) => {
    e.preventDefault();
    setPayError('');
    payMutation.mutate({ billId: showPay.id, data: payForm });
  };

  const openPayModal = (bill) => {
    setShowPay(bill);
    setPayForm({
      amount: parseFloat(bill.outstanding_amount).toFixed(2),
      payment_method: 'bank',
      date: format(new Date(), 'yyyy-MM-dd'),
      reference: ''
    });
    setPayError('');
  };

  const filtered = bills?.filter(b =>
    b.bill_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.vendor?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input className={clsx(inputCls, 'pl-9')} placeholder="Search bill number or vendor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus size={16} /> New Bill
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading vendor bills...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                {['Bill Number', 'Vendor', 'Invoice Date', 'Due Date', 'Total', 'Outstanding', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No vendor bills found</td></tr>
              )}
              {filtered?.map(bill => (
                <tr key={bill.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{bill.bill_number}</td>
                  <td className="px-4 py-4 text-sm text-slate-600">{bill.vendor?.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{format(new Date(bill.invoice_date), 'MMM dd, yyyy')}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">{bill.due_date ? format(new Date(bill.due_date), 'MMM dd, yyyy') : '—'}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-800">${parseFloat(bill.total).toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-orange-600">${parseFloat(bill.outstanding_amount).toFixed(2)}</td>
                  <td className="px-4 py-4"><StatusBadge status={bill.status} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {bill.status === 'draft' && (
                        <button
                          onClick={() => postMutation.mutate(bill.id)}
                          className="text-xs px-3 py-1 bg-amber-50 text-amber-700 rounded-md hover:bg-amber-100 transition-colors font-medium"
                        >
                          Post Bill
                        </button>
                      )}
                      {(bill.status === 'posted' || bill.status === 'partly_paid') && (
                        <button
                          onClick={() => openPayModal(bill)}
                          className="text-xs px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors font-medium"
                        >
                          Pay
                        </button>
                      )}
                      {(bill.status === 'posted' || bill.status === 'partly_paid' || bill.status === 'paid') && (
                        <a
                          href={`http://localhost:5000/api/pdf/bill/${bill.id}?token=${localStorage.getItem('token')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 font-medium flex items-center gap-1"
                          title="Download Vendor Bill PDF"
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

      {/* Create Bill Modal */}
      {showCreate && (
        <Modal title="New Vendor Bill" onClose={() => { setShowCreate(false); setError(''); }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vendor *">
                <select required value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })} className={inputCls}>
                  <option value="">Select vendor...</option>
                  {vendors?.filter(v => v.type === 'vendor' || v.type === 'both').map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Purchase Order (optional)">
                <select value={form.po_id} onChange={e => setForm({ ...form, po_id: e.target.value })} className={inputCls}>
                  <option value="">None</option>
                  {pos?.filter(p => p.status === 'confirmed').map(p => (
                    <option key={p.id} value={p.id}>{p.po_number} — {p.vendor?.name}</option>
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
            <LinesEditor lines={lines} setLines={setLines} products={products} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createMutation.isPending} className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
                {createMutation.isPending ? 'Creating...' : 'Create Bill'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Register Payment Modal */}
      {showPay && (
        <Modal title={`Register Payment — ${showPay.bill_number}`} onClose={() => { setShowPay(null); setPayError(''); }}>
          <form onSubmit={handlePay} className="space-y-5">
            {payError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <AlertCircle size={16} /> {payError}
              </div>
            )}
            <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Vendor</span>
                <span className="font-medium text-slate-800">{showPay.vendor?.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bill Total</span>
                <span className="font-medium text-slate-800">${parseFloat(showPay.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5">
                <span>Outstanding Amount</span>
                <span className="font-bold text-orange-600">${parseFloat(showPay.outstanding_amount).toFixed(2)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount *">
                <input
                  type="number" required min="0.01" step="0.01"
                  value={payForm.amount}
                  max={parseFloat(showPay.outstanding_amount)}
                  onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                  className={inputCls}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Payment Method *">
                <select required value={payForm.payment_method} onChange={e => setPayForm({ ...payForm, payment_method: e.target.value })} className={inputCls}>
                  <option value="bank">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </Field>
              <Field label="Payment Date *">
                <input type="date" required value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Reference">
                <input value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} className={inputCls} placeholder="e.g. TXN-001" />
              </Field>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowPay(null); setPayError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={payMutation.isPending} className="px-5 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center gap-2">
                {payMutation.isPending ? 'Processing...' : <><Check size={16} /> Register Payment</>}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Payments Tab ──────────────────────────────────────────────────────────
function PaymentsTab() {
  const [search, setSearch] = useState('');

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => (await api.get('/payments')).data
  });

  const filtered = payments?.filter(p =>
    p.payment_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.partner?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input className={clsx(inputCls, 'pl-9')} placeholder="Search payment..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading payments...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                {['Payment No.', 'Vendor', 'Date', 'Method', 'Amount', 'Reference', 'Bills Allocated', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No payments found</td></tr>
              )}
              {filtered?.map(pay => (
                <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{pay.payment_number}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">{pay.partner?.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{format(new Date(pay.date), 'MMM dd, yyyy')}</td>
                  <td className="px-5 py-4 text-sm text-slate-600 capitalize">{pay.payment_method}</td>
                  <td className="px-5 py-4 text-sm font-bold text-green-700">${parseFloat(pay.amount).toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{pay.reference || '—'}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {pay.allocations?.map(a => a.vendorBill?.bill_number).filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={pay.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main Purchases Page ───────────────────────────────────────────────────
const TABS = [
  { id: 'orders', label: 'Purchase Orders', icon: ShoppingBag },
  { id: 'bills', label: 'Vendor Bills', icon: FileText },
  { id: 'payments', label: 'Payments', icon: CreditCard },
];

export default function Purchases() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Purchases</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage purchase orders, vendor bills, and payments</p>
      </div>

      {/* Tab Navigation */}
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
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'orders' && <PurchaseOrdersTab />}
      {activeTab === 'bills' && <VendorBillsTab />}
      {activeTab === 'payments' && <PaymentsTab />}
    </div>
  );
}
