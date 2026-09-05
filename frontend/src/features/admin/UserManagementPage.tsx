import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { User, UserRole, RecordStatus } from '../../types';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon,
  X
} from 'lucide-react';
import { Pagination } from '../../components/ui/Pagination';

export const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    loginId: '',
    email: '',
    role: 'ACCOUNTANT' as UserRole,
    password: '',
    confirmPassword: '',
  });

  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return res.data.data;
    },
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await api.post('/auth/create-user', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalOpen(false);
      setFormData({
        name: '',
        loginId: '',
        email: '',
        role: 'ACCOUNTANT',
        password: '',
        confirmPassword: '',
      });
      setError(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create user.';
      setError(msg);
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: RecordStatus }) => {
      const res = await api.patch(`/auth/users/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.loginId.length < 6 || formData.loginId.length > 12) {
      setError('Login ID must be between 6 and 12 characters.');
      return;
    }

    if (formData.password.length <= 8) {
      setError('Password must be more than 8 characters.');
      return;
    }

    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);

    if (!hasUpper || !hasLower || !hasSpecial) {
      setError('Password must contain uppercase, lowercase, and special character.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    createMutation.mutate(formData);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge-purple">Administrator</span>;
      case 'ACCOUNTANT':
        return <span className="badge-teal">Accountant</span>;
      case 'CONTACT_USER':
        return <span className="badge-gray">Contact User</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#2F2F2F] tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#714B67]" />
            User Management
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage system access, roles, and authorized users for Urban Furniture Accounting.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          Create User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Login ID</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : !users || users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                (users?.slice((currentPage - 1) * 10, currentPage * 10) || []).map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#F3EAF0] text-[#714B67] flex items-center justify-center font-bold text-xs border border-[#714B67]/20">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-700">{u.loginId}</td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                    <td className="py-3 px-4">
                      {u.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Archived
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.loginId !== 'admin' && (
                        <button
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              id: u.id,
                              status: u.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE',
                            })
                          }
                          className="text-xs text-gray-600 hover:text-[#714B67] font-medium underline"
                        >
                          {u.status === 'ACTIVE' ? 'Archive' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {users && users.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalItems={users.length}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create User Modal - Exactly as Mockup Wireframe */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-[#E5E7EB] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-[#F8F9FA]">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#714B67]" />
                Create User
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 text-sm">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter user full name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Login ID <span className="text-gray-400 font-normal">(6-12 chars)</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.loginId}
                  onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                  placeholder="Unique Login ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  E-mail ID
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                >
                  <option value="ACCOUNTANT">Accountant (Invoicing User)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                  <option value="CONTACT_USER">User (Portal View Only)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password <span className="text-gray-400 font-normal">(&gt;8 chars, Aa, special)</span>
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Strong password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Re-Enter Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
