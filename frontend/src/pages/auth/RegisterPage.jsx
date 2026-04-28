import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Building2, Sparkles, CheckCircle } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/apiClient';
import './RegisterPage.css';

export const RegisterPage = () => {
  const [activeTab, setActiveTab] = useState('customer');
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', confirmPassword: '', business_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedRole = params.get('role');
    if (requestedRole === 'dealer' || requestedRole === 'customer') {
      setActiveTab(requestedRole);
    }
  }, [location.search]);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await authAPI.register({
        ...formData,
        role: activeTab,
        password: formData.password,
        confirm_password: formData.confirmPassword
      });
      
      if (response.data.success) {
        // Auto login after registration
        const loginResult = await login({ identifier: formData.email, password: formData.password });
        if (loginResult.success) {
          const storedRedirect = localStorage.getItem('redirectAfterLogin')
          const from = location.state?.from?.pathname || storedRedirect;
          const dashboard = activeTab === 'admin' ? '/admin' : 
                           activeTab === 'dealer' ? '/dealer' : '/dashboard';
          const destination = from && from !== '/login' && from !== '/register' ? from : dashboard;
          localStorage.removeItem('redirectAfterLogin');
          navigate(destination);
        }
      } else {
        setError(response.data.error?.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Registration failed. Please try again.');
    }
    
    setLoading(false);
  };

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];

  return (
    <div className="register-page">
      <div className="register-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <Link to="/shop" className="text-sm text-gray-500 hover:text-gray-700">
            Back to Home
          </Link>
        </motion.div>
          <GlassCard className="register-card" elevated>
            <div className="register-header">
              <Sparkles size={32} />
              <h1>Create Account</h1>
              <p>Join Glow Beyond Beauty</p>
            </div>

            {/* Tabbed Form */}
            <div className="register-tabs">
              <button 
                className={activeTab === 'customer' ? 'active' : ''}
                onClick={() => setActiveTab('customer')}
              >
                Customer
              </button>
              <button 
                className={activeTab === 'dealer' ? 'active' : ''}
                onClick={() => setActiveTab('dealer')}
              >
                Dealer
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <div className="input-wrapper">
                    <User size={18} />
                    <input
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                      placeholder="John"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <div className="input-wrapper">
                    <User size={18} />
                    <input
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <div className="input-wrapper">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              {activeTab === 'dealer' && (
                <div className="form-group">
                  <label>Business Name</label>
                  <div className="input-wrapper">
                    <Building2 size={18} />
                    <input
                      value={formData.business_name}
                      onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                      placeholder="Your Business Name"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({...formData, password: e.target.value});
                      checkPasswordStrength(e.target.value);
                    }}
                    placeholder="Create a strong password"
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i} 
                          className={`strength-segment ${i <= passwordStrength ? 'active' : ''}`}
                          style={{ backgroundColor: i <= passwordStrength ? strengthColors[passwordStrength - 1] : '#e5e7eb' }}
                        />
                      ))}
                    </div>
                    <span style={{ color: strengthColors[passwordStrength - 1] }}>
                      {strengthLabels[passwordStrength - 1] || 'Weak'}
                    </span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>

              <GlassButton
                variant="primary"
                size="lg"
                loading={loading}
                className="register-btn"
                type="submit"
              >
                Create Account
              </GlassButton>
            </form>

            <div className="register-footer">
              Already have an account?{' '}
              <Link to="/login" className="signin-link">Sign in</Link>
            </div>
          </GlassCard>
        </div>
      </div>
  );
};

export default RegisterPage;
