import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, Search, Package, Heart, 
  FileText, Users, AlertCircle 
} from 'lucide-react';
import './EmptyState.css';

const emptyConfig = {
  cart: { icon: ShoppingBag, title: 'Your cart is empty', description: 'Add some items to get started' },
  wishlist: { icon: Heart, title: 'Your wishlist is empty', description: 'Save items you love for later' },
  orders: { icon: Package, title: 'No orders yet', description: 'Your order history will appear here' },
  products: { icon: Search, title: 'No products found', description: 'Try adjusting your search or filters' },
  search: { icon: Search, title: 'No results found', description: 'Try different keywords' },
  default: { icon: AlertCircle, title: 'Nothing here', description: 'There are no items to display' },
};

export const EmptyState = ({ 
  variant = 'default', 
  title, 
  description, 
  action,
  className = '' 
}) => {
  const config = emptyConfig[variant] || emptyConfig.default;
  const Icon = config.icon;

  return (
    <motion.div 
      className={`empty-state ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="empty-state__icon">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="empty-state__title">{title || config.title}</h3>
      <p className="empty-state__description">{description || config.description}</p>
      {action && (
        <div className="empty-state__action">
          {action}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
