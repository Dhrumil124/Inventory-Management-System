import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AlertBanner from '../components/common/AlertBanner';
import Badge from '../components/common/Badge';
import { ArrowLeftRight, CheckCircle2, AlertTriangle, Building2, Clock } from 'lucide-react';

export default function TransfersPage() {
  const [searchParams] = useSearchParams();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [sourceStock, setSourceStock] = useState(null);
  const [destStock, setDestStock] = useState(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const [form, setForm] = useState({
    sourceWarehouseId: searchParams.get('sourceWarehouseId') || '',
    destinationWarehouseId: '',
    productId: searchParams.get('productId') || '',
    quantity: '',
    reference: '',
    reason: '',
  });

  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [recentTransfers, setRecentTransfers] = useState([]);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [whRes, prodRes, histRes] = await Promise.all([
          api.get('/warehouses'),
          api.get('/products?limit=100'),
          api.get('/inventory/history?movementType=TRANSFER_OUT&limit=5'),
        ]);
        if (whRes.data.success) setWarehouses(whRes.data.data);
        if (prodRes.data.success) setProducts(prodRes.data.data);
        if (histRes.data.success) setRecentTransfers(histRes.data.data);
      } catch (err) {
        setError('Failed to load transfer configuration.');
      }
    }
    loadInitialData();
  }, []);

  // Fetch stocks when product, source, or destination changes
  useEffect(() => {
    async function fetchBothStocks() {
      if (!form.productId) {
        setSourceStock(null);
        setDestStock(null);
        return;
      }

      setIsLoadingStock(true);
      try {
        if (form.sourceWarehouseId) {
          const resSrc = await api.get(`/inventory?warehouseId=${form.sourceWarehouseId}&search=${form.productId}`);
          const matchSrc = resSrc.data.data?.find(
            (i) => i.warehouse_id === parseInt(form.sourceWarehouseId, 10) && i.product_id === parseInt(form.productId, 10)
          );
          setSourceStock(matchSrc ? Number(matchSrc.quantity) : 0);
        } else {
          setSourceStock(null);
        }

        if (form.destinationWarehouseId) {
          const resDst = await api.get(`/inventory?warehouseId=${form.destinationWarehouseId}&search=${form.productId}`);
          const matchDst = resDst.data.data?.find(
            (i) => i.warehouse_id === parseInt(form.destinationWarehouseId, 10) && i.product_id === parseInt(form.productId, 10)
          );
          setDestStock(matchDst ? Number(matchDst.quantity) : 0);
        } else {
          setDestStock(null);
        }
      } catch {
        // ignore
      } finally {
        setIsLoadingStock(false);
      }
    }

    fetchBothStocks();
  }, [form.productId, form.sourceWarehouseId, form.destinationWarehouseId]);

  const selectedProductObj = products.find((p) => String(p.id) === String(form.productId));
  const sourceWhObj = warehouses.find((w) => String(w.id) === String(form.sourceWarehouseId));
  const destWhObj = warehouses.find((w) => String(w.id) === String(form.destinationWarehouseId));

  const qtyNumber = parseInt(form.quantity, 10) || 0;
  const isOverdraft = sourceStock !== null && qtyNumber > sourceStock;

  const sourceNew = (sourceStock !== null ? sourceStock : 0) - qtyNumber;
  const destNew = (destStock !== null ? destStock : 0) + qtyNumber;

  const handleValidate = (e) => {
    e.preventDefault();
    setError('');

    if (!form.sourceWarehouseId) {
      setError('Please select a source warehouse.');
      return;
    }
    if (!form.destinationWarehouseId) {
      setError('Please select a destination warehouse.');
      return;
    }
    if (form.sourceWarehouseId === form.destinationWarehouseId) {
      setError('Source and destination warehouses cannot be the same.');
      return;
    }
    if (!form.productId) {
      setError('Please select a product to transfer.');
      return;
    }
    if (qtyNumber <= 0) {
      setError('Transfer quantity must be greater than 0.');
      return;
    }
    if (isOverdraft) {
      setError(`Insufficient stock at source warehouse! Available: ${sourceStock}, Requested: ${qtyNumber}.`);
      return;
    }
    if (!form.reason.trim() || form.reason.trim().length < 3) {
      setError('A valid operational transfer reason (min 3 characters) is required.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmTransfer = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/inventory/transfer', {
        sourceWarehouseId: parseInt(form.sourceWarehouseId, 10),
        destinationWarehouseId: parseInt(form.destinationWarehouseId, 10),
        productId: parseInt(form.productId, 10),
        quantity: qtyNumber,
        reference: form.reference || undefined,
        reason: form.reason.trim(),
      });

      if (res.data.success) {
        setIsConfirmOpen(false);
        setSuccessResult(res.data.data);
        // Refresh recent transfers
        const histRes = await api.get('/inventory/history?movementType=TRANSFER_OUT&limit=5');
        if (histRes.data.success) setRecentTransfers(histRes.data.data);
      }
    } catch (err) {
      setIsConfirmOpen(false);
      setError(err.message || 'Transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    setForm({
      sourceWarehouseId: '',
      destinationWarehouseId: '',
      productId: '',
      quantity: '',
      reference: '',
      reason: '',
    });
    setSourceStock(null);
    setDestStock(null);
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-forest-700" />
          <span>Inter-Warehouse Stock Transfer</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Safely balance regional stock between distribution nodes with atomic dual-lock database transactions.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {successResult ? (
        <Card className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Stock Transfer Completed Successfully</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Transfer code <span className="font-mono font-bold text-zinc-800">{successResult.transferCode}</span> was committed atomically. Source inventory deducted and destination inventory credited simultaneously.
          </p>

          {/* Dual Balance Summary Cards */}
          <div className="my-6 max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-left">
            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2">
              <span className="font-semibold text-zinc-900 block border-b border-zinc-200 pb-1">
                Source: {sourceWhObj?.name}
              </span>
              <div className="flex justify-between">
                <span className="text-zinc-500">Initial:</span>
                <span className="font-mono">{successResult.source.previousQuantity}</span>
              </div>
              <div className="flex justify-between text-orange-700 font-semibold">
                <span>Transferred Out:</span>
                <span className="font-mono">-{successResult.quantity}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200 font-bold text-zinc-900">
                <span>New Balance:</span>
                <span className="font-mono text-sm">{successResult.source.newQuantity}</span>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-2">
              <span className="font-semibold text-zinc-900 block border-b border-zinc-200 pb-1">
                Destination: {destWhObj?.name}
              </span>
              <div className="flex justify-between">
                <span className="text-zinc-500">Initial:</span>
                <span className="font-mono">{successResult.destination.previousQuantity}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Transferred In:</span>
                <span className="font-mono">+{successResult.quantity}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-zinc-200 font-bold text-zinc-900">
                <span>New Balance:</span>
                <span className="font-mono text-sm">{successResult.destination.newQuantity}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleReset}>
              Execute Another Transfer
            </Button>
            <Button variant="primary" onClick={() => (window.location.href = '/inventory')}>
              View Inventory Matrix
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleValidate} className="space-y-4">
            {/* Warehouses Selection (Source & Destination) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200/80">
              <Select
                label="Source Warehouse (Origin)"
                value={form.sourceWarehouseId}
                onChange={(e) => setForm({ ...form, sourceWarehouseId: e.target.value })}
                options={warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }))}
                placeholder="Select Source Facility"
                helperText="Facility where stock currently exists"
                required
              />

              <Select
                label="Destination Warehouse"
                value={form.destinationWarehouseId}
                onChange={(e) => setForm({ ...form, destinationWarehouseId: e.target.value })}
                options={warehouses
                  .filter((w) => String(w.id) !== String(form.sourceWarehouseId))
                  .map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }))}
                placeholder="Select Destination Facility"
                helperText="Receiving branch warehouse"
                required
              />
            </div>

            {/* Product Picker */}
            <Select
              label="Select Product to Transfer"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              options={products.map((p) => ({ value: String(p.id), label: `${p.name} [${p.sku}]` }))}
              placeholder="Select SKU"
              required
            />

            {/* Live Source Stock Indicator */}
            {form.sourceWarehouseId && form.productId && (
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">
                  Available in Source ({sourceWhObj?.name}):
                </span>
                <span className="font-mono font-bold text-zinc-900 text-sm">
                  {isLoadingStock ? 'Checking...' : `${sourceStock ?? 0} ${selectedProductObj?.unit || 'units'}`}
                </span>
              </div>
            )}

            {isOverdraft && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  Insufficient source stock! Requested transfer of {qtyNumber} units, but source facility only holds {sourceStock} units.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Transfer Quantity"
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="e.g. 25"
                helperText="Must be greater than 0 and within source limits"
                required
              />

              <Input
                label="Transfer Reference / Waybill"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="e.g. WB-9042, TR-GUJ-BOM"
                helperText="Dispatch waybill or inter-branch transfer order #"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Audit Reason <span className="text-rose-600 font-bold">*</span>
              </label>
              <textarea
                rows="3"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Regional demand balancing for upcoming delivery commitments..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
                required
              />
            </div>

            {/* Side-by-Side Dual Facility Preview */}
            {form.sourceWarehouseId && form.destinationWarehouseId && form.productId && qtyNumber > 0 && !isOverdraft && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-orange-50/60 border border-orange-200/80 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-zinc-900 block">{sourceWhObj?.name} (Source)</span>
                  <div className="flex justify-between text-zinc-500">
                    <span>Current:</span>
                    <span className="font-mono">{sourceStock}</span>
                  </div>
                  <div className="flex justify-between text-orange-700 font-medium">
                    <span>Transferring:</span>
                    <span className="font-mono">-{qtyNumber}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-orange-200 font-bold text-zinc-900">
                    <span>Resulting Stock:</span>
                    <span className="font-mono">{sourceNew}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-zinc-900 block">{destWhObj?.name} (Destination)</span>
                  <div className="flex justify-between text-zinc-500">
                    <span>Current:</span>
                    <span className="font-mono">{destStock ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Receiving:</span>
                    <span className="font-mono">+{qtyNumber}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-emerald-200 font-bold text-zinc-900">
                    <span>Resulting Stock:</span>
                    <span className="font-mono">{destNew}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <Button type="submit" variant="primary" icon={ArrowLeftRight} disabled={isOverdraft || qtyNumber <= 0}>
                Review & Confirm Transfer
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmTransfer}
        title="Confirm Stock Transfer"
        subtitle="Both facility inventories will update atomically in a single transaction."
        confirmText="Confirm & Execute Transfer"
        confirmVariant="primary"
        isLoading={isSubmitting}
        details={{
          product: selectedProductObj ? `${selectedProductObj.name} (${selectedProductObj.sku})` : '-',
          sourceWarehouse: sourceWhObj?.name,
          destinationWarehouse: destWhObj?.name,
          operation: 'INTER-WAREHOUSE TRANSFER',
          requestedQuantity: `${qtyNumber} units`,
          resultingQuantity: `Source: ${sourceNew} | Destination: ${destNew}`,
        }}
      />

      {/* Recent Transfers Log */}
      <Card
        title="Recent Outbound Transfers Log"
        subtitle="Recent transfer transactions performed across facilities"
      >
        {recentTransfers.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">No transfer movements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200/80 text-zinc-400 font-semibold pb-2">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Facility</th>
                  <th className="py-2.5 px-3 text-right">Units</th>
                  <th className="py-2.5 px-3">Transfer Code / Waybill</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-700">
                {recentTransfers.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/70">
                    <td className="py-2.5 px-3 text-zinc-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 whitespace-nowrap">{m.product_name}</td>
                    <td className="py-2.5 px-3 text-zinc-700 whitespace-nowrap">{m.warehouse_name}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">{m.quantity}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-800 whitespace-nowrap">{m.reference}</td>
                    <td className="py-2.5 px-3 text-zinc-600 max-w-xs truncate" title={m.reason}>{m.reason}</td>
                    <td className="py-2.5 px-3 text-zinc-600 whitespace-nowrap">{m.first_name} {m.last_name}</td>
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
