import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import {
  Warehouse,
  MapPin,
  Phone,
  Mail,
  User,
  Users,
  Clock,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Boxes,
  AlertTriangle
} from 'lucide-react';

export default function WarehouseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [warehouseData, setWarehouseData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadWarehouse() {
      setIsLoading(true);
      setError('');
      try {
        const res = await api.get(`/warehouses/${id}`);
        if (res.data.success) {
          setWarehouseData(res.data.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load warehouse details.');
      } finally {
        setIsLoading(false);
      }
    }

    loadWarehouse();
  }, [id]);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-200/60 rounded w-48 animate-pulse" />
        <div className="h-48 bg-white rounded-xl border border-zinc-200 animate-pulse" />
      </div>
    );
  }

  if (error || !warehouseData) {
    return (
      <div className="space-y-4">
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/warehouses')}>
          Back to Warehouses
        </Button>
        <AlertBanner type="error" message={error || 'Warehouse not found.'} />
      </div>
    );
  }

  const { warehouse, stats, assignedUsers, recentMovements } = warehouseData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/warehouses')}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{warehouse.name}</h1>
              <Badge variant={warehouse.status}>{warehouse.status}</Badge>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">Facility Code: {warehouse.code}</p>
          </div>
        </div>

        {/* Operational Shortcuts for this warehouse */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={ArrowDownRight}
            onClick={() => navigate(`/stock-in?warehouseId=${warehouse.id}`)}
          >
            Stock In Here
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={ArrowUpRight}
            onClick={() => navigate(`/stock-out?warehouseId=${warehouse.id}`)}
          >
            Stock Out
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={ArrowLeftRight}
            onClick={() => navigate(`/transfers?sourceWarehouseId=${warehouse.id}`)}
          >
            Transfer Out
          </Button>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Total SKUs Tracked</span>
          <span className="text-2xl font-bold text-zinc-900 mt-1 block">
            {stats?.total_products || 0}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Total Physical Units</span>
          <span className="text-2xl font-bold font-mono text-zinc-900 mt-1 block">
            {Number(stats?.total_quantity || 0).toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Low Stock Alerts</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">
            {stats?.low_stock_count || 0}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Out of Stock SKUs</span>
          <span className="text-2xl font-bold text-rose-700 mt-1 block">
            {stats?.out_of_stock_count || 0}
          </span>
        </div>
      </div>

      {/* Facility Contact Info Card */}
      <Card title="Facility Location & Contact Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-zinc-700">
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900">Address</p>
              <p className="text-zinc-500 mt-0.5">{warehouse.address}, {warehouse.city}, {warehouse.state} - {warehouse.pincode}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <User className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900">Contact Person</p>
              <p className="text-zinc-500 mt-0.5">{warehouse.contact_person || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Phone className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900">Phone</p>
              <p className="text-zinc-500 mt-0.5">{warehouse.phone || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-forest-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-zinc-900">Email</p>
              <p className="text-zinc-500 mt-0.5">{warehouse.email || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Assigned Operations Staff */}
      <Card
        title="Assigned Personnel"
        subtitle="Managers and staff authorized to perform stock operations at this depot"
      >
        {assignedUsers.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">No staff explicitly mapped to this facility.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedUsers.map((u) => (
              <div key={u.id} className="p-3 bg-zinc-50 rounded-lg border border-zinc-200/70 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-zinc-900">{u.first_name} {u.last_name}</p>
                  <p className="text-zinc-400 text-[11px] truncate">{u.email}</p>
                </div>
                <Badge variant={u.role}>{u.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Recent Movements in this Warehouse */}
      <Card
        title="Recent Facility Activity"
        subtitle="Latest movements and stock operations logged for this warehouse"
      >
        {recentMovements.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">No recorded activity yet for this warehouse.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 text-zinc-400 font-semibold pb-2">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Operation</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Resulting Stock</th>
                  <th className="py-2.5 px-3">Operator</th>
                  <th className="py-2.5 px-3">Reference / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {recentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/70">
                    <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{formatDate(m.created_at)}</span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 whitespace-nowrap">{m.product_name}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={m.movement_type}>{m.movement_type}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      {m.movement_type === 'OUT' || m.movement_type === 'TRANSFER_OUT' ? `-${m.quantity}` : `+${m.quantity}`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-600 whitespace-nowrap">{m.new_quantity}</td>
                    <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                      {m.first_name} {m.last_name}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 max-w-xs truncate" title={m.reason}>
                      {m.reference && <span className="font-mono font-bold text-zinc-800 mr-1">[{m.reference}]</span>}
                      {m.reason}
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
