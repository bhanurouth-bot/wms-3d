from rest_framework import serializers
from .models import Warehouse, Rack, Item, Conveyor, MovementJob

class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'

class ConveyorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conveyor
        fields = '__all__'

class MovementJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovementJob
        fields = '__all__'

class RackSerializer(serializers.ModelSerializer):
    items = ItemSerializer(many=True, read_only=True)
    class Meta:
        model = Rack
        fields = '__all__'

class WarehouseSerializer(serializers.ModelSerializer):
    racks = RackSerializer(many=True, read_only=True)
    conveyors = ConveyorSerializer(many=True, read_only=True)
    class Meta:
        model = Warehouse
        fields = '__all__'