import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Warehouse,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  AlertCircle,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronDown
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Inventory Matrix', path: '/inventory', icon: Boxes },
    { name: 'Products', path: '/products', icon: Package },
    { name: 'Categories', path: '/categories', icon: SlidersHorizontal },
    { name: 'Warehouses', path: '/warehouses', icon: Warehouse },
    { name: 'Stock In', path: '/stock-in', icon: ArrowDownRight },
    // Transfers: Admin & Manager only (Staff prohibited)
    ...(hasRole(['ADMIN', 'MANAGER']) ? [{ name: 'Transfers', path: '/transfers', icon: ArrowLeftRight }] : []),
    { name: 'History & Audit', path: '/history', icon: History },
    { name: 'Stock Alerts', path: '/alerts', icon: AlertCircle },
    // Admin only
    ...(hasRole('ADMIN') ? [{ name: 'User Management', path: '/users', icon: Users }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (STATIC / FIXED DARK CONTRAST OBSIDIAN) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-[#0b0f19] border-r border-slate-800/80 shrink-0 h-full select-none text-slate-300">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 gap-3">
          <div 
            className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs border border-indigo-500/30"
            style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
          >
            <Boxes className="w-5 h-5 text-white" style={{ color: '#ffffff' }} />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight block">Inventory Hub</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Multi-Warehouse</span>
          </div>
        </div>

        {/* User Scope Banner in Sidebar */}
        <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800/60">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Assigned Scope</span>
            <Badge variant={user?.role}>{user?.role}</Badge>
          </div>
          <div className="mt-1 text-xs text-slate-300 font-medium flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {user?.role === 'ADMIN'
                ? 'All Warehouses (Global)'
                : user?.warehouses?.length > 0
                ? user.warehouses.map(w => w.name.split(' ')[0]).join(', ')
                : 'No Warehouses Assigned'}
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white font-semibold shadow-xs'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-current" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Profile info */}
        <div className="p-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] bg-[#0b0f19] text-slate-300 h-full flex flex-col z-10 shadow-dropdown border-r border-slate-800/80">
            <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div 
                  className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs border border-indigo-500/30"
                  style={{ backgroundColor: '#4f46e5', color: '#ffffff' }}
                >
                  <Boxes className="w-4 h-4 text-white" style={{ color: '#ffffff' }} />
                </div>
                <span className="font-bold text-white text-sm">Inventory Hub</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-brand-600 text-white font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 text-current" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800/80">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/40 rounded-lg border border-rose-800/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN LAYOUT WRAPPER */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header (Static) */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs text-slate-400 font-medium">Enterprise Inventory Management</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-brand-50 text-brand-700 border border-brand-200/80 flex items-center justify-center font-bold text-xs">
                  {user?.firstName?.[0]}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-slate-800 leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-tight uppercase font-bold tracking-wider">{user?.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-dropdown z-40 py-1.5 text-xs text-slate-700">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <p className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
                      <div className="mt-2">
                        <Badge variant={user?.role}>{user?.role}</Badge>
                      </div>
                    </div>
                    <NavLink
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium"
                    >
                      Account & Security Settings
                    </NavLink>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-700 font-medium flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area (Independently scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none">
          <div className="max-w-7xl mx-auto w-full pb-12">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
