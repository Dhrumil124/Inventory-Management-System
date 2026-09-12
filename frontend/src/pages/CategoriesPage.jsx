import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Table from '../components/common/Table';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import AlertBanner from '../components/common/AlertBanner';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';

export default function CategoriesPage() {
  const { hasRole } = useAuth();

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', status: 'ACTIVE' });

  // Delete / Deactivate Dialog
  const [deletingCategory, setDeletingCategory] = useState(null);

  const loadCategories = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/categories', addForm);
      if (res.data.success) {
        setIsAddModalOpen(false);
        setAddForm({ name: '', description: '' });
        setSuccessMessage('Category created successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadCategories();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setEditForm({
      name: cat.name,
      description: cat.description || '',
      status: cat.status,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);
    try {
      const res = await api.put(`/categories/${editingCategory.id}`, editForm);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setSuccessMessage('Category updated successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadCategories();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return;
    setIsSubmitting(true);
    try {
      const res = await api.delete(`/categories/${deletingCategory.id}`);
      if (res.data.success) {
        setDeletingCategory(null);
        setSuccessMessage(res.data.message || 'Category processed successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadCategories();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Category Name',
      accessor: 'name',
      render: (c) => (
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-forest-700 shrink-0" />
          <span className="font-semibold text-zinc-900">{c.name}</span>
        </div>
      ),
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (c) => <span className="text-zinc-500 text-xs">{c.description || '-'}</span>,
    },
    {
      header: 'Total Products',
      accessor: 'product_count',
      align: 'right',
      render: (c) => <span className="font-mono font-semibold text-zinc-800">{c.product_count}</span>,
    },
    {
      header: 'Active Products',
      accessor: 'active_product_count',
      align: 'right',
      render: (c) => <span className="font-mono text-emerald-700 font-bold">{c.active_product_count || 0}</span>,
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (c) => <Badge variant={c.status}>{c.status}</Badge>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (c) => (
        hasRole('ADMIN') && (
          <div className="flex items-center justify-end gap-1.5">
            <Button size="sm" variant="ghost" icon={Edit2} onClick={() => handleOpenEdit(c)} title="Edit Category" />
            <Button
              size="sm"
              variant="ghost"
              icon={Trash2}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => setDeletingCategory(c)}
              title="Delete or Deactivate"
            />
          </div>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Categories</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Group products into structured inventory classifications.
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
            New Category
          </Button>
        )}
      </div>

      {successMessage && <AlertBanner type="success" message={successMessage} />}
      {error && <AlertBanner type="error" message={error} />}

      <Table columns={columns} data={categories} isLoading={isLoading} emptyMessage="No categories defined yet." />

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Product Category"
        subtitle="Organize items by department, material, or application."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <Input
            label="Category Name"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            placeholder="e.g. Raw Materials"
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows="3"
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              placeholder="Scope and purpose of this product group..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Category"
        subtitle={`Updating: ${editingCategory?.name}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateCategory} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <Input
            label="Category Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows="3"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete / Deactivate Confirmation */}
      <Modal
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Confirm Category Deletion"
        subtitle="Safeguarding relational integrity"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-zinc-600 leading-relaxed">
            Are you sure you want to remove category <strong className="text-zinc-900">{deletingCategory?.name}</strong>?
          </p>
          {deletingCategory?.product_count > 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
              <strong>Notice:</strong> This category has {deletingCategory.product_count} registered products. To preserve historical catalog data, this category will be <strong>safely deactivated</strong> rather than permanently deleted.
            </div>
          ) : (
            <p className="text-zinc-500">This category has 0 associated products and can be safely deleted.</p>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="outline" onClick={() => setDeletingCategory(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} isLoading={isSubmitting}>
              {deletingCategory?.product_count > 0 ? 'Deactivate Category' : 'Delete Category'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
