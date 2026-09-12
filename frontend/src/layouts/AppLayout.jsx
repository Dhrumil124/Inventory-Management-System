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
    { name: 'Stock Out', path: '/stock-out', icon: ArrowUpRight },
    { name: 'Transfers', path: '/transfers', icon: ArrowLeftRight },
    { name: 'History & Audit', path: '/history', icon: History },
    { name: 'Stock Alerts', path: '/alerts', icon: AlertCircle },
    // Admin only
    ...(hasRole('ADMIN') ? [{ name: 'User Management', path: '/users', icon: Users }] : []),
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="h-screen bg-zinc-50 flex overflow-hidden">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (STATIC / FIXED) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-zinc-200/90 shrink-0 h-full select-none">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-100 gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-900 text-white flex items-center justify-center shadow-xs">
            <Boxes className="w-5 h-5 text-forest-300" />
          </div>
          <div>
            <span className="font-bold text-zinc-900 text-sm tracking-tight block">Inventory Hub</span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Multi-Warehouse</span>
          </div>
        </div>

        {/* User Scope Banner in Sidebar */}
        <div className="px-4 py-3 bg-zinc-50/70 border-b border-zinc-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Assigned Scope</span>
            <Badge variant={user?.role}>{user?.role}</Badge>
          </div>
          <div className="mt-1 text-xs text-zinc-700 font-medium flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
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
                      ? 'bg-forest-50 text-forest-900 font-semibold shadow-2xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
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
        <div className="p-3 border-t border-zinc-100">
          <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-200/60">
            <div className="truncate mr-2">
              <p className="text-xs font-semibold text-zinc-900 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
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
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[80%] bg-white h-full flex flex-col z-10 shadow-dropdown">
            <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-forest-900 text-white flex items-center justify-center">
                  <Boxes className="w-4 h-4 text-forest-300" />
                </div>
                <span className="font-bold text-zinc-900 text-sm">Inventory Hub</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
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
                          ? 'bg-forest-50 text-forest-900 font-semibold'
                          : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 text-current" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-zinc-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
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
        <header className="h-16 bg-white border-b border-zinc-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-zinc-600 hover:text-zinc-900 rounded-lg hover:bg-zinc-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs text-zinc-400 font-medium">Enterprise Inventory Management</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-colors focus:outline-none"
              >
                <div className="w-7 h-7 rounded-full bg-forest-100 text-forest-900 flex items-center justify-center font-bold text-xs">
                  {user?.firstName?.[0]}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-zinc-800 leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[10px] text-zinc-400 leading-tight uppercase font-bold">{user?.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-zinc-200 shadow-dropdown z-40 py-1.5 text-xs text-zinc-700">
                    <div className="px-3.5 py-2 border-b border-zinc-100">
                      <p className="font-semibold text-zinc-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-zinc-400 text-[11px] truncate">{user?.email}</p>
                      <div className="mt-1.5">
                        <Badge variant={user?.role}>{user?.role}</Badge>
                      </div>
                    </div>
                    <NavLink
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-3.5 py-2 hover:bg-zinc-50 text-zinc-700 font-medium"
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
