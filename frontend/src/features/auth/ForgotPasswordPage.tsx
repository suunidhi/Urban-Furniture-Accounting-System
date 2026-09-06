import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import urbanLogo from '../../assets/urban_logo.png';
import api from '../../services/api';
import { Lock, User as UserIcon, Mail, AlertCircle, CheckCircle } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    loginId: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [otpCode, setOtpCode] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', {
        loginId: formData.loginId,
        email: formData.email,
      });
      if (res.data.success) {
        setSuccess('OTP sent to your email! Please enter it below to reset your password.');
        setStep(2);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify account details.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (otpCode.length !== 6) {
      setError('OTP must be exactly 6 digits.');
      return;
    }

    if (formData.newPassword.length <= 8) {
      setError('Password must be more than 8 characters.');
      return;
    }

    const hasUpper = /[A-Z]/.test(formData.newPassword);
    const hasLower = /[a-z]/.test(formData.newPassword);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.newPassword);

    if (!hasUpper || !hasLower || !hasSpecial) {
      setError('Password must contain uppercase, lowercase, and a special character.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/reset-password', {
        ...formData,
        otpCode,
      });
      if (res.data.success) {
        setSuccess('Password reset successfully! Redirecting to login in 2 seconds...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password. Invalid OTP or details.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <img src={urbanLogo} alt="Urban Furniture Logo" className="w-14 h-14 rounded-xl shadow-md object-cover" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#2F2F2F]">
          Password Reset
        </h2>
        <p className="text-xs text-[#017E84] font-semibold tracking-widest uppercase mt-0.5">
          Urban Furniture Accounting
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-[#E5E7EB] rounded-xl">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {step === 1 ? (
            <form className="space-y-4" onSubmit={handleRequestOtp}>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Enter Login ID
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="loginId"
                    required
                    value={formData.loginId}
                    onChange={handleChange}
                    placeholder="Your registered Login ID"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Enter Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Your registered email address"
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
                  {loading ? 'Verifying...' : 'REQUEST OTP'}
                </button>
              </div>
              <div className="text-center pt-2 text-xs font-medium text-gray-600">
                Remember your credentials?{' '}
                <Link to="/login" className="text-[#714B67] hover:underline font-semibold">
                  Sign In
                </Link>
              </div>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleResetPassword}>
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
                  className="w-full text-center text-xl tracking-[0.5em] font-mono px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Enter New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="password"
                    name="newPassword"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="New password (>8 chars with Aa & special)"
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
                    placeholder="Confirm new password"
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setSuccess(null);
                  }}
                  className="w-1/3 btn-outline py-2.5 text-sm font-semibold tracking-wide uppercase"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-2/3 btn-primary py-2.5 text-sm font-semibold tracking-wide uppercase"
                >
                  {loading ? 'Updating...' : 'RESET PASSWORD'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
