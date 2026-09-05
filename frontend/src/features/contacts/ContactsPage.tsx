import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Contact, ContactType, RecordStatus } from '../../types';
import { 
  Users, 
  Plus, 
  Search, 
  LayoutList, 
  LayoutGrid, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  ExternalLink,
  X,
  AlertCircle,
  FileText,
  Receipt,
  CreditCard,
  Edit2,
  Archive,
  RotateCcw
} from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';
import { Pagination } from '../../components/ui/Pagination';

export const ContactsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalContact, setEditModalContact] = useState<Contact | null>(null);
  const [detailModalContactId, setDetailModalContactId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, typeFilter, statusFilter, viewMode]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'CUSTOMER' as ContactType,
    email: '',
    mobile: '',
    street: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    imageUrl: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'CUSTOMER' as ContactType,
    email: '',
    mobile: '',
    street: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    imageUrl: '',
  });

  // Fetch contacts
  const { data: contacts, isLoading } = useQuery<Contact[]>({
    queryKey: ['contacts', typeFilter, debouncedSearch, statusFilter],
    queryFn: async () => {
      const res = await api.get('/contacts', {
        params: {
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          search: debouncedSearch || undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
        },
      });
      return res.data.data;
    },
  });

  // Fetch single contact detail
  const { data: contactDetail, isLoading: isDetailLoading } = useQuery<any>({
    queryKey: ['contact', detailModalContactId],
    queryFn: async () => {
      if (!detailModalContactId) return null;
      const res = await api.get(`/contacts/${detailModalContactId}`);
      return res.data.data;
    },
    enabled: !!detailModalContactId,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/contacts', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setModalOpen(false);
      setFormData({
        name: '',
        type: 'CUSTOMER',
        email: '',
        mobile: '',
        street: '',
        city: '',
        state: '',
        country: 'India',
        pincode: '',
        imageUrl: '',
      });
      setError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create contact.';
      setError(msg);
    },
  });

  // Admin Edit Contact mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: typeof editFormData }) => {
      const res = await api.put(`/contacts/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', editModalContact?.id] });
      setEditModalContact(null);
      setError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update contact.';
      setError(msg);
    },
  });

  // Admin Toggle status (Archive / Restore) mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: RecordStatus }) => {
      const res = await api.patch(`/contacts/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update contact status.');
    },
  });

  const handleOpenEdit = (c: Contact) => {
    setEditModalContact(c);
    setEditFormData({
      name: c.name,
      type: c.type,
      email: c.email || '',
      mobile: c.mobile || '',
      street: c.street || '',
      city: c.city || '',
      state: c.state || '',
      country: c.country || 'India',
      pincode: c.pincode || '',
      imageUrl: c.imageUrl || '',
    });
    setError(null);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalContact) return;
    updateMutation.mutate({ id: editModalContact.id, payload: editFormData });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getTypeBadge = (type: ContactType) => {
    switch (type) {
      case 'CUSTOMER':
        return <span className="badge-purple">Customer</span>;
      case 'VENDOR':
        return <span className="badge-teal">Vendor</span>;
      case 'BOTH':
        return <span className="badge-green">Customer & Vendor</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#2F2F2F] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#714B67]" />
            Contacts Master
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Maintain customers, vendors, addresses, and transaction histories.
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
              setModalOpen(true);
            }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            New Contact
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-[#E5E7EB] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {['ALL', 'CUSTOMER', 'VENDOR', 'BOTH'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-[#F3EAF0] text-[#714B67] font-semibold border border-[#714B67]/30'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {t === 'ALL' ? 'All Contacts' : t === 'BOTH' ? 'Both' : `${t.charAt(0) + t.slice(1).toLowerCase()}s`}
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
            placeholder="Search contact, city, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67]"
          />
        </div>
      </div>

      {/* Main View: List or Kanban */}
      {isLoading ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-lg border border-gray-200">
          Loading contacts...
        </div>
      ) : !contacts || contacts.length === 0 ? (
        <div className="bg-white p-12 text-center text-gray-500 rounded-lg border border-gray-200">
          No contacts found matching criteria.
        </div>
      ) : viewMode === 'list' ? (
        /* List View */
        <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">City / State</th>
                <th className="py-3 px-4 text-center">Docs</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {(contacts?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setDetailModalContactId(c.id)}
                  className="hover:bg-gray-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#F3EAF0] text-[#714B67] flex items-center justify-center font-bold text-xs border border-[#714B67]/20">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{c.name}</div>
                      {c.user && (
                        <span className="text-[10px] text-[#017E84] font-medium bg-[#E6F4F4] px-1.5 py-0.2 rounded">
                          Portal Active
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">{getTypeBadge(c.type)}</td>
                  <td className="py-3 px-4">
                    {c.status === 'ARCHIVED' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        Archived
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{c.email || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">{c.mobile || '—'}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {c.city ? `${c.city}${c.state ? `, ${c.state}` : ''}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="badge-gray">
                      {(c as any)._count?.invoices || 0} Inv / {(c as any)._count?.vendorBills || 0} Bills
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setDetailModalContactId(c.id)}
                        className="text-xs text-[#714B67] hover:underline font-semibold"
                      >
                        View
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            title="Edit Contact (Admin)"
                            className="p-1 text-gray-500 hover:text-[#714B67] rounded hover:bg-gray-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const newStatus = c.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
                              if (confirm(`Are you sure you want to ${newStatus === 'ARCHIVED' ? 'archive' : 'restore'} ${c.name}?`)) {
                                toggleStatusMutation.mutate({ id: c.id, status: newStatus });
                              }
                            }}
                            title={c.status === 'ACTIVE' ? 'Archive Contact (Admin)' : 'Restore Contact (Admin)'}
                            className={`p-1 rounded transition-colors ${
                              c.status === 'ACTIVE'
                                ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {c.status === 'ACTIVE' ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
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
          {(contacts?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((c) => (
            <div
              key={c.id}
              onClick={() => setDetailModalContactId(c.id)}
              className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm hover:border-[#714B67]/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#F3EAF0] text-[#714B67] flex items-center justify-center font-bold text-sm border border-[#714B67]/20">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{c.name}</h3>
                      <div className="mt-0.5">{getTypeBadge(c.type)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {c.status === 'ARCHIVED' ? (
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
                          onClick={() => handleOpenEdit(c)}
                          title="Edit Contact (Admin)"
                          className="p-1 text-gray-400 hover:text-[#714B67] rounded hover:bg-gray-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const newStatus = c.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
                            if (confirm(`Are you sure you want to ${newStatus === 'ARCHIVED' ? 'archive' : 'restore'} ${c.name}?`)) {
                              toggleStatusMutation.mutate({ id: c.id, status: newStatus });
                            }
                          }}
                          title={c.status === 'ACTIVE' ? 'Archive Contact (Admin)' : 'Restore Contact (Admin)'}
                          className={`p-1 rounded ${
                            c.status === 'ACTIVE'
                              ? 'text-gray-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {c.status === 'ACTIVE' ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs text-gray-600">
                  {c.email && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}
                  {c.mobile && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{c.mobile}</span>
                    </div>
                  )}
                  {c.city && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{c.city}, {c.state || c.country}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>{(c as any)._count?.invoices || 0} Invoices</span>
                <span>{(c as any)._count?.vendorBills || 0} Bills</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {contacts && contacts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={contacts.length}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create Contact Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <h2 className="text-lg font-bold text-gray-900">Create Contact Master</h2>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Azure Furniture or Nimesh Pathak"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ContactType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="BOTH">Customer & Vendor (Both)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-gray-400 font-normal">(Auto-creates Portal User)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="Street, Industrial Area, Building"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    placeholder="400013"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                  {createMutation.isPending ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal (Admin) */}
      {editModalContact && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#714B67]" />
                <h2 className="text-lg font-bold text-gray-900">Edit Contact Master</h2>
              </div>
              <button onClick={() => setEditModalContact(null)} className="text-gray-400 hover:text-gray-600 p-1">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g. Azure Furniture or Nimesh Pathak"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Contact Type *
                  </label>
                  <select
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value as ContactType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="VENDOR">Vendor</option>
                    <option value="BOTH">Customer & Vendor (Both)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.mobile}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={editFormData.street}
                    onChange={(e) => setEditFormData({ ...editFormData, street: e.target.value })}
                    placeholder="Office #402, Trade Tower, Senapati Bapat Marg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={editFormData.country}
                    onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={editFormData.pincode}
                    onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                    placeholder="400013"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setEditModalContact(null)} className="btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                  {updateMutation.isPending ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contact Details View Drawer / Modal */}
      {detailModalContactId && contactDetail && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full border border-[#E5E7EB] overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F3EAF0] text-[#714B67] flex items-center justify-center font-bold text-base border border-[#714B67]/20">
                  {contactDetail.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{contactDetail.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {getTypeBadge(contactDetail.type)}
                    {contactDetail.user && (
                      <span className="text-[11px] text-[#017E84] font-medium bg-[#E6F4F4] px-2 py-0.5 rounded">
                        Portal User: {contactDetail.user.loginId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailModalContactId(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics Snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-gray-50 border-b border-gray-200 text-xs">
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <span className="text-gray-500 font-medium">Total Sales</span>
                <div className="text-base font-bold text-gray-900 mt-1">
                  ₹{(contactDetail.metrics?.totalSales || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <span className="text-gray-500 font-medium">Outstanding (Due)</span>
                <div className="text-base font-bold text-amber-700 mt-1">
                  ₹{(contactDetail.metrics?.outstandingReceivable || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <span className="text-gray-500 font-medium">Total Purchases</span>
                <div className="text-base font-bold text-gray-900 mt-1">
                  ₹{(contactDetail.metrics?.totalPurchases || 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-white p-3 rounded-md border border-gray-200">
                <span className="text-gray-500 font-medium">Payable (Due)</span>
                <div className="text-base font-bold text-[#714B67] mt-1">
                  ₹{(contactDetail.metrics?.outstandingPayable || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Scrollable details */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              <div>
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-2">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium text-gray-800 mt-0.5">{contactDetail.email || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium text-gray-800 mt-0.5">{contactDetail.mobile || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Billing Address:</span>
                    <p className="font-medium text-gray-800 mt-0.5">
                      {[contactDetail.street, contactDetail.city, contactDetail.state, contactDetail.pincode, contactDetail.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Invoices List */}
              {contactDetail.invoices && contactDetail.invoices.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#714B67]" />
                    Customer Invoices ({contactDetail.invoices.length})
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                        <tr>
                          <th className="py-2 px-3">Invoice #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Total</th>
                          <th className="py-2 px-3 text-right">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {contactDetail.invoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-semibold text-[#714B67]">{inv.invoiceNumber}</td>
                            <td className="py-2 px-3 text-gray-600">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                            <td className="py-2 px-3 font-medium">{inv.status}</td>
                            <td className="py-2 px-3 text-right font-mono">₹{Number(inv.totalAmount).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-mono text-amber-700">₹{Number(inv.amountDue).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Vendor Bills List */}
              {contactDetail.vendorBills && contactDetail.vendorBills.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#017E84]" />
                    Vendor Bills ({contactDetail.vendorBills.length})
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                        <tr>
                          <th className="py-2 px-3">Bill #</th>
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Total</th>
                          <th className="py-2 px-3 text-right">Due</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {contactDetail.vendorBills.map((b: any) => (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="py-2 px-3 font-semibold text-[#017E84]">{b.billNumber}</td>
                            <td className="py-2 px-3 text-gray-600">{new Date(b.billDate).toLocaleDateString()}</td>
                            <td className="py-2 px-3 font-medium">{b.status}</td>
                            <td className="py-2 px-3 text-right font-mono">₹{Number(b.totalAmount).toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-mono text-[#714B67]">₹{Number(b.amountDue).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setDetailModalContactId(null)}
                className="btn-outline text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
