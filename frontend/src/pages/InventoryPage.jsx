import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import {
  Boxes,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Building2
} from 'lucide-react';

export default function InventoryPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filter & Pagination State
  const [search, setSearch] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const loadFilterOptions = async () => {
    try {
      const [whRes, catRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/categories'),
      ]);
      if (whRes.data.success) setWarehouses(whRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        warehouseId: selectedWarehouse || undefined,
        categoryId: selectedCategory || undefined,
        stockStatus: stockStatus || undefined,
      };

      const res = await api.get('/inventory', { params });
      if (res.data.success) {
        setInventory(res.data.data);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory matrix.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedWarehouse, selectedCategory, stockStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadInventory();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadInventory]);

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const columns = [
    {
      header: 'Product / SKU',
      accessor: 'product_name',
      render: (inv) => (
        <div>
          <span className="font-semibold text-zinc-900 block">{inv.product_name}</span>
          <span className="font-mono text-xs font-bold text-zinc-400">{inv.sku}</span>
        </div>
      ),
    },
    {
      header: 'Facility',
      accessor: 'warehouse_name',
      render: (inv) => (
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <div>
            <span className="font-medium text-zinc-800 block text-xs">{inv.warehouse_name}</span>
            <span className="font-mono text-[10px] text-zinc-400 uppercase">{inv.warehouse_code}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category_name',
      render: (inv) => <span className="text-zinc-600 text-xs font-medium">{inv.category_name}</span>,
    },
    {
      header: 'Available Stock',
      accessor: 'quantity',
      align: 'right',
      render: (inv) => (
        <div>
          <span className="font-mono font-bold text-sm text-zinc-900">{Number(inv.quantity).toLocaleString()}</span>
          <span className="text-[11px] text-zinc-400 ml-1">{inv.unit}</span>
        </div>
      ),
    },
    {
      header: 'Min Threshold',
      accessor: 'minimum_stock',
      align: 'right',
      render: (inv) => <span className="font-mono text-zinc-500 text-xs">{inv.minimum_stock} {inv.unit}</span>,
    },
    {
      header: 'Stock State',
      accessor: 'stock_state',
      align: 'center',
      render: (inv) => {
        const qty = Number(inv.quantity);
        const min = Number(inv.minimum_stock);
        if (qty === 0) return <Badge variant="out_of_stock">Out of Stock</Badge>;
        if (qty <= min) return <Badge variant="low_stock">Low Stock</Badge>;
        return <Badge variant="in_stock">Healthy</Badge>;
      },
    },
    {
      header: 'Last Updated',
      accessor: 'updated_at',
      render: (inv) => <span className="text-zinc-400 text-xs">{formatDate(inv.updated_at)}</span>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowDownRight}
            onClick={() => navigate(`/stock-in?productId=${inv.product_id}&warehouseId=${inv.warehouse_id}`)}
            title="Stock In to this warehouse"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowUpRight}
            onClick={() => navigate(`/stock-out?productId=${inv.product_id}&warehouseId=${inv.warehouse_id}`)}
            title="Stock Out from this warehouse"
          />
          <Button
            size="sm"
            variant="ghost"
            icon={ArrowLeftRight}
            onClick={() => navigate(`/transfers?productId=${inv.product_id}&sourceWarehouseId=${inv.warehouse_id}`)}
            title="Transfer from this warehouse"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Inventory Matrix</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Real-time multi-warehouse inventory quantities, threshold indicators, and instant operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" icon={ArrowDownRight} onClick={() => navigate('/stock-in')}>
            Stock In
          </Button>
          <Button variant="outline" icon={ArrowUpRight} onClick={() => navigate('/stock-out')}>
            Stock Out
          </Button>
          <Button variant="outline" icon={ArrowLeftRight} onClick={() => navigate('/transfers')}>
            Transfer
          </Button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-64">
          <Input
            placeholder="Search product, SKU, facility..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={Search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="w-44">
            <Select
              value={selectedWarehouse}
              onChange={(e) => {
                setSelectedWarehouse(e.target.value);
                setPage(1);
              }}
              placeholder="All Facilities"
              options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
            />
          </div>

          <div className="w-40">
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              placeholder="All Categories"
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            />
          </div>

          <div className="w-36">
            <Select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              placeholder="All States"
              options={[
                { value: 'IN_STOCK', label: 'Healthy' },
                { value: 'LOW_STOCK', label: 'Low Stock' },
                { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Inventory Matrix Table */}
      <Table
        columns={columns}
        data={inventory}
        isLoading={isLoading}
        emptyMessage="No stock records found for the selected filters."
        onRowClick={(inv) => navigate(`/products/${inv.product_id}`)}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />
    </div>
  );
}
