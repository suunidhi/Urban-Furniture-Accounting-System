import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'More than 8 characters', ok: password.length > 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1.5 text-xs">
          {c.ok ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-white/30" />}
          <span className={c.ok ? 'text-green-400' : 'text-white/30'}>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ login_id: '', email: '', password: '', confirm_password: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      await api.post('/auth/signup', form);
      navigate('/login', { state: { message: 'Account created! Please sign in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputRow = (label, key, type = 'text', extra = null) => (
    <div className="flex items-center gap-3 border-b border-white/20 pb-2 focus-within:border-primary/70 transition-colors">
      <label className="text-white/60 text-sm whitespace-nowrap w-36">{label} -</label>
      <input
        type={type === 'password' ? (key === 'password' ? (showPass ? 'text' : 'password') : (showConfirm ? 'text' : 'password')) : type}
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/15 rounded-full blur-3xl" />
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2.5 rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {inputRow('Enter Login Id', 'login_id')}
            {inputRow('Enter Email Id', 'email', 'email')}
            <div>
              {inputRow('Enter Password', 'password', 'password',
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

            <div className="pt-2">
              <button
                id="signup-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-[#2a2a2a] hover:bg-primary/80 border border-white/20 hover:border-primary text-white font-bold py-3 rounded-xl text-sm tracking-widest transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
              </button>
            </div>

            <div className="text-center text-white/40 text-xs space-x-2">
              <Link to="/forgot-password" className="hover:text-white/70 transition-colors">Forgot Password</Link>
              <span>|</span>
              <Link to="/login" className="hover:text-white/70 transition-colors">Sign In</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
