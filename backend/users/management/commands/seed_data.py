"""
Seed Data Management Command - Section M2
Generates demo data for testing and development.
Usage: python manage.py seed_data [--flush]
"""
import random
from decimal import Decimal
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from users.models import User, CustomerProfile, DealerProfile
from products.models import Category, Brand, Product, ProductVariant, ProductImage
from inventory.models import Inventory, StockMovement, Supplier
from orders.models import Order, OrderItem, OrderStatusHistory
from payments.models import Payment


class Command(BaseCommand):
    help = 'Seed database with demo data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete existing data before seeding',
        )
        parser.add_argument(
            '--users',
            type=int,
            default=20,
            help='Number of users to create (default: 20)',
        )
        parser.add_argument(
            '--products',
            type=int,
            default=50,
            help='Number of products to create (default: 50)',
        )
        parser.add_argument(
            '--orders',
            type=int,
            default=100,
            help='Number of orders to create (default: 100)',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.HTTP_INFO('🌱 Starting data seeding...'))
        
        if options['flush']:
            self.flush_data()
        
        with transaction.atomic():
            self.create_categories()
            self.create_brands()
            self.create_suppliers()
            self.create_admin_user()
            self.create_dealers(options['users'] // 4)
            self.create_customers(options['users'] // 2)
            self.create_products(options['products'])
            self.create_inventory()
            self.create_orders(options['orders'])
        
        self.stdout.write(self.style.SUCCESS('✅ Data seeding completed successfully!'))
        self.print_summary()
    
    def flush_data(self):
        """Clear existing data."""
        self.stdout.write(self.style.WARNING('🗑️  Flushing existing data...'))
        Payment.objects.all().delete()
        OrderItem.objects.all().delete()
        OrderStatusHistory.objects.all().delete()
        Order.objects.all().delete()
        StockMovement.objects.all().delete()
        Inventory.objects.all().delete()
        ProductVariant.objects.all().delete()
        ProductImage.objects.all().delete()
        Product.objects.all().delete()
        Supplier.objects.all().delete()
        CustomerProfile.objects.all().delete()
        DealerProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        Brand.objects.all().delete()
        Category.objects.all().delete()
    
    def create_categories(self):
        """Create product categories."""
        categories_data = [
            {'name': 'Skincare', 'description': 'Face creams, serums, and skincare products'},
            {'name': 'Makeup', 'description': 'Cosmetics and makeup products'},
            {'name': 'Hair Care', 'description': 'Shampoos, conditioners, and hair treatments'},
            {'name': 'Fragrances', 'description': 'Perfumes and colognes'},
            {'name': 'Body Care', 'description': 'Body lotions, scrubs, and bath products'},
            {'name': 'Tools', 'description': 'Beauty tools and accessories'},
        ]
        
        for data in categories_data:
            Category.objects.get_or_create(name=data['name'], defaults=data)
        
        self.stdout.write(f'  ✓ Created {len(categories_data)} categories')
    
    def create_brands(self):
        """Create product brands."""
        brands_data = [
            {'name': 'Glow Naturals', 'description': 'Organic beauty products'},
            {'name': 'Luxe Beauty', 'description': 'Premium luxury cosmetics'},
            {'name': 'Pure Skin', 'description': 'Dermatologist approved skincare'},
            {'name': 'Essence', 'description': 'Affordable quality beauty'},
            {'name': 'Radiant', 'description': 'Professional salon products'},
        ]
        
        for data in brands_data:
            Brand.objects.get_or_create(name=data['name'], defaults=data)
        
        self.stdout.write(f'  ✓ Created {len(brands_data)} brands')
    
    def create_suppliers(self):
        """Create suppliers."""
        suppliers_data = [
            {'name': 'Beauty Wholesale Ltd', 'contact_person': 'John Smith', 'email': 'john@beautywholesale.com'},
            {'name': 'Glow Distributors', 'contact_person': 'Sarah Johnson', 'email': 'sarah@glowdist.com'},
            {'name': 'Luxury Imports', 'contact_person': 'Michael Chen', 'email': 'mike@luxuryimports.com'},
        ]
        
        for data in suppliers_data:
            Supplier.objects.get_or_create(name=data['name'], defaults=data)
        
        self.stdout.write(f'  ✓ Created {len(suppliers_data)} suppliers')
    
    def create_admin_user(self):
        """Create admin superuser."""
        if not User.objects.filter(email='admin@glowbeyond.com').exists():
            User.objects.create_superuser(
                email='admin@glowbeyond.com',
                password='admin123',
                first_name='System',
                last_name='Administrator',
                role='admin',
                is_verified=True
            )
            self.stdout.write('  ✓ Created admin user (admin@glowbeyond.com / admin123)')
    
    def create_dealers(self, count):
        """Create dealer users with profiles."""
        business_names = [
            'Glamour Hub', 'Beauty Corner', 'The Makeup Studio',
            'Radiant Beauty', 'Glow Beauty Supply', 'Elegant Touch',
            'Beauty Essentials', 'Chic Cosmetics'
        ]
        
        for i in range(count):
            email = f'dealer{i+1}@example.com'
            if User.objects.filter(email=email).exists():
                continue
            
            user = User.objects.create_user(
                email=email,
                password='dealer123',
                first_name=f'Dealer{i+1}',
                last_name='Business',
                role='dealer',
                is_verified=True
            )
            
            DealerProfile.objects.create(
                user=user,
                business_name=random.choice(business_names) + f' {i+1}',
                business_registration_number=f'BRN{random.randint(10000, 99999)}',
                commission_rate=random.choice([10, 12, 15, 8]),
                is_verified=random.choice([True, True, True, False])  # 75% verified
            )
        
        self.stdout.write(f'  ✓ Created {count} dealers')
    
    def create_customers(self, count):
        """Create customer users with profiles."""
        first_names = ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack']
        last_names = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Taylor', 'Anderson']
        
        for i in range(count):
            email = f'customer{i+1}@example.com'
            if User.objects.filter(email=email).exists():
                continue
            
            user = User.objects.create_user(
                email=email,
                password='customer123',
                first_name=random.choice(first_names),
                last_name=random.choice(last_names),
                role='customer',
                is_verified=True
            )
            
            CustomerProfile.objects.create(
                user=user,
                phone=f'+2547{random.randint(10000000, 99999999)}',
                address=f'{random.randint(1, 999)} Beauty Street, Nairobi',
                date_of_birth=timezone.now() - timedelta(days=random.randint(7000, 20000))
            )
        
        self.stdout.write(f'  ✓ Created {count} customers')
    
    def create_products(self, count):
        """Create products."""
        categories = list(Category.objects.all())
        brands = list(Brand.objects.all())
        dealers = list(User.objects.filter(role='dealer'))
        
        product_types = ['physical', 'digital', 'service']
        
        product_names = [
            ('Hydrating Face Cream', 'skincare'), ('Vitamin C Serum', 'skincare'),
            ('Matte Foundation', 'makeup'), ('Volumizing Mascara', 'makeup'),
            ('Repair Shampoo', 'hair'), ('Deep Conditioner', 'hair'),
            ('Rose Perfume', 'fragrance'), ('Citrus Cologne', 'fragrance'),
            ('Body Butter', 'body'), ('Sugar Scrub', 'body'),
            ('Makeup Brush Set', 'tools'), ('Curling Wand', 'tools'),
        ]
        
        for i in range(count):
            name, category_hint = random.choice(product_names)
            name = f'{name} {i+1}' if i > 0 else name
            
            cost_price = Decimal(random.randint(500, 5000))
            selling_price = cost_price * Decimal(random.uniform(1.3, 2.0))
            
            category = next((c for c in categories if category_hint in c.name.lower()), random.choice(categories))
            
            product = Product.objects.create(
                name=name,
                description=f'High-quality {name.lower()} for your beauty routine.',
                sku=f'SKU{random.randint(10000, 99999)}',
                category=category,
                brand=random.choice(brands),
                product_type=random.choice(product_types),
                cost_price=cost_price,
                selling_price=round(selling_price, 2),
                is_active=True,
                dealer=random.choice(dealers) if dealers and random.random() > 0.3 else None
            )
            
            # Create variants for some products
            if random.random() > 0.5:
                sizes = ['Small', 'Medium', 'Large']
                for j, size in enumerate(sizes):
                    ProductVariant.objects.create(
                        product=product,
                        name=f'{size} Size',
                        sku=f'{product.sku}-{size[0]}',
                        price_adjustment=Decimal(j * 200),
                        stock_quantity=random.randint(10, 100)
                    )
        
        self.stdout.write(f'  ✓ Created {count} products')
    
    def create_inventory(self):
        """Create inventory records for all products."""
        supplier = Supplier.objects.first()
        
        for product in Product.objects.all():
            stock = random.randint(5, 200)
            inventory, created = Inventory.objects.get_or_create(
                product=product,
                defaults={
                    'quantity': stock,
                    'reorder_level': random.randint(10, 30),
                    'reorder_quantity': random.randint(50, 100),
                    'supplier': supplier
                }
            )
            
            if created:
                # Create initial stock movement
                StockMovement.objects.create(
                    inventory=inventory,
                    movement_type='in',
                    quantity=stock,
                    quantity_before=0,
                    quantity_after=stock,
                    reference='INITIAL_STOCK',
                    notes='Initial inventory setup'
                )
        
        self.stdout.write(f'  ✓ Created inventory for {Product.objects.count()} products')
    
    def create_orders(self, count):
        """Create orders with items."""
        customers = list(User.objects.filter(role='customer'))
        products = list(Product.objects.filter(is_active=True))
        statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
        
        for i in range(count):
            customer = random.choice(customers)
            
            order = Order.objects.create(
                order_number=f'ORD{timezone.now().strftime("%Y%m%d")}{random.randint(1000, 9999)}',
                customer=customer,
                created_by=customer,
                status=random.choice(statuses),
                shipping_address=customer.customer_profile.address if hasattr(customer, 'customer_profile') else 'Nairobi, Kenya',
                customer_name=f'{customer.first_name} {customer.last_name}',
                customer_email=customer.email,
                customer_phone=customer.customer_profile.phone if hasattr(customer, 'customer_profile') else '+254700000000',
                subtotal=Decimal('0.00'),
                tax_amount=Decimal('0.00'),
                shipping_cost=Decimal('100.00'),
                total_amount=Decimal('0.00')
            )
            
            # Add order items
            num_items = random.randint(1, 5)
            subtotal = Decimal('0.00')
            
            for _ in range(num_items):
                product = random.choice(products)
                quantity = random.randint(1, 3)
                unit_price = product.selling_price
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=unit_price * quantity
                )
                
                subtotal += unit_price * quantity
            
            # Update order totals
            tax = subtotal * Decimal('0.16')  # 16% VAT
            order.subtotal = subtotal
            order.tax_amount = tax
            order.total_amount = subtotal + tax + order.shipping_cost
            order.save()
            
            # Create status history
            OrderStatusHistory.objects.create(
                order=order,
                old_status='pending',
                new_status=order.status,
                notes='Order created and status updated'
            )
            
            # Create payment for non-cancelled orders
            if order.status != 'cancelled' and random.random() > 0.2:
                Payment.objects.create(
                    order=order,
                    amount=order.total_amount,
                    status=random.choice(['completed', 'completed', 'completed', 'pending']),
                    method='mpesa',
                    phone_number=order.customer_phone
                )
        
        self.stdout.write(f'  ✓ Created {count} orders')
    
    def print_summary(self):
        """Print summary statistics."""
        self.stdout.write('')
        self.stdout.write(self.style.HTTP_INFO('📊 Seed Summary:'))
        self.stdout.write(f'  Users: {User.objects.count()}')
        self.stdout.write(f'  Categories: {Category.objects.count()}')
        self.stdout.write(f'  Brands: {Brand.objects.count()}')
        self.stdout.write(f'  Products: {Product.objects.count()}')
        self.stdout.write(f'  Inventory Items: {Inventory.objects.count()}')
        self.stdout.write(f'  Orders: {Order.objects.count()}')
        self.stdout.write(f'  Payments: {Payment.objects.count()}')
