import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Wallet,
  User, BadgeCheck, AlertCircle, LogOut, FileText,
  BarChart3, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationBell } from '../notifications/NotificationBell';
import { ThemeSwitcher } from '../theme/ThemeSwitcher';
import './DealerLayout.css';

const navItems = [
  { path: '/dealer', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/dealer/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/dealer/products', icon: Package, label: 'Products' },
  { path: '/dealer/earnings', icon: Wallet, label: 'Earnings' },
  { path: '/dealer/reports', icon: FileText, label: 'Reports' },
  { path: '/dealer/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/dealer/profile', icon: User, label: 'Profile' },
];

export const DealerLayout = ({ children }) => {
  const { user, logout, isVerified } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dealer-layout">
      {/* Verification Banner */}
      {!isVerified && (
        <div className="verification-banner">
          <AlertCircle size={20} />
          <span>Your account is pending verification. Some features are limited.</span>
        </div>
      )}

      <aside className="dealer-layout__sidebar">
        <div className="dealer-sidebar-header">
          <div className="dealer-logo">
            <span className="logo-icon">✨</span>
            <span className="logo-text">Dealer Portal</span>
          </div>
          
          {/* Verification Badge */}
          <div className={`verification-badge ${isVerified ? 'verified' : 'pending'}`}>
            {isVerified ? (
              <><BadgeCheck size={16} /> Verified Dealer</>
            ) : (
              <><AlertCircle size={16} /> Pending Verification</>
            )}
          </div>
        </div>

        <nav className="dealer-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `dealer-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="dealer-sidebar-footer">
          {/* Pending Payout Display */}
          <div className="payout-card">
            <span className="payout-label">Pending Payout</span>
            <span className="payout-amount">KES 12,500</span>
            <span className="payout-date">Next: Dec 15, 2024</span>
          </div>
          
          <button className="dealer-logout" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="dealer-layout__main">
        <header className="dealer-header">
          <h1 className="dealer-page-title">
            {navItems.find(item => item.path === location.pathname)?.label || 'Dealer Portal'}
          </h1>
          <div className="dealer-header-actions">
            <ThemeSwitcher />
            <NotificationBell />
            <div className="dealer-user">
              <span>{user?.first_name} {user?.last_name}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>
        
        <div className="dealer-content">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DealerLayout;
