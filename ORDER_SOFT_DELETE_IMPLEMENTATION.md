# Order Soft-Delete Implementation

## Summary
Completed orders deleted by customers are now preserved on the dealer's end. Customers can remove orders from their view, but dealers retain full historical data unless they explicitly delete the order.

## Database Changes
**New fields added to Order model:**
- `deleted_by_customer` (BooleanField, default=False)
- `deleted_at` (DateTimeField, nullable)

**Migration:** `0005_order_soft_delete.py`

## Behavior

### Customer Actions
- When a **customer deletes a completed order** (status: delivered, cancelled, refunded):
  - Order is soft-deleted (marked with `deleted_by_customer=True`)
  - Order disappears from customer's order history
  - Order remains in database for dealer records
  - Success message: "Order removed from your history"

- Customers can ONLY delete orders with status: `delivered`, `cancelled`, or `refunded`
- Active orders (pending, paid, processing, shipped) cannot be deleted by customers

### Dealer/Admin View
- Dealers can see **all orders** including:
  - Normal orders (`deleted_by_customer=False`)
  - Customer-deleted orders (`deleted_by_customer=True`)
- Dealers can still hard-delete any order
- Deletion by dealers completely removes order from system

### API Logic

**OrderViewSet.get_queryset():**
```
- Admin: Sees all orders
- Dealer: Sees all orders from their products (including soft-deleted)
- Customer: Sees only their own orders where deleted_by_customer=False
```

**OrderViewSet.destroy() (Delete endpoint):**
```
- Customer: Soft-delete (mark as deleted, don't hard-delete)
- Dealer: Hard-delete
- Admin: Hard-delete
```

## Test Results
```
Test: Order ORD1005 (Status: delivered)
1. Customer soft-deletes order
   ✓ deleted_by_customer=True
   ✓ deleted_at=timestamp set

2. Customer view
   ✓ Order hidden from customer's history

3. Dealer view
   ✓ Order still visible to dealer
   ✓ Historical data preserved

4. Data integrity
   ✓ Soft-deleted orders accessible to dealers
   ✓ No data loss
```

## Files Modified
1. `backend/orders/models.py` - Added soft-delete fields to Order
2. `backend/orders/views.py` - Updated get_queryset() and destroy() methods
3. `backend/orders/serializers.py` - Added fields to read_only list
4. `backend/orders/migrations/0005_order_soft_delete.py` - Schema migration

## Benefits
✓ Customer privacy: Orders hidden from customer view
✓ Dealer accountability: Complete order history preserved
✓ Data integrity: No information loss
✓ Flexibility: Dealers can still hard-delete if needed
✓ Compliance: Supports business requirement for separate deletion controls
