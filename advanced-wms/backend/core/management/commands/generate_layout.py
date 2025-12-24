# backend/core/management/commands/generate_layout.py
from django.core.management.base import BaseCommand
from core.models import Warehouse, Aisle, Rack, Shelf, Conveyor

class Command(BaseCommand):
    help = 'Generates a Warehouse Layout with Aisles and Conveyors'

    def handle(self, *args, **kwargs):
        # 1. Clear Old Data
        Warehouse.objects.all().delete()
        
        # 2. Create Warehouse
        wh = Warehouse.objects.create(name="Mega Fulfillment Center", width=50, depth=50, height=10)
        self.stdout.write("Created Warehouse")

        # 3. Create 3 Aisles
        aisle_spacing = 6.0 # Meters between aisles
        rack_spacing = 2.0  # Meters between racks in an aisle
        
        for i, aisle_id in enumerate(['A', 'B', 'C']):
            z_pos = (i * aisle_spacing) - 5 # Spread along Z axis
            
            aisle = Aisle.objects.create(
                warehouse=wh,
                identifier=aisle_id,
                start_x=-10, 
                start_z=z_pos,
                length=20,
                width=2
            )
            
            # 4. Fill Aisle with Racks
            for r in range(5): # 5 Racks per aisle
                rack_x = aisle.start_x + (r * rack_spacing * 2)
                
                rack = Rack.objects.create(
                    aisle=aisle,
                    identifier=f"{aisle_id}-{r+1}",
                    pos_x=rack_x,
                    pos_z=z_pos,
                    rotation=0,
                    width=1.5, depth=0.5, height=3.0
                )
                
                # 5. Create Shelves for this Rack
                for level in range(4):
                    Shelf.objects.create(
                        rack=rack,
                        identifier=f"L{level+1}",
                        level_height=0.5 + (level * 0.7)
                    )

        # 6. Create Conveyor Belt (Connecting the front of the aisles)
        # Running along X axis at the "front" (Z + offset)
        Conveyor.objects.create(
            warehouse=wh,
            name="Main Loop",
            start_x=-12, start_z=10,
            end_x=12, end_z=10,
            speed=2.0
        )
        
        # Spur lines connecting aisles to main loop
        for i, z_pos in enumerate([-5, 1, 7]): # Roughly matching aisle Z positions
            Conveyor.objects.create(
                warehouse=wh,
                name=f"Spur {i}",
                start_x=10, start_z=z_pos, # End of aisle
                end_x=10, end_z=10,        # Connect to main loop
                speed=1.5
            )

        self.stdout.write(self.style.SUCCESS('Successfully generated layout!'))