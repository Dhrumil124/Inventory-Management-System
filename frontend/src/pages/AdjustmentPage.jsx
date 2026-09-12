import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AlertBanner from '../components/common/AlertBanner';
import { SlidersHorizontal, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AdjustmentPage() {
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const [form, setForm] = useState({
    warehouseId: '',
    productId: '',
    physicalQuantity: '',
    reason: '',
  });

  const [error, setError] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [whRes, prodRes] = await Promise.all([
          api.get('/warehouses'),
          api.get('/products?limit=100'),
        ]);
        if (whRes.data.success) setWarehouses(whRes.data.data);
        if (prodRes.data.success) setProducts(prodRes.data.data);
      } catch (err) {
        setError('Failed to load warehouses and product catalog.');
      }
    }
    loadOptions();
  }, []);

  // Fetch current stock
  useEffect(() => {
    async function fetchStock() {
      if (!form.warehouseId || !form.productId) {
        setCurrentStock(null);
        return;
      }

      setIsLoadingStock(true);
      try {
        const res = await api.get(`/inventory?warehouseId=${form.warehouseId}&search=${form.productId}`);
        const match = res.data.data?.find(
          (i) => i.warehouse_id === parseInt(form.warehouseId, 10) && i.product_id === parseInt(form.productId, 10)
        );
        setCurrentStock(match ? Number(match.quantity) : 0);
      } catch {
        setCurrentStock(0);
      } finally {
        setIsLoadingStock(false);
      }
    }

    fetchStock();
  }, [form.warehouseId, form.productId]);

  const selectedProductObj = products.find((p) => String(p.id) === String(form.productId));
  const selectedWarehouseObj = warehouses.find((w) => String(w.id) === String(form.warehouseId));

  const physicalNum = form.physicalQuantity === '' ? null : parseInt(form.physicalQuantity, 10);
  const delta = physicalNum !== null && currentStock !== null ? physicalNum - currentStock : 0;

  const handleValidate = (e) => {
    e.preventDefault();
    setError('');

    if (!form.warehouseId) {
      setError('Please select a warehouse facility.');
      return;
    }
    if (!form.productId) {
      setError('Please select a product to adjust.');
      return;
    }
    if (physicalNum === null || isNaN(physicalNum) || physicalNum < 0) {
      setError('Physical counted quantity cannot be negative.');
      return;
    }
    if (!form.reason.trim() || form.reason.trim().length < 5) {
      setError('A detailed audit reason (at least 5 characters) is mandatory to justify inventory adjustments.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmAdjustment = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/inventory/adjustment', {
        warehouseId: parseInt(form.warehouseId, 10),
        productId: parseInt(form.productId, 10),
        physicalQuantity: physicalNum,
        reason: form.reason.trim(),
      });

      if (res.data.success) {
        setIsConfirmOpen(false);
        setSuccessResult(res.data.data);
      }
    } catch (err) {
      setIsConfirmOpen(false);
      setError(err.message || 'Stock adjustment failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    setForm({
      warehouseId: '',
      productId: '',
      physicalQuantity: '',
      reason: '',
    });
    setCurrentStock(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <SlidersHorizontal className="w-6 h-6 text-amber-700" />
          <span>Physical Stock Adjustment</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Reconcile system records with physical cycle counts. Creates an auditable adjustment movement.
        </p>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Audited Operation:</strong> Adjustments never overwrite or hide historical inventory movements. Every adjustment creates an immutable <strong className="font-mono">ADJUSTMENT</strong> entry attributed to your account.
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {successResult ? (
        <Card className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Stock Adjustment Committed</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            The discrepancy has been reconciled and the audit movement record has been written to the permanent ledger.
          </p>

          <div className="my-6 max-w-sm mx-auto p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Product</span>
              <span className="font-semibold text-zinc-900">{selectedProductObj?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Facility</span>
              <span className="font-medium text-zinc-800">{selectedWarehouseObj?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Previous System Count</span>
              <span className="font-mono text-zinc-700">{successResult.previousQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Audit Delta</span>
              <span className={`font-mono font-bold ${successResult.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {successResult.delta >= 0 ? `+${successResult.delta}` : successResult.delta} units
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-200 font-semibold">
              <span className="text-zinc-900">New Physical Count</span>
              <span className="font-mono font-bold text-base text-zinc-900">{successResult.newQuantity}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleReset}>
              Adjust Another Item
            </Button>
            <Button variant="primary" onClick={() => navigate('/history')}>
              View in Audit History
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleValidate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Warehouse Facility"
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                options={warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }))}
                placeholder="Select Warehouse"
                required
              />

              <Select
                label="Product to Reconcile"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                options={products.map((p) => ({ value: String(p.id), label: `${p.name} [${p.sku}]` }))}
                placeholder="Select SKU"
                required
              />
            </div>

            {/* Current Stock Display */}
            {form.warehouseId && form.productId && (
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Current System Inventory:</span>
                <span className="font-mono font-bold text-sm text-zinc-900">
                  {isLoadingStock ? 'Checking...' : `${currentStock ?? 0} ${selectedProductObj?.unit || 'units'}`}
                </span>
              </div>
            )}

            <Input
              label="Physical Counted Quantity"
              type="number"
              min="0"
              step="1"
              value={form.physicalQuantity}
              onChange={(e) => setForm({ ...form, physicalQuantity: e.target.value })}
              placeholder="e.g. 48"
              helperText="Actual physical quantity counted during audit (must be >= 0)"
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Audit Reason / Justification <span className="text-rose-600 font-bold">*</span>
              </label>
              <textarea
                rows="3"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="e.g. Discrepancy identified during quarterly warehouse audit; 2 items damaged in transit..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
                required
              />
            </div>

            {/* Live Delta Preview */}
            {form.warehouseId && form.productId && physicalNum !== null && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  delta === 0
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-700'
                    : delta > 0
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50/50 border-rose-200 text-rose-900'
                }`}
              >
                <div className="flex justify-between">
                  <span>Current System Count:</span>
                  <span className="font-mono font-semibold">{currentStock || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Counted Physical Units:</span>
                  <span className="font-mono font-semibold">{physicalNum}</span>
                </div>
                <div className="flex justify-between font-bold pt-1.5 border-t border-current/20">
                  <span>Calculated Adjustment Delta:</span>
                  <span className="font-mono text-sm">
                    {delta > 0 ? `+${delta}` : delta} units {delta === 0 && '(No change)'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <Button variant="outline" onClick={() => navigate('/inventory')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={SlidersHorizontal}>
                Review & Confirm Adjustment
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmAdjustment}
        title="Confirm Physical Stock Adjustment"
        subtitle="This action reconciles physical stock and writes an immutable ADJUSTMENT audit log."
        confirmText="Confirm & Reconcile"
        confirmVariant="primary"
        isLoading={isSubmitting}
        details={{
          product: selectedProductObj ? `${selectedProductObj.name} (${selectedProductObj.sku})` : '-',
          warehouse: selectedWarehouseObj?.name,
          currentQuantity: currentStock,
          operation: 'STOCK ADJUSTMENT',
          requestedQuantity: `${delta >= 0 ? `+${delta}` : delta} units (delta)`,
          resultingQuantity: physicalNum,
        }}
      />
    </div>
  );
}
