from rest_framework import serializers
from .models import Warehouse, Aisle, Rack, Shelf, Item, Conveyor, MovementJob

class ShelfSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shelf
        fields = '__all__'

class RackSerializer(serializers.ModelSerializer):
    shelves = ShelfSerializer(many=True, read_only=True)
    class Meta:
        model = Rack
        fields = '__all__'

class AisleSerializer(serializers.ModelSerializer):
    racks = RackSerializer(many=True, read_only=True)
    class Meta:
        model = Aisle
        fields = '__all__'

class ItemSerializer(serializers.ModelSerializer):
    # Helper to get the Rack ID quickly for 3D positioning
    rack_id = serializers.IntegerField(source='shelf.rack.id', read_only=True)
    
    class Meta:
        model = Item
        fields = '__all__'

# Keep Conveyor and MovementJob serializers same as before
class ConveyorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conveyor
        fields = '__all__'

class MovementJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovementJob
        fields = '__all__'

class WarehouseSerializer(serializers.ModelSerializer):
    aisles = AisleSerializer(many=True, read_only=True) # Nested Aisles
    conveyors = ConveyorSerializer(many=True, read_only=True)
    class Meta:
        model = Warehouse
        fields = '__all__'