import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import StatCard from '../components/common/StatCard';
import Badge from '../components/common/Badge';
import {
  Boxes,
  Warehouse,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  IndianRupee,
  Clock,
  ArrowRight,
  Plus,
  BarChart2,
  MapPin,
  ChevronDown,
  Bell,
  CheckCircle2,
  Layers,
  ArrowUp,
  RotateCcw
} from 'lucide-react';

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState(null);
  const [stockBreakdown, setStockBreakdown] = useState(null);
  const [recentActivity, setRecentActivity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState('Last 30 days');
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  const [searchParams] = useSearchParams();
  const warehouseId = searchParams.get('warehouseId');

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      setError('');
      try {
        const wqp = warehouseId ? `?warehouseId=${warehouseId}` : '';
        const [metRes, brkRes, actRes] = await Promise.all([
          api.get(`/dashboard/metrics${wqp}`),
          api.get(`/dashboard/stock-breakdown${wqp}`),
          api.get(`/dashboard/recent-activity${wqp}`),
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
  }, [warehouseId]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 1243500);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Chart data points matching the reference dual bar + spline chart
  const movementChartData = [
    { date: '15 Aug', stockIn: 540, stockOut: 320, netStock: 980 },
    { date: '20 Aug', stockIn: 620, stockOut: 510, netStock: 1040 },
    { date: '25 Aug', stockIn: 780, stockOut: 460, netStock: 1220 },
    { date: '30 Aug', stockIn: 690, stockOut: 480, netStock: 1190 },
    { date: '04 Sep', stockIn: 840, stockOut: 590, netStock: 1350 },
    { date: '09 Sep', stockIn: 750, stockOut: 620, netStock: 1310 },
    { date: '14 Sep', stockIn: 1180, stockOut: 980, netStock: 1510 },
  ];

  // Default / fallback Attention Items if database is clean
  const fallbackAttentionItems = [
    {
      id: 1,
      name: 'Wireless Keyboard',
      sku: 'KB-001',
      warehouse: 'Mumbai',
      available: 8,
      reorderPoint: 20,
      status: 'Low Stock',
      icon: '⌨️'
    },
    {
      id: 2,
      name: 'A4 Paper (500 sheets)',
      sku: 'PPR-004',
      warehouse: 'Ahmedabad',
      available: 12,
      reorderPoint: 50,
      status: 'Low Stock',
      icon: '📄'
    },
    {
      id: 3,
      name: 'USB-C Hub',
      sku: 'HUB-007',
      warehouse: 'Bengaluru',
      available: 4,
      reorderPoint: 15,
      status: 'Low Stock',
      icon: '🔌'
    },
    {
      id: 4,
      name: 'Office Chair',
      sku: 'CHR-002',
      warehouse: 'Delhi',
      available: 3,
      reorderPoint: 10,
      status: 'Low Stock',
      icon: '🪑'
    },
    {
      id: 5,
      name: 'Monitor 27"',
      sku: 'MON-027',
      warehouse: 'Mumbai',
      available: 5,
      reorderPoint: 10,
      status: 'Low Stock',
      icon: '🖥️'
    }
  ];

  // Default / fallback Recent Activity if clean
  const fallbackActivityItems = [
    {
      id: 101,
      time: '14 Sep, 10:24',
      type: 'Stock In',
      typeVariant: 'stock_in',
      product: 'A4 Paper',
      qty: '+200',
      qtyColor: 'text-[#246A48]',
      warehouse: 'Ahmedabad',
      by: 'DP',
      ref: '#GRN-1043'
    },
    {
      id: 102,
      time: '14 Sep, 09:12',
      type: 'Stock Out',
      typeVariant: 'stock_out',
      product: 'Wireless Keyboard',
      qty: '-15',
      qtyColor: 'text-[#C44D3A]',
      warehouse: 'Mumbai',
      by: 'SK',
      ref: '#SO-2219'
    },
    {
      id: 103,
      time: '14 Sep, 08:45',
      type: 'Transfer',
      typeVariant: 'transfer',
      product: 'Monitor 27"',
      qty: '-5',
      qtyColor: 'text-[#2B638A]',
      warehouse: 'Delhi → Mumbai',
      by: 'RJ',
      ref: '#TR-0082'
    },
    {
      id: 104,
      time: '13 Sep, 17:30',
      type: 'Stock In',
      typeVariant: 'stock_in',
      product: 'USB-C Hub',
      qty: '+50',
      qtyColor: 'text-[#246A48]',
      warehouse: 'Bengaluru',
      by: 'DP',
      ref: '#GRN-1042'
    },
    {
      id: 105,
      time: '13 Sep, 14:11',
      type: 'Stock Out',
      typeVariant: 'stock_out',
      product: 'Office Chair',
      qty: '-2',
      qtyColor: 'text-[#C44D3A]',
      warehouse: 'Delhi',
      by: 'AM',
      ref: '#SO-2218'
    },
    {
      id: 106,
      time: '13 Sep, 11:06',
      type: 'Adjustment',
      typeVariant: 'adjustment',
      product: 'A4 Paper',
      qty: '-10',
      qtyColor: 'text-stone-700',
      warehouse: 'Mumbai',
      by: 'SK',
      ref: '#ADJ-0031'
    }
  ];

  // Prepare attention items: prefer real API alerts, fallback to rich sample
  const attentionItems = (recentActivity?.criticalAlerts && recentActivity.criticalAlerts.length > 0)
    ? recentActivity.criticalAlerts.map(alt => ({
        id: alt.id,
        name: alt.product_name,
        sku: alt.sku || 'SKU-ITEM',
        warehouse: alt.warehouse_name ? alt.warehouse_name.split(' ')[0] : 'Main Depot',
        available: alt.current_quantity,
        reorderPoint: alt.minimum_stock,
        status: alt.alert_type === 'OUT_OF_STOCK' ? 'Out of Stock' : 'Low Stock',
        icon: '📦'
      }))
    : fallbackAttentionItems;

  // Prepare activity items: prefer real API recent movements, fallback to rich sample
  const activityItems = (recentActivity?.recentMovements && recentActivity.recentMovements.length > 0)
    ? recentActivity.recentMovements.map(m => {
        const isNegative = m.movement_type === 'OUT' || m.movement_type === 'TRANSFER_OUT';
        const isTransfer = m.movement_type.includes('TRANSFER');
        const isAdjustment = m.movement_type === 'ADJUSTMENT';
        const initials = `${m.first_name?.[0] || 'U'}${m.last_name?.[0] || 'P'}`;
        
        let typeVariant = 'stock_in';
        let typeLabel = 'Stock In';
        if (isTransfer) { typeVariant = 'transfer'; typeLabel = 'Transfer'; }
        else if (isAdjustment) { typeVariant = 'adjustment'; typeLabel = 'Adjustment'; }
        else if (isNegative) { typeVariant = 'stock_out'; typeLabel = 'Stock Out'; }

        return {
          id: m.id,
          time: formatDate(m.created_at),
          type: typeLabel,
          typeVariant,
          product: m.product_name,
          qty: isNegative ? `-${m.quantity}` : `+${m.quantity}`,
          qtyColor: isNegative ? 'text-[#C44D3A]' : isTransfer ? 'text-[#2B638A]' : 'text-[#246A48]',
          warehouse: m.warehouse_name ? m.warehouse_name.split(' ')[0] : 'Depot',
          by: initials,
          ref: m.reference || `#MOV-${m.id}`
        };
      })
    : fallbackActivityItems;

  const totalStockUnits = metrics?.totalStock ? metrics.totalStock.toLocaleString() : '12,486';
  const totalWarehousesCount = metrics?.totalWarehouses || 4;

  return (
    <div className="space-y-6 sm:space-y-7">
      {/* ========================================================================= */}
      {/* TOP EDITORIAL HEADER */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
            Inventory control
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1">
            Real-time visibility. Smarter decisions.
          </p>
        </div>

        <div className="flex flex-col md:items-end text-xs">
          <p className="font-semibold text-stone-800">
            Sunday, 14 September 2026
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-stone-400">Week 37 · FY 2026</span>
            <span className="hidden sm:inline text-stone-300">|</span>
            <span className="text-[10px] tracking-wider text-stone-400 font-bold uppercase">
              STOCK MOVES BUSINESS —
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 STAT CARDS + QUICK ACTIONS ROW */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1.18fr_0.92fr_1.05fr_1.55fr] gap-2.5 sm:gap-3 xl:gap-4 items-stretch">
        {/* Card 1: Units on hand */}
        <StatCard
          title="Units on hand"
          value={isLoading ? '...' : totalStockUnits}
          icon={Boxes}
          variant="gray"
          trend={{ value: '↑ 6.2%', label: 'vs last month', positive: true }}
        />

        {/* Card 2: Inventory value */}
        <StatCard
          title="Inventory value"
          value={isLoading ? '...' : formatCurrency(metrics?.totalInventoryValue)}
          icon={IndianRupee}
          variant="mint"
          trend={{ value: '↑ 8.1%', label: 'vs last month', positive: true }}
        />

        {/* Card 3: Low-stock items */}
        <StatCard
          title="Low-stock items"
          value={isLoading ? '...' : (metrics?.lowStockAlerts || 18)}
          icon={AlertTriangle}
          variant="peach"
          trend={{ value: '↑ 3 new', label: 'vs yesterday', positive: false }}
        />

        {/* Card 4: Today's movements */}
        <StatCard
          title="Today's movements"
          value={isLoading ? '...' : '342'}
          icon={ArrowLeftRight}
          variant="sage"
          trend={{ value: '↑ 12%', label: 'vs yesterday', positive: true }}
        />

        {/* Card 5: Quick Actions Panel */}
        <div className="bg-white rounded-2xl border border-[#EBE7DE] p-2.5 sm:p-3 xl:p-3.5 shadow-card flex flex-col justify-between min-w-[210px]">
          <p className="text-xs font-semibold text-stone-800 mb-1.5 leading-tight">
            Quick actions
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            <button
              onClick={() => navigate('/products')}
              className="bg-[#1E3A2F] text-white hover:bg-[#25483A] active:bg-[#162D24] text-[11px] xl:text-xs font-medium py-1.5 px-2 xl:py-2 xl:px-2.5 rounded-xl flex items-center justify-center gap-1 whitespace-nowrap shadow-2xs transition-all"
            >
              <Plus className="w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0" />
              <span>Add product</span>
            </button>
            <button
              onClick={() => navigate('/stock-in')}
              className="bg-white text-stone-700 hover:bg-[#FAF8F5] border border-[#E5E0D6] text-[11px] xl:text-xs font-medium py-1.5 px-2 xl:py-2 xl:px-2.5 rounded-xl flex items-center justify-center gap-1 whitespace-nowrap shadow-subtle transition-all"
            >
              <ArrowDownRight className="w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0 text-stone-500" />
              <span>Stock in</span>
            </button>
            <button
              onClick={() => navigate('/stock-out')}
              className="bg-white text-stone-700 hover:bg-[#FAF8F5] border border-[#E5E0D6] text-[11px] xl:text-xs font-medium py-1.5 px-2 xl:py-2 xl:px-2.5 rounded-xl flex items-center justify-center gap-1 whitespace-nowrap shadow-subtle transition-all"
            >
              <ArrowUpRight className="w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0 text-stone-500" />
              <span>Stock out</span>
            </button>
            <button
              onClick={() => navigate(hasRole(['ADMIN', 'MANAGER']) ? '/transfers' : '/stock-in')}
              className="bg-white text-stone-700 hover:bg-[#FAF8F5] border border-[#E5E0D6] text-[11px] xl:text-xs font-medium py-1.5 px-2 xl:py-2 xl:px-2.5 rounded-xl flex items-center justify-center gap-1 whitespace-nowrap shadow-subtle transition-all"
            >
              <ArrowLeftRight className="w-3 h-3 xl:w-3.5 xl:h-3.5 shrink-0 text-stone-500" />
              <span>Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MIDDLE ROW: STOCK MOVEMENT CHART & WAREHOUSE NETWORK */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* STOCK MOVEMENT CHART (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EBE7DE] p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0ECE4]">
            <div>
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-semibold text-stone-900 tracking-tight">Stock movement</h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">Track stock-in and stock-out across all warehouses</p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              {/* Legend */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4E9B78]" />
                  <span className="text-stone-500 text-[11px]">Stock In</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D77259]" />
                  <span className="text-stone-500 text-[11px]">Stock Out</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A2F]" />
                  <span className="text-stone-500 text-[11px]">Net Stock</span>
                </div>
              </div>

              {/* Filter */}
              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E5E0D6] text-[11px] font-medium text-stone-700 hover:bg-[#F2EFE9] transition-colors"
                >
                  <span>{timeFilter}</span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>
              </div>
            </div>
          </div>

          {/* SVG DUAL BAR & SPLINE CHART */}
          <div className="mt-4 pt-2">
            <div className="relative h-64 w-full">
              <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
                {/* Horizontal Grid lines */}
                <line x1="45" y1="20" x2="685" y2="20" stroke="#F0ECE4" strokeDasharray="3 3" />
                <line x1="45" y1="65" x2="685" y2="65" stroke="#F0ECE4" strokeDasharray="3 3" />
                <line x1="45" y1="110" x2="685" y2="110" stroke="#F0ECE4" strokeDasharray="3 3" />
                <line x1="45" y1="155" x2="685" y2="155" stroke="#F0ECE4" strokeDasharray="3 3" />
                <line x1="45" y1="200" x2="685" y2="200" stroke="#E5E0D6" />

                {/* Y-Axis Labels */}
                <text x="35" y="24" textAnchor="end" className="text-[10px] fill-stone-400 font-sans">2,000</text>
                <text x="35" y="69" textAnchor="end" className="text-[10px] fill-stone-400 font-sans">1,500</text>
                <text x="35" y="114" textAnchor="end" className="text-[10px] fill-stone-400 font-sans">1,000</text>
                <text x="35" y="159" textAnchor="end" className="text-[10px] fill-stone-400 font-sans">500</text>
                <text x="35" y="204" textAnchor="end" className="text-[10px] fill-stone-400 font-sans">0</text>

                {/* Bars & Line Points */}
                {movementChartData.map((d, i) => {
                  const stepX = 90;
                  const centerX = 85 + i * stepX;
                  const barWidth = 10;
                  const maxHeight = 180; // from y=20 to y=200
                  const maxVal = 2000;

                  const inHeight = (d.stockIn / maxVal) * maxHeight;
                  const outHeight = (d.stockOut / maxVal) * maxHeight;
                  const netY = 200 - (d.netStock / maxVal) * maxHeight;

                  return (
                    <g key={d.date} className="cursor-pointer group">
                      {/* Bar 1: Stock In (Green) */}
                      <rect
                        x={centerX - 12}
                        y={200 - inHeight}
                        width={barWidth}
                        height={inHeight}
                        rx="3"
                        fill="#4E9B78"
                        className="transition-all hover:opacity-85"
                      />

                      {/* Bar 2: Stock Out (Terracotta) */}
                      <rect
                        x={centerX + 2}
                        y={200 - outHeight}
                        width={barWidth}
                        height={outHeight}
                        rx="3"
                        fill="#D77259"
                        className="transition-all hover:opacity-85"
                      />

                      {/* X-Axis Date */}
                      <text
                        x={centerX}
                        y="222"
                        textAnchor="middle"
                        className="text-[10px] fill-stone-500 font-sans font-medium"
                      >
                        {d.date}
                      </text>
                    </g>
                  );
                })}

                {/* Net Stock Continuous Line Graph */}
                <path
                  d={`M ${85} ${200 - (movementChartData[0].netStock / 2000) * 180} ` +
                    movementChartData.slice(1).map((d, i) => {
                      const x = 85 + (i + 1) * 90;
                      const y = 200 - (d.netStock / 2000) * 180;
                      return `L ${x} ${y}`;
                    }).join(' ')}
                  fill="none"
                  stroke="#1E3A2F"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Point dots on the line */}
                {movementChartData.map((d, i) => {
                  const x = 85 + i * 90;
                  const y = 200 - (d.netStock / 2000) * 180;
                  return (
                    <circle
                      key={`point-${i}`}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="#1E3A2F"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      className="cursor-pointer hover:r-6 transition-all"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* WAREHOUSE NETWORK MAP & KPI (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EBE7DE] p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE4]">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-semibold text-stone-900 tracking-tight">Warehouse network</h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">{totalWarehousesCount} warehouses · {totalStockUnits} units</p>
            </div>
            <Link
              to="/warehouses"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mt-3 items-center">
            {/* Map Graphic with live node markers (7 cols) */}
            <div className="sm:col-span-7 relative h-56 flex items-center justify-center p-2 bg-[#FAF8F5]/60 rounded-xl border border-[#F0ECE4]">
              {/* Stylized SVG Map Silhouette */}
              <svg className="w-full h-full max-h-48 text-stone-200" viewBox="0 0 200 240" fill="currentColor">
                <path d="M70,25 C85,20 115,22 125,35 C132,44 140,55 130,68 C120,78 135,90 145,100 C155,110 170,115 160,130 C150,145 135,140 120,150 C110,160 105,180 95,205 C85,185 80,165 70,150 C55,135 45,120 50,105 C55,90 60,75 58,60 C56,45 60,30 70,25 Z" opacity="0.4" />
              </svg>

              {/* Live Warehouse Pins & Callout Cards */}
              {(() => {
                const whList = stockBreakdown?.warehouseStock || [];
                const getWhStock = (cityName, fallback) => {
                  const match = whList.find(w => 
                    (w.city && w.city.toLowerCase().includes(cityName.toLowerCase())) || 
                    (w.name && w.name.toLowerCase().includes(cityName.toLowerCase()))
                  );
                  return match ? Number(match.total_stock).toLocaleString() : fallback;
                };

                return (
                  <>
                    {/* Delhi */}
                    <div className="absolute top-6 right-10 flex flex-col items-center">
                      <div className="bg-white/95 backdrop-blur-xs border border-[#E5E0D6] rounded-md px-1.5 py-0.5 shadow-2xs text-[9px] font-medium text-stone-800 whitespace-nowrap">
                        <span className="font-bold">Delhi</span> · {getWhStock('delhi', '1,924')} units
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A2F] ring-4 ring-[#1E3A2F]/20 mt-1" />
                    </div>

                    {/* Ahmedabad */}
                    <div className="absolute top-20 left-4 flex flex-col items-start">
                      <div className="bg-white/95 backdrop-blur-xs border border-[#E5E0D6] rounded-md px-1.5 py-0.5 shadow-2xs text-[9px] font-medium text-stone-800 whitespace-nowrap">
                        <span className="font-bold">Ahmedabad</span> · {getWhStock('ahmedabad', '2,856')} units
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A2F] ring-4 ring-[#1E3A2F]/20 mt-1 ml-4" />
                    </div>

                    {/* Mumbai */}
                    <div className="absolute top-32 left-10 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A2F] ring-4 ring-[#1E3A2F]/20 mb-1" />
                      <div className="bg-white/95 backdrop-blur-xs border border-[#E5E0D6] rounded-md px-1.5 py-0.5 shadow-2xs text-[9px] font-medium text-stone-800 whitespace-nowrap">
                        <span className="font-bold">Mumbai</span> · {getWhStock('mumbai', '4,210')} units
                      </div>
                    </div>

                    {/* Surat / South Node */}
                    <div className="absolute bottom-4 right-12 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1E3A2F] ring-4 ring-[#1E3A2F]/20 mb-1" />
                      <div className="bg-white/95 backdrop-blur-xs border border-[#E5E0D6] rounded-md px-1.5 py-0.5 shadow-2xs text-[9px] font-medium text-stone-800 whitespace-nowrap">
                        <span className="font-bold">Surat</span> · {getWhStock('surat', '3,496')} units
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Warehouse Metrics Summary Column (5 cols) */}
            <div className="sm:col-span-5 space-y-3.5 pl-1 sm:pl-3">
              <div>
                <p className="text-xl font-bold text-stone-900 leading-none">
                  {totalWarehousesCount}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Warehouses</p>
              </div>

              <div>
                <p className="text-xl font-bold text-stone-900 leading-none">
                  {totalStockUnits}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Total units</p>
              </div>

              <div>
                <p className="text-xl font-bold text-stone-900 leading-none">
                  1,250 sq. ft.
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5 font-medium">Total storage area</p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-sm font-bold text-stone-900">98.5%</span>
                  <span className="text-[10px] text-stone-400 font-medium">Utilization</span>
                </div>
                <div className="w-full bg-[#FAF8F5] border border-[#EBE7DE] rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#1E3A2F] h-full rounded-full" style={{ width: '98.5%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM ROW: NEEDS ATTENTION & ACTIVITY LEDGER */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* NEEDS ATTENTION TABLE (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EBE7DE] p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE4]">
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#C44D3A]" />
                <h3 className="text-sm font-semibold text-stone-900 tracking-tight">Needs attention</h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">Items at or below reorder point</p>
            </div>
            <Link
              to="/alerts"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F0ECE4] text-[11px] text-stone-400 font-medium">
                  <th className="py-2.5 pr-2 font-medium">Product</th>
                  <th className="py-2.5 px-2 font-medium">SKU</th>
                  <th className="py-2.5 px-2 font-medium">Warehouse</th>
                  <th className="py-2.5 px-2 font-medium text-center">Available</th>
                  <th className="py-2.5 px-2 font-medium text-center">Reorder Point</th>
                  <th className="py-2.5 px-2 font-medium text-center">Status</th>
                  <th className="py-2.5 pl-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5] text-stone-700">
                {attentionItems.slice(0, 5).map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-2.5 pr-2 font-semibold text-stone-900 flex items-center gap-2 truncate max-w-[140px]">
                      <span className="text-sm shrink-0">{item.icon}</span>
                      <span className="truncate">{item.name}</span>
                    </td>
                    <td className="py-2.5 px-2 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      {item.sku}
                    </td>
                    <td className="py-2.5 px-2 text-stone-600 whitespace-nowrap">
                      {item.warehouse}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold text-[#C44D3A] whitespace-nowrap">
                      {item.available}
                    </td>
                    <td className="py-2.5 px-2 text-center text-stone-500 whitespace-nowrap">
                      {item.reorderPoint}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FDEEE9] text-[#C44D3A] border border-[#FCD8CD]">
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => navigate('/stock-in')}
                        className="px-2 py-1 rounded-lg border border-[#E5E0D6] bg-white text-[10px] font-medium text-stone-700 hover:bg-[#FAF8F5] hover:border-stone-400 transition-colors shadow-2xs"
                      >
                        Reorder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTIVITY LEDGER TABLE (6 COLS) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EBE7DE] p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between pb-3.5 border-b border-[#F0ECE4]">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-semibold text-stone-900 tracking-tight">Activity ledger</h3>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">Recent stock movements across all locations</p>
            </div>
            <Link
              to="/history"
              className="text-xs font-medium text-stone-600 hover:text-stone-900 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#F0ECE4] text-[11px] text-stone-400 font-medium">
                  <th className="py-2.5 pr-2 font-medium">Time</th>
                  <th className="py-2.5 px-2 font-medium">Type</th>
                  <th className="py-2.5 px-2 font-medium">Product</th>
                  <th className="py-2.5 px-2 font-medium text-right">Qty</th>
                  <th className="py-2.5 px-2 font-medium">Warehouse</th>
                  <th className="py-2.5 px-2 font-medium text-center">By</th>
                  <th className="py-2.5 pl-2 font-medium text-right">Ref. No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5] text-stone-700">
                {activityItems.slice(0, 6).map((item) => (
                  <tr key={item.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-2.5 pr-2 text-stone-500 whitespace-nowrap text-[11px]">
                      {item.time}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <Badge variant={item.typeVariant} size="sm">
                        {item.type}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-stone-900 whitespace-nowrap truncate max-w-[120px]">
                      {item.product}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono font-bold whitespace-nowrap ${item.qtyColor}`}>
                      {item.qty}
                    </td>
                    <td className="py-2.5 px-2 text-stone-600 whitespace-nowrap truncate max-w-[110px]">
                      {item.warehouse}
                    </td>
                    <td className="py-2.5 px-2 text-center whitespace-nowrap">
                      <span className="inline-block w-5 h-5 rounded-full bg-stone-100 text-stone-700 text-[9px] font-bold leading-5 border border-stone-200">
                        {item.by}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono text-[10px] text-stone-400 whitespace-nowrap">
                      {item.ref}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM ALERT BANNER */}
      {/* ========================================================================= */}
      <div className="bg-[#FDF3EE] rounded-2xl border border-[#F7DFD3] p-4.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#FCE8DF] text-[#C44D3A] flex items-center justify-center shrink-0 border border-[#FAD6C6]">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-stone-900">
              3 items crossed reorder point today
            </h4>
            <p className="text-xs text-stone-600 mt-0.5">
              Wireless Keyboard, USB-C Hub, Office Chair are below their reorder levels.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 self-end sm:self-center">
          <button
            onClick={() => navigate('/alerts')}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E5E0D6] shadow-subtle hover:bg-[#FAF8F5] text-xs font-semibold text-stone-800 transition-colors"
          >
            View alerts →
          </button>
          <span className="hidden lg:inline text-xs italic text-stone-400 font-serif">
            “Good inventory management turns hidden costs into visible opportunities.”
          </span>
        </div>
      </div>
    </div>
  );
}
