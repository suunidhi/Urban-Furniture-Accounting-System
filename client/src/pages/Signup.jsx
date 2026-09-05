import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import urbanLogo from '../assets/urban_logo.png';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); // clear previous errors
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match. Please ensure both passwords are identical.');
    }
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/signup', { name, email, password, role });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Server error occurred during signup');
    }
  };

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

  return (
    <div className="min-h-screen bg-odoo-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src={urbanLogo} alt="Urban Furniture" className="mx-auto h-16 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-extrabold text-odoo-text">
          Create a new account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-odoo-border">
          <form className="space-y-6" onSubmit={handleSignup}>
            {error && <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded border border-red-200">{error}</div>}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-gray-700">Password</label>
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
              <label className="block text-sm font-medium text-gray-700">Re-enter Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm pr-10"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
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
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <div className="mt-1">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="block w-full px-3 py-2 border border-odoo-border rounded-md shadow-sm focus:outline-none focus:ring-odoo-primary focus:border-odoo-primary sm:text-sm bg-white"
                >
                  <option value="admin">Admin (Business Owner)</option>
                  <option value="accountant">Invoicing User (Accountant)</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-odoo-primary hover:bg-odoo-primaryHover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-odoo-primary transition-colors"
              >
                Sign up
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Already have an account? <Link to="/login" className="text-odoo-secondary hover:text-odoo-secondaryHover">Sign in</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
