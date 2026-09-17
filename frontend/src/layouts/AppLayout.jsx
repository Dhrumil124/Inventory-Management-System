import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  MapPin,
  BarChart2
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const isStockRoute = ['/inventory', '/stock-in', '/stock-out', '/transfers', '/categories', '/adjustment'].some(p => location.pathname.startsWith(p));
  const [stockOpen, setStockOpen] = useState(isStockRoute);
  const [selectedWarehouse, setSelectedWarehouse] = useState({ id: null, name: 'All locations' });
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  useEffect(() => {
    if (location.pathname === '/products') {
      const q = new URLSearchParams(location.search).get('search');
      setSearchQuery(q || '');
    }
  }, [location.pathname, location.search]);

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : (user?.firstName ? user.firstName.substring(0, 2).toUpperCase() : 'DP');

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : (user?.firstName || 'Dhrumil Patel');

  return (
    <div className="h-screen bg-[#FBF9F5] flex overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (LIGHT EDITORIAL "STOCKROOM" THEME - SPACIOUS & STATIC) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex lg:flex-col w-60 xl:w-64 bg-white border-r border-[#EBE7DE] shrink-0 h-full select-none text-stone-800 overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-[#F0ECE4] gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center shadow-xs shrink-0">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <span className="font-extrabold text-stone-950 text-sm tracking-wider block font-sans leading-none">
              STOCKROOM
            </span>
            <span className="text-[9.5px] font-medium text-stone-400 block tracking-tight mt-1 leading-none">
              Inventory Today. Growth Tomorrow.
            </span>
          </div>
        </div>

        {/* Navigation links - Medium font weight & balanced sizing */}
        <nav className="flex-1 px-3 pt-3 pb-6 space-y-1 overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Overview */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F5F2EB]'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </NavLink>

          {/* Products */}
          <NavLink
            to="/products"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F5F2EB]'
              }`
            }
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>Products</span>
          </NavLink>

          {/* Stock Accordion */}
          <div>
            <button
              onClick={() => setStockOpen(!stockOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                isStockRoute && !stockOpen
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F5F2EB]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 shrink-0" />
                <span>Stock</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${stockOpen ? 'rotate-180' : ''}`} />
            </button>

            {stockOpen && (
              <div className="pl-5 pr-1 py-1 space-y-0.5 mt-0.5 border-l border-[#EBE7DE] ml-3.5">
                <NavLink
                  to="/inventory"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'text-[#1E3A2F] bg-[#EAF4EE] font-semibold'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-[#F5F2EB]'
                    }`
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>Stock Matrix</span>
                </NavLink>
                <NavLink
                  to="/stock-in"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'text-[#1E3A2F] bg-[#EAF4EE] font-semibold'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-[#F5F2EB]'
                    }`
                  }
                >
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  <span>Stock In</span>
                </NavLink>
                <NavLink
                  to="/stock-out"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'text-[#1E3A2F] bg-[#EAF4EE] font-semibold'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-[#F5F2EB]'
                    }`
                  }
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Stock Out</span>
                </NavLink>
                {hasRole('ADMIN', 'MANAGER') && (
                  <NavLink
                    to="/transfers"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'text-[#1E3A2F] bg-[#EAF4EE] font-semibold'
                          : 'text-stone-500 hover:text-stone-900 hover:bg-[#F5F2EB]'
                      }`
                    }
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Transfers</span>
                  </NavLink>
                )}
                <NavLink
                  to="/categories"
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'text-[#1E3A2F] bg-[#EAF4EE] font-semibold'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-[#F5F2EB]'
                    }`
                  }
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Categories</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Warehouses */}
          <NavLink
            to="/warehouses"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F5F2EB]'
              }`
            }
          >
            <Warehouse className="w-4 h-4 shrink-0" />
            <span>Warehouses</span>
          </NavLink>

          {/* Alerts */}
          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F5F2EB]'
              }`
            }
          >
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 shrink-0" />
              <span>Alerts</span>
            </div>
            <span className="w-5 h-5 rounded-full bg-[#D77259] text-white text-[10px] font-bold flex items-center justify-center">
              3
            </span>
          </NavLink>

          {/* History */}
          <NavLink
            to="/history"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F5F2EB]'
              }`
            }
          >
            <History className="w-4 h-4 shrink-0" />
            <span>History</span>
          </NavLink>

          {/* User Management (Admin only) */}
          {hasRole('ADMIN') && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#1E3A2F] text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-[#F5F2EB]'
                }`
              }
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Users</span>
            </NavLink>
          )}

          {/* Settings */}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-[#F5F2EB]'
              }`
            }
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </NavLink>

          <div className="h-4 shrink-0" />
        </nav>

        {/* Sidebar Footer — User Summary & Logout */}
        <div className="p-3 border-t border-[#EBE7DE] shrink-0 bg-[#FBF9F5] shadow-xs">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white border border-[#EBE7DE] shadow-2xs mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#1E3A2F] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-stone-900 truncate leading-tight">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </p>
              <p className="text-[10px] text-stone-400 capitalize font-medium truncate">
                {user?.role?.toLowerCase() || 'Staff'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative w-72 max-w-[85%] bg-white text-stone-800 h-full flex flex-col z-10 shadow-dropdown border-r border-[#EBE7DE]">
            <div className="h-16 flex items-center justify-between px-5 border-b border-[#F0ECE4]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1E3A2F] text-white flex items-center justify-center">
                  <Boxes className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-stone-900 text-sm tracking-wide">STOCKROOM</span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
              <NavLink
                to="/dashboard"
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive ? 'bg-[#1E3A2F] text-white font-semibold' : 'text-stone-600 hover:bg-[#F5F2EB]'
                  }`
                }
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview</span>
              </NavLink>
              <NavLink
                to="/products"
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive ? 'bg-[#1E3A2F] text-white font-semibold' : 'text-stone-600 hover:bg-[#F5F2EB]'
                  }`
                }
              >
                <Package className="w-4 h-4" />
                <span>Products</span>
              </NavLink>
              <NavLink
                to="/inventory"
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive ? 'bg-[#1E3A2F] text-white font-semibold' : 'text-stone-600 hover:bg-[#F5F2EB]'
                  }`
                }
              >
                <Boxes className="w-4 h-4" />
                <span>Stock Matrix</span>
              </NavLink>
              {hasRole('ADMIN', 'MANAGER') && (
                <NavLink
                  to="/transfers"
                  onClick={() => setMobileDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                      isActive ? 'bg-[#1E3A2F] text-white font-semibold' : 'text-stone-600 hover:bg-[#F5F2EB]'
                    }`
                  }
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  <span>Transfers</span>
                </NavLink>
              )}
              <NavLink
                to="/warehouses"
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive ? 'bg-[#1E3A2F] text-white font-semibold' : 'text-stone-600 hover:bg-[#F5F2EB]'
                  }`
                }
              >
                <Warehouse className="w-4 h-4" />
                <span>Warehouses</span>
              </NavLink>
              <NavLink
                to="/alerts"
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive ? 'bg-[#1E3A2F] text-white font-semibold' : 'text-stone-600 hover:bg-[#F5F2EB]'
                  }`
                }
              >
                <Bell className="w-4 h-4" />
                <span>Alerts</span>
              </NavLink>
              <NavLink
                to="/history"
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive ? 'bg-[#1E3A2F] text-white font-semibold' : 'text-stone-600 hover:bg-[#F5F2EB]'
                  }`
                }
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium ${
                    isActive ? 'bg-[#1E3A2F] text-white font-semibold' : 'text-stone-600 hover:bg-[#F5F2EB]'
                  }`
                }
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </NavLink>
            </nav>

            <div className="p-4 border-t border-[#F0ECE4]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#FBF9F5]">
        {/* Top Header Bar */}
        <header className="h-16 bg-[#FBF9F5] border-b border-[#EBE7DE] px-4 sm:px-8 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4 flex-1 max-w-lg">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-white/80"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, SKU, suppliers..."
                className="w-full bg-[#F4F2EC] text-stone-800 text-xs pl-10 pr-9 py-2 rounded-xl border border-transparent focus:border-[#E0DBD0] focus:bg-white focus:outline-none transition-all placeholder:text-stone-400 shadow-2xs"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-stone-400 font-mono bg-[#EAE6DE] px-1.5 py-0.5 rounded">
                /
              </kbd>
            </form>
          </div>

          <div className="flex items-center gap-3 sm:gap-4 ml-4">
            {/* Location / Warehouse Selector */}
            <div className="relative">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#E5E0D6] shadow-subtle hover:bg-[#FAF8F5] text-xs font-medium text-stone-700 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-stone-600" />
                <span>{selectedWarehouse.name}</span>
                <ChevronDown className="w-3 h-3 text-stone-400" />
              </button>

              {locationDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setLocationDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#EBE7DE] shadow-dropdown z-40 py-1.5 text-xs text-stone-700">
                    <button
                      onClick={() => { setSelectedWarehouse({ id: null, name: 'All locations' }); setLocationDropdownOpen(false); navigate(location.pathname); }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#F5F2EB] font-medium flex items-center justify-between"
                    >
                      <span>All locations</span>
                      {selectedWarehouse.id === null && <span className="text-[#1E3A2F] font-bold">✓</span>}
                    </button>
                    {user?.warehouses?.map(w => (
                      <button
                        key={w.id}
                        onClick={() => { setSelectedWarehouse({ id: w.id, name: w.name }); setLocationDropdownOpen(false); navigate(`${location.pathname}?warehouseId=${w.id}`); }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#F5F2EB] font-medium flex items-center justify-between"
                      >
                        <span className="truncate">{w.name}</span>
                        {selectedWarehouse.id === w.id && <span className="text-[#1E3A2F] font-bold">✓</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => navigate('/alerts')}
              className="relative p-2 rounded-xl bg-white border border-[#E5E0D6] shadow-subtle text-stone-600 hover:text-stone-900 hover:bg-[#FAF8F5] transition-colors"
              title="Stock Alerts"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D77259] text-white text-[9px] font-bold flex items-center justify-center">
                3
              </span>
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-white/80 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-[#18181B] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  {userInitials}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-stone-900 leading-tight">
                    {displayName}
                  </p>
                  <p className="text-[10px] text-stone-400 leading-tight font-medium capitalize">
                    {user?.role?.toLowerCase() || 'Admin'}
                  </p>
                </div>
              </button>

              {userDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setUserDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-[#EBE7DE] shadow-dropdown z-40 py-1.5 text-xs text-stone-700">
                    <div className="px-3.5 py-2.5 border-b border-[#F0ECE4]">
                      <p className="font-semibold text-stone-900">{displayName}</p>
                      <p className="text-stone-400 text-[11px] truncate">{user?.email}</p>
                      <div className="mt-2">
                        <Badge variant={user?.role}>{user?.role}</Badge>
                      </div>
                    </div>
                    <NavLink
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-3.5 py-2 hover:bg-[#FAF8F5] text-stone-700 font-medium"
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

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-6 focus:outline-none">
          <div className="max-w-[1680px] mx-auto w-full pb-16">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
