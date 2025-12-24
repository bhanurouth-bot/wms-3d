from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from core.wave_views import CompleteWaveView, WaveGeneratorView
from core.views import OrderViewSet, RoadViewSet, ZoneViewSet

# Import ViewSets from views.py
from core.views import (
    WarehouseViewSet, 
    RackViewSet, 
    ItemViewSet, 
    ConveyorViewSet, 
    MovementJobViewSet
)
# Import Automation Logic from automation_views.py
from core.automation_views import SensorScanView 

router = DefaultRouter()
router.register(r'warehouses', WarehouseViewSet)
router.register(r'racks', RackViewSet)
router.register(r'items', ItemViewSet)
router.register(r'conveyors', ConveyorViewSet)
router.register(r'jobs', MovementJobViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'roads', RoadViewSet) # <--- Register
router.register(r'zones', ZoneViewSet) # <--- Register

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/automation/scan/', SensorScanView.as_view()),
    path('api/wave/create/', WaveGeneratorView.as_view()),
    path('api/wave/complete/', CompleteWaveView.as_view()),
]