from django.contrib import admin
from .models import Warehouse, Rack, Item, Conveyor

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'width', 'depth', 'height')

@admin.register(Rack)
class RackAdmin(admin.ModelAdmin):
    list_display = ('identifier', 'warehouse', 'pos_x', 'shelves')

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('sku', 'name', 'rack', 'shelf_level')

@admin.register(Conveyor)
class ConveyorAdmin(admin.ModelAdmin):
    list_display = ('name', 'warehouse', 'speed', 'start_x', 'end_x')