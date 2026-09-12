import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Operation',
  subtitle = 'Please review the following details before submitting.',
  confirmText = 'Confirm & Proceed',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  details = null, // e.g. { product, warehouse, currentQuantity, operation, requestedQuantity, resultingQuantity }
  children
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} maxWidth="max-w-md">
      <div className="space-y-4">
        {details && (
          <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-4 text-xs space-y-2.5">
            {details.product && (
              <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500 font-medium">Product</span>
                <span className="font-semibold text-zinc-900 text-right">{details.product}</span>
              </div>
            )}
            {details.warehouse && (
              <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500 font-medium">Warehouse</span>
                <span className="font-medium text-zinc-900">{details.warehouse}</span>
              </div>
            )}
            {details.sourceWarehouse && (
              <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500 font-medium">Source WH</span>
                <span className="font-medium text-zinc-900">{details.sourceWarehouse}</span>
              </div>
            )}
            {details.destinationWarehouse && (
              <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500 font-medium">Destination WH</span>
                <span className="font-medium text-zinc-900">{details.destinationWarehouse}</span>
              </div>
            )}
            {details.currentQuantity !== undefined && (
              <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500 font-medium">Current Stock</span>
                <span className="font-mono font-medium text-zinc-900">{details.currentQuantity}</span>
              </div>
            )}
            {details.operation && (
              <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500 font-medium">Operation</span>
                <span className="font-semibold uppercase tracking-wider text-forest-800">{details.operation}</span>
              </div>
            )}
            {details.requestedQuantity !== undefined && (
              <div className="flex justify-between items-center py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500 font-medium">Change Quantity</span>
                <span className="font-mono font-semibold text-zinc-900">{details.requestedQuantity}</span>
              </div>
            )}
            {details.resultingQuantity !== undefined && (
              <div className="flex justify-between items-center pt-1">
                <span className="text-zinc-700 font-semibold">Resulting Stock</span>
                <span className="font-mono font-bold text-base text-zinc-900">{details.resultingQuantity}</span>
              </div>
            )}
          </div>
        )}

        {children}

        <div className="flex items-center justify-end gap-2.5 pt-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
