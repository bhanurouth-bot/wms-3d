from django.db import models

class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    width = models.FloatField()
    depth = models.FloatField()
    height = models.FloatField()

    def __str__(self):
        return self.name

class Rack(models.Model):
    warehouse = models.ForeignKey(Warehouse, related_name='racks', on_delete=models.CASCADE)
    identifier = models.CharField(max_length=20) 
    pos_x = models.FloatField()
    pos_z = models.FloatField()
    rotation = models.FloatField(default=0)
    width = models.FloatField(default=2.0)
    depth = models.FloatField(default=1.0)
    height = models.FloatField(default=3.0)
    shelves = models.IntegerField(default=4)

    def __str__(self):
        return self.identifier

class Item(models.Model):
    name = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    rack = models.ForeignKey(Rack, related_name='items', on_delete=models.CASCADE)
    shelf_level = models.IntegerField()
    position_on_shelf = models.FloatField()
    width = models.FloatField(default=0.5)
    height = models.FloatField(default=0.5)
    depth = models.FloatField(default=0.5)
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

    def __str__(self):
        return self.name

# NEW MODEL FOR JOBS
class MovementJob(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    start_x = models.FloatField()
    start_z = models.FloatField()
    end_x = models.FloatField()
    end_z = models.FloatField()
    status = models.CharField(max_length=20, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)