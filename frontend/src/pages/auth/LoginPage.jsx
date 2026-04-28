import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

export const LoginPage = () => {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(formData);
    
    if (result.success) {
      const storedRedirect = localStorage.getItem('redirectAfterLogin')
      const from = location.state?.from?.pathname || storedRedirect;
      const dashboard = result.user.role === 'admin' ? '/admin' : 
                       result.user.role === 'dealer' ? '/dealer' : '/dashboard';
      const destination = from && from !== '/login' && from !== '/register' ? from : dashboard;
      localStorage.removeItem('redirectAfterLogin');
      navigate(destination);
    } else {
      setError(result.error);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-page">
      {/* Split Layout Background */}
      <div className="login-split">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <motion.div 
              className="brand-logo"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles size={48} />
              <h1>Glow Beyond</h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Beauty redefined. Your journey to radiant skin starts here.
            </motion.p>
          </div>
          <div className="branding-image" />
        </div>

        {/* Right Side - Form */}
        <div className="login-form-section">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className={`login-card ${shake ? 'shake' : ''}`} elevated>
              <div className="flex items-center justify-between mb-4">
                <h2>Welcome Back</h2>
                <Link to="/shop" className="text-sm text-gray-500 hover:text-gray-700">
                  Back to Home
                </Link>
              </div>
              <p>Sign in to your account to continue</p>

              {error && (
                <motion.div 
                  className="error-message"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Email or Username</label>
                  <div className="input-wrapper">
                    <Mail size={18} />
                    <input
                      type="text"
                      value={formData.identifier}
                      onChange={(e) => setFormData({...formData, identifier: e.target.value})}
                      placeholder="your@email.com or username"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Lock size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-options">
                  <label className="remember-me">
                    <input type="checkbox" /> Remember me
                  </label>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>

                <GlassButton
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="login-btn"
                  type="submit"
                >
                  Sign In
                </GlassButton>
              </form>

              <div className="login-footer">
                Don't have an account?{' '}
                <Link to="/register" className="signup-link">
                  Create one
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
