import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import {
  Package,
  Building2,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Clock,
  Layers,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productData, setProductData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProduct() {
      setIsLoading(true);
      setError('');
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProductData(res.data.data);
        }
      } catch (err) {
        setError(err.message || 'Failed to load product details.');
      } finally {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val || 0);
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-200/60 rounded w-48 animate-pulse" />
        <div className="h-48 bg-white rounded-xl border border-zinc-200 animate-pulse" />
      </div>
    );
  }

  if (error || !productData) {
    return (
      <div className="space-y-4">
        <Button variant="outline" icon={ArrowLeft} onClick={() => navigate('/products')}>
          Back to Products
        </Button>
        <AlertBanner type="error" message={error || 'Product not found.'} />
      </div>
    );
  }

  const { product, warehouseStock, recentMovements } = productData;
  const totalStockAcrossWarehouses = warehouseStock.reduce((sum, w) => sum + Number(w.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={ArrowLeft} onClick={() => navigate('/products')}>
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900 tracking-tight">{product.name}</h1>
              <Badge variant={product.status}>{product.status}</Badge>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">SKU: {product.sku}</p>
          </div>
        </div>

        {/* Operational Shortcuts */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            icon={ArrowDownRight}
            onClick={() => navigate(`/stock-in?productId=${product.id}`)}
          >
            Stock In
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={ArrowUpRight}
            onClick={() => navigate(`/stock-out?productId=${product.id}`)}
          >
            Stock Out
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={ArrowLeftRight}
            onClick={() => navigate(`/transfers?productId=${product.id}`)}
          >
            Transfer
          </Button>
        </div>
      </div>

      {/* Specifications & Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Category</span>
          <span className="text-sm font-semibold text-zinc-800 mt-1 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-accent-600" />
            <span>{product.category_name}</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Unit Price</span>
          <span className="text-sm font-semibold font-mono text-zinc-900 mt-1 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-brand-600" />
            <span>{formatCurrency(product.price)}</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Safety Threshold</span>
          <span className="text-sm font-semibold font-mono text-zinc-800 mt-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>{product.minimum_stock} {product.unit}</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">Total Available Stock</span>
          <span className="text-lg font-bold font-mono text-zinc-900 mt-0.5 block">
            {totalStockAcrossWarehouses.toLocaleString()} {product.unit}
          </span>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <Card title="Product Specifications & Notes">
          <p className="text-xs text-zinc-600 leading-relaxed">{product.description}</p>
        </Card>
      )}

      {/* Per-Warehouse Stock Availability Breakdown */}
      <Card
        title="Stock by Facility"
        subtitle="Current physical quantity distribution across your authorized warehouses"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/80 text-zinc-400 font-semibold pb-2">
                <th className="py-2.5 px-3">Warehouse Facility</th>
                <th className="py-2.5 px-3">Facility Code</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3 text-right">Available Units</th>
                <th className="py-2.5 px-3 text-center">Alert State</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {warehouseStock.map((wh) => {
                const qty = Number(wh.quantity);
                const min = Number(product.minimum_stock);
                let badgeType = 'in_stock';
                let badgeLabel = 'In Stock';
                if (qty === 0) {
                  badgeType = 'out_of_stock';
                  badgeLabel = 'Out of Stock';
                } else if (qty <= min) {
                  badgeType = 'low_stock';
                  badgeLabel = 'Low Stock';
                }

                return (
                  <tr key={wh.warehouse_id} className="hover:bg-zinc-50/70">
                    <td className="py-3 px-3 font-semibold text-zinc-900 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{wh.warehouse_name}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-zinc-500 uppercase">{wh.warehouse_code}</td>
                    <td className="py-3 px-3 text-zinc-600">{wh.city}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900 text-sm">
                      {qty.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <Badge variant={badgeType}>{badgeLabel}</Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/stock-in?productId=${product.id}&warehouseId=${wh.warehouse_id}`)}
                      >
                        Stock In
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Movement History for this Product */}
      <Card
        title="Recent Movements Audit Trail"
        subtitle="Historical stock adjustments, dispatches, receipts, and transfers for this item"
      >
        {recentMovements.length === 0 ? (
          <p className="text-xs text-zinc-400 py-6 text-center">No movement history recorded yet for this product.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 text-zinc-400 font-semibold pb-2">
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3">Operation Type</th>
                  <th className="py-2.5 px-3 text-right">Quantity</th>
                  <th className="py-2.5 px-3 text-right">Resulting Stock</th>
                  <th className="py-2.5 px-3">Reference / Reason</th>
                  <th className="py-2.5 px-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {recentMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/70">
                    <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{formatDate(m.created_at)}</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-800 font-medium whitespace-nowrap">{m.warehouse_name}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant={m.movement_type}>{m.movement_type}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                      {m.movement_type === 'OUT' || m.movement_type === 'TRANSFER_OUT' ? `-${m.quantity}` : `+${m.quantity}`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-zinc-600 whitespace-nowrap">{m.new_quantity}</td>
                    <td className="py-2.5 px-3 text-zinc-600 max-w-xs truncate" title={m.reason}>
                      {m.reference && <span className="font-mono font-bold text-zinc-800 mr-1.5">[{m.reference}]</span>}
                      {m.reason}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">
                      {m.first_name} {m.last_name}
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
