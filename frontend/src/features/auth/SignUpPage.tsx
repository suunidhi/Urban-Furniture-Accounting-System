import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import urbanLogo from '../../assets/urban_logo.png';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { UserRole } from '../../types';
import { 
  Lock, 
  User as UserIcon, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  BookOpen, 
  Users 
} from 'lucide-react';

interface RoleOption {
  role: UserRole;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'ACCOUNTANT',
    title: 'Accountant',
    badge: 'Operational ERP',
    description: 'Manage sales, purchases, journals, accounts, budgets, and financial reports.',
    icon: BookOpen,
  },
  {
    role: 'ADMIN',
    title: 'Administrator',
    badge: 'Full Access',
    description: 'Full ERP access, plus user management, company settings, and master data controls.',
    icon: Shield,
  },
  {
    role: 'CONTACT_USER',
    title: 'Client / Vendor',
    badge: 'Self-Service Portal',
    description: 'Dedicated portal to view customer invoices, vendor bills, and settle payments.',
    icon: Users,
  },
];

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    loginId: '',
    email: '',
    role: 'ACCOUNTANT' as UserRole,
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');
  const [userId, setUserId] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleRoleSelect = (role: UserRole) => {
    setFormData({ ...formData, role });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side rule validation
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
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one special character.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/signup', formData);
      if (res.data.success) {
        if (res.data.data.requireOtp) {
          setUserId(res.data.data.userId);
          setStep(2);
        } else {
          // Fallback if no OTP required (shouldn't happen with our backend changes)
          const { token, user } = res.data.data;
          login(token, user);
          navigate(user.role === 'CONTACT_USER' ? '/portal/invoices' : '/dashboard');
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create account. Please check your details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (otpCode.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-signup-otp', { userId, otpCode });
      if (res.data.success) {
        const { token, user } = res.data.data;
        login(token, user);
        if (user.role === 'CONTACT_USER') {
          navigate('/portal/invoices');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <img src={urbanLogo} alt="Urban Furniture Logo" className="w-14 h-14 rounded-xl shadow-md object-cover" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#2F2F2F]">
          Create Your Account
        </h2>
        <p className="text-xs text-[#017E84] font-semibold tracking-widest uppercase mt-0.5">
          Select Your Access Role & Join Urban Furniture Accounting
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-7 px-6 sm:px-9 shadow-sm border border-[#E5E7EB] rounded-xl">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Account Role Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Select Your Role & Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formData.role === opt.role;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        onClick={() => handleRoleSelect(opt.role)}
                        className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#714B67] bg-[#714B67]/5 shadow-sm ring-1 ring-[#714B67]'
                            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div
                            className={`w-7 h-7 rounded-md flex items-center justify-center ${
                              isSelected ? 'bg-[#714B67] text-white' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-[#714B67]" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-900">{opt.title}</div>
                          <span
                            className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                              isSelected
                                ? 'bg-[#714B67]/15 text-[#714B67]'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 mt-2 italic bg-gray-50 p-2 rounded border border-gray-100">
                  {ROLE_OPTIONS.find((r) => r.role === formData.role)?.description}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Login ID <span className="text-gray-400 font-normal">(6-12 characters)</span>
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="loginId"
                    required
                    value={formData.loginId}
                    onChange={handleChange}
                    placeholder="Unique ID between 6-12 chars"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Password <span className="text-gray-400 font-normal">(&gt;8 chars, Aa, special)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 9 chars with Upper, lower, special"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Re-Enter Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 text-sm font-semibold tracking-wide uppercase"
                >
                  {loading
                    ? 'Creating Account...'
                    : `SIGN UP AS ${formData.role === 'CONTACT_USER' ? 'PORTAL USER' : formData.role}`}
                </button>
              </div>

              <div className="text-center pt-2 text-xs font-medium text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-[#714B67] hover:underline font-semibold">
                  Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerifyOtp}>
              <div className="text-center mb-6">
                <Shield className="w-10 h-10 text-[#714B67] mx-auto mb-2" />
                <h3 className="text-lg font-bold text-gray-900">Verify Your Email</h3>
                <p className="text-sm text-gray-500 mt-1">
                  We've sent a 6-digit one-time password to <span className="font-semibold text-gray-800">{formData.email}</span>. It expires in 5 minutes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1 text-center">
                  Enter 6-Digit OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  placeholder="000000"
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                />
              </div>

              <div className="pt-4 space-y-3">
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full btn-primary py-2.5 text-sm font-semibold tracking-wide uppercase disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Account'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full btn-outline py-2.5 text-sm font-semibold tracking-wide uppercase"
                >
                  Back to Details
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
