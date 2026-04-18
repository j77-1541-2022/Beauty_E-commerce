import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Home, Search } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { GlassButton } from '../../components/ui/GlassButton';
import './ErrorPages.css';

export const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="animated-bg">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="floating-particle"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight 
            }}
            animate={{ 
              y: [null, Math.random() * -100, null],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ 
              duration: 5 + Math.random() * 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <GlassCard className="not-found-card" elevated>
          <motion.div 
            className="error-code"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          >
            <span className="digit">4</span>
            <Sparkles size={60} className="sparkle-icon" />
            <span className="digit">4</span>
          </motion.div>
          
          <h1>Page Not Found</h1>
          <p>
            Oops! The page you're looking for seems to have vanished 
            like morning dew on a rose petal.
          </p>
          
          <div className="not-found-actions">
            <Link to="/">
              <GlassButton variant="primary">
                <Home size={18} /> Back Home
              </GlassButton>
            </Link>
            
            <Link to="/shop">
              <GlassButton variant="ghost">
                <Search size={18} /> Browse Shop
              </GlassButton>
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
