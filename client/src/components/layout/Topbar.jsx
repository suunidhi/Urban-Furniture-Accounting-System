import { Menu, Search, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ setSidebarOpen }) {
  const { logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white px-4 shadow-sm border-b border-gray-light sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          type="button"
          className="text-gray-dark hover:text-primary lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden sm:flex ml-4 items-center">
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-DEFAULT" />
            </div>
            <input
              type="text"
              className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-gray-light placeholder:text-gray-DEFAULT focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
              placeholder="Search..."
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="text-gray-DEFAULT hover:text-primary">
          <Bell size={20} />
        </button>
        <button 
          onClick={logout}
          className="text-sm font-medium text-gray-dark hover:text-primary"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
