import React, { useState, useEffect, useCallback } from 'react';
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
import { Plus, Search, Eye, Edit2, ShieldAlert } from 'lucide-react';

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters & Pagination state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Add Product Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    sku: '',
    name: '',
    categoryId: '',
    unit: 'pcs',
    price: '',
    minimumStock: '10',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit Product Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    categoryId: '',
    unit: '',
    price: '',
    minimumStock: '',
    status: 'ACTIVE',
  });

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        stockStatus: stockStatus || undefined,
      };

      const res = await api.get('/products', { params });
      if (res.data.success) {
        setProducts(res.data.data);
        if (res.data.meta) {
          setPagination(res.data.meta);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch products.');
    } finally {
      setIsLoading(false);
    }
  }, [page, search, selectedCategory, stockStatus]);

  const loadCategories = async () => {
    try {
      const res = await api.get('/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...addForm,
        categoryId: parseInt(addForm.categoryId, 10),
        price: parseFloat(addForm.price) || 0,
        minimumStock: parseInt(addForm.minimumStock, 10) || 0,
      };

      const res = await api.post('/products', payload);
      if (res.data.success) {
        setIsAddModalOpen(false);
        setAddForm({ sku: '', name: '', categoryId: '', unit: 'pcs', price: '', minimumStock: '10', description: '' });
        setSuccessMessage('Product registered successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadProducts();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      categoryId: String(product.category_id),
      unit: product.unit,
      price: String(product.price),
      minimumStock: String(product.minimum_stock),
      status: product.status,
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const payload = {
        name: editForm.name,
        categoryId: parseInt(editForm.categoryId, 10),
        unit: editForm.unit,
        price: parseFloat(editForm.price),
        minimumStock: parseInt(editForm.minimumStock, 10),
        status: editForm.status,
      };

      const res = await api.put(`/products/${editingProduct.id}`, payload);
      if (res.data.success) {
        setIsEditModalOpen(false);
        setSuccessMessage('Product updated successfully.');
        setTimeout(() => setSuccessMessage(''), 4000);
        loadProducts();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(val || 0);
  };

  const columns = [
    {
      header: 'SKU',
      accessor: 'sku',
      render: (p) => <span className="font-mono text-xs font-bold text-zinc-900">{p.sku}</span>,
    },
    {
      header: 'Product Name',
      accessor: 'name',
      render: (p) => (
        <div>
          <span className="font-semibold text-zinc-900 block">{p.name}</span>
          <span className="text-[11px] text-zinc-400">Unit: {p.unit}</span>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category_name',
      render: (p) => <span className="text-zinc-600 text-xs font-medium">{p.category_name}</span>,
    },
    {
      header: 'Unit Price',
      accessor: 'price',
      align: 'right',
      render: (p) => <span className="font-mono font-medium text-zinc-900">{formatCurrency(p.price)}</span>,
    },
    {
      header: 'Min Stock',
      accessor: 'minimum_stock',
      align: 'right',
      render: (p) => <span className="font-mono text-zinc-600">{p.minimum_stock}</span>,
    },
    {
      header: 'Total Stock',
      accessor: 'total_stock',
      align: 'right',
      render: (p) => {
        const stock = Number(p.total_stock);
        const min = Number(p.minimum_stock);
        let badgeType = 'in_stock';
        let label = 'In Stock';
        if (stock === 0) {
          badgeType = 'out_of_stock';
          label = 'Out of Stock';
        } else if (stock <= min) {
          badgeType = 'low_stock';
          label = 'Low Stock';
        }

        return (
          <div className="flex items-center justify-end gap-2">
            <span className="font-mono font-bold text-zinc-900">{stock.toLocaleString()}</span>
            <Badge variant={badgeType} size="sm">
              {label}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      align: 'center',
      render: (p) => <Badge variant={p.status} size="sm">{p.status}</Badge>,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            icon={Eye}
            onClick={() => navigate(`/products/${p.id}`)}
            title="View Details"
          />
          {hasRole('ADMIN') && (
            <Button
              size="sm"
              variant="ghost"
              icon={Edit2}
              onClick={() => handleOpenEdit(p)}
              title="Edit Product"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">Products Catalog</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Browse and manage all registered inventory items, unit prices, and thresholds.
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
            Register Product
          </Button>
        )}
      </div>

      {successMessage && <AlertBanner type="success" message={successMessage} />}
      {error && <AlertBanner type="error" message={error} />}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            icon={Search}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="w-44">
            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              placeholder="All Categories"
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            />
          </div>

          <div className="w-40">
            <Select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              placeholder="All Stock Levels"
              options={[
                { value: 'IN_STOCK', label: 'In Stock' },
                { value: 'LOW_STOCK', label: 'Low Stock' },
                { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <Table
        columns={columns}
        data={products}
        isLoading={isLoading}
        emptyMessage="No products match your current filters."
        onRowClick={(p) => navigate(`/products/${p.id}`)}
        pagination={{
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      {/* Add Product Modal (Admin Only) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Product"
        subtitle="Add a new SKU to the central inventory catalog."
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="SKU (Unique Code)"
              value={addForm.sku}
              onChange={(e) => setAddForm({ ...addForm, sku: e.target.value })}
              placeholder="e.g. ELC-PLC-001"
              required
            />
            <Select
              label="Product Category"
              value={addForm.categoryId}
              onChange={(e) => setAddForm({ ...addForm, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              required
            />
          </div>

          <Input
            label="Product Name"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            placeholder="e.g. Programmable Logic Controller 24V DC"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Unit of Measure"
              value={addForm.unit}
              onChange={(e) => setAddForm({ ...addForm, unit: e.target.value })}
              placeholder="pcs, units, kg..."
              required
            />
            <Input
              label="Unit Price (INR)"
              type="number"
              step="0.01"
              min="0"
              value={addForm.price}
              onChange={(e) => setAddForm({ ...addForm, price: e.target.value })}
              placeholder="0.00"
              required
            />
            <Input
              label="Min Safety Stock"
              type="number"
              min="0"
              value={addForm.minimumStock}
              onChange={(e) => setAddForm({ ...addForm, minimumStock: e.target.value })}
              placeholder="10"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows="3"
              value={addForm.description}
              onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
              placeholder="Detailed technical specifications, warranty, or handling guidelines..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Save Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal (Admin Only) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product"
        subtitle={`Updating SKU: ${editingProduct?.sku}`}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleUpdateProduct} className="space-y-4">
          {formError && <AlertBanner type="error" message={formError} />}

          <Input
            label="Product Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Product Category"
              value={editForm.categoryId}
              onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              required
            />
            <Select
              label="Product Status"
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              options={[
                { value: 'ACTIVE', label: 'ACTIVE (Operational)' },
                { value: 'INACTIVE', label: 'INACTIVE (Deactivated)' },
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Unit of Measure"
              value={editForm.unit}
              onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
              required
            />
            <Input
              label="Unit Price (INR)"
              type="number"
              step="0.01"
              min="0"
              value={editForm.price}
              onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              required
            />
            <Input
              label="Min Safety Stock"
              type="number"
              min="0"
              value={editForm.minimumStock}
              onChange={(e) => setEditForm({ ...editForm, minimumStock: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Product
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
