import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AlertBanner from '../components/common/AlertBanner';
import { ArrowDownRight, CheckCircle2, Building2, Package, Layers } from 'lucide-react';

export default function StockInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [currentStock, setCurrentStock] = useState(null);
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

  // Fetch current stock whenever warehouseId or productId changes
  useEffect(() => {
    async function fetchStock() {
      if (!form.warehouseId || !form.productId) {
        setCurrentStock(null);
        return;
      }

      setIsLoadingStock(true);
      try {
        const res = await api.get(`/inventory?warehouseId=${form.warehouseId}&search=${form.productId}`);
        // match exact product
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
  const qtyNumber = parseInt(form.quantity, 10) || 0;
  const resultingStock = (currentStock !== null ? currentStock : 0) + qtyNumber;

  const handleValidateAndReview = (e) => {
    e.preventDefault();
    setError('');

    if (!form.warehouseId) {
      setError('Please select a receiving warehouse facility.');
      return;
    }
    if (!form.productId) {
      setError('Please select a product.');
      return;
    }
    if (qtyNumber <= 0) {
      setError('Stock In quantity must be a positive integer greater than 0.');
      return;
    }
    if (!form.reason.trim() || form.reason.trim().length < 3) {
      setError('A valid operational reason (min 3 characters) is required.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmStockIn = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await api.post('/inventory/stock-in', {
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
      setError(err.message || 'Stock In failed.');
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
    setCurrentStock(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
          <ArrowDownRight className="w-6 h-6 text-forest-700" />
          <span>Stock In Intake</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Receive purchase orders, supplier shipments, and incoming stock into an authorized facility.
        </p>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {successResult ? (
        /* Success Screen */
        <Card className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Stock In Completed Successfully</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            The physical inventory quantity and immutable audit movement record have been successfully committed to the database.
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
              <span className="text-zinc-500 font-medium">Previous Stock</span>
              <span className="font-mono text-zinc-700">{successResult.previousQuantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500 font-medium">Added Quantity</span>
              <span className="font-mono font-bold text-emerald-700">+{successResult.quantityAdded}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-zinc-200 font-semibold">
              <span className="text-zinc-900">New Available Stock</span>
              <span className="font-mono font-bold text-base text-zinc-900">{successResult.newQuantity}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" onClick={handleReset}>
              Receive Another Batch
            </Button>
            <Button variant="primary" onClick={() => navigate('/inventory')}>
              View in Inventory Matrix
            </Button>
          </div>
        </Card>
      ) : (
        /* Operational Form */
        <Card>
          <form onSubmit={handleValidateAndReview} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Receiving Facility"
                value={form.warehouseId}
                onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
                options={warehouses.map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }))}
                placeholder="Select Receiving Warehouse"
                required
              />

              <Select
                label="Product to Intake"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                options={products.map((p) => ({ value: String(p.id), label: `${p.name} [${p.sku}]` }))}
                placeholder="Select SKU"
                required
              />
            </div>

            {/* Current Stock Preview Banner */}
            {form.warehouseId && form.productId && (
              <div className="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Current Stock in Selected Warehouse:</span>
                <span className="font-mono font-bold text-sm text-zinc-900">
                  {isLoadingStock ? 'Checking...' : `${currentStock ?? 0} ${selectedProductObj?.unit || 'units'}`}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Intake Quantity"
                type="number"
                min="1"
                step="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                placeholder="e.g. 50"
                helperText="Must be a positive whole integer (> 0)"
                required
              />

              <Input
                label="Document Reference"
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="e.g. PO-2026-9042, GRN-018"
                helperText="Vendor Invoice, PO number or GRN code"
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
                placeholder="e.g. Vendor shipment received against purchase order, passed visual inspection..."
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
                required
              />
            </div>

            {/* Live Calculation Preview Card */}
            {form.warehouseId && form.productId && qtyNumber > 0 && (
              <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between text-zinc-600">
                  <span>Current Inventory:</span>
                  <span className="font-mono font-semibold">{currentStock || 0}</span>
                </div>
                <div className="flex justify-between text-emerald-800">
                  <span>Adding Quantity:</span>
                  <span className="font-mono font-bold">+{qtyNumber}</span>
                </div>
                <div className="flex justify-between text-zinc-900 pt-1.5 border-t border-emerald-200/60 font-bold">
                  <span>Resulting Inventory:</span>
                  <span className="font-mono text-sm">{resultingStock}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <Button variant="outline" onClick={() => navigate('/inventory')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={ArrowDownRight}>
                Review & Confirm
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmStockIn}
        title="Confirm Stock In Operation"
        subtitle="This action will increase recorded inventory and create an immutable audit record."
        confirmText="Confirm & Intake Stock"
        confirmVariant="primary"
        isLoading={isSubmitting}
        details={{
          product: selectedProductObj ? `${selectedProductObj.name} (${selectedProductObj.sku})` : '-',
          warehouse: selectedWarehouseObj?.name,
          currentQuantity: currentStock,
          operation: 'STOCK IN (INCREASE)',
          requestedQuantity: `+${qtyNumber}`,
          resultingQuantity: resultingStock,
        }}
      />
    </div>
  );
}
