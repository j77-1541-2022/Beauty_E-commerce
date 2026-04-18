import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Edit2, Trash2, X } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { productAPI } from '../../services/apiClient';
import './AdminProducts.css';

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ search: searchTerm });
      setProducts(response.data.results || []);
    } catch (error) { console.error('Failed to fetch products:', error); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await productAPI.delete(id);
      setProducts(products.filter(p => p.id !== id));
      setDeleteConfirm(null);
    } catch (error) { console.error('Failed to delete product:', error); }
  };

  const columns = [
    { key: 'image', title: 'Image', render: (_, row) => (
      <img src={row.image || '/placeholder.png'} alt={row.name} className="product-thumb" />
    ), width: '60px' },
    { key: 'name', title: 'Product Name' },
    { key: 'sku', title: 'SKU' },
    { key: 'selling_price', title: 'Price', render: (v) => `KES ${v}` },
    { key: 'stock', title: 'Stock', render: (_, row) => (
      <StatusBadge status={row.stock > 10 ? 'in_stock' : row.stock > 0 ? 'low_stock' : 'out_of_stock'} />
    )},
    { key: 'is_active', title: 'Status', render: (v) => <StatusBadge status={v ? 'active' : 'inactive'} /> },
  ];

  return (
    <AdminLayout>
      <div className="admin-products">
        <div className="page-header">
          <h1>Products</h1>
          <GlassButton variant="primary" onClick={() => setIsDrawerOpen(true)}>
            <Plus size={18} /> Add Product
          </GlassButton>
        </div>

        <GlassCard className="products-card">
          <div className="products-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search products..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button className="filter-btn"><Filter size={18} /> Filter</button>
          </div>

          {loading ? <LoadingSkeleton variant="table-row" count={5} /> : (
            <DataTable columns={columns} data={products}
              actions={(row) => (<>
                <button className="action-btn edit" onClick={() => { setEditingProduct(row); setIsDrawerOpen(true); }}>
                  <Edit2 size={16} />
                </button>
                <button className="action-btn delete" onClick={() => setDeleteConfirm(row)}>
                  <Trash2 size={16} />
                </button>
              </>)} />
          )}
        </GlassCard>

        <AnimatePresence>
          {isDrawerOpen && <ProductDrawer product={editingProduct}
            onClose={() => { setIsDrawerOpen(false); setEditingProduct(null); }} onSave={fetchProducts} />}
        </AnimatePresence>

        <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm?.id)} title="Delete Product"
          message={`Delete "${deleteConfirm?.name}"?`} variant="danger" />
      </div>
    </AdminLayout>
  );
};

const ProductDrawer = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState(product || { name: '', sku: '', description: '', selling_price: '', cost_price: '', stock: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (product) await productAPI.update(product.id, formData);
      else await productAPI.create(formData);
      onSave(); onClose();
    } catch (error) { console.error('Failed to save product:', error); }
  };

  return (<>
    <div className="drawer-overlay" onClick={onClose} />
    <motion.div className="product-drawer" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}>
      <div className="drawer-header">
        <h2>{product ? 'Edit Product' : 'Add Product'}</h2>
        <button onClick={onClose}><X size={24} /></button>
      </div>
      <form onSubmit={handleSubmit} className="drawer-form">
        <div className="form-group">
          <label>Product Name</label>
          <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>SKU</label>
            <input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Stock</label>
            <input type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Selling Price (KES)</label>
            <input type="number" value={formData.selling_price} onChange={(e) => setFormData({...formData, selling_price: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Cost Price (KES)</label>
            <input type="number" value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} />
        </div>
        <div className="drawer-actions">
          <GlassButton variant="ghost" type="button" onClick={onClose}>Cancel</GlassButton>
          <GlassButton variant="primary" type="submit">{product ? 'Update' : 'Create'}</GlassButton>
        </div>
      </form>
    </motion.div>
  </>);
};

export default AdminProducts;
