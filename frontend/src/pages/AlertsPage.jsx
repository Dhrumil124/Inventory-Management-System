import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import { AlertCircle, AlertTriangle, AlertOctagon, ArrowDownRight, Clock } from 'lucide-react';

export default function AlertsPage() {
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters State
  const [status, setStatus] = useState('ACTIVE');
  const [alertType, setAlertType] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
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

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 15,
        status: status || undefined,
        alertType: alertType || undefined,
        warehouseId: warehouseId || undefined,
      };

      const res = await api.get('/inventory/alerts', { params });
      if (res.data.success) {
        setAlerts(res.data.data);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory alerts.');
    } finally {
      setIsLoading(false);
    }
  }, [page, status, alertType, warehouseId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAlerts();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadAlerts]);

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns = [
    {
      header: 'Severity / Type',
      accessor: 'alert_type',
      render: (a) => (
        <div className="flex items-center gap-2">
          {a.alert_type === 'OUT_OF_STOCK' ? (
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <Badge variant={a.alert_type}>{a.alert_type.replace('_', ' ')}</Badge>
        </div>
      ),
    },
    {
      header: 'Product / SKU',
      accessor: 'product_name',
      render: (a) => (
        <div>
          <span className="font-semibold text-zinc-900 block">{a.product_name}</span>
          <span className="font-mono text-xs font-bold text-zinc-400">{a.sku}</span>
        </div>
      ),
    },
    {
      header: 'Facility',
      accessor: 'warehouse_name',
      render: (a) => (
        <div>
          <span className="text-zinc-800 font-medium text-xs block">{a.warehouse_name}</span>
          <span className="font-mono text-[10px] text-zinc-400 uppercase">{a.warehouse_code}</span>
        </div>
      ),
    },
    {
      header: 'Current Stock',
      accessor: 'current_quantity',
      align: 'right',
      render: (a) => (
        <span className={`font-mono font-bold text-sm ${a.current_quantity === 0 ? 'text-rose-700' : 'text-amber-700'}`}>
          {a.current_quantity} {a.unit}
        </span>
      ),
    },
    {
      header: 'Min Threshold',
      accessor: 'minimum_stock',
      align: 'right',
      render: (a) => <span className="font-mono text-zinc-500 text-xs">{a.minimum_stock} {a.unit}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (a) => (
        <Badge variant={a.status === 'ACTIVE' ? 'low_stock' : 'in_stock'}>
          {a.status}
        </Badge>
      ),
    },
    {
      header: 'Triggered At',
      accessor: 'created_at',
      render: (a) => (
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>{formatDate(a.created_at)}</span>
        </div>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      render: (a) => (
        a.status === 'ACTIVE' && (
          <Button
            size="sm"
            variant="primary"
            icon={ArrowDownRight}
            onClick={() => navigate(`/stock-in?productId=${a.product_id}&warehouseId=${a.warehouse_id}`)}
          >
            Reorder Stock
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <span>Inventory Stock Alerts</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Automated alerts generated when warehouse levels fall to or below safety minimum thresholds.
          </p>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-40">
            <Select
              label="Alert Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              options={[
                { value: 'ACTIVE', label: 'Active Alerts' },
                { value: 'RESOLVED', label: 'Resolved Alerts' },
                { value: 'ALL', label: 'All Alerts' },
              ]}
            />
          </div>

          <div className="w-40">
            <Select
              label="Alert Type"
              value={alertType}
              onChange={(e) => {
                setAlertType(e.target.value);
                setPage(1);
              }}
              placeholder="All Alert Types"
              options={[
                { value: 'LOW_STOCK', label: 'Low Stock' },
                { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
              ]}
            />
          </div>

          <div className="w-48">
            <Select
              label="Warehouse Facility"
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setPage(1);
              }}
              placeholder="All Facilities"
              options={warehouses.map((w) => ({ value: String(w.id), label: w.name }))}
            />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={alerts}
        isLoading={isLoading}
        emptyMessage={
          status === 'ACTIVE'
            ? 'No active stock alerts. All warehouse products are above safety thresholds!'
            : 'No alerts match your filter criteria.'
        }
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
