import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Users,
  BarChart3, Settings, Bell, Menu, X, ChevronDown,
  LogOut, Box
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './AdminLayout.css';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/admin/inventory', icon: Box, label: 'Inventory' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { colors, theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`admin-layout ${isDark ? 'dark' : ''}`} style={{ backgroundColor: isDark ? colors.background : '#f8fafc' }}>
      {/* Mobile Header */}
      <div className="admin-layout__mobile-header" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
        <button 
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ color: colors.text }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <span className="mobile-logo" style={{ background: colors.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Glow Beyond</span>
        <button className="mobile-notifications" style={{ color: colors.text }}>
          <Bell size={20} />
        </button>
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || mobileMenuOpen) && (
          <motion.aside
            className={`admin-layout__sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
            style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <span className="logo-icon">✨</span>
                <span className="logo-text" style={{ background: colors.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Glow Beyond</span>
              </div>
              <button 
                className="sidebar-collapse"
                onClick={() => setSidebarOpen(false)}
                style={{ color: colors.textMuted }}
              >
                <X size={20} />
              </button>
            </div>

            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => 
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                  style={({ isActive }) => ({
                    color: isActive ? '#fff' : colors.textMuted,
                    backgroundColor: isActive ? colors.primary : 'transparent'
                  })}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="sidebar-footer" style={{ borderColor: colors.cardBorder }}>
              <div className="user-section">
                <div className="user-avatar" style={{ background: colors.primary }}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="user-info">
                  <span className="user-name" style={{ color: colors.text }}>{user?.first_name} {user?.last_name}</span>
                  <span className="user-role" style={{ color: colors.textMuted }}>Administrator</span>
                </div>
                <ChevronDown size={16} style={{ color: colors.textMuted }} />
              </div>
              <button className="logout-btn" onClick={handleLogout} style={{ color: '#dc2626', borderColor: colors.cardBorder }}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="admin-layout__main">
        <header className="admin-header" style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ color: colors.text }}
          >
            <Menu size={20} />
          </button>
          <h1 className="page-title" style={{ color: colors.text }}>Admin Portal</h1>
          <div className="header-actions">
            <button className="header-btn" style={{ color: colors.text }}>
              <Bell size={20} />
              <span className="notification-badge" style={{ background: '#dc2626' }}>3</span>
            </button>
          </div>
        </header>
        
        <div className="admin-content" style={{ color: colors.text }}>
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
