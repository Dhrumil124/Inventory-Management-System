import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import AlertBanner from '../components/common/AlertBanner';
import {
  Boxes,
  Warehouse,
  AlertTriangle,
  AlertOctagon,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  IndianRupee,
  Layers,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [stockBreakdown, setStockBreakdown] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setError('');
      try {
        const [metRes, brkRes, actRes] = await Promise.all([
          api.get('/dashboard/metrics'),
          api.get('/dashboard/stock-breakdown'),
          api.get('/dashboard/recent-activity'),
        ]);

        setMetrics(metRes.data.data);
        setStockBreakdown(brkRes.data.data);
        setRecentActivity(actRes.data.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard metrics.');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Inventory Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time stock levels, warehouse capacity, and recent movement audit trail.
          </p>
        </div>

        {/* Quick Operational Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={ArrowDownRight}
            onClick={() => navigate('/stock-in')}
          >
            Stock In
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={ArrowUpRight}
            onClick={() => navigate('/stock-out')}
          >
            Stock Out
          </Button>
          {(hasRole('ADMIN') || hasRole('MANAGER')) && (
            <Button
              size="sm"
              variant="outline"
              icon={ArrowLeftRight}
              onClick={() => navigate('/transfers')}
            >
              Transfer
            </Button>
          )}
          {(hasRole('ADMIN') || hasRole('MANAGER')) && (
            <Button
              size="sm"
              variant="secondary"
              icon={SlidersHorizontal}
              onClick={() => navigate('/adjustment')}
            >
              Adjust
            </Button>
          )}
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Stock Units"
          value={isLoading ? '...' : (metrics?.totalStock || 0).toLocaleString()}
          subtitle="Across assigned facilities"
          icon={Boxes}
          variant="brand"
        />
        <StatCard
          title="Inventory Value"
          value={isLoading ? '...' : formatCurrency(metrics?.totalInventoryValue)}
          subtitle="Calculated at unit price"
          icon={IndianRupee}
          variant="accent"
        />
        <StatCard
          title="Active SKUs"
          value={isLoading ? '...' : metrics?.totalProducts || 0}
          subtitle="Registered catalog items"
          icon={Layers}
          variant="default"
        />
        <StatCard
          title="Warehouses"
          value={isLoading ? '...' : metrics?.totalWarehouses || 0}
          subtitle={user?.role === 'ADMIN' ? 'Global network' : 'Your authorized depots'}
          icon={Warehouse}
          variant="blue"
        />
        <StatCard
          title="Low Stock"
          value={isLoading ? '...' : metrics?.lowStockAlerts || 0}
          subtitle="At or below threshold"
          icon={AlertTriangle}
          variant={metrics?.lowStockAlerts > 0 ? 'amber' : 'default'}
        />
        <StatCard
          title="Out of Stock"
          value={isLoading ? '...' : metrics?.outOfStockAlerts || 0}
          subtitle="Critical depletion (0 units)"
          icon={AlertOctagon}
          variant={metrics?.outOfStockAlerts > 0 ? 'rose' : 'default'}
        />
      </div>

      {/* Warehouse Stock Breakdown & Category Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse Distribution */}
        <div className="lg:col-span-2">
          <Card
            title="Warehouse Inventory Breakdown"
            subtitle="Units available across your authorized facilities"
            action={
              <Link to="/inventory" className="text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
                <span>View Full Matrix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {isLoading ? (
              <div className="space-y-4 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-4 bg-slate-200/70 rounded w-1/3" />
                    <div className="h-2 bg-slate-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : stockBreakdown?.warehouseStock?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No warehouse stock data available.</p>
            ) : (
              <div className="space-y-4">
                {stockBreakdown?.warehouseStock?.map((wh) => {
                  const totalSysStock = metrics?.totalStock || 1;
                  const pct = Math.min(100, Math.round(((wh.total_stock || 0) / totalSysStock) * 100));
                  return (
                    <div key={wh.id} className="group">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 group-hover:text-brand-700 transition-colors">
                            {wh.name}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-500">
                            {wh.code}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{Number(wh.total_stock).toLocaleString()}</span>
                          <span className="text-slate-400 ml-1">units ({pct}%)</span>
                        </div>
                      </div>
                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Critical Alerts Requiring Attention */}
        <div>
          <Card
            title="Stock Alerts Requiring Action"
            subtitle="Products depleted below safety levels"
            action={
              <Link to="/alerts" className="text-xs text-brand-600 font-medium hover:text-brand-700">
                All Alerts ({metrics?.lowStockAlerts + metrics?.outOfStockAlerts || 0})
              </Link>
            }
          >
            {isLoading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-lg" />
                ))}
              </div>
            ) : recentActivity?.criticalAlerts?.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <p className="font-medium text-emerald-700">Healthy Inventory</p>
                <p className="mt-0.5 text-slate-400">All products are currently above minimum safety stock.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentActivity?.criticalAlerts?.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold text-slate-900 truncate">{alt.product_name}</p>
                      <p className="text-[11px] text-slate-500">
                        {alt.warehouse_name} • Current: <span className="font-bold text-slate-800">{alt.current_quantity}</span> (Min: {alt.minimum_stock})
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Badge variant={alt.alert_type}>{alt.alert_type.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Recent Movements Audit Trail Feed */}
      <Card
        title="Recent Stock Movements (Audit Trail)"
        subtitle="Latest 8 inventory transactions recorded with user attribution"
        action={
          <Link to="/history" className="text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
            <span>Full Audit Log</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse h-10 bg-zinc-100 rounded" />
            ))}
          </div>
        ) : recentActivity?.recentMovements?.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">No recent stock activity logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 text-zinc-400 font-medium pb-2">
                  <th className="py-2 pr-3 font-semibold">Timestamp</th>
                  <th className="py-2 px-3 font-semibold">Product</th>
                  <th className="py-2 px-3 font-semibold">Warehouse</th>
                  <th className="py-2 px-3 font-semibold">Type</th>
                  <th className="py-2 px-3 font-semibold text-right">Quantity</th>
                  <th className="py-2 px-3 font-semibold text-right">New Stock</th>
                  <th className="py-2 px-3 font-semibold">Operator</th>
                  <th className="py-2 pl-3 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {recentActivity?.recentMovements?.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-2.5 pr-3 text-zinc-500 whitespace-nowrap flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
                      <span>{formatDate(m.created_at)}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 whitespace-nowrap">
                      {m.product_name}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                      {m.warehouse_name}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={m.movement_type}>{m.movement_type}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900 whitespace-nowrap">
                      {m.movement_type === 'OUT' || m.movement_type === 'TRANSFER_OUT' ? `-${m.quantity}` : `+${m.quantity}`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-600 whitespace-nowrap">
                      {m.new_quantity}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                      {m.first_name} {m.last_name}
                    </td>
                    <td className="py-2.5 pl-3 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {m.reference || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
