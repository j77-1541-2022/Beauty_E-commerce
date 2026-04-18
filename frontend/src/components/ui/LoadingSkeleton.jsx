import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSkeleton.css';

export const LoadingSkeleton = ({ variant = 'text', count = 1, className = '' }) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <motion.div
      key={i}
      className={`skeleton skeleton--${variant} ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  ));

  return <>{skeletons}</>;
};

// Pre-configured skeleton variants
export const CardSkeleton = () => (
  <div className="skeleton-card">
    <LoadingSkeleton variant="image" className="skeleton-card__image" />
    <LoadingSkeleton variant="title" />
    <LoadingSkeleton variant="text" count={2} />
  </div>
);

export const TableRowSkeleton = ({ columns = 4 }) => (
  <div className="skeleton-table-row">
    {Array.from({ length: columns }, (_, i) => (
      <LoadingSkeleton key={i} variant="text" className="skeleton-table-cell" />
    ))}
  </div>
);

export const ProductCardSkeleton = () => (
  <div className="skeleton-product-card">
    <LoadingSkeleton variant="image" />
    <LoadingSkeleton variant="title" />
    <LoadingSkeleton variant="text" />
    <div className="skeleton-product-card__footer">
      <LoadingSkeleton variant="text" className="skeleton-price" />
      <LoadingSkeleton variant="button" />
    </div>
  </div>
);

export default LoadingSkeleton;
