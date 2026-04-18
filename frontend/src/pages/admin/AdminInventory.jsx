import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Search, Filter, AlertTriangle, TrendingUp, Plus, Minus, RefreshCw } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { productAPI } from '../../services/apiClient';
import './AdminInventory.css';

export const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [adjustModal, setAdjustModal] = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getAll({ search: searchTerm });
      setProducts(response.data.results || []);
    } catch (error) { console.error('Failed to fetch inventory:', error); }
    finally { setLoading(false); }
  };

  const handleAdjustStock = async (productId, adjustment) => {
    try {
      await productAPI.adjustStock(productId, { adjustment });
      fetchProducts();
      setAdjustModal(null);
    } catch (error) { console.error('Failed to adjust stock:', error); }
  };

  const filteredProducts = products.filter(p => {
    if (filter === 'low') return p.stock > 0 && p.stock <= 10;
    if (filter === 'out') return p.stock === 0;
    if (filter === 'in') return p.stock > 10;
    return true;
  });

  const inventoryStats = {
    total: products.length,
    lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((acc, p) => acc + (p.stock * p.cost_price || 0), 0)
  };

  const columns = [
    { key: 'name', title: 'Product Name' },
    { key: 'sku', title: 'SKU' },
    { key: 'stock', title: 'Current Stock', render: (v, row) => (
      <span className={`stock-value ${v === 0 ? 'out' : v <= 10 ? 'low' : ''}`}>{v}</span>
    )},
    { key: 'status', title: 'Status', render: (_, row) => (
      <StatusBadge status={row.stock > 10 ? 'in_stock' : row.stock > 0 ? 'low_stock' : 'out_of_stock'} />
    )},
    { key: 'cost_price', title: 'Unit Cost', render: (v) => `KES ${v || 0}` },
    { key: 'total_value', title: 'Total Value', render: (_, row) => `KES ${(row.stock * row.cost_price || 0).toFixed(2)}` },
  ];

  return (
    <AdminLayout>
      <div className="admin-inventory">
        <div className="page-header">
          <h1><Package size={24} /> Inventory Management</h1>
          <GlassButton variant="primary" onClick={fetchProducts}>
            <RefreshCw size={18} /> Refresh
          </GlassButton>
        </div>

        <div className="stats-grid">
          <GlassCard className="stat-card">
            <div className="stat-icon"><Package size={24} /></div>
            <div className="stat-info">
              <h3>{inventoryStats.total}</h3>
              <p>Total Products</p>
            </div>
          </GlassCard>
          <GlassCard className="stat-card warning">
            <div className="stat-icon"><AlertTriangle size={24} /></div>
            <div className="stat-info">
              <h3>{inventoryStats.lowStock}</h3>
              <p>Low Stock</p>
            </div>
          </GlassCard>
          <GlassCard className="stat-card danger">
            <div className="stat-icon"><AlertTriangle size={24} /></div>
            <div className="stat-info">
              <h3>{inventoryStats.outOfStock}</h3>
              <p>Out of Stock</p>
            </div>
          </GlassCard>
          <GlassCard className="stat-card success">
            <div className="stat-icon"><TrendingUp size={24} /></div>
            <div className="stat-info">
              <h3>KES {inventoryStats.totalValue.toFixed(2)}</h3>
              <p>Inventory Value</p>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="inventory-card">
          <div className="inventory-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search products..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="filter-group">
              <Filter size={18} />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Stock</option>
                <option value="low">Low Stock</option>
                <option value="out">Out of Stock</option>
                <option value="in">In Stock</option>
              </select>
            </div>
          </div>

          {loading ? <LoadingSkeleton variant="table-row" count={5} /> : (
            <DataTable columns={columns} data={filteredProducts}
              actions={(row) => (
                <button className="action-btn adjust" onClick={() => setAdjustModal(row)}>
                  <Plus size={16} /> Adjust
                </button>
              )} />
          )}
        </GlassCard>

        <AnimatePresence>
          {adjustModal && (
            <StockAdjustModal
              product={adjustModal}
              onClose={() => setAdjustModal(null)}
              onAdjust={handleAdjustStock}
            />
          )}
        </AnimatePresence>
      </div>
    </AdminLayout>
  );
};

const StockAdjustModal = ({ product, onClose, onAdjust }) => {
  const [adjustment, setAdjustment] = useState(0);
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdjust(product.id, adjustment);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <motion.div className="adjust-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <h3>Adjust Stock: {product.name}</h3>
        <p>Current Stock: <strong>{product.stock}</strong></p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Adjustment (+/-)</label>
            <input type="number" value={adjustment} onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)} required />
          </div>
          <div className="form-group">
            <label>New Stock: {product.stock + adjustment}</label>
          </div>
          <div className="form-group">
            <label>Reason (optional)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
          <div className="modal-actions">
            <GlassButton variant="ghost" type="button" onClick={onClose}>Cancel</GlassButton>
            <GlassButton variant="primary" type="submit">Adjust Stock</GlassButton>
          </div>
        </form>
      </motion.div>
    </>
  );
};

export default AdminInventory;
