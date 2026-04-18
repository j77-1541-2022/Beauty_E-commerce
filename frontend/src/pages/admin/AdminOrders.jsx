import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, XCircle, Eye } from 'lucide-react';
import { AdminLayout } from '../../components/layouts/AdminLayout';
import { GlassCard } from '../../components/ui/GlassCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DataTable } from '../../components/ui/DataTable';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton';
import { orderAPI } from '../../services/apiClient';
import './AdminOrders.css';

const statusTabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState(null);

  useEffect(() => { fetchOrders(); }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await orderAPI.getAll(params);
      setOrders(response.data.results || []);
    } catch (error) { console.error('Failed to fetch orders:', error); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      setStatusUpdate(null);
    } catch (error) { console.error('Failed to update status:', error); }
  };

  const columns = [
    { key: 'order_number', title: 'Order #' },
    { key: 'customer_name', title: 'Customer' },
    { key: 'created_at', title: 'Date', render: (v) => new Date(v).toLocaleDateString() },
    { key: 'total_amount', title: 'Total', render: (v) => `KES ${v}` },
    { key: 'status', title: 'Status', render: (v) => <StatusBadge status={v} /> },
  ];

  return (
    <AdminLayout>
      <div className="admin-orders">
        <div className="page-header"><h1>Orders</h1></div>

        <div className="status-tabs">
          {statusTabs.map((tab) => (
            <button key={tab.key} className={`status-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
          ))}
        </div>

        <GlassCard className="orders-card">
          {loading ? <LoadingSkeleton variant="table-row" count={5} /> : (
            <DataTable columns={columns} data={orders}
              actions={(row) => (
                <div className="order-actions">
                  <select value={row.status} className="status-select"
                    onChange={(e) => setStatusUpdate({ order: row, status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button className="action-btn view" onClick={() => setSelectedOrder(row)}><Eye size={16} /></button>
                </div>
              )} />
          )}
        </GlassCard>

        {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        <ConfirmDialog isOpen={!!statusUpdate} onClose={() => setStatusUpdate(null)}
          onConfirm={() => handleStatusUpdate(statusUpdate?.order?.id, statusUpdate?.status)}
          title="Update Order Status" message={`Change order ${statusUpdate?.order?.order_number} to "${statusUpdate?.status}"?`} />
      </div>
    </AdminLayout>
  );
};

const OrderDetailModal = ({ order, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <motion.div className="order-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h2>Order {order.order_number}</h2>
        <button onClick={onClose}><XCircle size={24} /></button>
      </div>
      <div className="modal-content">
        <div className="order-info-grid">
          <div><label>Customer</label><p>{order.customer_name}</p><p>{order.customer_email}</p></div>
          <div><label>Shipping</label><p>{order.shipping_address}</p></div>
          <div><label>Date</label><p>{new Date(order.created_at).toLocaleString()}</p></div>
          <div><label>Status</label><StatusBadge status={order.status} /></div>
        </div>
        <h3>Items</h3>
        <div className="order-items">
          {order.items?.map((item) => (
            <div key={item.id} className="order-item">
              <img src={item.product_image || '/placeholder.png'} alt={item.product_name} />
              <div className="item-details"><span className="item-name">{item.product_name}</span>
                <span className="item-qty">Qty: {item.quantity}</span></div>
              <span className="item-price">KES {item.total_price}</span>
            </div>
          ))}
        </div>
        <div className="order-totals">
          <div className="total-row"><span>Subtotal</span><span>KES {order.subtotal}</span></div>
          <div className="total-row"><span>Tax</span><span>KES {order.tax_amount}</span></div>
          <div className="total-row"><span>Shipping</span><span>KES {order.shipping_cost}</span></div>
          <div className="total-row grand"><span>Total</span><span>KES {order.total_amount}</span></div>
        </div>
      </div>
    </motion.div>
  </div>
);

export default AdminOrders;
