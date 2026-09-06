import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import urbanLogo from '../../assets/urban_logo.png';
import api from '../../services/api';
import { Lock, User as UserIcon, AlertCircle, ArrowRight, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { loginId, password });
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
      const msg = err.response?.data?.message || 'Invalid Login Id or Password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (userRole: 'admin' | 'accountant' | 'contact') => {
    if (userRole === 'admin') {
      setLoginId('admin');
      setPassword('Admin@123456');
    } else if (userRole === 'accountant') {
      setLoginId('accountant');
      setPassword('Account@123456');
    } else {
      setLoginId('nimesh');
      setPassword('User@123456');
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <img src={urbanLogo} alt="Urban Furniture Logo" className="w-14 h-14 rounded-xl shadow-md object-cover" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-[#2F2F2F]">
          URBAN FURNITURE
        </h2>
        <p className="text-xs text-[#017E84] font-semibold tracking-widest uppercase mt-0.5">
          Enterprise Accounting System
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Login ID
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  required
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="Enter your Login ID"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Password"
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#714B67] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-2.5 text-sm font-semibold tracking-wide uppercase"
              >
                {loading ? 'Authenticating...' : 'SIGN IN'}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs font-medium text-gray-600">
              <Link
                to="/forgot-password"
                className="text-[#714B67] hover:underline hover:text-[#583850]"
              >
                Forgot Password
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                to="/signup"
                className="text-[#017E84] hover:underline hover:text-[#01686d]"
              >
                Sign Up
              </Link>
            </div>
          </form>

          {/* Quick Demo Credentials Switcher */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className="font-semibold text-gray-700 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#714B67]" />
                Demo Credentials:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin')}
                className="px-2 py-1.5 bg-[#F3EAF0] text-[#714B67] hover:bg-[#ebdce7] rounded text-xs font-medium text-center transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemo('accountant')}
                className="px-2 py-1.5 bg-[#E6F4F4] text-[#017E84] hover:bg-[#d5eeee] rounded text-xs font-medium text-center transition-colors"
              >
                Accountant
              </button>
              <button
                type="button"
                onClick={() => fillDemo('contact')}
                className="px-2 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-xs font-medium text-center transition-colors"
              >
                Contact User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
