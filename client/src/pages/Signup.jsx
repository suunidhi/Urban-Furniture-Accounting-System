import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import logo from '../assets/urban_logo.png';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(''); // Excalidraw calls this 'Login id' and 'E-mail id' (we'll just use email)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user'); // Admin, User, Accountant
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('http://localhost:5000/api/auth/signup', {
        name,
        email,
        password,
        role: role === 'admin' ? 'admin' : role === 'accountant' ? 'accountant' : 'user'
      });

      login(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-white border-2 border-gray-800 rounded-lg p-4 shadow-sm">
            <img src={logo} alt="App LOGO" className="h-12 object-contain" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Create Account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-300 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSignup}>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <div className="mt-1 border-b border-gray-400 focus-within:border-black transition-colors">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <div className="flex items-center space-x-6">
                <label className="flex items-center">
                  <input type="radio" name="role" value="user" checked={role === 'user'} onChange={(e) => setRole(e.target.value)} className="h-4 w-4 text-black focus:ring-black border-gray-300" />
                  <span className="ml-2 text-sm text-gray-700">User</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="role" value="admin" checked={role === 'admin'} onChange={(e) => setRole(e.target.value)} className="h-4 w-4 text-black focus:ring-black border-gray-300" />
                  <span className="ml-2 text-sm text-gray-700">Administrator</span>
                </label>
                <label className="flex items-center">
                  <input type="radio" name="role" value="accountant" checked={role === 'accountant'} onChange={(e) => setRole(e.target.value)} className="h-4 w-4 text-black focus:ring-black border-gray-300" />
                  <span className="ml-2 text-sm text-gray-700">Accountant</span>
                </label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700">Re-Enter Password</label>
              <div className="mt-1 border-b border-gray-400 focus-within:border-black transition-colors">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border-0 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-between gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-gray-800 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                {isLoading ? 'Creating...' : 'Create'}
              </button>
              <Link
                to="/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-800 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
              >
                Cancel
              </Link>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Signup;
