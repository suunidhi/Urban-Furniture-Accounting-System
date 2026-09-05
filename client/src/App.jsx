import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';

// A placeholder for the dashboard layout
const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  return (
    <div className="flex h-screen bg-odoo-bg">
      {/* Sidebar */}
      <div className="w-64 bg-odoo-sidebar border-r border-odoo-border flex flex-col">
        <div className="h-14 flex items-center justify-center border-b border-odoo-border bg-odoo-primary text-white font-bold text-lg">
          Urban Furniture
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="p-2 bg-odoo-sidebarHover rounded cursor-pointer text-sm font-medium">Dashboard</div>
          <div className="p-2 hover:bg-odoo-sidebarHover rounded cursor-pointer text-sm font-medium">Master Data</div>
          <div className="p-2 hover:bg-odoo-sidebarHover rounded cursor-pointer text-sm font-medium">Purchases</div>
          <div className="p-2 hover:bg-odoo-sidebarHover rounded cursor-pointer text-sm font-medium">Sales</div>
          <div className="p-2 hover:bg-odoo-sidebarHover rounded cursor-pointer text-sm font-medium">Accounting</div>
          <div className="p-2 hover:bg-odoo-sidebarHover rounded cursor-pointer text-sm font-medium">Budgets</div>
          <div className="p-2 hover:bg-odoo-sidebarHover rounded cursor-pointer text-sm font-medium">Reports</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-odoo-border flex items-center justify-between px-6 shadow-sm z-10">
          <div className="text-xl font-semibold text-gray-800">Dashboard</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user?.name}</span>
            <button 
              onClick={logout}
              className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-odoo-bg">
          <div className="bg-white p-6 rounded shadow border border-odoo-border">
            <h2 className="text-2xl mb-4 font-light text-odoo-primary">Welcome to Urban Furniture Accounting</h2>
            <p className="text-gray-600">The Odoo-themed accounting system is successfully set up.</p>
          </div>
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AppContent = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
