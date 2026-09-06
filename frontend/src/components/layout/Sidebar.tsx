import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Truck,
  ShoppingCart,
  Package,
  PieChart,
  BarChart3,
  Shield,
  ChevronDown,
  ChevronRight,
  FileText,
  CreditCard,
  Layers,
  FileSpreadsheet,
  Settings,
  FolderKanban,
  Receipt
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  title: string;
  path: string;
}

interface NavSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  items?: NavItem[];
  path?: string;
  adminOnly?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin, isContactUser } = useAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Sales: true,
    Purchase: true,
    Account: true,
    Report: true,
    Administration: false,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  // Dedicated menu for Contact Users
  if (isContactUser) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={onClose}
          />
        )}
        <aside
          className={`fixed lg:static top-14 left-0 bottom-0 z-30 w-64 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-200 ease-in-out ${
            isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div className="p-4 border-b border-gray-100 bg-[#F3EAF0]/40">
            <span className="text-xs font-bold text-[#714B67] uppercase tracking-wider">
              Customer & Vendor Portal
            </span>
            <p className="text-xs text-gray-500 mt-0.5">Self-Service Account Center</p>
          </div>
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            <NavLink
              to="/portal/invoices"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#714B67] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <FileText className="w-4 h-4" />
              <span>My Invoices</span>
            </NavLink>
            <NavLink
              to="/portal/bills"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#714B67] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Receipt className="w-4 h-4" />
              <span>My Bills</span>
            </NavLink>
            <NavLink
              to="/portal/payments"
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#714B67] text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <CreditCard className="w-4 h-4" />
              <span>Payment History</span>
            </NavLink>
          </nav>
        </aside>
      </>
    );
  }

  // Navigation sections matching the required flow:
  // 1. Overview (at top)
  // 2. Sales
  // 3. Purchase
  // 4. Account
  // 5. Report
  // + Administration for Admins
  const sections: NavSection[] = [
    {
      title: 'Sales',
      icon: ShoppingCart,
      items: [
        { title: 'Sales Orders', path: '/sales/orders' },
        { title: 'Sales Invoice', path: '/sales/invoices' },
        { title: 'Receipt', path: '/sales/receipts' },
      ],
    },
    {
      title: 'Purchase',
      icon: Truck,
      items: [
        { title: 'Purchase Order', path: '/purchases/orders' },
        { title: 'Purchase Bill', path: '/purchases/bills' },
        { title: 'Payment', path: '/purchases/payments' },
      ],
    },
    {
      title: 'Account',
      icon: BookOpen,
      items: [
        { title: 'Contact', path: '/contacts' },
        { title: 'Product', path: '/products' },
        { title: 'Analyticals', path: '/accounting/analytic-accounts' },
        { title: 'Analytical Budget', path: '/budgets' },
        { title: 'Chart of Account', path: '/accounting/chart-of-accounts' },
        { title: 'Journals', path: '/accounting/journals' },
        { title: 'Journals Entries', path: '/accounting/journal-entries' },
      ],
    },
    {
      title: 'Report',
      icon: FileSpreadsheet,
      items: [
        { title: 'Balance Sheet', path: '/reports/balance-sheet' },
        { title: 'Profit and Loss', path: '/reports/profit-loss' },
        { title: 'Budget Report', path: '/reports/budget-report' },
      ],
    },
    {
      title: 'Administration',
      icon: Shield,
      adminOnly: true,
      items: [
        { title: 'User Management', path: '/admin/users' },
        { title: 'Company Settings', path: '/admin/settings' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-14 left-0 bottom-0 z-30 w-64 bg-white border-r border-[#E5E7EB] flex flex-col transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Direct Dashboard Link */}
        <div className="p-3 border-b border-gray-100">
          <NavLink
            to="/dashboard"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#714B67] text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </NavLink>
        </div>

        {/* Scrollable Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
          {sections
            .filter((s) => !s.adminOnly || isAdmin)
            .map((section) => {
              const Icon = section.icon;
              const isExpanded = openSections[section.title] ?? false;

              return (
                <div key={section.title} className="py-0.5">
                  <button
                    onClick={() => toggleSection(section.title)}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md font-semibold text-xs tracking-wide transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#714B67]" />
                      <span>{section.title}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>

                  {isExpanded && section.items && (
                    <div className="pl-6 pr-1 py-1 space-y-0.5 border-l border-gray-100 ml-4 mt-0.5">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `block px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                              isActive
                                ? 'bg-[#F3EAF0] text-[#714B67] font-semibold'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`
                          }
                        >
                          {item.title}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </nav>

        {/* Bottom Status bar */}
        <div className="p-3 border-t border-gray-100 bg-[#F8F9FA] flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            MySQL Connected
          </span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </aside>
    </>
  );
};
