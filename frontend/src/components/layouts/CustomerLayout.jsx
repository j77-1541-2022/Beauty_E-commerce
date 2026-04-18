import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, ShoppingBag, Heart, User, Menu, X,
  LogOut, Package
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './CustomerLayout.css';

export const CustomerLayout = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { path: '/shop', label: 'Shop' },
    { path: '/categories', label: 'Categories' },
    { path: '/offers', label: 'Offers' },
    { path: '/about', label: 'About' },
  ];

  return (
    <div className="customer-layout">
      {/* Top Navigation */}
      <header className={`customer-nav ${isScrolled ? 'solid' : 'transparent'}`}>
        <div className="customer-nav__container">
          {/* Logo */}
          <NavLink to="/" className="customer-logo">
            <span className="logo-glow">✨</span>
            <span className="logo-text">Glow Beyond</span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="customer-nav__links">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => 
                  `nav-link ${isActive ? 'active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="customer-nav__actions">
            <button className="nav-action-btn" onClick={() => navigate('/search')}>
              <Search size={20} />
            </button>
            
            {isAuthenticated ? (
              <>
                <button className="nav-action-btn" onClick={() => navigate('/wishlist')}>
                  <Heart size={20} />
                </button>
                <button className="nav-action-btn" onClick={() => navigate('/cart')}>
                  <ShoppingBag size={20} />
                  <span className="cart-badge">2</span>
                </button>
                <button className="nav-action-btn" onClick={() => navigate('/dashboard')}>
                  <User size={20} />
                </button>
              </>
            ) : (
              <button 
                className="nav-login-btn"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          className="mobile-menu"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <nav className="mobile-nav">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className="mobile-nav-link"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            
            {isAuthenticated && (
              <>
                <NavLink to="/orders" className="mobile-nav-link">
                  <Package size={18} /> My Orders
                </NavLink>
                <NavLink to="/wishlist" className="mobile-nav-link">
                  <Heart size={18} /> Wishlist
                </NavLink>
                <button className="mobile-logout" onClick={handleLogout}>
                  <LogOut size={18} /> Logout
                </button>
              </>
            )}
          </nav>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="customer-main">
        {children}
      </main>
    </div>
  );
};

export default CustomerLayout;
