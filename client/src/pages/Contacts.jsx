import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, LayoutList, LayoutGrid, X, User,
  Mail, Phone, MapPin, Edit2, Archive, Upload, ChevronDown
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const SERVER = 'http://localhost:5000';
const TYPES = ['customer', 'vendor', 'both'];

const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors";

// ── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ src, name, size = 'md' }) {
  const sz = size === 'lg' ? 'w-16 h-16 text-xl' : size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (src) return <img src={`${SERVER}${src}`} alt={name} className={clsx(sz, 'rounded-full object-cover flex-shrink-0 border border-gray-200')} />;
  return (
    <div className={clsx(sz, 'rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 font-bold text-primary')}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ── Type Badge ──────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const colors = { customer: 'bg-blue-100 text-blue-700', vendor: 'bg-orange-100 text-orange-700', both: 'bg-purple-100 text-purple-700' };
  return <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium capitalize', colors[type] || 'bg-slate-100 text-slate-600')}>{type}</span>;
}

// ── Contact Modal (Add / Edit) ──────────────────────────────────────────────
function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState({
    name: contact?.name || '',
    type: contact?.type || 'customer',
    email: contact?.email || '',
    mobile: contact?.mobile || '',
    address_line: contact?.address_line || '',
    city: contact?.city || '',
    state: contact?.state || '',
    pincode: contact?.pincode || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(contact?.profile_image ? `${SERVER}${contact.profile_image}` : null);
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
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (imageFile) fd.append('image', imageFile);
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-slate-800 text-lg">{contact ? 'Edit Contact' : 'New Contact'}</h2>
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
                : <div className="text-center"><Upload size={20} className="text-gray-300 mx-auto mb-1" /><p className="text-[10px] text-gray-400">Upload</p></div>
              }
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Contact Photo</p>
              <p className="text-xs text-slate-400 mt-0.5">JPG, PNG, WebP · Max 5MB</p>
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 text-xs text-primary hover:underline">Choose file</button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Contact Name *</label>
              <input value={form.name} onChange={set('name')} required className={inputCls} placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
              <select value={form.type} onChange={set('type')} className={inputCls}>
                {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone</label>
              <input value={form.mobile} onChange={set('mobile')} className={inputCls} placeholder="+1 234 567 8900" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="email@example.com" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1">Street / Address</label>
              <input value={form.address_line} onChange={set('address_line')} className={inputCls} placeholder="Street address" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City</label>
              <input value={form.city} onChange={set('city')} className={inputCls} placeholder="City" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">State</label>
              <input value={form.state} onChange={set('state')} className={inputCls} placeholder="State" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Pincode</label>
              <input value={form.pincode} onChange={set('pincode')} className={inputCls} placeholder="12345" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-primary text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
              {contact ? 'Update Contact' : 'Create Contact'}
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

// ── Kanban Card ─────────────────────────────────────────────────────────────
function KanbanCard({ contact, isAdmin, onEdit, onArchive }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar src={contact.profile_image} name={contact.name} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{contact.name}</p>
          <TypeBadge type={contact.type} />
        </div>
      </div>
      {contact.email && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Mail size={12} className="text-primary/60" />
          <span className="truncate">{contact.email}</span>
        </div>
      )}
      {contact.mobile && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Phone size={12} className="text-primary/60" />
          <span>{contact.mobile}</span>
        </div>
      )}
      {contact.city && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin size={12} className="text-primary/60" />
          <span>{[contact.city, contact.state].filter(Boolean).join(', ')}</span>
        </div>
      )}
      {isAdmin && (
        <div className="flex gap-2 pt-1 border-t border-gray-50">
          <button onClick={() => onEdit(contact)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
            <Edit2 size={12} /> Edit
          </button>
          <button onClick={() => onArchive(contact.id)} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Archive size={12} /> Archive
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function Contacts() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', filterType, search],
    queryFn: async () => (await api.get(`/contacts?type=${filterType}&search=${search}`)).data
  });

  const createMutation = useMutation({
    mutationFn: (fd) => api.post('/contacts', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries(['contacts']); setShowModal(false); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, fd }) => api.put(`/contacts/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries(['contacts']); setEditContact(null); }
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => api.patch(`/contacts/${id}/archive`),
    onSuccess: () => qc.invalidateQueries(['contacts'])
  });

  const handleSave = (fd) => {
    if (editContact) {
      updateMutation.mutate({ id: editContact.id, fd });
    } else {
      createMutation.mutate(fd);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Vendors, customers and partners</p>
        </div>
        <button
          onClick={() => { setEditContact(null); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={16} /> New Contact
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" placeholder="Search contacts..." />
        </div>

        {/* Filter Type */}
        <div className="relative">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white">
            <option value="all">All Types</option>
            {TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
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
        <div className="py-16 text-center text-slate-400">Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div className="py-16 text-center">
          <User size={40} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400">No contacts found. Click "New Contact" to add one.</p>
        </div>
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {contacts.map(c => (
            <KanbanCard
              key={c.id}
              contact={c}
              isAdmin={isAdmin}
              onEdit={(contact) => { setEditContact(contact); setShowModal(true); }}
              onArchive={(id) => { if (window.confirm('Archive this contact?')) archiveMutation.mutate(id); }}
            />
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-slate-50 border-b border-gray-100">
              <tr>
                <th className="w-10 px-4 py-3"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">City</th>
                {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <Avatar src={c.profile_image} name={c.name} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                  </td>
                  <td className="px-4 py-3"><TypeBadge type={c.type} /></td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.mobile || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{c.city || '—'}</td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditContact(c); setShowModal(true); }}
                          className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm('Archive this contact?')) archiveMutation.mutate(c.id); }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
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
      {(showModal || editContact) && (
        <ContactModal
          contact={editContact}
          onClose={() => { setShowModal(false); setEditContact(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
