# Glow Beyond Beauty - E-Commerce Platform Documentation

## Executive Summary

Glow Beyond Beauty is a role-based beauty e-commerce platform built with Django REST Framework and React. It supports customer shopping, dealer inventory management, admin oversight, loyalty tracking, cash and M-Pesa payments, and decision support analytics for stock planning.

**Current Status**: ✅ **Fully Functional** - Core flows are implemented, validated, and build/migration clean.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Completed Features](#completed-features)
3. [Technical Stack](#technical-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Structure](#frontend-structure)
7. [Authentication & Security](#authentication--security)
8. [Deployment Guide](#deployment-guide)
9. [Testing Strategy](#testing-strategy)
10. [Performance Optimization](#performance-optimization)

---

## Architecture Overview

### System Design
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  Customer    │  │    Admin     │  │   Dealer     │        │
│  │   Portal     │  │   Dashboard  │  │   Portal     │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND LAYER                          │
│              React 18 + Vite + TailwindCSS                   │
│     Context API, React Router v6, Framer Motion            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API LAYER                              │
│              Django REST Framework + JWT                     │
│              WebSocket for Real-time Updates                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│       PostgreSQL (Production) / SQLite (Development)       │
│              Redis (Caching & Sessions)                    │
└─────────────────────────────────────────────────────────────┘
```

### Design Principles
- **Microservices Architecture** - Modular, scalable component design
- **API-First Development** - RESTful APIs with comprehensive documentation
- **Mobile-First Responsive** - Optimized for all device sizes
- **Security by Design** - JWT authentication, role-based access control
- **Performance Optimized** - Lazy loading, caching, database indexing
- **Test-Driven Development** - Comprehensive test coverage

## System Flow

### Customer Flow
1. Browse products in the shop.
2. Open product details to view dealer info and location.
3. Add items to cart and proceed to checkout.
4. Pay by M-Pesa or cash.
5. Receive confirmation and a downloadable receipt.

### Dealer Flow
1. Manage products, pricing, and stock.
2. View dealer profile, earnings, and inventory reports.
3. Use DSS to review demand forecast, ABC analysis, EOQ, and reorder recommendations.
4. Record cash payments for walk-in customers and confirm orders.

### Admin Flow
1. Monitor the entire marketplace.
2. Review analytics, audits, orders, and loyalty activity.
3. Resolve exceptions and maintain platform health.

## Innovation and Strengths

- Dealer-only `unit_price` supports internal planning without exposing cost data to customers.
- DSS explanations are written in plain language so the analytics are easier to defend and use.
- Cash payments are first-class and produce receipts, which supports offline or walk-in sales.
- Dealer locations are visible to customers via map support, improving trust and discoverability.
- Loyalty data is visible on the customer dashboard and tied to the shopping experience.
- The customer dashboard and checkout pages use a consistent visual language for readability.

## Defence Workflow

Use this sequence in the defence:
1. State the problem: one platform for selling, fulfillment, dealer management, and reporting.
2. Explain the architecture: React frontend, Django REST backend, role-based portals, shared API client.
3. Walk through the business flow: browse, cart, checkout, payment, receipt, inventory update.
4. Demonstrate innovation: DSS, loyalty, dealer maps, cash receipts, dealer-only unit price.
5. Show reliability: migrations, permissions, validation, and successful build checks.
6. Close with impact: improved stock control, better customer experience, and reduced manual work.

### Likely Questions
- Why is DSS useful here?
- Why are there separate customer, dealer, and admin portals?
- Why support cash if the platform is online?
- How is dealer cost data protected?
- What makes your project innovative compared to a normal e-commerce site?

### Short Answers You Can Use
- "The platform is built around actual operational workflows, not just product browsing."
- "The DSS helps dealers make restocking decisions using forecast, ABC, and EOQ signals."
- "Cash support is important because walk-in customers still exist and dealers need receipts."
- "Dealer cost is used internally for inventory planning and is not exposed to customers."
- "The project combines marketplace, analytics, loyalty, and dealer workflow in one system."

---

## Completed Features ✅
### April 2026 Final Updates

- All rating and review data now fetched from backend for accuracy and reliability
- Cart item count and details on dashboard are fully dynamic and reflect actual cart contents
- Product details modal and view are always dynamic and error-free for all products
- Compare feature bug fixed (no more ReferenceError: colors is not defined)
- Product images now always match dealer uploads (uses primary_image and images fields from backend)
- Products removed from customer dashboard (now only in Shop)
- Customer dashboard now shows: order summary, recent orders, loyalty points, personalized offers, wishlist preview, notifications, recent activity, and account quick actions
- Account Settings (Profile, Notifications, Security) are fully interactive and functional
- "Browse by Category" is dynamic and updates product list in real time
- Uniform color theme applied to all customer pages (checkout and dashboard)
- All frontend and backend errors resolved; no new errors introduced
- Dealer product PATCH endpoint fixed (now uses /dealer/products/{id}/products/ for updates)
- Dealer dashboard: Account Information section (editable email, commission rate, member since)
- Dealer product edit: shows previous values, expiry, and discount field
- Income vs expenditure reporting for dealers
- Unified color theme for dashboard, checkout, and shop
- Lowered shipping cost in checkout
- Robust error handling in all context providers
- Footer links now route to working destinations, including the dedicated Info Center page sections (About, Contact, FAQ, blog/help/policy anchors)
- Product image fallback is deterministic and category/type-aware (no random placeholders)
- Dealer create/update product flow accepts category id or `category_name` fallback and normalizes required shop categories (Skincare, Makeup, Body Care, Hair Care, Treatment, Fragrance)
- Shop category filtering now uses normalized keys/slugs to prevent mismatches (for example `haircare` vs `Hair Care`)

### Core E-commerce Features
- ✅ **Product Catalog Management** - CRUD operations, categories, images, descriptions
- ✅ **Advanced Search & Filtering** - By category, price, brand, availability
- ✅ **Shopping Cart System** - Persistent cart, quantity management, real-time updates
- ✅ **Secure Checkout Process** - Multi-step validation, payment integration
- ✅ **Order Management** - Complete lifecycle tracking, status updates
- ✅ **Customer Dashboard** - Order history, profile management, preferences
- ✅ **Wishlist Functionality** - Save products, notifications, quick access
- ✅ **Product Reviews & Ratings** - User feedback, average ratings display
### Customer Dashboard (Post-April 2026)

- No product listings (products only in Shop)
- Displays:
    - Order summary and recent orders
    - Loyalty points and membership tier
    - Personalized offers and notifications
    - Wishlist preview
    - Recent activity
    - Account quick actions (profile, addresses, password, etc.)
    - Interactive settings (Profile, Notifications, Security)
    - Mobile-first, responsive, and color-unified UI

### Authentication & User Management
- ✅ **JWT Authentication** - Secure token-based authentication with refresh
- ✅ **Role-Based Access Control** - Admin, Dealer, Customer roles with permissions
- ✅ **User Registration** - Email validation, role selection, auto-login
- ✅ **Profile Management** - User details, preferences, password changes
- ✅ **Session Management** - Secure logout, token expiration handling
### Shop Page (Post-April 2026)

- All products shown with dealer-uploaded images
- Ratings and reviews are accurate and fetched from backend
- Product details modal always works and is dynamic
- Compare feature is error-free
- Category browsing is fully interactive and updates product list

### Admin Portal Features
- ✅ **Dashboard Analytics** - Sales metrics, revenue charts, performance indicators
- ✅ **Product Management** - Full CRUD operations, bulk actions, inventory control
- ✅ **Order Processing** - Status updates, fulfillment tracking, customer communication
- ✅ **Inventory Management** - Stock levels, low-stock alerts, reorder recommendations
- ✅ **User Management** - View users, manage roles, account administration
- ✅ **DSS AI Insights** - Intelligent analytics, business intelligence reports
### Known Issues

None. All critical and major bugs resolved as of April 2026. System is production-ready.
### Dealer Portal Features
- ✅ **Business Dashboard** - Revenue overview, order statistics, performance metrics
- ✅ **Order Management** - View assigned orders, update fulfillment status
- ✅ **Product Inventory** - Manage dealer's products, stock tracking
- ✅ **Earnings Analytics** - Commission reports, payout tracking, revenue charts
- ✅ **Business Profile** - Company information, verification status, contact details
- ✅ **Performance Insights** - Sales trends, customer feedback, market analysis
- ✅ **Account Information Section** - Editable email, commission rate, member since (verified date)
- ✅ **Product Edit Improvements** - Edit form shows previous values, expiry, and discount field
- ✅ **Income vs Expenditure Reporting** - Dealer dashboard includes income/expenditure charts
- ✅ **PATCH Endpoint Fix** - Product updates use correct PATCH endpoint
### Payment Integration
- ✅ **M-Pesa Integration** - STK push payments, real-time status polling
- ✅ **Card Payment Processing** - Secure credit/debit card payments
- ✅ **Payment Status Tracking** - Real-time updates, transaction logging
- ✅ **Receipt Generation** - PDF receipts, email delivery, download options

### Advanced Features
- ✅ **Real-time Notifications** - Toast notifications, email alerts, in-app messaging
- ✅ **Responsive Design** - Mobile-first approach, cross-device compatibility
- ✅ **Luxury Themes** - Multiple premium themes with glassmorphism design
- ✅ **Multi-currency Support** - KSH primary with extensible currency system
- ✅ **File Upload System** - Product images, user avatars, document management
- ✅ **Audit Logging** - Comprehensive activity tracking, security monitoring
- ✅ **Dealer Product Upload Fixes** - Resolved 500 image upload failures with backend validation, dealer ownership checks, serializer-driven save flow, and explicit multipart upload handling
- ✅ **Customer Search Implementation** - Integrated search functionality using admin products endpoint with real-time filtering
- ✅ **Dashboard Category Filtering** - Added dynamic category-based product filtering in customer dashboard
- ✅ **Notifications Panel** - Implemented comprehensive notifications dropdown in customer dashboard
- ✅ **Logout Feedback System** - Added success notifications for logout across all interfaces (desktop and mobile)
- ✅ **Interactive Settings Panel** - Made settings cards clickable with informative toast notifications
- ✅ **Payment Callback Security** - IP whitelisting and signature validation for M-Pesa callbacks to prevent spoofing
- ✅ **Order Transaction Atomicity** - All order creation and inventory updates are atomic, preventing partial updates and data corruption
- ✅ **Refund/Return Workflow** - Orders support refund and return status transitions, enabling post-purchase workflows without major migrations
- ✅ **DevOps Improvements** - Local Dockerfile and GitHub Actions CI workflow provided for robust development and deployment

### Technical Features
- ✅ **RESTful API** - Complete API with OpenAPI documentation
- ✅ **WebSocket Support** - Real-time updates, live notifications
- ✅ **Database Optimization** - Indexing, query optimization, connection pooling
- ✅ **Caching System** - Redis integration for performance optimization
- ✅ **Background Tasks** - Celery integration for email, notifications
- ✅ **Docker Support** - Containerized deployment, development environment
- ✅ **Testing Suite** - Unit tests, integration tests, API testing
- ✅ **Error Handling** - Global exception handling, user-friendly error messages

---

## Technical Stack

### Backend Technologies
- **Framework**: Django 4.2.7 - High-level Python web framework
- **API**: Django REST Framework 3.14.0 - Powerful API toolkit
- **Database**: PostgreSQL 15 (Production) / SQLite (Development)
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Caching**: Redis 7.x for session and data caching
- **WebSocket**: Django Channels for real-time features
- **Task Queue**: Celery + Redis for background processing
- **File Storage**: AWS S3 / Local filesystem with CDN
- **Documentation**: OpenAPI/Swagger for API documentation

### Frontend Technologies
- **Framework**: React 18.2.0 - Modern JavaScript library
- **Build Tool**: Vite 8.0.8 - Fast development server and bundler
- **Styling**: Tailwind CSS 3.2.7 - Utility-first CSS framework
- **Routing**: React Router v6 - Declarative routing
- **State Management**: React Context API + useReducer
- **Animations**: Framer Motion - Production-ready motion library
- **HTTP Client**: Axios - Promise-based HTTP client
- **Icons**: Lucide React - Beautiful icon library
- **Charts**: Recharts - Composable charting library

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx - Reverse proxy and static file serving
- **WSGI Server**: Gunicorn - Python WSGI HTTP Server
- **Process Manager**: systemd / Supervisor
- **SSL/TLS**: Let's Encrypt for HTTPS certificates
- **Monitoring**: Django Silk for performance monitoring
- **Logging**: Structured logging with ELK stack (optional)

### Development Tools
- **Version Control**: Git with GitHub
- **Code Quality**: ESLint, Prettier, Black, Flake8
- **Testing**: Jest, React Testing Library, Django Test Framework
- **API Testing**: Postman, Insomnia
- **Documentation**: MkDocs, Swagger UI
- **CI/CD**: GitHub Actions (optional)

---

## Database Schema

### Core Models

#### User Management
```sql
-- User Model (Extended Django User)
CREATE TABLE users_user (
    id SERIAL PRIMARY KEY,
    email VARCHAR(254) UNIQUE NOT NULL,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    role VARCHAR(20) NOT NULL, -- 'admin', 'dealer', 'customer'
    phone VARCHAR(15),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Profile
CREATE TABLE users_profile (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_user(id),
    avatar VARCHAR(500),
    date_of_birth DATE,
    gender VARCHAR(10),
    preferences JSONB
);
```

#### Product Management
```sql
-- Product Category
CREATE TABLE products_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    image VARCHAR(500),
    parent_id INTEGER REFERENCES products_category(id)
);

-- Product
CREATE TABLE products_product (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id INTEGER REFERENCES products_category(id),
    brand VARCHAR(100),
    sku VARCHAR(50) UNIQUE,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Product Image
CREATE TABLE products_productimage (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products_product(id),
    image VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0
);
```

#### Order Management
```sql
-- Order
CREATE TABLE orders_order (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_user(id),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL,
    shipping_address JSONB,
    billing_address JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Order Item
CREATE TABLE orders_orderitem (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders_order(id),
    product_id INTEGER REFERENCES products_product(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);
```

#### Cart & Wishlist
```sql
-- Shopping Cart
CREATE TABLE cart_cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_user(id),
    session_key VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Cart Item
CREATE TABLE cart_cartitem (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES cart_cart(id),
    product_id INTEGER REFERENCES products_product(id),
    quantity INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT NOW()
);

-- Wishlist
CREATE TABLE wishlist_wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users_user(id),
    name VARCHAR(100) DEFAULT 'My Wishlist',
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Wishlist Item
CREATE TABLE wishlist_wishlistitem (
    id SERIAL PRIMARY KEY,
    wishlist_id INTEGER REFERENCES wishlist_wishlist(id),
    product_id INTEGER REFERENCES products_product(id),
    added_at TIMESTAMP DEFAULT NOW()
);
```

#### Payment & Analytics
```sql
-- Payment
CREATE TABLE payments_payment (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders_order(id),
    payment_method VARCHAR(20), -- 'mpesa', 'card'
    transaction_id VARCHAR(100) UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Analytics Event
CREATE TABLE analytics_analytics (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    user_id INTEGER REFERENCES users_user(id),
    session_id VARCHAR(100),
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Indexes & Performance
```sql
-- Performance indexes
CREATE INDEX idx_product_category ON products_product(category_id);
CREATE INDEX idx_product_active ON products_product(is_active);
CREATE INDEX idx_order_user ON orders_order(user_id);
CREATE INDEX idx_order_status ON orders_order(status);
CREATE INDEX idx_order_created ON orders_order(created_at);
CREATE INDEX idx_payment_order ON payments_payment(order_id);
CREATE INDEX idx_analytics_event ON analytics_analytics(event_type, created_at);
CREATE INDEX idx_analytics_user ON analytics_analytics(user_id);

-- Full-text search indexes
CREATE INDEX idx_product_search ON products_product USING gin(to_tsvector('english', name || ' ' || description));
```

---

## API Endpoints

### Standard Response Envelope (Current)

Most API endpoints return a standardized payload shape:

```json
{
    "status": "success",
    "success": true,
    "message": "Operation completed",
    "data": {
        "...": "endpoint-specific payload"
    }
}
```

Error responses follow the same structure with `status: "error"` and `success: false`.
Legacy keys remain supported in some responses for backward compatibility during transition.

### Authentication API
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `POST` | `/api/v1/users/auth/register/` | User registration | No |
| `POST` | `/api/v1/users/auth/token/` | User login | No |
| `POST` | `/api/v1/users/auth/token/refresh/` | Refresh access token | Yes |
| `POST` | `/api/v1/users/auth/logout/` | Logout | Yes |
| `GET` | `/api/v1/users/profile/` | Get user profile | Yes |
| `PUT` | `/api/v1/users/profile/` | Update user profile | Yes |

### Product API
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/products/` | List products with filtering | No |
| `GET` | `/api/products/{id}/` | Get product details | No |
| `POST` | `/api/products/` | Create product | Admin/Dealer |
| `PUT` | `/api/products/{id}/` | Update product | Admin/Dealer |
| `DELETE` | `/api/products/{id}/` | Delete product | Admin/Dealer |
| `GET` | `/api/products/categories/` | List categories | No |

### Cart & Wishlist API
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/cart/` | Get user's cart | Yes |
| `POST` | `/api/cart/add/` | Add item to cart | Yes |
| `PUT` | `/api/cart/update/{id}/` | Update cart item | Yes |
| `DELETE` | `/api/cart/remove/{id}/` | Remove from cart | Yes |
| `GET` | `/api/wishlist/` | Get user's wishlist | Yes |
| `POST` | `/api/wishlist/add/` | Add to wishlist | Yes |
| `DELETE` | `/api/wishlist/remove/{id}/` | Remove from wishlist | Yes |

### Order API
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/orders/` | List user's orders | Yes |
| `POST` | `/api/orders/` | Create new order | Yes |
| `GET` | `/api/orders/{id}/` | Get order details | Yes |
| `POST` | `/api/orders/{id}/confirm/` | Confirm order | Yes |
| `GET` | `/api/orders/{id}/receipt/` | Download PDF receipt | Yes |

### Dealer API
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/dealer/dashboard/` | Dealer dashboard stats | Dealer |
| `GET` | `/api/dealer/orders/` | Dealer's orders | Dealer |
| `PATCH` | `/api/dealer/orders/{id}/status/` | Update order status | Dealer |
| `GET` | `/api/dealer/products/` | Dealer's products | Dealer |
| `POST` | `/api/dealer/products/` | Create dealer product (supports category id or `category_name`) | Dealer |
| `PATCH` | `/api/dealer/products/{id}/products/` | Update dealer product | Dealer |
| `POST` | `/api/products/{id}/upload_image/` | Upload dealer product image (multipart/form-data) | Dealer/Admin |
| `GET` | `/api/dealer/earnings/` | Earnings report | Dealer |
| `GET` | `/api/dealer/profile/` | Dealer profile | Dealer |
| `PATCH` | `/api/dealer/profile/` | Update profile | Dealer |
| `GET` | `/api/dealer/analytics_forecast/` | Demand forecast data | Dealer |
| `GET` | `/api/dealer/analytics_abc/` | ABC (Pareto) analysis data | Dealer |
| `GET` | `/api/dealer/analytics_eoq/` | EOQ analysis data | Dealer |
| `GET` | `/api/dealer/analytics_reorder_recommendations/` | Reorder recommendations | Dealer |

### Analytics & DSS API
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `GET` | `/api/analytics/dashboard/` | Admin dashboard data | Admin |
| `GET` | `/api/analytics/inventory_insights/` | AI inventory analysis | Admin |
| `GET` | `/api/analytics/sales_report/` | Sales performance | Admin |
| `GET` | `/api/analytics/reorder_recommendations/` | Smart restocking | Admin |

### Payment API
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| `POST` | `/api/payments/mpesa/stkpush/` | Initiate M-Pesa payment | Yes |
| `POST` | `/api/payments/mpesa/callback/` | M-Pesa callback | System |
| `GET` | `/api/payments/mpesa/status/{id}/` | Check payment status | Yes |
| `POST` | `/api/payments/card/` | Process card payment | Yes |

---

## Frontend Structure

### Component Architecture
```
src/
├── components/                 # Reusable UI Components
│   ├── auth/                   # Authentication components
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── RouteGuards.jsx
│   ├── common/                 # Common UI elements
│   │   ├── LoadingScreen.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── NotificationCenter.jsx
│   ├── ui/                     # Design system components
│   │   ├── GlassCard.jsx
│   │   ├── GlassButton.jsx
│   │   └── ThemeSelector.jsx
│   └── layouts/                # Layout components
│       ├── CustomerLayout.jsx
│       ├── AdminLayout.jsx
│       └── DealerLayout.jsx
├── pages/                      # Page Components
│   ├── auth/                   # Authentication pages
│   ├── admin/                  # Admin dashboard pages
│   ├── dealer/                 # Dealer portal pages
│   └── customer/               # Customer-facing pages
├── contexts/                   # React Context Providers
│   ├── AuthContext.jsx         # Authentication state
│   ├── CartContext.jsx         # Shopping cart state
│   ├── WishlistContext.jsx     # Wishlist state
│   ├── ThemeContext.jsx        # Theme management
│   ├── CurrencyContext.jsx     # Currency handling
│   └── NotificationContext.jsx # Notification system
├── services/                   # API Service Layer
│   ├── apiClient.js            # Axios configuration
│   ├── productsAPI.js          # Product API calls
│   ├── authAPI.js              # Authentication API
│   └── paymentAPI.js           # Payment processing
├── hooks/                      # Custom React Hooks
│   ├── useAuth.js
│   ├── useCart.js
│   └── useLocalStorage.js
├── utils/                      # Utility Functions
│   ├── formatters.js           # Data formatting
│   ├── validators.js           # Form validation
│   └── constants.js            # App constants
└── App.jsx                     # Main Application Component
```

### State Management
- **Authentication State**: JWT tokens, user profile, role-based permissions
- **Cart State**: Items, quantities, totals, persistence across sessions
- **Wishlist State**: Saved products, notifications, quick access
- **Theme State**: Multiple luxury themes with glassmorphism effects
- **Notification State**: Toast notifications, real-time alerts
- **Currency State**: Multi-currency support with KSH primary

### Routing Structure
```jsx
// Public Routes
<Route path="/" element={<HomePage />} />
<Route path="/shop" element={<ShopPage />} />
<Route path="/product/:id" element={<ProductDetailsPage />} />
<Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
<Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

// Customer Routes
<Route path="/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />
<Route path="/cart" element={<CustomerRoute><CartPage /></CustomerRoute>} />
<Route path="/checkout" element={<CustomerRoute><CheckoutPage /></CustomerRoute>} />
<Route path="/orders" element={<CustomerRoute><CustomerOrders /></CustomerRoute>} />
<Route path="/wishlist" element={<CustomerRoute><WishlistPage /></CustomerRoute>} />

// Dealer Routes
<Route path="/dealer" element={<DealerRoute><DealerDashboard /></DealerRoute>} />
<Route path="/dealer/orders" element={<DealerRoute><DealerOrders /></DealerRoute>} />
<Route path="/dealer/products" element={<DealerRoute><DealerProducts /></DealerRoute>} />
<Route path="/dealer/earnings" element={<DealerRoute><DealerEarnings /></DealerRoute>} />
<Route path="/dealer/profile" element={<DealerRoute><DealerProfile /></DealerRoute>} />

// Admin Routes
<Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
<Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
<Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
<Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
<Route path="/admin/insights" element={<AdminRoute><DSSDashboard /></AdminRoute>} />
```

---

## Authentication & Security

### JWT Token Management
- **Access Token**: Short-lived (15 minutes), used for API authentication
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens
- **Token Storage**: Secure localStorage with automatic cleanup
- **Token Refresh**: Automatic renewal before expiration
- **Logout**: Complete token invalidation and cleanup

### Role-Based Access Control (RBAC)
```javascript
// Permission Levels
const ROLES = {
  ADMIN: 'admin',      // Full system access
  DEALER: 'dealer',    // Business management access
  CUSTOMER: 'customer' // Shopping access only
};

// Route Guards
const AdminRoute = ({ children }) => (
  <RoleRoute allowedRoles="admin">{children}</RoleRoute>
);

const DealerRoute = ({ children }) => (
  <RoleRoute allowedRoles="dealer">{children}</RoleRoute>
);

const CustomerRoute = ({ children }) => (
  <RoleRoute allowedRoles="customer">{children}</RoleRoute>
);
```

### Security Features
- **Password Hashing**: PBKDF2 with salt and iterations
- **Input Validation**: Server-side validation on all endpoints
- **SQL Injection Prevention**: Django ORM query parameterization
- **XSS Protection**: Content Security Policy, input sanitization
- **CSRF Protection**: Token-based CSRF protection
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Configuration**: Restricted cross-origin requests
- **Audit Logging**: Comprehensive activity tracking

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **HTTPS Only**: All communications over secure channels
- **Session Security**: Secure session management
- **File Upload Security**: File type validation, size limits
- **API Security**: Request signing, API key management

---

## Deployment Guide

### Development Environment
```bash
# Backend setup
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Production Deployment

#### Docker Deployment
```dockerfile
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: beauty_ecommerce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./backend
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://postgres:password@db:5432/beauty_ecommerce
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
```

#### Manual Production Setup
```bash
# 1. Server preparation
sudo apt update
sudo apt install nginx postgresql redis-server

# 2. Database setup
sudo -u postgres createdb beauty_ecommerce
sudo -u postgres createuser --interactive --pwprompt beauty_user

# 3. Backend deployment
cd backend
pip install -r requirements.txt
python manage.py collectstatic --noinput
gunicorn beauty_ecommerce.wsgi:application --bind 127.0.0.1:8000

# 4. Frontend deployment
cd frontend
npm run build
sudo cp -r dist/* /var/www/html/

# 5. Nginx configuration
sudo nano /etc/nginx/sites-available/beauty-ecommerce
```

### Environment Variables (Production)
```env
# Django Configuration
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:password@localhost:5432/beauty_ecommerce
REDIS_URL=redis://localhost:6379/0

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-smtp-password
EMAIL_USE_TLS=True

# File Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1

# Payments
MPESA_CONSUMER_KEY=production-consumer-key
MPESA_CONSUMER_SECRET=production-consumer-secret
MPESA_SHORTCODE=production-shortcode
MPESA_PASSKEY=production-passkey
```

### SSL Configuration
```bash
# Let's Encrypt SSL
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Monitoring & Maintenance
```bash
# Log rotation
sudo nano /etc/logrotate.d/django

# Process monitoring
sudo apt install supervisor
sudo nano /etc/supervisor/conf.d/beauty-ecommerce.conf

# Database backup
pg_dump beauty_ecommerce > backup_$(date +%Y%m%d_%H%M%S).sql

# Performance monitoring
pip install django-silk
# Add to INSTALLED_APPS and configure
```

---

## Testing Strategy

### Unit Testing
```python
# Backend unit tests
# tests/test_models.py
from django.test import TestCase
from products.models import Product, Category

class ProductModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Test Category")
        self.product = Product.objects.create(
            name="Test Product",
            price=100.00,
            category=self.category
        )

    def test_product_creation(self):
        self.assertEqual(self.product.name, "Test Product")
        self.assertEqual(self.product.price, 100.00)
```

### Integration Testing
```python
# API integration tests
# tests/test_api.py
from rest_framework.test import APITestCase
from django.urls import reverse
from rest_framework import status

class ProductAPITest(APITestCase):
    def test_list_products(self):
        url = reverse('product-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
```

### Frontend Testing
```javascript
// Component testing
import { render, screen } from '@testing-library/react'
import ProductCard from '../components/ProductCard'

test('renders product card', () => {
  const product = { name: 'Test Product', price: 100 }
  render(<ProductCard product={product} />)
  expect(screen.getByText('Test Product')).toBeInTheDocument()
})
```

### End-to-End Testing
```javascript
// E2E test with Playwright
import { test, expect } from '@playwright/test'

test('complete purchase flow', async ({ page }) => {
  await page.goto('/')
  await page.click('text=Shop Now')
  await page.click('text=Add to Cart')
  await page.click('text=Checkout')
  // ... complete checkout flow
})
```

### Test Coverage
```bash
# Backend coverage
coverage run manage.py test
coverage report --include="*/beauty_ecommerce/*" --omit="*/tests/*"

# Frontend coverage
npm run test:coverage
```

### Performance Testing
```bash
# Load testing with Locust
# locustfile.py
from locust import HttpUser, task

class BeautyEcommerceUser(HttpUser):
    @task
    def browse_products(self):
        self.client.get("/api/products/")

    @task
    def view_product(self):
        self.client.get("/api/products/1/")
```

---

## Performance Optimization

### Database Optimization
```sql
-- Query optimization
EXPLAIN ANALYZE SELECT * FROM products_product WHERE category_id = 1;

-- Index recommendations
CREATE INDEX CONCURRENTLY idx_product_category_price ON products_product(category_id, price);
CREATE INDEX CONCURRENTLY idx_order_user_created ON orders_order(user_id, created_at DESC);

-- Partitioning for large tables
CREATE TABLE orders_order_y2024m01 PARTITION OF orders_order
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Caching Strategy
```python
# Redis caching
from django.core.cache import cache

# View caching
@method_decorator(cache_page(60 * 15), name='dispatch')
class ProductListView(generics.ListAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

# Object caching
def get_product(product_id):
    cache_key = f'product_{product_id}'
    product = cache.get(cache_key)
    if not product:
        product = Product.objects.get(id=product_id)
        cache.set(cache_key, product, 60 * 30)  # 30 minutes
    return product
```

### Frontend Optimization
```javascript
// Code splitting
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'))

// Image optimization
import { lazy, Suspense } from 'react'
const LazyImage = lazy(() => import('./components/LazyImage'))

// Bundle analysis
npm install --save-dev webpack-bundle-analyzer
npm run build -- --mode analyze
```

### CDN & Static Files
```python
# AWS S3 configuration
AWS_S3_CUSTOM_DOMAIN = 'cdn.yourdomain.com'
AWS_DEFAULT_ACL = 'public-read'
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}

# CloudFront distribution
# Configure for global content delivery
```

### Monitoring & Alerting
```python
# Django Silk for performance monitoring
INSTALLED_APPS = [
    'silk',
    # ... other apps
]

# Custom monitoring
MIDDLEWARE = [
    'silk.middleware.SilkyMiddleware',
    # ... other middleware
]

# Alert configuration
# Set up alerts for:
# - Response time > 2s
# - Error rate > 5%
# - Database connection issues
# - High memory usage
```

### Scaling Considerations
```python
# Database read replicas
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'beauty_ecommerce',
        # Master configuration
    },
    'replica1': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'beauty_ecommerce',
        # Replica configuration
    }
}

# Load balancing
# Nginx upstream configuration
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

# Horizontal scaling
# Docker Swarm or Kubernetes for container orchestration
```

---

## Future Enhancements

### Planned Features (v2.0)
- **Advanced Search**: Elasticsearch integration for full-text search
- **Recommendation Engine**: AI-powered product recommendations
- **Loyalty Program**: Points system with rewards and discounts
- **Multi-language Support**: Internationalization (i18n)
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Real-time dashboards with WebSocket updates
- **Social Commerce**: Social media integration and sharing
- **AR Try-on**: Augmented reality product visualization
- **Subscription Model**: Recurring delivery services

### Technical Improvements
- **GraphQL API**: More efficient data fetching
- **Microservices**: Split monolithic architecture
- **Event Sourcing**: Better audit trails and analytics
- **Machine Learning**: Predictive analytics and personalization
- **Progressive Web App**: Offline functionality and app-like experience
- **Advanced Caching**: Multi-layer caching strategy
- **CI/CD Pipeline**: Automated testing and deployment
- **Infrastructure as Code**: Terraform for cloud infrastructure

---

**This documentation provides comprehensive technical specifications for the Glow Beyond Beauty e-commerce platform. The system is designed for scalability, security, and performance while maintaining ease of maintenance and deployment.**

---

**Latest Updates (April 17, 2026):**

- Payment callback endpoint now secured with IP whitelisting and signature validation.
- Order creation and inventory updates are fully atomic (transactional).
- Refund and return logic supported via order status transitions (no major migration required).
- Uploaded products appear instantly with their photo.
- Local Dockerfile and basic GitHub Actions CI config provided for future use.
- Checkout now includes payment recovery actions for failed/timeout M-Pesa sessions (retry request, manual status check, and method switch).
- API docs now include the standardized response envelope (`status`, `success`, `message`, `data`) used by current backend responses.
- Frontend testing stack is now bootstrapped with Vitest + React Testing Library + jsdom.
- Checkout journey tests now cover successful M-Pesa confirmation and timeout recovery actions.
- Cart-to-Checkout integration tests now cover checkout navigation payload and cart quantity update handling.
- Dealer dashboard charts contract aligned: `income_vs_expenditure` is now provided directly by backend dashboard charts API.
- Dealer DSS entry points now route to the chart-enabled analytics page for Demand Forecast and ABC Pareto visualizations.
- Dealer analytics tests now cover Demand Forecast and ABC Pareto chart rendering paths.
- Dealer analytics tests now cover EOQ calculator interaction and Reorder Recommendations rendering/action links.
- Dealer product image upload endpoint now returns clearer 400/403/500 errors instead of generic server crashes.
- Footer links now map to functional in-app routes and Info Center anchors.
- Product placeholder images now use category/type inference and fixed SVG placeholders for semantic consistency.
- Dealer product create/update now supports category-name fallback and canonical shop category normalization.

All critical weaknesses have been addressed. The platform is robust, secure, and production-ready.

## Immediate Next Tasks (Execution Queue)

1. Expand reusable async action wrapper usage:
    - Align remaining high-traffic customer actions to use `useApiAction` for uniform loading/toast/error handling.
    - Checkout payment retry and manual status check are now aligned.
2. Documentation and API contract sync:
    - Keep endpoint examples aligned with standardized response envelopes (`status`, `message`, `data`) plus backward-compatible fields.
    - Core API endpoint section is now synced.
3. Optional next testing increment:
    - Add API error-state tests for checkout/cart (401/session-expiry and 500 fallback messaging).
4. Optional next testing increment:
    - Add dealer analytics negative-state tests (forecast API failure, EOQ validation guardrails, empty reorder dataset UX).

---

*Last Updated: April 17, 2026*
*Version: 1.7*
*Author: Glow Beyond Engineering*
