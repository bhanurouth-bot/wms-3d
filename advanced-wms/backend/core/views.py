from rest_framework.viewsets import ModelViewSet
from .models import Road, Warehouse, Rack, Item, Conveyor, MovementJob, Order, OrderItem, Zone
from .serializers import (
    RoadSerializer,
    WarehouseSerializer, 
    RackSerializer, 
    ItemSerializer, 
    ConveyorSerializer, 
    MovementJobSerializer,
    OrderSerializer,
    ZoneSerializer
)

class WarehouseViewSet(ModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer

class RackViewSet(ModelViewSet):
    queryset = Rack.objects.all()
    serializer_class = RackSerializer

class ItemViewSet(ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

class ConveyorViewSet(ModelViewSet):
    queryset = Conveyor.objects.all()
    serializer_class = ConveyorSerializer

class MovementJobViewSet(ModelViewSet):
    queryset = MovementJob.objects.all()
    serializer_class = MovementJobSerializer

class OrderViewSet(ModelViewSet):
    queryset = Order.objects.all()
    serializer_class = OrderSerializer

class RoadViewSet(ModelViewSet):
    queryset = Road.objects.all()
    serializer_class = RoadSerializer

class ZoneViewSet(ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer