import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, Home, LogIn } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import { useAuth } from '../../contexts/AuthContext';
import './ErrorPages.css';

export const UnauthorizedPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const roleMessages = {
    admin: {
      title: 'Access Restricted',
      message: 'This area is reserved for system administrators only.',
      cta: 'Go to Admin Dashboard',
      link: '/admin'
    },
    dealer: {
      title: 'Dealer Access Only',
      message: 'This section is exclusively for verified dealers. Complete your verification to access this area.',
      cta: 'Go to Dealer Dashboard',
      link: '/dealer'
    },
    customer: {
      title: 'Customer Access Only',
      message: 'This feature is available for registered customers.',
      cta: 'Go to Dashboard',
      link: '/dashboard'
    },
    guest: {
      title: 'Authentication Required',
      message: 'Please sign in to access this page.',
      cta: 'Sign In',
      link: '/login'
    }
  };

  const role = isAuthenticated ? user?.role : 'guest';
  const content = roleMessages[role] || roleMessages.guest;

  return (
    <div className="unauthorized-page">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <GlassCard className="unauthorized-card" elevated>
          <div className="unauthorized-icon">
            <ShieldAlert size={64} />
          </div>
          
          <h1>{content.title}</h1>
          <p>{content.message}</p>
          
          <div className="unauthorized-actions">
            <GlassButton 
              variant="primary" 
              onClick={() => navigate(content.link)}
            >
              {content.cta}
            </GlassButton>
            
            <GlassButton 
              variant="ghost" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={18} /> Go Back
            </GlassButton>
          </div>
          
          <Link to="/" className="home-link">
            <Home size={16} /> Return to Homepage
          </Link>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default UnauthorizedPage;
