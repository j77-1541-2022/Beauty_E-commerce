import React, { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// Contexts
import { AuthProvider } from './contexts/AuthContext'
import { CustomerAuthProvider } from './contexts/CustomerAuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { CompareProvider } from './contexts/CompareContext'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ErrorHandlerProvider } from './contexts/ErrorHandlerContext'

// Components
import ErrorBoundary from './components/errors/ErrorBoundary'
import ErrorToast from './components/ErrorToast'
import Footer from './components/Footer'
import { 
  ProtectedRoute, AdminRoute, DealerRoute, CustomerRoute, PublicOnlyRoute 
} from './components/auth/RouteGuards'
import LoadingScreen from './components/common/LoadingScreen'
import GlobalLoadingOverlay from './components/common/GlobalLoadingOverlay'
import PageTransition from './components/PageTransition'

// Lazy load pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const UnauthorizedPage = lazy(() => import('./pages/errors/UnauthorizedPage'))
const NotFoundPage = lazy(() => import('./pages/errors/NotFoundPage'))

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'))
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'))
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'))
const AdminInventory = lazy(() => import('./pages/admin/AdminInventory'))
const DSSDashboard = lazy(() => import('./pages/admin/DSSDashboard'))

// Dealer Pages
const DealerLayout = lazy(() => import('./pages/dealer/DealerLayout'))
const DealerDashboard = lazy(() => import('./pages/dealer/DealerDashboard'))
const DealerOrders = lazy(() => import('./pages/dealer/DealerOrdersManagement'))
const DealerProducts = lazy(() => import('./pages/dealer/DealerProducts'))
const DealerInventory = lazy(() => import('./pages/dealer/DealerInventory'))
const DealerEarnings = lazy(() => import('./pages/dealer/DealerEarnings'))
const DealerProfile = lazy(() => import('./pages/dealer/DealerProfile'))
const DealerAnalytics = lazy(() => import('./pages/dealer/DealerAnalytics'))
const DealerVerificationPending = lazy(() => import('./pages/dealer/DealerVerificationPending'))
const DealerReportsCenter = lazy(() => import('./pages/dealer/DealerReportsCenter'))
const DSSInsights = lazy(() => import('./pages/dealer/DSSInsights'))

// Customer Pages
const HomePage = lazy(() => import('./pages/HomePage'))
const ShopPage = lazy(() => import('./pages/ShopPage'))
const CartPage = lazy(() => import('./pages/CartPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const CustomerDashboard = lazy(() => import('./pages/CustomerAccountDashboard'))
const CustomerOrders = lazy(() => import('./pages/CustomerOrders'))
const WishlistPage = lazy(() => import('./pages/WishlistPage'))
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'))
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'))
const ProductDetailsPage = lazy(() => import('./pages/ProductDetailsPage'))
const DealerStorePage = lazy(() => import('./pages/DealerStorePage'))
const InfoCenterPage = lazy(() => import('./pages/InfoCenterPage'))

// Page transition wrapper
const PageWrapper = ({ children }) => (
  <PageTransition>
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      transition={{ 
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  </PageTransition>
)

// Apply theme class to root element
const ThemeApplier = ({ children }) => {
  const { isDark } = useTheme()
  
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])
  
  return children
}

function AppRoutes() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <Suspense fallback={<LoadingScreen />}>
            <PageWrapper><ShopPage /></PageWrapper>
          </Suspense>
        } />
        
        {/* Auth Routes - Public Only */}
        <Route path="/login" element={
          <PublicOnlyRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><LoginPage /></PageWrapper>
            </Suspense>
          </PublicOnlyRoute>
        } />
        
        <Route path="/register" element={
          <PublicOnlyRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><RegisterPage /></PageWrapper>
            </Suspense>
          </PublicOnlyRoute>
        } />

        {/* Customer Shop Routes - Public */}
        <Route path="/shop" element={
          <Suspense fallback={<LoadingScreen />}>
            <PageWrapper><ShopPage /></PageWrapper>
          </Suspense>
        } />
        <Route path="/info" element={
          <Suspense fallback={<LoadingScreen />}>
            <PageWrapper><InfoCenterPage /></PageWrapper>
          </Suspense>
        } />
        <Route path="/product/:id" element={
          <Suspense fallback={<LoadingScreen />}>
            <PageWrapper><ProductDetailsPage /></PageWrapper>
          </Suspense>
        } />
        <Route path="/dealer/:dealerId" element={
          <Suspense fallback={<LoadingScreen />}>
            <PageWrapper><DealerStorePage /></PageWrapper>
          </Suspense>
        } />

        {/* Customer Protected Routes */}
        <Route path="/dashboard" element={
          <CustomerRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><CustomerDashboard /></PageWrapper>
            </Suspense>
          </CustomerRoute>
        } />
        {/* Cart - Public (guests can view cart) */}
        <Route path="/cart" element={
          <Suspense fallback={<LoadingScreen />}>
            <PageWrapper><CartPage /></PageWrapper>
          </Suspense>
        } />
        <Route path="/checkout" element={
          <CustomerRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><CheckoutPage /></PageWrapper>
            </Suspense>
          </CustomerRoute>
        } />
        <Route path="/orders" element={
          <CustomerRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><CustomerOrders /></PageWrapper>
            </Suspense>
          </CustomerRoute>
        } />
        <Route path="/customer/orders/:id/track" element={
          <CustomerRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><OrderTrackingPage /></PageWrapper>
            </Suspense>
          </CustomerRoute>
        } />
        <Route path="/wishlist" element={
          <CustomerRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><WishlistPage /></PageWrapper>
            </Suspense>
          </CustomerRoute>
        } />
        <Route path="/compare" element={
          <Suspense fallback={<LoadingScreen />}>
            <PageWrapper><ComparisonPage /></PageWrapper>
          </Suspense>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><AdminDashboard /></PageWrapper>
            </Suspense>
          </AdminRoute>
        } />
        <Route path="/admin/products" element={
          <AdminRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><AdminProducts /></PageWrapper>
            </Suspense>
          </AdminRoute>
        } />
        <Route path="/admin/orders" element={
          <AdminRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><AdminOrders /></PageWrapper>
            </Suspense>
          </AdminRoute>
        } />
        <Route path="/admin/inventory" element={
          <AdminRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><AdminInventory /></PageWrapper>
            </Suspense>
          </AdminRoute>
        } />
        <Route path="/admin/insights" element={
          <AdminRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DSSDashboard /></PageWrapper>
            </Suspense>
          </AdminRoute>
        } />

        {/* Dealer Routes */}
        <Route path="/dealer" element={
          <DealerRoute>
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerLayout /></PageWrapper>
            </Suspense>
          </DealerRoute>
        }>
          <Route index element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerDashboard /></PageWrapper>
            </Suspense>
          } />
          <Route path="orders" element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerOrders /></PageWrapper>
            </Suspense>
          } />
          <Route path="products" element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerProducts /></PageWrapper>
            </Suspense>
          } />
          <Route path="inventory" element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerInventory /></PageWrapper>
            </Suspense>
          } />
          <Route path="earnings" element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerEarnings /></PageWrapper>
            </Suspense>
          } />
          <Route path="profile" element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerProfile /></PageWrapper>
            </Suspense>
          } />
          <Route path="reports" element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerReportsCenter /></PageWrapper>
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerAnalytics /></PageWrapper>
            </Suspense>
          } />
          <Route path="verification-pending" element={
            <Suspense fallback={<LoadingScreen />}>
              <PageWrapper><DealerVerificationPending /></PageWrapper>
            </Suspense>
          } />
          <Route path="inventory-reports" element={
            <Navigate to="/dealer/reports" replace />
          } />
          <Route path="dss-insights" element={
            <Suspense fallback={<LoadingScreen />}>
              <DealerRoute><DSSInsights /></DealerRoute>
            </Suspense>
          } />
        </Route>

        {/* Error Pages */}
        <Route path="/unauthorized" element={
          <Suspense fallback={<LoadingScreen />}>
            <UnauthorizedPage />
          </Suspense>
        } />
        
        {/* 404 Catch-all */}
        <Route path="*" element={
          <Suspense fallback={<LoadingScreen />}>
            <NotFoundPage />
          </Suspense>
        } />
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemeApplier>
          <CurrencyProvider>
            <AuthProvider>
              <NotificationProvider>
                <ErrorHandlerProvider>
                  <CustomerAuthProvider>
                    <CartProvider>
                      <WishlistProvider>
                        <CompareProvider>
                          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-300">
                            <div className="flex-1">
                              <AppRoutes />
                            </div>
                            <Footer />
                            <GlobalLoadingOverlay />
                            <ErrorToast />
                          </div>
                        </CompareProvider>
                      </WishlistProvider>
                    </CartProvider>
                  </CustomerAuthProvider>
                </ErrorHandlerProvider>
              </NotificationProvider>
            </AuthProvider>
          </CurrencyProvider>
        </ThemeApplier>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
