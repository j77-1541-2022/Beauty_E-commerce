import React, { Component } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import './ErrorBoundary.css';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <GlassCard className="error-card" elevated>
              <div className="error-icon">
                <AlertTriangle size={64} />
              </div>
              
              <h1>Something Went Wrong</h1>
              <p>
                We apologize for the inconvenience. Our team has been notified 
                and is working to resolve the issue.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="error-details">
                  <pre>{this.state.error.toString()}</pre>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              )}
              
              <div className="error-actions">
                <GlassButton variant="primary" onClick={this.handleRetry}>
                  <RefreshCw size={18} /> Try Again
                </GlassButton>
                
                <a href="/">
                  <GlassButton variant="ghost">
                    <Home size={18} /> Go Home
                  </GlassButton>
                </a>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
