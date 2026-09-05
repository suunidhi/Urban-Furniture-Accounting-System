import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ShoppingBag,
  ShoppingCart,
  Package,
  PieChart,
  FileText,
  X,
  CreditCard,
  Scroll,
  Scan,
  BarChart3,
  LogOut,
  UserPlus
} from 'lucide-react';
import clsx from 'clsx';

const navGroups = [
  {
    label: null,
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
    ]
  },
  {
    label: 'Transactions',
    items: [
      { name: 'Sales', href: '/sales', icon: ShoppingCart },
      { name: 'Purchases', href: '/purchases', icon: ShoppingBag },
    ]
  },
  {
    label: 'Accounting',
    items: [
      { name: 'Chart of Accounts', href: '/accounting', icon: BookOpen },
      { name: 'Journal Entries', href: '/journal-entries', icon: Scroll },
      { name: 'Budgets', href: '/budgets', icon: PieChart },
      { name: 'Reports', href: '/reports', icon: BarChart3 },
    ]
  },
  {
    label: 'Master Data',
    items: [
      { name: 'Customers', href: '/customers', icon: Users },
      { name: 'Vendors', href: '/vendors', icon: CreditCard },
      { name: 'Products', href: '/products', icon: Package },
    ]
  },
  {
    label: 'Tools',
    items: [
      { name: 'OCR Scanner', href: '/ocr', icon: Scan },
      { name: 'Create User', href: '/create-user', icon: UserPlus, adminOnly: true },
    ]
  },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.href;
    return location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar panel */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-[#5a3b52]">
          <div>
            <h1 className="text-base font-bold tracking-widest text-white">URBAN</h1>
            <p className="text-[10px] text-white/60 tracking-wider -mt-0.5">FURNITURE ERP</p>
          </div>
          <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                        active
                          ? 'bg-white/15 text-white shadow-sm'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon size={17} className="shrink-0" />
                      {item.name}
                      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 bg-[#5a3b52] border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-white/50 capitalize">{user?.role}</div>
            </div>
            {logout && (
              <button onClick={logout} title="Sign out" className="text-white/50 hover:text-white transition-colors">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
