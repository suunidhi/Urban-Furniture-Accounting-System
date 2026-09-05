import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import logo from '../assets/urban_logo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setError('');
    try {
      setIsLoading(true);
      await axios.post('http://localhost:5000/api/auth/forgot-password', { email: forgotEmail });
      setForgotMsg('OTP sent to your email (check console/network tab since Nodemailer is not configured)');
      setForgotStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    setError('');
    try {
      setIsLoading(true);
      await axios.post('http://localhost:5000/api/auth/reset-password', {
        email: forgotEmail,
        otp,
        newPassword
      });
      setForgotMsg('Password reset successfully! You can now login.');
      setTimeout(() => {
        setShowForgot(false);
        setForgotStep(1);
        setForgotMsg('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (showForgot) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <div className="bg-white border-2 border-gray-800 rounded-lg p-4 shadow-sm">
              <img src={logo} alt="App LOGO" className="h-12 object-contain" />
            </div>
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Reset Password
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 border border-gray-300 shadow rounded-lg sm:px-10">
            
            {error && <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4"><p className="text-sm text-red-700">{error}</p></div>}
            {forgotMsg && <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4"><p className="text-sm text-green-700">{forgotMsg}</p></div>}

            {forgotStep === 1 ? (
              <form className="space-y-6" onSubmit={handleSendOTP}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enter your E-mail id</label>
                  <div className="mt-1 border-b border-gray-400 focus-within:border-black transition-colors">
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-between gap-4">
                  <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-gray-800 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none">
                    {isLoading ? 'Sending...' : 'Send OTP'}
                  </button>
                  <button type="button" onClick={() => setShowForgot(false)} className="w-full flex justify-center py-2 px-4 border border-gray-800 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleResetPassword}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                  <div className="mt-1 border-b border-gray-400 focus-within:border-black transition-colors">
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <div className="mt-1 border-b border-gray-400 focus-within:border-black transition-colors">
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-between gap-4">
                  <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-gray-800 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none">
                    {isLoading ? 'Resetting...' : 'Confirm'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-white border-2 border-gray-800 rounded-lg p-4 shadow-sm">
            <img src={logo} alt="App LOGO" className="h-12 object-contain" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Login Page
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-300 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Login id / E-mail id</label>
              <div className="mt-1 border-b border-gray-400 focus-within:border-black transition-colors">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 border-b border-gray-400 focus-within:border-black transition-colors">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button type="button" onClick={() => setShowForgot(true)} className="font-medium text-gray-600 hover:text-black">
                  Forgot your password?
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-between gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-gray-800 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-600">Don't have an account? </span>
              <Link to="/signup" className="text-sm font-medium text-gray-900 hover:underline">
                Create
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
