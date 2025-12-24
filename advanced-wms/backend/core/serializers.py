from rest_framework import serializers
from .models import Conveyor, MovementJob, Warehouse, Aisle, Rack, Shelf, Item, Order, OrderItem, Road, Zone

# --- SUB-COMPONENTS FIRST ---

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
    rack_id = serializers.IntegerField(source='shelf.rack.id', read_only=True)
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

# --- NEW: Define Road & Zone BEFORE Warehouse ---

class RoadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Road
        fields = '__all__'

class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = '__all__'

# --- MAIN PARENT SERIALIZER ---

class WarehouseSerializer(serializers.ModelSerializer):
    aisles = AisleSerializer(many=True, read_only=True)
    racks = RackSerializer(many=True, read_only=True)
    roads = RoadSerializer(many=True, read_only=True) # Now this works
    zones = ZoneSerializer(many=True, read_only=True) # Now this works
    
    class Meta:
        model = Warehouse
        fields = '__all__'

# --- ORDERS ---

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['sku', 'quantity', 'allocated_item']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True) 
    class Meta:
        model = Order
        fields = '__all__'

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order