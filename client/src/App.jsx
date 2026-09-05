import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import CreateUser from './pages/CreateUser';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ContactForm from './pages/ContactForm';
import Products from './pages/Products';
import AccountingMaster from './pages/AccountingMaster';
import JournalEntries from './pages/JournalEntries';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import OCRUpload from './pages/OCRUpload';

const queryClient = new QueryClient();

function Unauthorized() {
  return <div className="p-8 text-red-500 font-bold">Unauthorized Access</div>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/contacts/new" element={<ContactForm />} />
              <Route path="/customers" element={<Contacts />} />
              <Route path="/vendors" element={<Contacts />} />
              <Route path="/products" element={<Products />} />
              <Route path="/accounting" element={<AccountingMaster />} />
              <Route path="/journal-entries" element={<JournalEntries />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/ocr" element={<OCRUpload />} />
              <Route path="/create-user" element={<CreateUser />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
