import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import { Plus, Warehouse, Eye, Edit2, Users, MapPin } from 'lucide-react';

export default function WarehousesPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    contactPerson: '',
    phone: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    contactPerson: '',
    phone: '',
    email: '',
    status: 'ACTIVE',
  });

  const loadWarehouses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/warehouses');
      if (res.data.success) {
        setWarehouses(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load warehouses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/warehouses', addForm);
      if (res.data.success) {
        setIsAddModalOpen(false);
        setAddForm({
          name: '', code: '', address: '', city: '', state: '',
          country: 'India', pincode: '', contactPerson: '', phone: '', email: ''
        });
        setSuccessMessage('Warehouse registered successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadWarehouses();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create warehouse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (wh) => {
    setEditingWarehouse(wh);
    setEditForm({
      name: wh.name,
      address: wh.address,
      city: wh.city,
      state: wh.state,
      country: wh.country,
      pincode: wh.pincode,
      contactPerson: wh.contact_person || '',
      phone: wh.phone || '',
      email: wh.email || '',
      status: wh.status,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateWarehouse = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await api.put(`/warehouses/${editingWarehouse.id}`, editForm);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setSuccessMessage('Warehouse updated successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadWarehouses();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update warehouse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Code',
      accessor: 'code',
      render: (wh) => <span className="font-mono text-xs font-bold text-zinc-900 uppercase">{wh.code}</span>,
    },
    {
      header: 'Warehouse Name',
      accessor: 'name',
      render: (wh) => (
        <div className="flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-forest-800 shrink-0" />
          <div>
            <span className="font-semibold text-zinc-900 block">{wh.name}</span>
            <span className="text-[11px] text-zinc-400">{wh.city}, {wh.state}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Active SKUs',
      accessor: 'total_active_skus',
      align: 'right',
      render: (wh) => <span className="font-mono font-medium text-zinc-800">{wh.total_active_skus || 0}</span>,
    },
    {
      header: 'Total Stock Units',
      accessor: 'total_stock_units',
      align: 'right',
      render: (wh) => (
        <span className="font-mono font-bold text-zinc-900">
          {Number(wh.total_stock_units || 0).toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Staff Assigned',
      accessor: 'assigned_staff_count',
      align: 'center',
      render: (wh) => (
        <span className="text-xs text-zinc-600 flex items-center justify-center gap-1">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span>{wh.assigned_staff_count || 0}</span>
        </span>
      ),
    },
    {
      header: 'Active Alerts',
      accessor: 'active_alerts_count',
      align: 'center',
      render: (wh) => {
        const cnt = Number(wh.active_alerts_count || 0);
        if (cnt === 0) return <span className="text-xs text-emerald-700 font-medium">None</span>;
        return <Badge variant="low_stock">{cnt} Alerts</Badge>;
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (wh) => <Badge variant={wh.status}>{wh.status}</Badge>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (wh) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={() => navigate(`/warehouses/${wh.id}`)}
            title="View Details"
          />
          {hasRole('ADMIN') && (
            <Button
              size="sm"
              variant="ghost"
              icon={Edit2}
              onClick={() => handleOpenEdit(wh)}
              title="Edit Warehouse"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Warehouses & Depots</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage multi-depot storage locations, capacities, and facility contacts.
          </p>
        </div>

        {hasRole('ADMIN') && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              setFormError('');
              setIsAddModalOpen(true);
            }}
          >
            Add Warehouse
          </Button>
        )}
      </div>

      {successMessage && <AlertBanner type="success" message={successMessage} />}
      {error && <AlertBanner type="error" message={error} />}

      <Table
        columns={columns}
        data={warehouses}
        isLoading={isLoading}
        emptyMessage="No warehouses found in your scope."
        onRowClick={(wh) => navigate(`/warehouses/${wh.id}`)}
      />

      {/* Add Warehouse Modal (Admin Only) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Warehouse Facility"
        subtitle="Establish a new physical inventory node in the logistics network."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Warehouse Code"
              value={addForm.code}
              onChange={(e) => setAddForm({ ...addForm, code: e.target.value })}
              placeholder="e.g. WH-PUN-01"
              required
            />
            <Input
              label="Warehouse Name"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              placeholder="e.g. Pune Central Depot"
              required
            />
          </div>

          <Input
            label="Street Address"
            value={addForm.address}
            onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
            placeholder="Plot / Sector / Industrial Area..."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="City"
              value={addForm.city}
              onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
              placeholder="City"
              required
            />
            <Input
              label="State"
              value={addForm.state}
              onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
              placeholder="State"
              required
            />
            <Input
              label="Pincode"
              value={addForm.pincode}
              onChange={(e) => setAddForm({ ...addForm, pincode: e.target.value })}
              placeholder="Pincode"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Contact Person"
              value={addForm.contactPerson}
              onChange={(e) => setAddForm({ ...addForm, contactPerson: e.target.value })}
              placeholder="Manager Name"
            />
            <Input
              label="Phone Number"
              value={addForm.phone}
              onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
              placeholder="+91..."
            />
            <Input
              label="Facility Email"
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              placeholder="facility@company.com"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Register Warehouse
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Warehouse Modal (Admin Only) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Warehouse Details"
        subtitle={`Editing: ${editingWarehouse?.code}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateWarehouse} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Warehouse Name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
            <Select
              label="Operational Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE (Operational)' },
                { value: 'INACTIVE', label: 'INACTIVE (Decommissioned)' },
              ]}
              required
            />
          </div>

          <Input
            label="Street Address"
            value={editForm.address}
            onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="City"
              value={editForm.city}
              onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              required
            />
            <Input
              label="State"
              value={editForm.state}
              onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
              required
            />
            <Input
              label="Pincode"
              value={editForm.pincode}
              onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Contact Person"
              value={editForm.contactPerson}
              onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
            />
            <Input
              label="Phone Number"
              value={editForm.phone}
              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            />
            <Input
              label="Facility Email"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Warehouse
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
