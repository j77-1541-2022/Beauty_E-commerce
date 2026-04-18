# Glow Beyond Beauty - Quick Start Guide

## ✅ Current State

The backend runs at `http://localhost:8000/` and the frontend build is passing.

---

## Practical Workflow

Use this when you want to test the system quickly:

1. Start the backend and frontend.
2. Log in as admin, dealer, or customer.
3. Create or update products as a dealer.
4. Browse products and checkout as a customer.
5. Review DSS insights as a dealer.
6. Confirm receipt generation for M-Pesa or cash orders.

---

## Testing the System

### 1. **Authentication**
First, you'll need to get authentication tokens:

```bash
# Create a test dealer account (if not already created)
POST /api/v1/auth/register/
{
    "username": "dealer_1",
    "email": "dealer1@example.com",
    "password": "testpass123",
    "role": "dealer"
}

# Login to get token
POST /api/v1/auth/login/
{
    "email": "dealer1@example.com",
    "password": "testpass123"
}
```

### 2. **Dealer Operations**

#### Add a Product
```bash
POST /api/v1/dealer/products/
Headers: Authorization: Bearer {token}

{
    "name": "Premium Face Serum",
    "sku": "SERUM-001",
    "category": 1,
    "cost_price": 500.00,
    "selling_price": 1500.00,
    "description": "Hydrating serum with vitamin C"
}
```

#### Set Up Inventory
```bash
POST /api/v1/dealer/inventory/
Headers: Authorization: Bearer {token}

{
    "product": 1,
    "stock_quantity": 50,
    "reorder_level": 10,
    "reorder_quantity": 30
}
```

#### View Dashboard
```bash
GET /api/v1/dealer/dashboard/
Headers: Authorization: Bearer {token}
```

#### View DSS Insights
```bash
GET /api/v1/dealer/analytics_abc/
GET /api/v1/dealer/analytics_eoq/
GET /api/v1/dealer/analytics_forecast/
GET /api/v1/dealer/analytics_reorder_recommendations/
```

#### Generate Report
```bash
POST /api/v1/dealer/reports/
Headers: Authorization: Bearer {token}

{
    "report_type": "monthly"
}
```

#### Get Decision Support Metrics
```bash
GET /api/v1/dealer/decision_metrics/
Headers: Authorization: Bearer {token}
```

### 3. **Customer Operations**

#### View All Products (from all dealers)
```bash
GET /api/v1/products/
Headers: Authorization: Bearer {customer_token}
```

#### View Products by Category
```bash
GET /api/v1/products/by_category/?category_id=1
Headers: Authorization: Bearer {customer_token}
```

#### View Products from Specific Dealer
```bash
GET /api/v1/products/by_dealer/?dealer_id=1
Headers: Authorization: Bearer {customer_token}
```

#### Search Products
```bash
GET /api/v1/products/search/?q=serum
Headers: Authorization: Bearer {customer_token}
```

#### View Product with Dealer Info
```bash
GET /api/v1/products/1/
Headers: Authorization: Bearer {customer_token}
```

#### Record Cash Payment
```bash
POST /api/v1/payments/cash/
Headers: Authorization: Bearer {token}

{
    "order_id": 1,
    "amount": 2500.00,
    "phone_number": "254712345678"
}
```

---

## Current API Endpoints

### Dealer Endpoints (`/api/v1/dealer/`)
- `GET /dashboard/` - Dashboard statistics
- `GET /profile/` - Get dealer profile
- `PATCH /profile/` - Update dealer profile
- `GET /products/` - List products
- `POST /products/` - Create product
- `GET /inventory/` - Manage inventory
- `GET /orders/` - View orders
- `GET /analytics/` - Sales analytics
- `GET /reports/` - List reports
- `POST /reports/` - Generate report
- `GET /decision_metrics/` - Business metrics
- `GET /analytics_forecast/` - Demand forecast per product or all products
- `GET /analytics_abc/` - ABC analysis
- `GET /analytics_eoq/` - EOQ calculator
- `GET /analytics_reorder_recommendations/` - Reorder suggestions

### Customer Product Endpoints (`/api/v1/products/`)
- `GET /` - List all products with dealer info
- `GET /{id}/` - Product detail with dealer
- `GET /by_category/?category_id=N` - Products by category
- `GET /by_dealer/?dealer_id=N` - Products by dealer
- `GET /by_brand/?brand_id=N` - Products by brand
- `GET /search/?q=query` - Search products

---

## Database Changes

### New Tables Created
1. **dealer_dealerinventory** - Per-dealer product stock
2. **dealer_dealerstockmovement** - Stock audit trail
3. **dealer_dealeranalytics** - Daily sales metrics
4. **dealer_dealerreport** - Period reports
5. **dealer_decisionsupportmetric** - Business insights

### Updated Tables
- **products_product** - Added dealer FK, changed SKU uniqueness constraint

---

## Admin Interface

Access Django admin at `http://localhost:8000/admin/`

**New Admin Sections:**
- Dealer Inventory Management
- Stock Movements
- Sales Analytics
- Reports
- Decision Support Metrics

---

## Next Steps

### Frontend Development
1. Create dealer dashboard UI
2. Build product management interface
3. Implement customer product browsing
4. Add dealer filtering and search

### Features to Build
1. [ ] Dealer onboarding flow
2. [ ] Product image upload
3. [ ] Inventory alerts
4. [ ] Report downloads
5. [ ] Analytics charts
6. [ ] Commission tracking
7. [ ] Payout management

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CUSTOMERS                             │
│  Browse Products | Filter by Dealer | View Seller Info  │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼──────────┐      ┌──────▼──────────┐
│  PRODUCTS API    │      │  DEALERS API    │
│                  │      │                 │
│ /products/       │      │ /dealer/        │
│ /search/         │      │ /dashboard/     │
│ /by_category/    │      │ /products/      │
│ /by_dealer/      │      │ /inventory/     │
└──────────────────┘      │ /analytics/     │
                          │ /reports/       │
                          └─────────────────┘
        │                         │
        └────────────┬────────────┘
                     │
        ┌────────────▼────────────┐
        │   DATABASE             │
        │                        │
        │ • Products            │
        │ • Categories          │
        │ • Brands              │
        │ • Dealers             │
        │ • Inventory           │
        │ • Orders              │
        │ • Analytics           │
        │ • Reports             │
        └────────────────────────┘
```

---

## Troubleshooting

### Redis Warning
You'll see a Redis warning - this is normal in local development. The system works without Redis but real-time WebSocket updates are disabled.

```bash
# Install Redis (Windows)
WSL redis-server
# OR use Redis from https://github.com/microsoftarchive/redis/releases
```

### Migration Issues
If migrations fail:
```bash
python manage.py migrate --fake-initial
python manage.py migrate
```

### Defence Tip
If you get stuck explaining the project, use this order:
problem, architecture, customer flow, dealer flow, innovation, then business value.

### Port Already in Use
```bash
python manage.py runserver 0.0.0.0:8001
```

---

## Sample Data Creation

Create test dealers and products:

```python
# In Django shell: python manage.py shell

from users.models import User, DealerProfile
from products.models import Product, Category, Brand

# Create category
cat = Category.objects.create(name="Skincare", description="Skincare products")

# Create brand
brand = Brand.objects.create(name="Beauty Plus", description="Premium beauty brand")

# Create dealer user
user = User.objects.create_user(
    username='dealer1',
    email='dealer1@example.com',
    password='pass123',
    role='dealer'
)

# Create dealer profile
dealer = DealerProfile.objects.create(
    user=user,
    business_name="Beauty Store 1",
    location="Nairobi"
)

# Create product
product = Product.objects.create(
    name="Hydrating Face Cream",
    sku="CREAM-001",
    category=cat,
    brand=brand,
    dealer=dealer,
    cost_price=500.00,
    selling_price=1200.00,
    description="Rich hydrating cream"
)
```

---

## Important Notes

⚠️ **Before Going to Production:**
1. Set `DEBUG = False` in settings.py
2. Configure allowed hosts
3. Set up Redis for real-time features
4. Configure email service
5. Enable HTTPS
6. Set up database backups
7. Configure payment gateway (M-Pesa)
8. Set up logging and monitoring

---

## Documentation Links

- [Full Implementation Guide](./MULTI_DEALER_IMPLEMENTATION.md)
- [API Endpoint Details](./MULTI_DEALER_IMPLEMENTATION.md#2-api-architecture)
- [Database Schema](./MULTI_DEALER_IMPLEMENTATION.md#1-database-architecture)
- [Workflow Examples](./MULTI_DEALER_IMPLEMENTATION.md#7-workflow-examples)

---

**Backend Status**: ✅ Running  
**Database**: ✅ Migrated  
**Tests**: Ready to run  
**Date**: April 11, 2026
