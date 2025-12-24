from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Order, Item, Wave, OrderItem
from django.db import transaction

class WaveGeneratorView(APIView):
    """
    POST /api/wave/create/
    Body: { "order_ids": [1, 2, 5] }
    """
    def post(self, request):
        order_ids = request.data.get('order_ids', [])
        orders = Order.objects.filter(id__in=order_ids, status='PENDING')
        
        if not orders.exists():
            return Response({"error": "No valid pending orders selected"}, status=400)

        pick_list = []
        
        # Atomic transaction: Ensure we don't allocate the same item twice
        with transaction.atomic():
            # 1. Create the Wave Container
            wave = Wave.objects.create(status='Allocated')
            
            for order in orders:
                order.status = 'WAVED'
                order.save()
                wave.orders.add(order)

                # 2. Allocate Inventory (The "Hard Allocation" Step)
                # Look at every line item in the order
                for line in order.items.all():
                    # Find an available item of this SKU that isn't already allocated
                    # STRATEGY: Pick the one in the lowest Rack ID (Logic: First In First Out approx)
                    candidate = Item.objects.filter(
                        sku=line.sku, 
                        orderitem__isnull=True # Ensure not allocated to another order
                    ).order_by('shelf__rack__identifier').first()

                    if candidate:
                        # Lock it to this order
                        line.allocated_item = candidate
                        line.save()
                        
                        # Add to Pick List
                        pick_list.append({
                            "sku": candidate.sku,
                            "location": f"{candidate.shelf.rack.aisle.identifier}-{candidate.shelf.rack.identifier}-{candidate.shelf.identifier}",
                            "rack_id": candidate.shelf.rack.id, # For 3D highlighting
                            "order": order.order_number,
                            "status": "OK"
                        })
                    else:
                        pick_list.append({
                            "sku": line.sku,
                            "location": "N/A",
                            "order": order.order_number,
                            "status": "OUT OF STOCK"
                        })

        # 3. Optimize the Pick Path (Sort by Location)
        # We sort alphabetically by location string: "A-1-L1" comes before "A-2-L1"
        pick_list.sort(key=lambda x: x['location'])

        return Response({
            "status": "success", 
            "wave_id": wave.id,
            "pick_list": pick_list
        })
    
class CompleteWaveView(APIView):
    """
    POST /api/wave/complete/
    Body: { "wave_id": 123 }
    Logic: Mark orders as SHIPPED and DELETE the physical items from racks.
    """
    def post(self, request):
        wave_id = request.data.get('wave_id')
        try:
            wave = Wave.objects.get(id=wave_id)
            
            # 1. Update all Orders in this wave
            for order in wave.orders.all():
                order.status = 'SHIPPED'
                order.save()
                
                # 2. "Ship" the items (Delete from Database so they vanish in 3D)
                for line in order.items.all():
                    if line.allocated_item:
                        line.allocated_item.delete() 

            wave.status = 'COMPLETED'
            wave.save()

            return Response({"status": "success", "message": "Wave Shipped! Inventory updated."})

        except Wave.DoesNotExist:
            return Response({"error": "Wave not found"}, status=404)