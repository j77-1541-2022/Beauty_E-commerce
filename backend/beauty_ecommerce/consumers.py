import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken
from .models import Product
from inventory.models import Inventory

class BaseConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            # Get token from query string or headers
            token = self.get_token()
            
            if token:
                # Validate JWT token
                try:
                    access_token = AccessToken(token)
                    user_id = access_token['user_id']
                    self.user = await self.get_user(user_id)
                except InvalidToken:
                    self.user = AnonymousUser()
            else:
                self.user = AnonymousUser()
            
            # Accept connection
            await self.accept()
            print(f"✅ WebSocket connected: {self.user}")
            
        except Exception as e:
            print(f"❌ WebSocket connection error: {e}")
            await self.close()

    def get_token(self):
        # Try to get token from query string
        token = self.scope['query_params'].get('token')
        if not token:
            # Try to get from headers
            headers = dict(self.scope.get('headers', {}))
            auth_header = headers.get(b'authorization', b'').decode('utf-8')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]
        return token

    @database_sync_to_async
    def get_user(self, user_id):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return AnonymousUser()

    async def disconnect(self, close_code):
        print(f"❌ WebSocket disconnected: {self.user}")

class InventoryConsumer(BaseConsumer):
    async def connect(self):
        await super().connect()
        self.inventory_group = 'inventory_updates'
        
        # Join inventory group
        await self.channel_layer.group_add(
            self.inventory_group,
            self.channel_name
        )

    async def disconnect(self, close_code):
        await super().disconnect(close_code)
        
        # Leave inventory group
        await self.channel_layer.group_discard(
            self.inventory_group,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe_inventory':
                # Handle subscription request
                await self.send(text_data=json.dumps({
                    'type': 'subscription_confirmed',
                    'message': 'Subscribed to inventory updates'
                }))
            elif message_type == 'subscribe_product':
                # Subscribe to specific product updates
                product_id = data.get('product_id')
                if product_id:
                    product_group = f'product_{product_id}'
                    await self.channel_layer.group_add(
                        product_group,
                        self.channel_name
                    )
                    await self.send(text_data=json.dumps({
                        'type': 'subscription_confirmed',
                        'message': f'Subscribed to product {product_id} updates'
                    }))
        except Exception as e:
            print(f"❌ Error processing message: {e}")

    # Handle inventory updates
    async def inventory_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'inventory_update',
            'product_id': event['product_id'],
            'quantity': event['quantity'],
            'old_quantity': event.get('old_quantity'),
            'timestamp': event['timestamp']
        }))

    # Handle stock updates
    async def stock_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'stock_update',
            'product_id': event['product_id'],
            'quantity': event['quantity'],
            'stock_status': event['stock_status'],
            'timestamp': event['timestamp']
        }))

class ProductConsumer(BaseConsumer):
    async def connect(self):
        await super().connect()
        self.product_group = 'product_updates'
        
        # Join product group
        await self.channel_layer.group_add(
            self.product_group,
            self.channel_name
        )

    async def disconnect(self, close_code):
        await super().disconnect(close_code)
        
        # Leave product group
        await self.channel_layer.group_discard(
            self.product_group,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe_products':
                await self.send(text_data=json.dumps({
                    'type': 'subscription_confirmed',
                    'message': 'Subscribed to product updates'
                }))
        except Exception as e:
            print(f"❌ Error processing message: {e}")

    # Handle product updates
    async def product_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'product_update',
            'action': event['action'],
            'product': event['product'],
            'timestamp': event['timestamp']
        }))
