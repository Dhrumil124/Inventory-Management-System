import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import { History, Search, Filter, Clock, RotateCcw } from 'lucide-react';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [movementType, setMovementType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  useEffect(() => {
    async function loadWarehouses() {
      try {
        const res = await api.get('/warehouses');
        if (res.data.success) setWarehouses(res.data.data);
      } catch {
        // ignore
      }
    }
    loadWarehouses();
  }, []);

  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 15,
        search: search || undefined,
        warehouseId: warehouseId || undefined,
        movementType: movementType || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const res = await api.get('/inventory/history', { params });
      if (res.data.success) {
        setHistory(res.data.data);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory history.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, warehouseId, movementType, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadHistory]);

  const handleResetFilters = () => {
    setSearch('');
    setWarehouseId('');
    setMovementType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      header: 'Timestamp',
      accessor: 'created_at',
      render: (m) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>{formatDate(m.created_at)}</span>
        </div>
      ),
    },
    {
      header: 'Product / SKU',
      accessor: 'product_name',
      render: (m) => (
        <div>
          <span className="font-semibold text-zinc-900 block">{m.product_name}</span>
          <span className="font-mono text-[11px] text-zinc-400 font-bold">{m.sku}</span>
        </div>
      ),
    },
    {
      header: 'Facility',
      accessor: 'warehouse_name',
      render: (m) => (
        <div>
          <span className="text-zinc-800 font-medium block text-xs">{m.warehouse_name}</span>
          <span className="font-mono text-[10px] text-zinc-400 uppercase">{m.warehouse_code}</span>
        </div>
      ),
    },
    {
      header: 'Operation',
      accessor: 'movement_type',
      align: 'center',
      render: (m) => <Badge variant={m.movement_type}>{m.movement_type}</Badge>,
    },
    {
      header: 'Delta',
      accessor: 'quantity',
      align: 'right',
      render: (m) => {
        const isDeduction = m.movement_type === 'OUT' || m.movement_type === 'TRANSFER_OUT';
        return (
          <span
            className={`font-mono font-bold text-xs ${
              isDeduction ? 'text-orange-700' : 'text-emerald-700'
            }`}
          >
            {isDeduction ? `-${m.quantity}` : `+${m.quantity}`} {m.unit}
          </span>
        );
      },
    },
    {
      header: 'Prev Stock',
      accessor: 'previous_quantity',
      align: 'right',
      render: (m) => <span className="font-mono text-zinc-500 text-xs">{m.previous_quantity}</span>,
    },
    {
      header: 'New Stock',
      accessor: 'new_quantity',
      align: 'right',
      render: (m) => <span className="font-mono font-semibold text-zinc-900 text-xs">{m.new_quantity}</span>,
    },
    {
      header: 'Reference & Reason',
      accessor: 'reason',
      render: (m) => (
        <div className="max-w-xs text-xs text-zinc-700">
          {m.reference && (
            <span className="font-mono font-bold text-zinc-900 mr-1.5 px-1 py-0.5 bg-zinc-100 rounded text-[11px]">
              {m.reference}
            </span>
          )}
          <span className="text-zinc-600 line-clamp-1" title={m.reason}>
            {m.reason}
          </span>
        </div>
      ),
    },
    {
      header: 'Operator',
      accessor: 'first_name',
      render: (m) => (
        <span className="text-xs text-zinc-600 whitespace-nowrap">
          {m.first_name} {m.last_name}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-forest-800" />
            <span>Inventory Audit Trail</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Immutable historical record of every stock movement, transfer, and adjustment with user attribution.
          </p>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="w-full md:w-80">
            <Input
              placeholder="Search product, SKU, reference, or reason..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              icon={Search}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="w-40">
              <Select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setPage(1);
                }}
                placeholder="All Facilities"
                options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
              />
            </div>

            <div className="w-40">
              <Select
                value={movementType}
                onChange={(e) => {
                  setMovementType(e.target.value);
                  setPage(1);
                }}
                placeholder="All Types"
                options={[
                  { value: 'IN', label: 'IN (Receipt)' },
                  { value: 'OUT', label: 'OUT (Dispatch)' },
                  { value: 'TRANSFER_IN', label: 'TRANSFER IN' },
                  { value: 'TRANSFER_OUT', label: 'TRANSFER OUT' },
                  { value: 'ADJUSTMENT', label: 'ADJUSTMENT' },
                ]}
              />
            </div>

            <div className="w-36">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
                title="From Date"
              />
            </div>

            <div className="w-36">
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
                title="To Date"
              />
            </div>

            {(search || warehouseId || movementType || startDate || endDate) && (
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={handleResetFilters}>
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* History Table */}
      <Table
        columns={columns}
        data={history}
        isLoading={isLoading}
        emptyMessage="No audit movement records found matching your filters."
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
