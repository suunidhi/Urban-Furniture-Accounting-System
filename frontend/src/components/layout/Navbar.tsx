import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/urban_logo.png';
import {
  Building2,
  Search,
  User as UserIcon,
  LogOut,
  Menu,
  Bell,
  ChevronDown,
  ShieldCheck
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin, isAccountant } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const getRoleBadge = () => {
    if (isAdmin) return <span className="bg-[#F3EAF0] text-[#714B67] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#714B67]/20 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Admin</span>;
    if (isAccountant) return <span className="bg-[#E6F4F4] text-[#017E84] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[#017E84]/20">Accountant</span>;
    return <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-300">Portal User</span>;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB] h-14 flex items-center justify-between px-4 sm:px-6 shadow-sm">
      {/* Left branding & toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#714B67]"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
            <img
              src={logo}
              alt="Urban Furniture Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-[#2F2F2F] text-base tracking-tight">URBAN FURNITURE</span>
            <span className="text-xs text-[#017E84] font-semibold ml-2 px-1.5 py-0.5 bg-[#E6F4F4] rounded">ACCOUNTING</span>
          </div>
        </div>
      </div>

      {/* Center global search */}
      <div className="hidden md:flex items-center relative max-w-md w-full mx-4">
        <Search className="w-4 h-4 absolute left-3 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search invoices, bills, partners, accounts (Ctrl+K)..."
          className="w-full pl-9 pr-4 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded-md text-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#714B67] focus:border-[#714B67] transition-all"
        />
      </div>

      {/* Right controls & user profile */}
      <div className="flex items-center gap-3">
        {/* Business entity */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
          <Building2 className="w-3.5 h-3.5 text-[#714B67]" />
          <span className="font-medium text-gray-700">Urban Furniture Ltd. (HQ)</span>
        </div>

        {/* Notifications */}
        <button className="p-1.5 text-gray-500 hover:text-[#714B67] hover:bg-gray-50 rounded-full relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-[#017E84] absolute top-1 right-1"></span>
        </button>

        {/* User profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-full bg-[#F3EAF0] text-[#714B67] flex items-center justify-center font-bold text-xs border border-[#714B67]/30">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-gray-800 leading-tight">{user?.name || 'Guest'}</div>
              <div className="text-[11px] text-gray-500 leading-tight">{user?.email || ''}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-2 z-50 text-sm">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="mt-2">{getRoleBadge()}</div>
              </div>

              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-xs font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
