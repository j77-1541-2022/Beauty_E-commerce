from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal
from products.models import Category, Brand, Product
from inventory.models import Supplier, Inventory
from orders.models import Order, OrderItem
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Add sample data for the beauty e-commerce system'

    def handle(self, *args, **options):
        self.stdout.write('Adding sample data...')
        
        # Create categories
        categories_data = [
            {'name': 'Skincare', 'description': 'Face and body care products'},
            {'name': 'Makeup', 'description': 'Cosmetics and beauty products'},
            {'name': 'Haircare', 'description': 'Hair styling and treatment products'},
            {'name': 'Fragrance', 'description': 'Perfumes and scented products'},
            {'name': 'Beauty Tools', 'description': 'Professional beauty equipment'},
        ]
        
        categories = []
        for cat_data in categories_data:
            category, created = Category.objects.get_or_create(**cat_data)
            categories.append(category)
            self.stdout.write(f'{"Created" if created else "Found"} category: {category.name}')
        
        # Create brands
        brands_data = [
            {'name': 'L\'Oréal', 'description': 'French cosmetics company'},
            {'name': 'Estée Lauder', 'description': 'American beauty company'},
            {'name': 'MAC Cosmetics', 'description': 'Professional makeup brand'},
            {'name': 'Dove', 'description': 'Personal care brand'},
            {'name': 'Neutrogena', 'description': 'Dermatologist-recommended skincare'},
        ]
        
        brands = []
        for brand_data in brands_data:
            brand, created = Brand.objects.get_or_create(**brand_data)
            brands.append(brand)
            self.stdout.write(f'{"Created" if created else "Found"} brand: {brand.name}')
        
        # Create suppliers
        suppliers_data = [
            {'name': 'Beauty Supply Co', 'contact_person': 'John Smith', 'email': 'john@beautysupply.com'},
            {'name': 'Cosmetics Wholesale', 'contact_person': 'Jane Doe', 'email': 'jane@cosmeticswholesale.com'},
            {'name': 'Premium Beauty Distributors', 'contact_person': 'Mike Johnson', 'email': 'mike@premiumbeauty.com'},
        ]
        
        suppliers = []
        for supplier_data in suppliers_data:
            supplier, created = Supplier.objects.get_or_create(**supplier_data)
            suppliers.append(supplier)
            self.stdout.write(f'{"Created" if created else "Found"} supplier: {supplier.name}')
        
        # Create products
        products_data = [
            {
                'name': 'Anti-Aging Face Cream',
                'description': 'Advanced formula with retinol and hyaluronic acid',
                'sku': 'SKN001',
                'product_type': 'skincare',
                'cost_price': Decimal('15.00'),
                'selling_price': Decimal('45.00'),
                'category': categories[0],
                'brand': brands[0],
            },
            {
                'name': 'Hydrating Face Serum',
                'description': 'Vitamin C serum for bright and radiant skin',
                'sku': 'SKN002',
                'product_type': 'skincare',
                'cost_price': Decimal('20.00'),
                'selling_price': Decimal('65.00'),
                'category': categories[0],
                'brand': brands[3],
            },
            {
                'name': 'Matte Lipstick - Ruby Red',
                'description': 'Long-lasting matte lipstick in classic red',
                'sku': 'MKP001',
                'product_type': 'makeup',
                'cost_price': Decimal('8.00'),
                'selling_price': Decimal('25.00'),
                'category': categories[1],
                'brand': brands[2],
            },
            {
                'name': 'Foundation - Natural Beige',
                'description': 'Full coverage foundation with SPF 15',
                'sku': 'MKP002',
                'product_type': 'makeup',
                'cost_price': Decimal('12.00'),
                'selling_price': Decimal('35.00'),
                'category': categories[1],
                'brand': brands[2],
            },
            {
                'name': 'Repairing Hair Mask',
                'description': 'Deep conditioning treatment for damaged hair',
                'sku': 'HR001',
                'product_type': 'haircare',
                'cost_price': Decimal('10.00'),
                'selling_price': Decimal('30.00'),
                'category': categories[2],
                'brand': brands[3],
            },
            {
                'name': 'Volumizing Shampoo',
                'description': 'Adds body and volume to fine hair',
                'sku': 'HR002',
                'product_type': 'haircare',
                'cost_price': Decimal('8.00'),
                'selling_price': Decimal('22.00'),
                'category': categories[2],
                'brand': brands[3],
            },
            {
                'name': 'Floral Perfume - Rose',
                'description': 'Elegant rose fragrance with notes of jasmine',
                'sku': 'FRG001',
                'product_type': 'fragrance',
                'cost_price': Decimal('25.00'),
                'selling_price': Decimal('85.00'),
                'category': categories[3],
                'brand': brands[1],
            },
            {
                'name': 'Makeup Brush Set',
                'description': 'Professional synthetic brushes for flawless application',
                'sku': 'TOOL001',
                'product_type': 'tools',
                'cost_price': Decimal('15.00'),
                'selling_price': Decimal('45.00'),
                'category': categories[4],
                'brand': brands[2],
            },
        ]
        
        products = []
        for product_data in products_data:
            product, created = Product.objects.get_or_create(**product_data)
            products.append(product)
            self.stdout.write(f'{"Created" if created else "Found"} product: {product.name}')
        
        # Create inventory records
        for product in products:
            inventory, created = Inventory.objects.get_or_create(
                product=product,
                defaults={
                    'quantity': random.randint(5, 50),
                    'reorder_level': random.randint(5, 15),
                    'reorder_quantity': random.randint(20, 50),
                    'supplier': random.choice(suppliers),
                }
            )
            self.stdout.write(f'{"Created" if created else "Found"} inventory for: {product.name} (Stock: {inventory.quantity})')
        
        # Create some orders
        admin_user = User.objects.filter(username='admin').first()
        if not admin_user:
            self.stdout.write('Admin user not found. Please create admin user first.')
            return
        
        orders_data = [
            {
                'customer_name': 'Alice Johnson',
                'customer_email': 'alice@email.com',
                'customer_phone': '+1234567890',
                'shipping_address': '123 Beauty Street, Makeup City, MC 12345',
                'subtotal': Decimal('70.00'),
                'tax_amount': Decimal('5.60'),
                'shipping_cost': Decimal('10.00'),
                'total_amount': Decimal('85.60'),
                'status': 'delivered',
                'created_by': admin_user,
            },
            {
                'customer_name': 'Bob Smith',
                'customer_email': 'bob@email.com',
                'customer_phone': '+1234567891',
                'shipping_address': '456 Cosmetics Avenue, Skincare Town, SC 67890',
                'subtotal': Decimal('55.00'),
                'tax_amount': Decimal('4.40'),
                'shipping_cost': Decimal('8.00'),
                'total_amount': Decimal('67.40'),
                'status': 'confirmed',
                'created_by': admin_user,
            },
            {
                'customer_name': 'Carol Davis',
                'customer_email': 'carol@email.com',
                'customer_phone': '+1234567892',
                'shipping_address': '789 Fragrance Boulevard, Perfume City, PF 10112',
                'subtotal': Decimal('125.00'),
                'tax_amount': Decimal('10.00'),
                'shipping_cost': Decimal('15.00'),
                'total_amount': Decimal('150.00'),
                'status': 'pending',
                'created_by': admin_user,
            },
        ]
        
        for order_data in orders_data:
            order, created = Order.objects.get_or_create(
                order_number=f"ORD{random.randint(1001, 9999)}",
                defaults=order_data
            )
            if created:
                # Add order items
                selected_products = random.sample(products, random.randint(1, 3))
                for i, product in enumerate(selected_products, 1):
                    quantity = random.randint(1, 3)
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price=product.selling_price,
                        total_price=product.selling_price * quantity
                    )
                    # Update inventory
                    inventory = product.inventory
                    inventory.quantity -= quantity
                    inventory.save()
                
                self.stdout.write(f'Created order: {order.order_number} with {len(selected_products)} items')
        
        self.stdout.write(self.style.SUCCESS('Sample data added successfully!'))
