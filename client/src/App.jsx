import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import DashboardHome from './pages/DashboardHome';

// Master Data
import ContactsList from './pages/master/ContactsList';
import ProductsList from './pages/master/ProductsList';
import AccountsList from './pages/master/AccountsList';
import JournalsList from './pages/master/JournalsList';

// Transactions
import PurchasesList from './pages/purchases/PurchasesList';
import BillsList from './pages/purchases/BillsList';
import SalesList from './pages/sales/SalesList';
import InvoicesList from './pages/sales/InvoicesList';

// Accounting
import ReportsList from './pages/accounting/ReportsList';
import JournalEntriesList from './pages/accounting/JournalEntriesList';
import AnalyticalsList from './pages/master/AnalyticalsList';
import BudgetsList from './pages/master/BudgetsList';

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
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="contacts" element={<ContactsList />} />
          <Route path="products" element={<ProductsList />} />
          <Route path="accounts" element={<AccountsList />} />
          <Route path="journals" element={<JournalsList />} />
          <Route path="purchases" element={<PurchasesList />} />
          <Route path="bills" element={<BillsList />} />
          <Route path="sales" element={<SalesList />} />
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="reports" element={<ReportsList />} />
          <Route path="analyticals" element={<AnalyticalsList />} />
          <Route path="budgets" element={<BudgetsList />} />
          <Route path="journal-entries" element={<JournalEntriesList />} />
        </Route>
        
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
