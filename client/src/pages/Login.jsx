import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import urbanLogo from '../assets/urban_logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // view: 'login' | 'forgot' | 'otp' | 'reset'
  const [view, setView] = useState('login');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 hover:text-gray-700">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );

  const EyeSlashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500 hover:text-gray-700">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(res.data.message + ' (Dev OTP: ' + res.data.otp + ')'); // Displaying OTP for dev
      setView('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/verify-otp', { email, otp });
      setMessage(res.data.message);
      setView('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (newPassword !== confirmNewPassword) {
      return setError('Passwords do not match');
    }

    try {
      const res = await axios.post('http://localhost:5000/api/auth/reset-password', { email, otp, newPassword });
      setMessage(res.data.message + '. Please login with your new password.');
      setView('login');
      setPassword('');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-odoo-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src={urbanLogo} alt="Urban Furniture" className="mx-auto h-16 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-odoo-text">
          {view === 'login' && "Sign in to your account"}
          {view === 'forgot' && "Forgot Password"}
          {view === 'otp' && "Verify OTP"}
          {view === 'reset' && "Reset Password"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-odoo-border">
          {message && <div className="text-green-600 text-sm mb-4 text-center font-medium bg-green-50 p-2 rounded">{message}</div>}
          {error && <div className="text-red-600 text-sm mb-4 text-center font-medium bg-red-50 p-2 rounded">{error}</div>}

          {view === 'login' && (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between">
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" onClick={() => { setView('forgot'); setError(''); setMessage(''); }} className="text-sm text-odoo-secondary hover:text-odoo-secondaryHover">Forgot password?</button>
                </div>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm pr-10"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center" 
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-odoo-primary hover:bg-odoo-primaryHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-odoo-primary"
                >
                  Sign in
                </button>
              </div>

              <div className="mt-6">
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Don't have an account? <Link to="/signup" className="text-odoo-secondary hover:text-odoo-secondaryHover">Sign up</Link>
                  </span>
                </div>
              </div>
            </form>
          )}

          {view === 'forgot' && (
            <form className="space-y-6" onSubmit={handleForgotPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-odoo-primary hover:bg-odoo-primaryHover"
              >
                Send OTP
              </button>
              <button type="button" onClick={() => setView('login')} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2">Back to Login</button>
            </form>
          )}

          {view === 'otp' && (
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-odoo-primary hover:bg-odoo-primaryHover"
              >
                Verify OTP
              </button>
              <button type="button" onClick={() => setView('forgot')} className="w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-2">Resend OTP</button>
            </form>
          )}

          {view === 'reset' && (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm pr-10"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    className="appearance-none block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm pr-10"
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-odoo-primary hover:bg-odoo-primaryHover"
              >
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
