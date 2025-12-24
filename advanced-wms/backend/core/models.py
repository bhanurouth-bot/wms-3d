# backend/core/models.py
from django.db import models

class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    width = models.FloatField(help_text="X-axis size")
    depth = models.FloatField(help_text="Z-axis size")
    height = models.FloatField()

    def __str__(self):
        return self.name

class Aisle(models.Model):
    warehouse = models.ForeignKey(Warehouse, related_name='aisles', on_delete=models.CASCADE)
    identifier = models.CharField(max_length=10, help_text="e.g. 'A', 'B'")
    
    # Coordinates of the Aisle Start (Top-Left of the aisle)
    start_x = models.FloatField()
    start_z = models.FloatField()
    
    # Dimensions
    length = models.FloatField(help_text="Length of the aisle")
    width = models.FloatField(default=2.0) # Width including walking space

    def __str__(self):
        return f"Aisle {self.identifier}"

class Rack(models.Model):
    # Link to Aisle now, not just Warehouse
    aisle = models.ForeignKey(Aisle, related_name='racks', on_delete=models.CASCADE)
    identifier = models.CharField(max_length=20) # e.g., "A-01"
    
    # Position is relative to the Warehouse Floor (Global Coordinates)
    # This makes 3D rendering easier
    pos_x = models.FloatField()
    pos_z = models.FloatField()
    rotation = models.FloatField(default=0)
    
    width = models.FloatField(default=1.5)
    depth = models.FloatField(default=0.5)
    height = models.FloatField(default=3.0)

    def __str__(self):
        return self.identifier

class Shelf(models.Model):
    rack = models.ForeignKey(Rack, related_name='shelves', on_delete=models.CASCADE)
    identifier = models.CharField(max_length=20) # e.g. "S1", "Bulk-Storage"
    level_height = models.FloatField(help_text="Height from floor in meters")
    
    def __str__(self):
        return f"{self.rack.identifier}-{self.identifier}"

class Item(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    
    # Link to specific Shelf now
    shelf = models.ForeignKey(Shelf, related_name='items', on_delete=models.CASCADE)
    
    # Position relative to the Shelf (0 to 1, or meters)
    position_on_shelf = models.FloatField()
    
    width = models.FloatField(default=0.4)
    height = models.FloatField(default=0.4)
    depth = models.FloatField(default=0.4)
    color = models.CharField(max_length=7, default="#ff0000") 

    def __str__(self):
        return self.sku

class Conveyor(models.Model):
    warehouse = models.ForeignKey(Warehouse, related_name='conveyors', on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    start_x = models.FloatField()
    start_z = models.FloatField()
    end_x = models.FloatField()
    end_z = models.FloatField()
    speed = models.FloatField(default=1.0)

class MovementJob(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    start_x = models.FloatField()
    start_z = models.FloatField()
    end_x = models.FloatField()
    end_z = models.FloatField()
    status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

