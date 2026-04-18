# Glow Beyond Beauty - E-commerce Platform

A modern beauty e-commerce platform with a dealer marketplace, customer storefront, admin control panel, and a decision support system for stock planning. The project combines Django REST Framework, React, real-time inventory logic, loyalty tracking, cash and M-Pesa payments, and a role-aware user experience.

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-4.2.7-green.svg)](https://djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎨 Features

### Core E-commerce
- **Product Catalog**: Advanced filtering, search, and categorization
- **Shopping Cart**: Persistent cart with real-time synchronization
- **Secure Checkout**: Multi-step checkout with M-Pesa and card payments
- **Order Management**: Complete order lifecycle with status tracking
- **Customer Dashboard**: Order history, profile management, wishlist
- **Wishlist**: Save and manage favorite products

### Admin & Dealer Portals
- **Admin Dashboard**: Comprehensive analytics, inventory management, order processing
- **Dealer Portal**: Dedicated portal for dealers with full product and order management
  - Real-time dashboard with earnings overview
  - Advanced order management with status updates
  - Product inventory tracking and alerts
  - Earnings analytics with detailed reports
  - Business profile management
- **DSS AI Insights**: Intelligent inventory analytics and recommendations

### Advanced Features
- **Luxury Themes**: Premium themes with a consistent visual system across customer, dealer, and admin pages
- **M-Pesa Integration**: STK push payments with real-time status updates
- **Cash Payments**: Dealer-recorded walk-in payments with receipt generation
- **PDF Receipts**: Automated receipt generation and downloads
- **Real-time Notifications**: Toast notifications and alerts
- **Role-based Access Control**: Secure multi-role authentication
- **Decision Support System**: AI-powered inventory insights and reorder recommendations
- **Multi-currency Support**: Primary KSH with extensible currency system
- **Responsive Design**: Mobile-first approach with glassmorphism UI

## Project Flow

### Customer Flow
1. Browse products in the shop.
2. View dealer information, location, and product details.
3. Add items to cart and proceed through checkout.
4. Pay by M-Pesa or cash.
5. Receive an order confirmation and receipt.

### Dealer Flow
1. Log in to the dealer portal.
2. Add or update products and inventory.
3. Review profile information, stock levels, and sales data.
4. Use DSS insights to plan demand, EOQ, and reorder quantities.
5. Record cash walk-in payments and confirm orders when needed.

### Admin Flow
1. Monitor users, products, orders, and inventory.
2. Review analytics, audit logs, loyalty activity, and reports.
3. Resolve exceptions and keep the marketplace stable.

## Project Structure

### Backend
- `backend/users/` - authentication, profiles, roles
- `backend/products/` - catalog, categories, brands, product images
- `backend/cart/` - cart and cart items
- `backend/orders/` - order creation, status, and receipts
- `backend/payments/` - M-Pesa and cash payment recording
- `backend/dealer/` - dealer portal, inventory, reports, DSS endpoints
- `backend/inventory/` - stock control and movement tracking
- `backend/loyalty/` - loyalty points and tier tracking
- `backend/notifications/` - alerts and email workflows
- `backend/analytics/` - operational and business reporting
- `backend/audit/` - audit trail and compliance logging

### Frontend
- `frontend/src/pages/` - customer, dealer, and admin screens
- `frontend/src/components/` - shared UI components
- `frontend/src/services/` - centralized API client and feature clients
- `frontend/src/contexts/` - auth, cart, wishlist, and theme state

## Project Strengths

### Innovation Areas
- Dealer-visible `unit_price` is used for internal stock and DSS calculations while remaining hidden from customers.
- DSS is not just charts; it explains demand, ABC analysis, EOQ, and reorder logic in plain language.
- The dealer portal supports both product management and business decision support in one workspace.
- Cash payments are handled as a real workflow with receipt generation and dealer confirmation.
- Dealer locations are visible to customers through map integration, which improves trust and store discoverability.
- Loyalty data is surfaced clearly in the customer dashboard instead of being buried in the backend.
- The UI uses a consistent dark and readable theme for customer-facing checkout and dashboard pages.

## Defence Workflow

Use this structure during the defence:
1. Start with the problem: beauty sellers need one platform for customers, dealers, and admin.
2. Explain the architecture: React frontend, Django REST backend, role-based portals, and centralized APIs.
3. Walk through the flow: customer browsing, dealer inventory management, payment, receipt, and reporting.
4. Show the innovation: DSS, loyalty, dealer location maps, cash receipts, and dealer-only unit price.
5. Demonstrate reliability: validation, permissions, receipts, and migration-backed database changes.
6. End with business value: better stock planning, better customer experience, and less manual work.

### Questions You Should Be Ready For
- Why did you build a DSS instead of only a dashboard?
- How do you protect dealer cost data from customers?
- Why support cash payments in an e-commerce system?
- How does loyalty affect customer retention?
- What makes your dealer portal different from a normal product admin page?
- How do customers know where a dealer is located?

### Short Defence Lines
- "The platform is designed around real operational workflows, not just product listings."
- "The DSS helps dealers make reorder decisions using sales history and inventory state."
- "Dealer unit price is used internally for planning, while customers only see selling price."
- "Cash payments are recorded by dealers with receipts, which supports walk-in sales."
- "The system is role-aware, so each user sees only the tools relevant to their job."

## 🛠 Tech Stack

### Backend
- **Django** 4.2.7 - High-level Python web framework
- **Django REST Framework** 3.14.0 - Powerful API toolkit
- **PostgreSQL** 15 - Advanced open-source database (SQLite fallback)
- **JWT Authentication** - Secure token-based authentication
- **Redis** - Caching and WebSocket support
- **Django Channels** - Real-time WebSocket communication
- **ReportLab** - PDF generation for receipts
- **Celery** - Background task processing

### Frontend
- **React** 18.2.0 - Modern JavaScript library for UI
- **Vite** 8.0.8 - Fast build tool and dev server
- **Tailwind CSS** 3.2.7 - Utility-first CSS framework
- **Framer Motion** - Production-ready motion library
- **Recharts** - Composable charting library
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library
- **React Router v6** - Declarative routing

## 🚀 Quick Start

### Prerequisites
- **Python** 3.8 or higher
- **Node.js** 16.x or higher
- **PostgreSQL** 15 (optional, SQLite used by default)
- **Redis** (optional, for real-time features)
- **Git** for version control

### Backend Setup

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Create and activate virtual environment**
```bash
# Windows
cd ..
python -m venv venv
venv\Scripts\activate
cd backend

# macOS/Linux
cd ..
python -m venv venv
source venv/bin/activate
cd backend
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Environment configuration**
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env  # or use your preferred editor
```

5. **Database setup**
```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (admin account)
python manage.py createsuperuser
```

6. **Start Django development server**
```bash
python manage.py runserver
```
**Backend API**: `http://localhost:8000`  
**Admin Panel**: `http://localhost:8000/admin`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Start Vite development server**
```bash
npm run dev
```
**Frontend App**: `http://localhost:3001`

### Environment Variables

Create `.env` file in the backend directory:

```env
# Django Configuration
SECRET_KEY=your-super-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/beauty_ecommerce
# Or use SQLite (default):
# DATABASE_URL=sqlite:///db.sqlite3

# M-Pesa Configuration (for payments)
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_SHORTCODE=your-mpesa-shortcode

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379/0

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### First Run Setup

1. **Create test data** (optional)
```bash
# Backend shell
python manage.py shell
```
```python
from django.contrib.auth import get_user_model
from products.models import Category, Product

# Create categories
beauty = Category.objects.create(name="Beauty", description="Beauty products")
skincare = Category.objects.create(name="Skincare", description="Skincare products")

# Create sample products
Product.objects.create(
    name="Luxury Face Cream",
    description="Premium anti-aging cream",
    price=2500.00,
    category=beauty,
    stock_quantity=100
)
```

2. **Access the application**
   - **Home**: http://localhost:3001
   - **Admin Panel**: http://localhost:8000/admin
   - **API Docs**: http://localhost:8000/api/docs/

## 🔧 Recent Integration Updates

### ✅ Latest Enhancements (April 2026)
- **Customer Dashboard Stats** - Fixed dashboard to correctly display Loyalty Points, Cart Items, Total Orders, and Member Tier
- **Unified Product Feed** - Dealer products now visible to customers alongside admin products (similar to Jumia/Jiji marketplace model)
- **Stock Status Syncing** - Real-time stock status synchronization between dealer inventory and customer view
- **Theme System Standardization** - Unified color codes across all pages using ThemeContext (Light, Dark, Blue, Rose-Gold themes)
- **Shop Page Landing Enhancement** - Added welcome banner, category quick links, and improved landing page experience
- **Footer Integration** - Added comprehensive footer to Shop Page with Kenyan contact details and newsletter signup
- **Navigation Consistency** - All portal navigation (Customer, Dealer, Admin) now uses consistent theme-aware styling
- **Member Tier System** - Implemented tier calculation based on loyalty points (Bronze, Silver, Gold, Platinum)
- **Dealer Product Information** - Enhanced product display with dealer business name, verification status, and contact details

### ✅ Recent Fixes & Improvements
- **Fixed PublicOnlyRoute Authentication Redirect** - Authenticated users now properly redirect to role-specific dashboards (admin → /admin, dealer → /dealer, customer → /dashboard)
- **Resolved NotificationProvider Context Error** - Cleared Vite cache and verified proper provider wrapping
- **Added Missing Routes** - DealerProfile (/dealer/profile) and DSSDashboard (/admin/insights) routes added
- **Fixed Import Paths** - Corrected relative import paths in DSSDashboard component
- **Enhanced Dealer Portal** - Complete navigation with Dashboard, Orders, Products, Earnings, and Profile sections
- **Improved Route Guards** - Role-based access control with proper authentication flow

### ✅ Previous Fixes
- **Registration Payload Fix** - Updated to use `confirm_password` field for proper signup validation
- **Context Provider Integration** - Added WishlistProvider and CartProvider to prevent hook errors
- **Email Uniqueness** - Cleaned duplicate emails and enforced unique constraint in database
- **Auth Context Synchronization** - Fixed navigation issues by syncing AuthContext and CustomerAuthContext
- **Product Image Loading** - Added intelligent fallback system for product images
- **API Method Correction** - Fixed `productsAPI.getProducts()` to `productsAPI.getAll()`

### ✅ Build & Compilation Status
- **Frontend Build**: ✅ Successful compilation with all routes and components
- **Backend API**: ✅ All endpoints functional with proper authentication
- **Database**: ✅ Migrations applied, models properly configured
- **Navigation**: ✅ All role-based redirects working correctly

## 👥 User Roles & Access Control

### Admin Role (`/admin`)
**Full System Access & Management**
- **Dashboard**: Comprehensive analytics, sales metrics, inventory overview
- **Product Management**: Create, edit, delete products across all categories
- **Order Processing**: View and manage all orders, update statuses
- **Inventory Control**: Stock management, low-stock alerts, reorder recommendations
- **User Management**: View all users, manage roles and permissions
- **DSS Analytics**: Access AI-powered insights and business intelligence
- **System Settings**: Configure themes, payment methods, notifications

### Dealer Role (`/dealer`)
**Business Management Portal**
- **Dashboard**: Real-time earnings overview, order statistics, performance metrics
- **Order Management**: View orders containing dealer's products, update fulfillment status
- **Product Inventory**: Manage personal product catalog, track stock levels
- **Earnings Analytics**: Detailed commission reports, payout tracking, revenue charts
- **Business Profile**: Manage company information, verification status, contact details
- **Performance Insights**: Sales trends, top products, customer feedback

### Customer Role (`/dashboard`)
**Personal Shopping Experience**
- **Order History**: Track all purchases, view order status, download receipts
- **Profile Management**: Update personal information, payment methods, addresses
- **Wishlist**: Save favorite products, get notifications on price changes
- **Shopping Cart**: Persistent cart across sessions, quick checkout
- **Product Reviews**: Rate and review purchased products
- **Loyalty Program**: Points accumulation, special offers, exclusive access

### Authentication Flow
1. **Registration**: Role selection (Customer/Dealer) with email verification
2. **Auto-Login**: Immediate authentication after successful registration
3. **Role-Based Redirect**: Automatic navigation to appropriate dashboard
4. **Session Management**: JWT tokens with refresh capability
5. **Secure Logout**: Complete session cleanup and token invalidation

## 📱 Application URLs & Navigation

### Public Routes
| Route | Description | Access |
|-------|-------------|---------|
| `/` | Landing page with hero carousel and featured products | All users |
| `/shop` | Product catalog with filtering and search | All users |
| `/product/:id` | Individual product details page | All users |
| `/login` | User authentication page | Unauthenticated only |
| `/register` | User registration with role selection | Unauthenticated only |

### Customer Routes
| Route | Description | Access |
|-------|-------------|---------|
| `/dashboard` | Order history and account overview | Customers only |
| `/cart` | Shopping cart management | Customers only |
| `/checkout` | Secure payment processing | Customers only |
| `/orders` | Detailed order history | Customers only |
| `/wishlist` | Saved products management | Customers only |

### Dealer Routes
| Route | Description | Access |
|-------|-------------|---------|
| `/dealer` | Dealer dashboard with key metrics | Dealers only |
| `/dealer/orders` | Order management and fulfillment | Dealers only |
| `/dealer/products` | Product inventory management | Dealers only |
| `/dealer/earnings` | Revenue analytics and payouts | Dealers only |
| `/dealer/profile` | Business profile and settings | Dealers only |

### Admin Routes
| Route | Description | Access |
|-------|-------------|---------|
| `/admin` | Admin dashboard and overview | Admins only |
| `/admin/products` | Product catalog management | Admins only |
| `/admin/orders` | Order processing and management | Admins only |
| `/admin/inventory` | Stock and inventory control | Admins only |
| `/admin/insights` | DSS AI analytics and insights | Admins only |

### Utility Routes
| Route | Description | Access |
|-------|-------------|---------|
| `/unauthorized` | Access denied page | All users |
| `/not-found` | 404 error page | All users |

## 🔄 Authentication Flow

### Registration & Login Success Path
1. User registers with email, password, name, and role (customer/dealer)
2. Backend creates user account and generates JWT tokens
3. Frontend auto-logs in and navigates to role-specific dashboard:
   - **Customer**: `/dashboard`
   - **Dealer**: `/dealer`
   - **Admin**: `/admin`
4. AuthContext and CustomerAuthContext are synchronized
5. Tokens are stored in localStorage and used for subsequent requests

## 🎯 Dealer Portal Features

### Dashboard
- Total orders overview
- Pending orders count
- Revenue statistics (monthly/lifetime)
- Pending payout amount
- Recent orders list
- Top selling products

### Orders Management
- View all orders containing dealer's products
- Filter by status (pending, processing, shipped)
- Search by order number
- Expandable order details
- Update order status (forward-only workflow)

### Products
- View dealer's product inventory
- Stock level monitoring
- Low stock alerts
- SKU and pricing information

### Earnings
- Monthly earnings breakdown
- Commission rate display (default 10%)
- Bar chart visualization (6-month history)
- Lifetime earnings total
- Pending payout tracking

### Profile
- Business name, phone, location
- Verification status badge
- Account information
- Editable business details

## 🧠 DSS AI Insights

Access via: `/admin/insights`

### Features
- **Inventory Overview**: Total SKUs, categories, stock value
- **Reorder Recommendations**: Products needing restock with suggested quantities
- **Fast Movers**: Products with ≤7 days supply (high velocity)
- **Slow Movers**: Products with ≥90 days supply (low velocity)
- **Revenue Trends**: Monthly sales visualization
- **Smart Alerts**: Automated low-stock warnings

## 💳 Payment Methods

### M-Pesa (Kenya)
- STK push to customer's phone
- Real-time payment status polling
- Automatic order confirmation on success

### Credit/Debit Card
- Secure card form
- Card number formatting
- Expiry date validation
- CVV security

## 🎨 Luxury Themes

Choose from 4 premium themes in the UI:

1. **Rose Gold** (Default) - Elegant pink and gold tones
2. **Midnight Black** - Sophisticated dark theme
3. **Pearl White** - Clean, minimal white theme
4. **Champagne Gold** - Warm gold and cream tones

## � API Endpoints

### Authentication API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/users/auth/register/` | User registration with role selection |
| `POST` | `/api/v1/users/auth/token/` | User login with JWT token generation |
| `POST` | `/api/v1/users/auth/token/refresh/` | Refresh access token |
| `POST` | `/api/v1/users/auth/logout/` | Logout and token invalidation |
| `GET` | `/api/v1/users/profile/` | Retrieve authenticated user profile |

### Product API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products/` | List products with filtering and pagination |
| `GET` | `/api/products/{id}/` | Retrieve specific product details |
| `POST` | `/api/products/` | Create new product (Admin/Dealer) |
| `PUT` | `/api/products/{id}/` | Update product information |
| `DELETE` | `/api/products/{id}/` | Delete product |

### Cart & Wishlist API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cart/` | Retrieve user's shopping cart |
| `POST` | `/api/cart/add/` | Add product to cart |
| `PUT` | `/api/cart/update/{id}/` | Update cart item quantity |
| `DELETE` | `/api/cart/remove/{id}/` | Remove item from cart |
| `GET` | `/api/wishlist/` | Retrieve user's wishlist |
| `POST` | `/api/wishlist/add/` | Add product to wishlist |
| `DELETE` | `/api/wishlist/remove/{id}/` | Remove from wishlist |

### Order API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/orders/` | List user's orders |
| `POST` | `/api/orders/` | Create new order |
| `GET` | `/api/orders/{id}/` | Retrieve order details |
| `POST` | `/api/orders/{id}/confirm_order/` | Confirm and process order |
| `GET` | `/api/orders/{id}/receipt/` | Download PDF receipt |

### Dealer API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dealer/dashboard/` | Dealer dashboard statistics |
| `GET` | `/api/dealer/orders/` | Orders containing dealer's products |
| `PATCH` | `/api/dealer/orders/{id}/status/` | Update order fulfillment status |
| `GET` | `/api/dealer/products/` | Dealer's product inventory |
| `GET` | `/api/dealer/earnings/` | Earnings and commission reports |
| `GET` | `/api/dealer/profile/` | Dealer business profile |
| `PATCH` | `/api/dealer/profile/` | Update dealer profile |

### Analytics & DSS API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/analytics/dashboard/` | Admin dashboard analytics |
| `GET` | `/api/analytics/inventory_insights/` | AI-powered inventory analysis |
| `GET` | `/api/analytics/sales_report/` | Sales performance reports |
| `GET` | `/api/analytics/reorder_recommendations/` | Smart restocking suggestions |

### Payment API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/payments/mpesa/stkpush/` | Initiate M-Pesa payment |
| `POST` | `/api/payments/mpesa/callback/` | M-Pesa payment callback |
| `GET` | `/api/payments/mpesa/status/{id}/` | Check payment status |
| `POST` | `/api/payments/card/` | Process card payment |

### Notification API
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications/` | User's notifications |
| `PATCH` | `/api/notifications/{id}/read/` | Mark notification as read |
| `POST` | `/api/notifications/mark_all_read/` | Mark all notifications read |

## 📁 Project Structure

```
Beauty E-commerce/
├── backend/                          # Django Backend Application
│   ├── beauty_ecommerce/            # Main Django Project
│   │   ├── __init__.py
│   │   ├── settings.py              # Django settings with app configurations
│   │   ├── urls.py                  # Main URL routing
│   │   ├── wsgi.py                  # WSGI configuration
│   │   └── asgi.py                  # ASGI configuration for WebSockets
│   ├── users/                       # User Management & Authentication
│   │   ├── models.py                # User, Profile, Role models
│   │   ├── views.py                 # Authentication views
│   │   ├── serializers.py           # User serialization
│   │   ├── urls.py                  # User API routes
│   │   └── permissions.py           # Custom permissions
│   ├── products/                    # Product Catalog Management
│   │   ├── models.py                # Product, Category, Image models
│   │   ├── views.py                 # Product CRUD operations
│   │   ├── serializers.py           # Product serialization
│   │   └── services.py              # Product business logic
│   ├── inventory/                   # Stock & Inventory Management
│   │   ├── models.py                # Inventory, StockMovement models
│   │   ├── views.py                 # Inventory operations
│   │   └── services.py              # Inventory calculations
│   ├── orders/                      # Order Processing System
│   │   ├── models.py                # Order, OrderItem models
│   │   ├── views.py                 # Order management
│   │   ├── serializers.py           # Order serialization
│   │   └── services.py              # Order fulfillment logic
│   ├── cart/                        # Shopping Cart Functionality
│   │   ├── models.py                # Cart, CartItem models
│   │   └── views.py                 # Cart operations
│   ├── wishlist/                    # Wishlist Management
│   │   ├── models.py                # Wishlist, WishlistItem models
│   │   └── views.py                 # Wishlist operations
│   ├── payments/                    # Payment Processing
│   │   ├── models.py                # Payment, Transaction models
│   │   ├── mpesa_service.py         # M-Pesa integration
│   │   └── views.py                 # Payment endpoints
│   ├── analytics/                   # DSS & Business Intelligence
│   │   ├── models.py                # Analytics data models
│   │   ├── views.py                 # Analytics endpoints
│   │   └── services.py              # AI insights algorithms
│   ├── dealer/                      # Dealer Portal API
│   │   ├── models.py                # Dealer-specific models
│   │   ├── views.py                 # Dealer dashboard & operations
│   │   └── serializers.py           # Dealer data serialization
│   ├── notifications/               # Notification System
│   │   ├── models.py                # Notification models
│   │   ├── email_service.py         # Email notifications
│   │   └── tasks.py                 # Background notification tasks
│   ├── audit/                       # Audit Logging System
│   │   ├── models.py                # Audit log models
│   │   └── middleware.py            # Request logging middleware
│   ├── reviews/                     # Product Reviews & Ratings
│   │   ├── models.py                # Review models
│   │   └── views.py                 # Review operations
│   ├── utils/                       # Utility Functions
│   │   ├── api_response.py          # Standardized API responses
│   │   └── exception_handler.py     # Global exception handling
│   ├── manage.py                    # Django management script
│   ├── requirements.txt             # Python dependencies
│   ├── db.sqlite3                   # SQLite database (development)
│   └── .env.example                 # Environment variables template
│
├── frontend/                        # React Frontend Application
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable UI Components
│   │   │   ├── auth/                # Authentication components
│   │   │   ├── common/              # Common UI elements
│   │   │   ├── ui/                  # Design system components
│   │   │   └── layouts/             # Layout components
│   │   ├── pages/                   # Page Components
│   │   │   ├── admin/               # Admin dashboard pages
│   │   │   ├── dealer/              # Dealer portal pages
│   │   │   ├── auth/                # Authentication pages
│   │   │   └── customer/            # Customer-facing pages
│   │   ├── contexts/                # React Context Providers
│   │   │   ├── AuthContext.jsx      # Authentication state
│   │   │   ├── CartContext.jsx      # Shopping cart state
│   │   │   ├── WishlistContext.jsx  # Wishlist state
│   │   │   └── NotificationContext.jsx # Notification state
│   │   ├── services/                # API Service Layer
│   │   │   ├── apiClient.js         # Axios configuration
│   │   │   └── productsAPI.js       # Product API calls
│   │   ├── hooks/                   # Custom React Hooks
│   │   ├── utils/                   # Utility Functions
│   │   └── App.jsx                  # Main App Component
│   ├── package.json                 # Node.js dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # Tailwind CSS configuration
│   └── index.html                  # HTML template
│
├── docs/                           # Documentation (Optional)
├── scripts/                        # Deployment & Utility Scripts
├── docker/                         # Docker Configuration
├── .gitignore                      # Git ignore rules
├── README.md                       # Project documentation
└── PROJECT_DOCUMENTATION.md        # Detailed technical docs
```

## 🔧 Environment Variables

Create `.env` in backend directory:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://user:pass@localhost/dbname
MPESA_CONSUMER_KEY=your-mpesa-key
MPESA_CONSUMER_SECRET=your-mpesa-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_SHORTCODE=your-shortcode
```

## 🧪 Testing & Quality Assurance

### Backend Testing
```bash
cd backend

# Run all tests
python manage.py test

# Run specific app tests
python manage.py test users
python manage.py test products

# Run with coverage
pip install coverage
coverage run manage.py test
coverage report
```

### Frontend Testing
```bash
cd frontend

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### API Testing
```bash
# Using curl for API testing
curl -X POST http://localhost:8000/api/v1/users/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","role":"customer"}'

# Using Postman/Insomnia for comprehensive API testing
# Import the API collection from docs/api_collection.json
```

### End-to-End Testing
```bash
# Install Playwright for E2E testing
cd frontend
npm install -D @playwright/test
npx playwright install

# Run E2E tests
npx playwright test

# Run tests in UI mode
npx playwright test --ui
```

## 📦 Deployment

### Production Backend Deployment

1. **Environment Setup**
```bash
# Production environment variables
cp .env.example .env.production
# Configure production settings (database, Redis, email, etc.)
```

2. **Database Migration**
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

3. **Gunicorn Configuration**
```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn beauty_ecommerce.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

4. **Nginx Configuration** (example)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static/ {
        alias /path/to/static/files/;
    }

    location /media/ {
        alias /path/to/media/files/;
    }
}
```

### Production Frontend Deployment

1. **Build Production Assets**
```bash
cd frontend
npm run build
```

2. **Serve Static Files**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
    }
}
```

### Docker Deployment

```dockerfile
# Dockerfile for backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
EXPOSE 8000
CMD ["gunicorn", "beauty_ecommerce.wsgi:application", "--bind", "0.0.0.0:8000"]
```

```dockerfile
# Dockerfile for frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 80
CMD ["npx", "serve", "-s", "dist", "-l", "80"]
```

### Environment Variables for Production

```env
# Security
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DATABASE_URL=postgresql://user:password@db-host:5432/production_db

# Redis
REDIS_URL=redis://redis-host:6379/0

# Email
EMAIL_HOST=smtp.your-provider.com
EMAIL_HOST_USER=your-email@domain.com
EMAIL_HOST_PASSWORD=your-smtp-password

# File Storage (AWS S3, etc.)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket-name

# Payment
MPESA_CONSUMER_KEY=production-consumer-key
MPESA_CONSUMER_SECRET=production-consumer-secret
MPESA_SHORTCODE=production-shortcode
```

## � Troubleshooting

### Common Issues

#### Frontend Build Issues
```bash
# Clear Vite cache
cd frontend
rm -rf node_modules/.vite
npm run build

# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Database Issues
```bash
# Reset database
cd backend
python manage.py flush
python manage.py migrate

# Create fresh superuser
python manage.py createsuperuser
```

#### Authentication Issues
```bash
# Clear browser localStorage
# Open DevTools → Application → Local Storage → Clear

# Reset user tokens
# Backend: Force logout all sessions
```

#### Port Conflicts
```bash
# Kill process on port 3001 (frontend)
npx kill-port 3001

# Kill process on port 8000 (backend)
npx kill-port 8000
```

#### API Connection Issues
```bash
# Check backend is running
curl http://localhost:8000/api/v1/users/profile/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check CORS settings in backend settings.py
# Ensure frontend proxy is configured in vite.config.js
```

### Performance Optimization

#### Database Optimization
```sql
-- Add database indexes for frequently queried fields
CREATE INDEX CONCURRENTLY idx_product_category ON products_product(category_id);
CREATE INDEX CONCURRENTLY idx_order_user ON orders_order(user_id);
CREATE INDEX CONCURRENTLY idx_order_created ON orders_order(created_at);
```

#### Frontend Optimization
```bash
# Analyze bundle size
npm run build -- --mode analyze

# Optimize images
# Use WebP format and lazy loading
```

### Logs & Debugging

#### Backend Logs
```bash
# Development logs
python manage.py runserver --verbosity=2

# Production logs (with logging configuration)
tail -f /var/log/django/app.log
```

#### Frontend Logs
```bash
# Browser DevTools Console
# Check Network tab for API calls
# Check Application tab for localStorage
```

## 🎯 Key Features & Highlights

### ✅ Core E-commerce Features
- **Complete Product Catalog** - Advanced filtering, search, and categorization
- **Secure Shopping Cart** - Persistent cart with real-time synchronization
- **Multi-step Checkout** - Secure payment processing with validation
- **Order Lifecycle Management** - Complete order tracking from creation to delivery
- **Customer Dashboard** - Comprehensive order history and profile management
- **Wishlist Functionality** - Save and manage favorite products

### ✅ Advanced Portal Systems
- **Admin Dashboard** - Full system analytics, inventory management, order processing
- **Dealer Portal** - Dedicated business management with earnings tracking
- **DSS AI Insights** - Intelligent inventory analytics and business intelligence
- **Role-based Access Control** - Secure multi-role authentication system

### ✅ Technical Excellence
- **Modern Tech Stack** - React 18, Django 4.2, PostgreSQL, Redis
- **Real-time Features** - WebSocket support for live updates
- **Responsive Design** - Mobile-first approach with luxury themes
- **API-First Architecture** - Comprehensive REST API with documentation
- **Production Ready** - Docker support, deployment configurations

### ✅ Business Intelligence
- **Inventory Analytics** - AI-powered stock optimization and reorder recommendations
- **Sales Analytics** - Revenue trends, performance metrics, and insights
- **Dealer Performance** - Commission tracking, earnings reports, business analytics
- **Customer Insights** - Purchase patterns, preferences, and behavior analysis

### ✅ Payment & Integration
- **M-Pesa Integration** - STK push payments with real-time status updates
- **Card Payments** - Secure credit/debit card processing
- **PDF Receipts** - Automated receipt generation and downloads
- **Multi-currency Support** - Extensible currency system (KSH primary)

### ✅ Developer Experience
- **Hot Reload** - Fast development with Vite and Django dev servers
- **Type Safety** - Comprehensive error handling and validation
- **Testing Suite** - Unit tests, integration tests, and E2E testing
- **Documentation** - Complete API docs and developer guides
- **Docker Support** - Containerized deployment with docker-compose

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint and Prettier for JavaScript/React
- Write tests for new features
- Update documentation for API changes
- Ensure responsive design for all components

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Django Community** - For the excellent web framework
- **React Team** - For the powerful frontend library
- **Open Source Contributors** - For the amazing libraries and tools
- **Beauty Industry Partners** - For domain expertise and requirements

---

**Glow Beyond Beauty** - Elevating beauty e-commerce with intelligence, elegance, and innovation. ✨🌸

*Built with ❤️ for the beauty industry*
