from rest_framework.viewsets import ModelViewSet
from .models import Warehouse, Rack, Item, Conveyor, MovementJob
from .serializers import (
    WarehouseSerializer, 
    RackSerializer, 
    ItemSerializer, 
    ConveyorSerializer, 
    MovementJobSerializer
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