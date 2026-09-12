import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import { Plus, Edit2, Building2, UserPlus, Trash2, Search, Users } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '3', // Default STAFF
    warehouseIds: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit User Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    roleId: '',
    status: 'ACTIVE',
  });

  // Manage Warehouse Assignments Modal State
  const [isAssignmentsModalOpen, setIsAssignmentsModalOpen] = useState(false);
  const [selectedUserForWh, setSelectedUserForWh] = useState(null);
  const [userWarehousesList, setUserWarehousesList] = useState([]);
  const [selectedWhToAdd, setSelectedWhToAdd] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const loadWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      if (res.data.success) setWarehouses(res.data.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      };

      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.data);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load user accounts.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const payload = {
        ...addForm,
        roleId: parseInt(addForm.roleId, 10),
        warehouseIds: addForm.warehouseIds.map((id) => parseInt(id, 10)),
      };

      const res = await api.post('/users', payload);
      if (res.data.success) {
        setIsAddModalOpen(false);
        setAddForm({ firstName: '', lastName: '', email: '', password: '', roleId: '3', warehouseIds: [] });
        setSuccessMessage('User account created successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadUsers();
      }
    } catch (err) {
      const msg = err.errors?.length
        ? err.errors.map((e) => e.message).join(' ')
        : (err.message || 'Failed to create user.');
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      firstName: u.first_name,
      lastName: u.last_name,
      roleId: String(u.role_id),
      status: u.status,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        roleId: parseInt(editForm.roleId, 10),
        status: editForm.status,
      };

      const res = await api.put(`/users/${editingUser.id}`, payload);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setSuccessMessage('User details updated successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadUsers();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAssignments = async (u) => {
    setSelectedUserForWh(u);
    setSelectedWhToAdd('');
    setIsAssignmentsModalOpen(true);
    try {
      const res = await api.get(`/users/${u.id}`);
      if (res.data.success) {
        setUserWarehousesList(res.data.data.warehouses || []);
      }
    } catch {
      setUserWarehousesList([]);
    }
  };

  const handleAddWarehouseAssignment = async () => {
    if (!selectedWhToAdd || !selectedUserForWh) return;
    setIsAssigning(true);
    try {
      const res = await api.post(`/users/${selectedUserForWh.id}/warehouses`, {
        warehouseId: parseInt(selectedWhToAdd, 10),
      });
      if (res.data.success) {
        // Refresh list
        const userRes = await api.get(`/users/${selectedUserForWh.id}`);
        if (userRes.data.success) {
          setUserWarehousesList(userRes.data.data.warehouses || []);
        }
        setSelectedWhToAdd('');
        loadUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to assign warehouse.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRevokeWarehouseAssignment = async (whId) => {
    if (!selectedUserForWh) return;
    setIsAssigning(true);
    try {
      const res = await api.delete(`/users/${selectedUserForWh.id}/warehouses/${whId}`);
      if (res.data.success) {
        setUserWarehousesList(userWarehousesList.filter((w) => w.id !== whId));
        loadUsers();
      }
    } catch (err) {
      alert(err.message || 'Failed to revoke warehouse assignment.');
    } finally {
      setIsAssigning(false);
    }
  };

  const columns = [
    {
      header: 'User Name',
      accessor: 'name',
      render: (u) => (
        <div>
          <span className="font-semibold text-zinc-900 block">{u.first_name} {u.last_name}</span>
          <span className="text-zinc-400 text-xs">{u.email}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      align: 'center',
      render: (u) => <Badge variant={u.role}>{u.role}</Badge>,
    },
    {
      header: 'Assigned Depots',
      accessor: 'assigned_warehouse_count',
      align: 'center',
      render: (u) => (
        u.role === 'ADMIN' ? (
          <span className="text-xs text-purple-700 font-semibold">Global (All)</span>
        ) : (
          <span className="text-xs text-zinc-600 font-medium">
            {u.assigned_warehouse_count} {u.assigned_warehouse_count === 1 ? 'Warehouse' : 'Warehouses'}
          </span>
        )
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (u) => <Badge variant={u.status}>{u.status}</Badge>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {u.role !== 'ADMIN' && (
            <Button
              size="sm"
              variant="outline"
              icon={Building2}
              onClick={() => handleOpenAssignments(u)}
              title="Manage Warehouse Assignments"
            >
              Assignments
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon={Edit2}
            onClick={() => handleOpenEdit(u)}
            title="Edit User"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-700" />
            <span>User & Access Management</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Admin console for managing accounts, RBAC security roles, and multi-warehouse authorizations.
          </p>
        </div>

        <Button
          variant="primary"
          icon={UserPlus}
          onClick={() => {
            setFormError('');
            setIsAddModalOpen(true);
          }}
        >
          Add User Account
        </Button>
      </div>

      {successMessage && <AlertBanner type="success" message={successMessage} />}
      {error && <AlertBanner type="error" message={error} />}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={Search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="w-36">
            <Select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              placeholder="All Roles"
              options={[
                { value: 'ADMIN', label: 'Admin' },
                { value: 'MANAGER', label: 'Manager' },
                { value: 'STAFF', label: 'Staff' },
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              placeholder="All Statuses"
              options={[
                { value: 'ACTIVE', label: 'ACTIVE' },
                { value: 'INACTIVE', label: 'INACTIVE' },
              ]}
            />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No user accounts match your filters."
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New User Account"
        subtitle="Provision employee access with role-based permissions."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={addForm.firstName}
              onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={addForm.lastName}
              onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Corporate Email Address"
            type="email"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            placeholder="user@company.com"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Initial Password"
              type="password"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder="Min 8 chars, mixed case & numbers"
              helperText="Min 8 chars, 1 uppercase, 1 lowercase & 1 number"
              required
            />
            <Select
              label="Assigned System Role"
              value={addForm.roleId}
              onChange={(e) => setAddForm({ ...addForm, roleId: e.target.value })}
              options={[
                { value: '1', label: 'ADMIN (System Administrator)' },
                { value: '2', label: 'MANAGER (Warehouse Operational Manager)' },
                { value: '3', label: 'STAFF (Routine Operations Staff)' },
              ]}
              required
            />
          </div>

          {addForm.roleId !== '1' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
                Initial Warehouse Assignments
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                {warehouses.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addForm.warehouseIds.includes(String(w.id))}
                      onChange={(e) => {
                        const idStr = String(w.id);
                        const updated = e.target.checked
                          ? [...addForm.warehouseIds, idStr]
                          : addForm.warehouseIds.filter((id) => id !== idStr);
                        setAddForm({ ...addForm, warehouseIds: updated });
                      }}
                      className="rounded text-forest-800 focus:ring-forest-700"
                    />
                    <span className="text-zinc-700 font-medium">{w.name} ({w.code})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User Profile"
        subtitle={`Updating user ID: ${editingUser?.id}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={editForm.firstName}
              onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={editForm.lastName}
              onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
              required
            />
          </div>

          <Select
            label="System Role"
            value={editForm.roleId}
            onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
            options={[
              { value: '1', label: 'ADMIN' },
              { value: '2', label: 'MANAGER' },
              { value: '3', label: 'STAFF' },
            ]}
            required
          />

          <Select
            label="Account Status"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            options={[
              { value: 'ACTIVE', label: 'ACTIVE' },
              { value: 'INACTIVE', label: 'INACTIVE (Deactivated - Session immediately revoked)' },
            ]}
            required
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Manage Warehouse Assignments Modal */}
      <Modal
        isOpen={isAssignmentsModalOpen}
        onClose={() => setIsAssignmentsModalOpen(false)}
        title="Manage Warehouse Assignments"
        subtitle={`User: ${selectedUserForWh?.first_name} ${selectedUserForWh?.last_name} (${selectedUserForWh?.email})`}
        maxWidth="max-w-lg"
      >
        <div className="space-y-5 text-xs">
          {/* Current Assignments List */}
          <div>
            <h4 className="font-semibold text-zinc-900 mb-2">Currently Assigned Facilities:</h4>
            {userWarehousesList.length === 0 ? (
              <p className="text-zinc-400 py-3 text-center bg-zinc-50 rounded-lg border border-zinc-100">
                No warehouses currently assigned. This user cannot access warehouse-sensitive data.
              </p>
            ) : (
              <div className="space-y-2">
                {userWarehousesList.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-2.5 rounded-lg border border-zinc-200/80 bg-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-forest-800" />
                      <div>
                        <span className="font-semibold text-zinc-900 block">{wh.name}</span>
                        <span className="font-mono text-[10px] text-zinc-400 uppercase">{wh.code} • {wh.city}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      onClick={() => handleRevokeWarehouseAssignment(wh.id)}
                      disabled={isAssigning}
                      icon={Trash2}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Assignment */}
          <div className="pt-4 border-t border-zinc-100">
            <h4 className="font-semibold text-zinc-900 mb-2">Assign New Facility:</h4>
            <div className="flex gap-2">
              <Select
                value={selectedWhToAdd}
                onChange={(e) => setSelectedWhToAdd(e.target.value)}
                placeholder="Select Warehouse to Assign"
                options={warehouses
                  .filter((w) => !userWarehousesList.some((uw) => uw.id === w.id))
                  .map((w) => ({ value: String(w.id), label: `${w.name} (${w.code})` }))}
              />
              <Button
                variant="primary"
                onClick={handleAddWarehouseAssignment}
                disabled={!selectedWhToAdd || isAssigning}
                isLoading={isAssigning}
              >
                Assign
              </Button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsAssignmentsModalOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
