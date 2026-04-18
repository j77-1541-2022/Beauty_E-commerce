import React from 'react';
import { motion } from 'framer-motion';
import './GlassButton.css';

export const GlassButton = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props 
}) => {
  const baseClasses = 'glass-btn';
  const variantClass = `glass-btn--${variant}`;
  const sizeClass = `glass-btn--${size}`;
  
  return (
    <motion.button
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      {...props}
    >
      {loading && <span className="glass-btn__spinner" />}
      {children}
    </motion.button>
  );
};

export default GlassButton;
