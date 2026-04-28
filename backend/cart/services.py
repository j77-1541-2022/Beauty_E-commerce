from .models import Cart, CartItem
from products.models import Product


def get_guest_cart_from_session(request):
    return request.session.get('guest_cart', [])


def save_guest_cart_to_session(request, items):
    request.session['guest_cart'] = items
    request.session.modified = True


def merge_guest_cart_to_user(request, user):
    guest_items = get_guest_cart_from_session(request)
    if not guest_items:
        return {'merged': 0, 'skipped': 0}

    cart, _ = Cart.objects.get_or_create(user=user)
    merged = 0
    skipped = 0

    for row in guest_items:
        product_id = row.get('product_id')
        quantity = int(row.get('quantity', 0) or 0)
        if not product_id or quantity < 1:
            skipped += 1
            continue

        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            skipped += 1
            continue

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity},
        )
        if not created:
            cart_item.quantity += quantity
            cart_item.save(update_fields=['quantity'])
        merged += 1

    save_guest_cart_to_session(request, [])
    return {'merged': merged, 'skipped': skipped}
