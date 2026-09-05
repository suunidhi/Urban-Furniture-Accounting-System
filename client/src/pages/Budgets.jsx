import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, RefreshCw, X, AlertCircle, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import clsx from 'clsx';

// ─── Status Badge ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-600',
  confirmed: 'bg-blue-100 text-blue-700',
  revised: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-600',
};

function StatusBadge({ status }) {
  return (
    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', STATUS_COLORS[status] || 'bg-gray-100 text-gray-700')}>
      {status}
    </span>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────
function ProgressBar({ pct, color = 'bg-primary' }) {
  const clamped = Math.min(Math.max(pct || 0, 0), 100);
  const barColor = clamped >= 90 ? 'bg-red-500' : clamped >= 70 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className={clsx('h-2 rounded-full transition-all duration-500', barColor)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ─── Modal ─────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
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

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

// ─── KPI Card ──────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className={clsx('bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4')}>
      <div className={clsx('p-3 rounded-lg', color)}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Budgets Page ─────────────────────────────────────────────────────
export default function Budgets() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [error, setError] = useState('');
  const emptyForm = {
    name: '', period_start: '', period_end: '',
    analytic_account_id: '', responsible_person_id: '',
    planned_amount: '', notes: ''
  };
  const [form, setForm] = useState(emptyForm);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['budgets-summary'],
    queryFn: async () => (await api.get('/budgets/summary')).data
  });

  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => (await api.get('/budgets')).data
  });

  const { data: analyticAccounts } = useQuery({
    queryKey: ['analytic-accounts'],
    queryFn: async () => (await api.get('/analytic-accounts')).data
  });

  const { data: users } = useQuery({
    queryKey: ['users-list'],
    queryFn: async () => {
      // Re-use contacts or get from auth — fall back gracefully
      try { return (await api.get('/auth/users')).data; } catch { return []; }
    }
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/budgets', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      queryClient.invalidateQueries(['budgets-summary']);
      setShowCreate(false);
      setForm(emptyForm);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create budget')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/budgets/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      queryClient.invalidateQueries(['budgets-summary']);
      setEditBudget(null);
      setForm(emptyForm);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to update budget')
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => api.post(`/budgets/${id}/confirm`),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      queryClient.invalidateQueries(['budgets-summary']);
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to confirm budget')
  });

  const cancelMutation = useMutation({
    mutationFn: (id) => api.post(`/budgets/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      queryClient.invalidateQueries(['budgets-summary']);
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to cancel budget')
  });

  const recalcMutation = useMutation({
    mutationFn: (id) => api.post(`/budgets/${id}/recalculate`),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      queryClient.invalidateQueries(['budgets-summary']);
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to recalculate')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/budgets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['budgets']);
      queryClient.invalidateQueries(['budgets-summary']);
    },
    onError: (err) => alert(err.response?.data?.message || 'Failed to delete budget')
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  const openEdit = (b) => {
    setEditBudget(b);
    setForm({
      name: b.name,
      period_start: b.period_start?.split('T')[0] || '',
      period_end: b.period_end?.split('T')[0] || '',
      analytic_account_id: b.analytic_account_id || '',
      responsible_person_id: b.responsible_person_id || '',
      planned_amount: parseFloat(b.planned_amount).toFixed(2),
      notes: b.notes || ''
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (editBudget) {
      updateMutation.mutate({ id: editBudget.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  // ── Summary KPIs ─────────────────────────────────────────────────────────
  const totalPlanned = summary?.reduce((s, b) => s + parseFloat(b.planned_amount || 0), 0) || 0;
  const totalAchieved = summary?.reduce((s, b) => s + parseFloat(b.achieved_amount || 0), 0) || 0;
  const totalCommitted = summary?.reduce((s, b) => s + parseFloat(b.committed_amount || 0), 0) || 0;
  const overallUtil = totalPlanned > 0 ? (totalAchieved / totalPlanned) * 100 : 0;

  const filtered = budgets?.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.analyticAccount?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track planned vs committed vs achieved spending</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setForm(emptyForm); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> New Budget
        </button>
      </div>

      {/* KPI Summary Cards */}
      {!summaryLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Planned" value={`$${totalPlanned.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={Target} color="bg-primary" sub={`${summary?.length || 0} active budgets`} />
          <KpiCard label="Total Committed" value={`$${totalCommitted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={TrendingUp} color="bg-amber-500" sub="Confirmed purchase orders" />
          <KpiCard label="Total Achieved" value={`$${totalAchieved.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} icon={TrendingDown} color="bg-secondary" sub="Posted journal debits" />
          <KpiCard label="Utilization" value={`${overallUtil.toFixed(1)}%`} icon={Target} color={overallUtil >= 90 ? 'bg-red-500' : 'bg-green-600'} sub="Achieved vs planned" />
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input className={clsx(inputCls, 'pl-9')} placeholder="Search budget name or account..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Budget Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400">Loading budgets...</div>
      ) : filtered?.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-slate-400">
          No budgets found. Create your first budget to start tracking spending.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered?.map(b => {
            const planned = parseFloat(b.planned_amount || 0);
            const committed = parseFloat(b.committed_amount || 0);
            const achieved = parseFloat(b.achieved_amount || 0);
            const remaining = planned - achieved;
            const utilPct = planned > 0 ? (achieved / planned) * 100 : 0;
            const committedPct = planned > 0 ? (committed / planned) * 100 : 0;

            return (
              <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{b.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {b.analyticAccount?.name || 'No analytic account'} &nbsp;·&nbsp;
                      {format(new Date(b.period_start), 'MMM d, yyyy')} – {format(new Date(b.period_end), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>

                {/* Amounts Row */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500 font-medium">Planned</p>
                    <p className="text-base font-bold text-slate-800">${planned.toLocaleString()}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-2.5">
                    <p className="text-xs text-amber-600 font-medium">Committed</p>
                    <p className="text-base font-bold text-amber-700">${committed.toLocaleString()}</p>
                    <p className="text-xs text-amber-400">{committedPct.toFixed(1)}%</p>
                  </div>
                  <div className={clsx('rounded-lg p-2.5', achieved > planned ? 'bg-red-50' : 'bg-green-50')}>
                    <p className={clsx('text-xs font-medium', achieved > planned ? 'text-red-600' : 'text-green-600')}>Achieved</p>
                    <p className={clsx('text-base font-bold', achieved > planned ? 'text-red-700' : 'text-green-700')}>${achieved.toLocaleString()}</p>
                    <p className={clsx('text-xs', achieved > planned ? 'text-red-400' : 'text-green-400')}>{utilPct.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Utilization</span>
                    <span className={achieved > planned ? 'text-red-600 font-semibold' : ''}>
                      {utilPct.toFixed(1)}% {achieved > planned && '⚠ Over Budget'}
                    </span>
                  </div>
                  <ProgressBar pct={utilPct} />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Remaining: ${Math.max(remaining, 0).toLocaleString()}</span>
                    {b.responsiblePerson && <span>Owner: {b.responsiblePerson.name}</span>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                  {b.status === 'draft' && (
                    <>
                      <button onClick={() => openEdit(b)} className="text-xs px-3 py-1.5 text-slate-600 border border-gray-200 rounded-md hover:bg-slate-50 transition-colors">Edit</button>
                      <button onClick={() => confirmMutation.mutate(b.id)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors font-medium">Confirm</button>
                      <button onClick={() => { if (confirm('Delete this budget?')) deleteMutation.mutate(b.id); }} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors ml-auto">Delete</button>
                    </>
                  )}
                  {b.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => recalcMutation.mutate(b.id)}
                        disabled={recalcMutation.isPending}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 bg-slate-50 text-slate-600 border border-gray-200 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        <RefreshCw size={12} className={recalcMutation.isPending ? 'animate-spin' : ''} />
                        Recalculate
                      </button>
                      <button onClick={() => openEdit(b)} className="text-xs px-3 py-1.5 text-slate-600 border border-gray-200 rounded-md hover:bg-slate-50 transition-colors">Edit</button>
                      <button onClick={() => { if (confirm('Cancel this budget?')) cancelMutation.mutate(b.id); }} className="text-xs px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors ml-auto">Cancel</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {(showCreate || editBudget) && (
        <Modal
          title={editBudget ? `Edit — ${editBudget.name}` : 'New Budget'}
          onClose={() => { setShowCreate(false); setEditBudget(null); setError(''); }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <Field label="Budget Name *">
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Q1 Marketing Budget 2026" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Period Start *">
                <input type="date" required value={form.period_start} onChange={e => setForm({ ...form, period_start: e.target.value })} className={inputCls} />
              </Field>
              <Field label="Period End *">
                <input type="date" required value={form.period_end} onChange={e => setForm({ ...form, period_end: e.target.value })} className={inputCls} />
              </Field>
            </div>

            <Field label="Planned Amount *">
              <input type="number" required min="0" step="0.01" value={form.planned_amount} onChange={e => setForm({ ...form, planned_amount: e.target.value })} className={inputCls} placeholder="0.00" />
            </Field>

            <Field label="Analytic Account">
              <select value={form.analytic_account_id} onChange={e => setForm({ ...form, analytic_account_id: e.target.value })} className={inputCls}>
                <option value="">None</option>
                {analyticAccounts?.map(a => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
              </select>
            </Field>

            <Field label="Notes">
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={clsx(inputCls, 'resize-none')} rows={2} placeholder="Optional notes..." />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => { setShowCreate(false); setEditBudget(null); setError(''); }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editBudget ? 'Update Budget' : 'Create Budget'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
