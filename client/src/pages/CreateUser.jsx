import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import clsx from 'clsx';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'More than 8 characters', ok: password.length > 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-1.5 ml-1 space-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1.5 text-xs">
          {c.ok ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-white/25" />}
          <span className={c.ok ? 'text-green-400' : 'text-white/30'}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function CreateUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', login_id: '', email: '', role: 'accountant', password: '', confirm_password: ''
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirm_password) return setError('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/users', form);
      setSuccess(`User "${data.name}" (${data.role}) created successfully!`);
      setForm({ name: '', login_id: '', email: '', role: 'accountant', password: '', confirm_password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const inputRow = (label, key, type = 'text', extra = null) => (
    <div className="flex items-center gap-3 border-b border-white/20 pb-2 focus-within:border-primary/70 transition-colors">
      <label className="text-white/60 text-sm w-36 whitespace-nowrap">{label}</label>
      <input
        type={type === 'password'
          ? (key === 'password' ? (showPass ? 'text' : 'password') : (showConfirm ? 'text' : 'password'))
          : type}
        value={form[key]}
        onChange={set(key)}
        required
        className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/20 py-1"
        placeholder={label.toLowerCase()}
      />
      {extra}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-80 h-80 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl p-8 space-y-6">

          {/* Logo */}
          <div className="flex justify-center">
            <div className="bg-[#2a2a2a] border border-white/10 rounded-xl px-8 py-4 text-center">
              <p className="text-white font-bold text-lg tracking-widest">URBAN</p>
              <p className="text-white/40 text-[10px] tracking-widest -mt-0.5">FURNITURE ERP</p>
            </div>
          </div>

          <h2 className="text-center text-white/70 text-sm font-medium">Create User</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-2.5 rounded-lg text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {inputRow('Name', 'name')}
            {inputRow('Login id', 'login_id')}
            {inputRow('E-mail id', 'email', 'email')}

            {/* Role radio */}
            <div className="flex items-center gap-4 border-b border-white/20 pb-3">
              <label className="text-white/60 text-sm w-36">Role</label>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="accountant"
                    checked={form.role === 'accountant'}
                    onChange={set('role')}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-white/70 text-sm">User</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={form.role === 'admin'}
                    onChange={set('role')}
                    className="accent-primary w-4 h-4"
                  />
                  <span className="text-white/70 text-sm">Administrator</span>
                </label>
              </div>
            </div>

            <div>
              {inputRow('Password', 'password', 'password',
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              )}
              <PasswordStrength password={form.password} />
            </div>

            {inputRow('Re-Enter Password', 'confirm_password', 'password',
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-white/30 hover:text-white/60 transition-colors">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                id="create-user-btn"
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#2a2a2a] hover:bg-primary/80 border border-white/20 hover:border-primary text-white font-bold py-2.5 rounded-xl text-sm tracking-wider transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                id="cancel-btn"
                type="button"
                onClick={() => navigate('/')}
                className="flex-1 bg-transparent border border-white/20 text-white/60 hover:text-white font-bold py-2.5 rounded-xl text-sm tracking-wider transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Role info */}
          <div className="border-t border-white/10 pt-4 space-y-1.5">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Role Access Rights</p>
            <p className="text-white/30 text-xs"><span className="text-white/50 font-medium">User (Accountant)</span> — Create master data, record transactions, view reports, manage customers/vendors, journal entries, invoices & payments</p>
            <p className="text-white/30 text-xs mt-1"><span className="text-white/50 font-medium">Administrator</span> — Full access including user management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
