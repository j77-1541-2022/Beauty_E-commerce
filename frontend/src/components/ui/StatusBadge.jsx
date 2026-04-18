import React from 'react';
import './StatusBadge.css';

const statusConfig = {
  pending: { color: '#f59e0b', label: 'Pending', bg: 'rgba(245, 158, 11, 0.15)' },
  confirmed: { color: '#3b82f6', label: 'Confirmed', bg: 'rgba(59, 130, 246, 0.15)' },
  processing: { color: '#8b5cf6', label: 'Processing', bg: 'rgba(139, 92, 246, 0.15)' },
  shipped: { color: '#06b6d4', label: 'Shipped', bg: 'rgba(6, 182, 212, 0.15)' },
  delivered: { color: '#22c55e', label: 'Delivered', bg: 'rgba(34, 197, 94, 0.15)' },
  cancelled: { color: '#ef4444', label: 'Cancelled', bg: 'rgba(239, 68, 68, 0.15)' },
  refunded: { color: '#6b7280', label: 'Refunded', bg: 'rgba(107, 114, 128, 0.15)' },
  paid: { color: '#22c55e', label: 'Paid', bg: 'rgba(34, 197, 94, 0.15)' },
  failed: { color: '#ef4444', label: 'Failed', bg: 'rgba(239, 68, 68, 0.15)' },
  active: { color: '#22c55e', label: 'Active', bg: 'rgba(34, 197, 94, 0.15)' },
  inactive: { color: '#6b7280', label: 'Inactive', bg: 'rgba(107, 114, 128, 0.15)' },
  in_stock: { color: '#22c55e', label: 'In Stock', bg: 'rgba(34, 197, 94, 0.15)' },
  low_stock: { color: '#f59e0b', label: 'Low Stock', bg: 'rgba(245, 158, 11, 0.15)' },
  out_of_stock: { color: '#ef4444', label: 'Out of Stock', bg: 'rgba(239, 68, 68, 0.15)' },
};

export const StatusBadge = ({ status, className = '', size = 'md' }) => {
  const config = statusConfig[status?.toLowerCase()] || { 
    color: '#6b7280', 
    label: status || 'Unknown',
    bg: 'rgba(107, 114, 128, 0.15)'
  };

  return (
    <span 
      className={`status-badge status-badge--${size} ${className}`}
      style={{ 
        color: config.color, 
        backgroundColor: config.bg,
        border: `1px solid ${config.color}30`
      }}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
