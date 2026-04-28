from decimal import Decimal


# Shipping zones with costs (for manual selection)
SHIPPING_ZONES = [
    {"id": "nairobi_cbd", "name": "Nairobi (CBD)", "cost": Decimal('2.00')},
    {"id": "nairobi_other", "name": "Nairobi (Other)", "cost": Decimal('3.00')},
    {"id": "machakos", "name": "Machakos Town", "cost": Decimal('5.00')},
    {"id": "athi_river", "name": "Athi River", "cost": Decimal('4.00')},
    {"id": "other", "name": "Other Locations", "cost": Decimal('15.00')},
]

SHIPPING_ZONE_COSTS = {
    'nairobi': Decimal('2.00'),
    'athi river': Decimal('5.00'),
    'machakos': Decimal('10.00'),
    'other': Decimal('20.00'),
}


def get_shipping_zones():
    """Return list of available shipping zones"""
    return SHIPPING_ZONES


def get_shipping_cost_by_zone(zone_id: str) -> Decimal:
    """Get shipping cost for a specific zone ID"""
    for zone in SHIPPING_ZONES:
        if zone['id'] == zone_id:
            return zone['cost']
    return SHIPPING_ZONES[-1]['cost']  # Return 'Other' cost as default


def resolve_shipping_zone(address: str = '', city: str = '') -> str:
    haystack = f"{city or ''} {address or ''}".lower()
    if 'nairobi' in haystack:
        return 'nairobi'
    if 'athi river' in haystack:
        return 'athi river'
    if 'machakos' in haystack:
        return 'machakos'
    return 'other'


def calculate_shipping_cost(address: str = '', city: str = '', zone_id: str = None) -> Decimal:
    """Calculate shipping cost based on zone_id or auto-detect from address"""
    if zone_id:
        return get_shipping_cost_by_zone(zone_id)
    zone = resolve_shipping_zone(address=address, city=city)
    return SHIPPING_ZONE_COSTS.get(zone, SHIPPING_ZONE_COSTS['other'])
