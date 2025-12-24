from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Item, Rack, Conveyor, MovementJob

class SensorScanView(APIView):
    """
    Endpoint: POST /api/automation/scan/
    Payload: { "sku": "RTX-4090", "location_id": "Rack-B" }
    """
    def post(self, request):
        sku = request.data.get('sku')
        target_rack_id = request.data.get('location_id')

        try:
            # 1. Find the Item and Target
            item = Item.objects.get(sku=sku)
            target_rack = Rack.objects.get(identifier=target_rack_id)
            
            # Store starting position (Before update)
            start_x = item.rack.pos_x
            start_z = item.rack.pos_z

            # 2. Update the Item's location immediately in DB
            item.rack = target_rack
            item.save()

            # 3. Create a Movement Job (For history)
            job = MovementJob.objects.create(
                item=item,
                start_x=start_x,
                start_z=start_z,
                end_x=target_rack.pos_x,
                end_z=target_rack.pos_z,
                status='COMPLETED'
            )

            # 4. Calculate Path (Optional: logic to find nearest conveyor)
            waypoints = []
            waypoints.append([start_x, 0.5, start_z]) # Start
            
            conveyor = Conveyor.objects.first()
            if conveyor:
                waypoints.append([conveyor.start_x, 0.5, conveyor.start_z])
                waypoints.append([conveyor.end_x, 0.5, conveyor.end_z])

            waypoints.append([target_rack.pos_x, 0.5, target_rack.pos_z]) # End

            return Response({
                "status": "success", 
                "message": f"Moved {sku} to {target_rack_id}",
                "job_id": job.id,
                "path": waypoints
            })

        except Item.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)
        except Rack.DoesNotExist:
            return Response({"error": "Target Rack not found"}, status=404)