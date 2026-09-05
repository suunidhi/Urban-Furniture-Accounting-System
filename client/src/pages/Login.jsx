import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, ArrowRight, Sofa } from 'lucide-react';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(loginId, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid Login Id or Password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-[#1e1435] to-[#0f0a1e] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

        <div className="relative z-10 text-center">
          {/* Logo icon */}
          <div className="w-20 h-20 bg-primary/20 border border-primary/30 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Sofa size={36} className="text-primary" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tight mb-2">URBAN</h1>
          <p className="text-primary/80 font-semibold text-lg tracking-widest mb-4">FURNITURE ERP</p>
          <div className="w-16 h-px bg-white/20 mx-auto mb-6" />
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Streamline your furniture business with intelligent accounting, inventory and CRM — all in one place.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[['360°', 'Business View'], ['Real-time', 'Analytics'], ['Multi-role', 'Access']].map(([v, l]) => (
              <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                <p className="text-white font-bold text-sm">{v}</p>
                <p className="text-white/40 text-[10px] mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right login panel ── */}
      <div className="flex-1 bg-slate-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sofa size={26} className="text-primary" />
            </div>
            <h1 className="text-2xl font-black text-white">URBAN ERP</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Welcome back</h2>
            <p className="text-white/40 text-sm mt-1">Sign in to continue to your workspace</p>
          </div>

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Login Id */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Login Id</label>
              <input
                id="login-id"
                type="text"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                placeholder="Enter your login id"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              id="sign-in-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : (<>Sign In <ArrowRight size={16} /></>)}
            </button>

            {/* Links */}
            <div className="flex items-center justify-between text-xs text-white/30 pt-1">
              <Link to="/forgot-password" className="hover:text-white/60 transition-colors">Forgot Password?</Link>
              <Link to="/signup" className="hover:text-white/60 transition-colors">Create Account →</Link>
            </div>
          </form>

          {/* Credentials hint */}
          <div className="mt-8 p-4 bg-white/3 border border-white/8 rounded-xl">
            <p className="text-white/30 text-xs font-medium mb-2 uppercase tracking-wider">Demo Credentials</p>
            <div className="space-y-1 text-xs text-white/40">
              <div className="flex justify-between"><span>Admin</span><span className="text-white/60 font-mono">admin123 / password123</span></div>
              <div className="flex justify-between"><span>Accountant</span><span className="text-white/60 font-mono">acct1234 / password123</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
