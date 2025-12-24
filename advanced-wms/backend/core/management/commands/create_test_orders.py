from django.core.management.base import BaseCommand
from core.models import Order, OrderItem, Item
import random

class Command(BaseCommand):
    help = 'Generates fake orders for testing'

    def handle(self, *args, **kwargs):
        # Clear old orders to avoid duplicates
        Order.objects.all().delete()
        
        # get some real SKUs from your DB
        real_items = list(Item.objects.values_list('sku', flat=True).distinct())
        
        if not real_items:
            self.stdout.write(self.style.ERROR("No Items found in DB! Create items in 3D view or Admin first."))
            return

        self.stdout.write(f"Found SKUs: {real_items}")

        # Create 5 Orders
        for i in range(1, 6):
            order = Order.objects.create(
                customer_name=f"Customer {i}",
                order_number=f"ORD-500{i}",
                status='PENDING'
            )
            
            # Add random items to order
            # Pick a random SKU that actually exists in your warehouse
            sku = random.choice(real_items)
            
            OrderItem.objects.create(
                order=order,
                sku=sku,
                quantity=random.randint(1, 3)
            )
            self.stdout.write(f"Created {order.order_number} for {sku}")

        self.stdout.write(self.style.SUCCESS('Successfully created 5 Pending Orders!'))