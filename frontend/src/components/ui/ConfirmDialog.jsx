import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { GlassButton } from './GlassButton';
import './ConfirmDialog.css';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default', // default, danger, warning
  loading = false,
}) => {
  if (!isOpen) return null;

  const variants = {
    default: { confirmVariant: 'primary', icon: null },
    danger: { confirmVariant: 'danger', icon: AlertTriangle },
    warning: { confirmVariant: 'warning', icon: AlertTriangle },
  };

  const { confirmVariant, icon: Icon } = variants[variant] || variants.default;

  return (
    <AnimatePresence>
      <motion.div
        className="confirm-dialog__overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="confirm-dialog"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="confirm-dialog__close" onClick={onClose}>
            <X size={20} />
          </button>
          
          {Icon && (
            <div className={`confirm-dialog__icon confirm-dialog__icon--${variant}`}>
              <Icon size={32} />
            </div>
          )}
          
          <h3 className="confirm-dialog__title">{title}</h3>
          <p className="confirm-dialog__message">{message}</p>
          
          <div className="confirm-dialog__actions">
            <GlassButton variant="ghost" onClick={onClose} disabled={loading}>
              {cancelText}
            </GlassButton>
            <GlassButton 
              variant={confirmVariant} 
              onClick={onConfirm}
              loading={loading}
            >
              {confirmText}
            </GlassButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmDialog;
