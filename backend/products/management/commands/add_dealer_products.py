from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
from products.models import Brand, Product, Category
from users.models import DealerProfile, User
from dealer.models import DealerInventory


class Command(BaseCommand):
    help = 'Add 10 brands and 10 products to a specific dealer'

    def add_arguments(self, parser):
        parser.add_argument('--email', type=str, default='simonekinyua8@gmail.com',
                            help='Dealer email (default: simonekinyua8@gmail.com)')

    def handle(self, *args, **options):
        email = options['email']
        
        # Find the user and dealer
        try:
            user = User.objects.get(email=email)
            dealer = user.dealer_profile
            self.stdout.write(self.style.SUCCESS(f'Found dealer: {dealer.business_name}'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User with email {email} not found'))
            return
        except DealerProfile.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'DealerProfile not found for user {email}'))
            return

        # Get or create categories
        categories = {
            'skincare': Category.objects.get_or_create(name='Skincare')[0],
            'makeup': Category.objects.get_or_create(name='Makeup')[0],
            'haircare': Category.objects.get_or_create(name='Haircare')[0],
            'fragrance': Category.objects.get_or_create(name='Fragrance')[0],
            'tools': Category.objects.get_or_create(name='Beauty Tools')[0],
        }

        # Create 10 brands
        brands_data = [
            {'name': 'Lumina Skin', 'description': 'Premium skincare collection for radiant skin'},
            {'name': 'AquaPetal Beauty', 'description': 'Hydrating beauty products with petal extracts'},
            {'name': 'Canvas Beauty', 'description': 'Professional makeup for all skin tones'},
            {'name': 'Rouge Atelier', 'description': 'Luxury cosmetics and color ranges'},
            {'name': 'Tressa Hair Lab', 'description': 'Advanced hair care technology'},
            {'name': 'ManeKind', 'description': 'Natural and nourishing hair products'},
            {'name': 'Maison Fleur', 'description': 'Luxury fragrance and perfumes'},
            {'name': 'Aura Mist', 'description': 'Fresh and light body mists'},
            {'name': 'BelleForge', 'description': 'Professional beauty tools and brushes'},
            {'name': 'Prism Tools', 'description': 'Innovative beauty appliances'},
        ]

        brands = []
        for brand_data in brands_data:
            brand, created = Brand.objects.get_or_create(
                name=brand_data['name'],
                defaults={'description': brand_data['description']}
            )
            brands.append(brand)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created brand: {brand.name}'))
            else:
                self.stdout.write(f'Brand already exists: {brand.name}')

        # Create 10 products (2 per category)
        products_data = [
            {
                'name': 'Radiance Reset Serum',
                'brand_idx': 0,
                'category': 'skincare',
                'product_type': 'skincare',
                'description': 'Advanced serum to reset and revitalize your skin with vitamin C and hyaluronic acid. Promotes radiance and addresses fine lines.',
                'sku': 'LUMINA-SERUM-001',
                'cost_price': '25.00',
                'selling_price': '89.99',
                'stock': 20,
            },
            {
                'name': 'Hydra Bloom Cream',
                'brand_idx': 1,
                'category': 'skincare',
                'product_type': 'skincare',
                'description': 'Luxurious hydrating cream with petal extracts. Deep moisture for dry and sensitive skin.',
                'sku': 'AQUAPETAL-CREAM-001',
                'cost_price': '35.00',
                'selling_price': '129.99',
                'stock': 15,
            },
            {
                'name': 'Velvet Touch Foundation',
                'brand_idx': 2,
                'category': 'makeup',
                'product_type': 'makeup',
                'description': 'Smooth, full-coverage foundation with velvet finish. Available in 24 shades.',
                'sku': 'CANVAS-FOUND-001',
                'cost_price': '15.00',
                'selling_price': '59.99',
                'stock': 25,
            },
            {
                'name': 'Sunset Bloom Lip Palette',
                'brand_idx': 3,
                'category': 'makeup',
                'product_type': 'makeup',
                'description': 'Stunning 12-color lip palette with warm sunset tones. Highly pigmented and long-lasting.',
                'sku': 'ROUGE-LIPP-001',
                'cost_price': '20.00',
                'selling_price': '64.99',
                'stock': 18,
            },
            {
                'name': 'Crown Gloss Repair Shampoo',
                'brand_idx': 4,
                'category': 'haircare',
                'product_type': 'haircare',
                'description': 'Restorative shampoo with keratin and argan oil. Repairs damaged hair and adds shine.',
                'sku': 'TRESSA-SHMP-001',
                'cost_price': '20.00',
                'selling_price': '74.99',
                'stock': 22,
            },
            {
                'name': 'Root Revival Hair Mask',
                'brand_idx': 5,
                'category': 'haircare',
                'product_type': 'haircare',
                'description': 'Deep conditioning hair mask with natural oils. Strengthens roots and prevents breakage.',
                'sku': 'MANEKIND-MASK-001',
                'cost_price': '18.00',
                'selling_price': '69.99',
                'stock': 16,
            },
            {
                'name': 'Noire Petal Eau de Parfum',
                'brand_idx': 6,
                'category': 'fragrance',
                'product_type': 'fragrance',
                'description': 'Luxurious floral fragrance with black petal notes. Long-lasting and elegant.',
                'sku': 'MAISON-PARFM-001',
                'cost_price': '40.00',
                'selling_price': '119.99',
                'stock': 12,
            },
            {
                'name': 'Citrus Drift Body Mist',
                'brand_idx': 7,
                'category': 'fragrance',
                'product_type': 'fragrance',
                'description': 'Light and refreshing citrus body mist. Perfect for everyday wear.',
                'sku': 'AURA-MIST-001',
                'cost_price': '12.00',
                'selling_price': '49.99',
                'stock': 30,
            },
            {
                'name': 'Studio Sculpt Brush Set',
                'brand_idx': 8,
                'category': 'tools',
                'product_type': 'tools',
                'description': 'Professional 12-piece brush set. Includes all brushes needed for complete makeup application.',
                'sku': 'BELLE-BRUSH-001',
                'cost_price': '25.00',
                'selling_price': '84.99',
                'stock': 10,
            },
            {
                'name': 'GlowPress Heated Curler',
                'brand_idx': 9,
                'category': 'tools',
                'product_type': 'tools',
                'description': 'Advanced heated curler with ionic technology. Creates long-lasting curls and reduces frizz.',
                'sku': 'PRISM-CURL-001',
                'cost_price': '30.00',
                'selling_price': '94.99',
                'stock': 14,
            },
        ]

        # Create products
        for product_data in products_data:
            sku = product_data['sku']
            
            # Check if product already exists for this dealer
            existing = Product.objects.filter(sku=sku, dealer=dealer).first()
            if existing:
                self.stdout.write(f'Product already exists: {existing.name}')
                continue

            product = Product.objects.create(
                name=product_data['name'],
                description=product_data['description'],
                sku=sku,
                product_type=product_data['product_type'],
                category=categories[product_data['category']],
                brand=brands[product_data['brand_idx']],
                dealer=dealer,
                cost_price=Decimal(product_data['cost_price']),
                selling_price=Decimal(product_data['selling_price']),
                original_price=Decimal(product_data['selling_price']),
                is_active=True,
            )
            self.stdout.write(self.style.SUCCESS(f'Created product: {product.name}'))

            # Create inventory entry
            inventory, created = DealerInventory.objects.get_or_create(
                dealer=dealer,
                product=product,
                defaults={
                    'stock_quantity': product_data['stock'],
                    'reorder_level': 5,
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created inventory: {product.name} - Stock: {product_data["stock"]}'))
            else:
                self.stdout.write(f'Inventory already exists for: {product.name}')

        self.stdout.write(self.style.SUCCESS('Successfully added brands and products!'))
