import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AlertBanner from '../components/common/AlertBanner';
import { ArrowUpRight, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function StockOutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [availableStock, setAvailableStock] = useState(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  const [form, setForm] = useState({
    warehouseId: searchParams.get('warehouseId') || '',
    productId: searchParams.get('productId') || '',
    quantity: '',
    reference: '',
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
        setError('Failed to load facility and product catalog.');
      }
    }
    loadOptions();
  }, []);

  // Fetch current available stock
  useEffect(() => {
    async function fetchStock() {
      if (!form.warehouseId || !form.productId) {
        setAvailableStock(null);
        return;
      }

      setIsLoadingStock(true);
      try {
        const res = await api.get(`/inventory?warehouseId=${form.warehouseId}&search=${form.productId}`);
        const match = res.data.data?.find(
          (i) => i.warehouse_id === parseInt(form.warehouseId, 10) && i.product_id === parseInt(form.productId, 10)
        );
        setAvailableStock(match ? Number(match.quantity) : 0);
      } catch {
        setAvailableStock(0);
      } finally {
        setIsLoadingStock(false);
      }
    }

    fetchStock();
  }, [form.warehouseId, form.productId]);

  const selectedProductObj = products.find((p) => String(p.id) === String(form.productId));
  const selectedWarehouseObj = warehouses.find((w) => String(w.id) === String(form.warehouseId));
  const qtyNumber = parseInt(form.quantity, 10) || 0;
  const isOverdraft = availableStock !== null && qtyNumber > availableStock;
  const resultingStock = (availableStock !== null ? availableStock : 0) - qtyNumber;

  const handleValidateAndReview = (e) => {
    e.preventDefault();
    setError('');

    if (!form.warehouseId) {
      setError('Please select a dispatch facility.');
      return;
    }
    if (!form.productId) {
      setError('Please select a product.');
      return;
    }
    if (qtyNumber <= 0) {
      setError('Stock Out quantity must be a positive integer greater than 0.');
      return;
    }
    if (isOverdraft) {
      setError(`Insufficient stock available. Only ${availableStock} units available, requested ${qtyNumber}.`);
      return;
    }
    if (!form.reason.trim() || form.reason.trim().length < 3) {
      setError('A valid operational reason (min 3 characters) is required.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmStockOut = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/inventory/stock-out', {
        warehouseId: parseInt(form.warehouseId, 10),
        productId: parseInt(form.productId, 10),
        quantity: qtyNumber,
        reference: form.reference || undefined,
        reason: form.reason.trim(),
      });

      if (res.data.success) {
        setIsConfirmOpen(false);
        setSuccessResult(res.data.data);
      }
    } catch (err) {
      setIsConfirmOpen(false);
      setError(err.message || 'Stock Out failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessResult(null);
    setForm({
      warehouseId: '',
      productId: '',
      quantity: '',
      reference: '',
      reason: '',
    });
    setAvailableStock(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <ArrowUpRight className="w-6 h-6 text-orange-600" />
          <span>Stock Out Dispatch</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Deduct dispatched orders, manufacturing consumption, or customer fulfillment shipments.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {successResult ? (
        <Card className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Stock Out Completed Successfully</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Inventory was deducted atomically and an immutable dispatch movement record has been created.
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
              <span className="text-zinc-500 font-medium">Initial Stock</span>
              <span className="font-mono text-zinc-700">{successResult.previousQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Deducted Units</span>
              <span className="font-mono font-bold text-orange-600">-{successResult.quantityDeducted}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-200 font-semibold">
              <span className="text-zinc-900">Remaining Available Stock</span>
              <span className="font-mono font-bold text-base text-zinc-900">{successResult.newQuantity}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleReset}>
              Dispatch Another Batch
            </Button>
            <Button variant="primary" onClick={() => navigate('/inventory')}>
              View in Inventory Matrix
            </Button>
          </div>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleValidateAndReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Dispatch Facility"
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                options={warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }))}
                placeholder="Select Warehouse"
                required
              />

              <Select
                label="Product to Dispatch"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                options={products.map((p) => ({ value: String(p.id), label: `${p.name} [${p.sku}]` }))}
                placeholder="Select SKU"
                required
              />
            </div>

            {/* Current Available Stock Preview */}
            {form.warehouseId && form.productId && (
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                  availableStock === 0
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-zinc-50 border-zinc-200/80 text-zinc-700'
                }`}
              >
                <span className="font-medium">Available Stock in Selected Facility:</span>
                <span className="font-mono font-bold text-sm">
                  {isLoadingStock ? 'Checking...' : `${availableStock ?? 0} ${selectedProductObj?.unit || 'units'}`}
                </span>
              </div>
            )}

            {/* Overdraft Alert Warning */}
            {isOverdraft && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertOctagon className="w-4 h-4 shrink-0 text-rose-600" />
                <span>
                  Insufficient stock! Requested {qtyNumber} units, but only {availableStock} units are currently available in this facility.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Dispatch Quantity"
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="e.g. 20"
                helperText="Must be a positive whole integer (> 0)"
                required
              />

              <Input
                label="Dispatch Reference"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="e.g. DISP-2026-104, SO-981"
                helperText="Delivery Challan or Sales Order number"
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
                placeholder="e.g. Dispatched for client project deployment, outbound courier handover..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
                required
              />
            </div>

            {/* Live Calculation Preview Card */}
            {form.warehouseId && form.productId && qtyNumber > 0 && !isOverdraft && (
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between text-zinc-600">
                  <span>Current Available:</span>
                  <span className="font-mono font-semibold">{availableStock}</span>
                </div>
                <div className="flex justify-between text-orange-700">
                  <span>Deducting:</span>
                  <span className="font-mono font-bold">-{qtyNumber}</span>
                </div>
                <div className="flex justify-between text-zinc-900 pt-1.5 border-t border-orange-200/60 font-bold">
                  <span>Resulting Balance:</span>
                  <span className="font-mono text-sm">{resultingStock}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <Button variant="outline" onClick={() => navigate('/inventory')}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" icon={ArrowUpRight} disabled={isOverdraft || qtyNumber <= 0}>
                Review & Confirm Dispatch
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmStockOut}
        title="Confirm Stock Out Operation"
        subtitle="This action will decrease physical inventory and write an immutable audit record."
        confirmText="Confirm & Dispatch Stock"
        confirmVariant="danger"
        isLoading={isSubmitting}
        details={{
          product: selectedProductObj ? `${selectedProductObj.name} (${selectedProductObj.sku})` : '-',
          warehouse: selectedWarehouseObj?.name,
          currentQuantity: availableStock,
          operation: 'STOCK OUT (DECREASE)',
          requestedQuantity: `-${qtyNumber}`,
          resultingQuantity: resultingStock,
        }}
      />
    </div>
  );
}
