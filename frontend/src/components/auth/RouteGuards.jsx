import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from '../common/LoadingScreen';

/**
 * ProtectedRoute - Section I2
 * Base protected route that requires authentication
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

/**
 * RoleRoute - Section I2
 * Route that requires specific role(s)
 */
export const RoleRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  if (!roles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check verification for dealers unless already on the verification pending page
  if (role === 'dealer' && !user?.is_verified && location.pathname !== '/dealer/verification-pending') {
    return <Navigate to="/dealer/verification-pending" replace />;
  }

  return children;
};

/**
 * AdminRoute - Section I2
 * Route only for admin users
 */
export const AdminRoute = ({ children }) => {
  return <RoleRoute allowedRoles="admin">{children}</RoleRoute>;
};

/**
 * DealerRoute - Section I2
 * Route only for dealer users
 */
export const DealerRoute = ({ children }) => {
  return <RoleRoute allowedRoles="dealer">{children}</RoleRoute>;
};

/**
 * CustomerRoute - Section I2
 * Route only for customer users
 */
export const CustomerRoute = ({ children }) => {
  return <RoleRoute allowedRoles="customer">{children}</RoleRoute>;
};

/**
 * AdminOrDealerRoute - Section I2
 * Route for admin OR dealer users
 */
export const AdminOrDealerRoute = ({ children }) => {
  return <RoleRoute allowedRoles={['admin', 'dealer']}>{children}</RoleRoute>;
};

/**
 * PublicOnlyRoute - Section I2
 * Route only accessible when NOT authenticated (login, register)
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading, role } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Redirect to appropriate dashboard based on role
    if (role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (role === 'dealer') {
      return <Navigate to="/dealer" replace />;
    } else if (role === 'customer') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
