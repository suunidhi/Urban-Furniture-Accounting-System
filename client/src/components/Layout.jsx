import React, { useContext } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import urban_logo from '../assets/urban_logo.png';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [expandedSections, setExpandedSections] = React.useState({
    sales: false,
    purchase: false,
    account: false,
    report: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navItemClass = ({ isActive }) => 
    `p-2 pl-8 rounded cursor-pointer text-sm font-medium transition-colors flex items-center gap-2 ${
      isActive ? 'bg-odoo-sidebarHover text-odoo-primary' : 'hover:bg-odoo-sidebarHover text-gray-700'
    }`;

  const accordionHeaderClass = (isOpen) => 
    `w-full flex justify-between items-center px-3 py-2 mt-2 rounded cursor-pointer text-sm font-bold uppercase tracking-wider transition-colors ${
      isOpen ? 'text-odoo-primary bg-indigo-50' : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="flex h-screen bg-odoo-bg print:h-auto print:block">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-odoo-border flex flex-col shadow-sm print:hidden">
        <div className="h-14 flex items-center px-4 gap-3 border-b border-odoo-border bg-odoo-primary text-white font-bold text-lg">
          <div className="w-9 h-9 bg-white rounded-md flex items-center justify-center shrink-0">
            <img src={urban_logo} className="h-7 w-7" alt="Logo" />
          </div>
          <span className="truncate">Urban Furniture</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <NavLink to="/dashboard" end className={({ isActive }) => `p-2 px-3 rounded cursor-pointer text-sm font-bold transition-colors flex items-center gap-2 ${isActive ? 'bg-odoo-sidebarHover text-odoo-primary' : 'hover:bg-odoo-sidebarHover text-gray-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Dashboard
          </NavLink>

          {/* Sales Accordion */}
          <div>
            <button onClick={() => toggleSection('sales')} className={accordionHeaderClass(expandedSections.sales)}>
              Sales
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedSections.sales ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.sales && (
              <div className="mt-1 space-y-1">
                <NavLink to="/dashboard/sales" className={navItemClass}>Sales order</NavLink>
                <NavLink to="/dashboard/invoices" className={navItemClass}>Sale Invoice</NavLink>
                <NavLink to="/dashboard/invoices" className={navItemClass}>Receipt</NavLink>
              </div>
            )}
          </div>

          {/* Purchase Accordion */}
          <div>
            <button onClick={() => toggleSection('purchase')} className={accordionHeaderClass(expandedSections.purchase)}>
              Purchase
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedSections.purchase ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.purchase && (
              <div className="mt-1 space-y-1">
                <NavLink to="/dashboard/purchases" className={navItemClass}>Purchase Order</NavLink>
                <NavLink to="/dashboard/bills" className={navItemClass}>Purchase Bill</NavLink>
                <NavLink to="/dashboard/payments" className={navItemClass}>Payment</NavLink>
              </div>
            )}
          </div>

          {/* Account Accordion */}
          <div>
            <button onClick={() => toggleSection('account')} className={accordionHeaderClass(expandedSections.account)}>
              Account
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedSections.account ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.account && (
              <div className="mt-1 space-y-1">
                <NavLink to="/dashboard/contacts" className={navItemClass}>Contact</NavLink>
                <NavLink to="/dashboard/products" className={navItemClass}>Product</NavLink>
                <NavLink to="/dashboard/analyticals" className={navItemClass}>Analyticals</NavLink>
                <NavLink to="/dashboard/budgets" className={navItemClass}>Analytical Budget</NavLink>
                <NavLink to="/dashboard/accounts" className={navItemClass}>Chart of Account</NavLink>
                <NavLink to="/dashboard/journals" className={navItemClass}>Journals</NavLink>
                <NavLink to="/dashboard/journal-entries" className={navItemClass}>Journal Entries</NavLink>
              </div>
            )}
          </div>

          {/* Report Accordion */}
          <div>
            <button onClick={() => toggleSection('report')} className={accordionHeaderClass(expandedSections.report)}>
              Report
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedSections.report ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSections.report && (
              <div className="mt-1 space-y-1">
                <NavLink to="/dashboard/reports?tab=BS" className={navItemClass}>Balancesheet</NavLink>
                <NavLink to="/dashboard/reports?tab=PL" className={navItemClass}>Profit and Loss</NavLink>
                <NavLink to="/dashboard/reports?tab=BUDGET" className={navItemClass}>Budget Report</NavLink>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-odoo-border flex items-center justify-between px-6 shadow-sm z-10 print:hidden">
          <div className="text-xl font-semibold text-gray-800">
            {/* The page title could be dynamic, but for now we'll let the children render their own headers */}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{user?.name}</span>
              <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page Content injected via Outlet */}
        <main className="flex-1 overflow-y-auto bg-odoo-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
