from django.contrib import admin
from .models import Warehouse, Aisle, Rack, Shelf, Item, Conveyor, MovementJob

@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ('name', 'width', 'depth', 'height')

@admin.register(Aisle)
class AisleAdmin(admin.ModelAdmin):
    list_display = ('identifier', 'warehouse', 'length', 'start_x', 'start_z')
    list_filter = ('warehouse',)

@admin.register(Rack)
class RackAdmin(admin.ModelAdmin):
    # 'aisle' is the new parent, not 'warehouse'
    list_display = ('identifier', 'aisle', 'pos_x', 'pos_z')
    list_filter = ('aisle__warehouse', 'aisle') 

@admin.register(Shelf)
class ShelfAdmin(admin.ModelAdmin):
    list_display = ('identifier', 'rack', 'level_height')
    list_filter = ('rack__aisle__warehouse',)

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    # We display 'shelf' instead of 'rack' or 'shelf_level'
    list_display = ('sku', 'name', 'shelf', 'get_rack', 'color')
    search_fields = ('sku', 'name')
    list_filter = ('shelf__rack__aisle__warehouse',)

    # Helper to show the Rack name in the Item list
    def get_rack(self, obj):
        return obj.shelf.rack.identifier
    get_rack.short_description = 'Rack'

@admin.register(Conveyor)
class ConveyorAdmin(admin.ModelAdmin):
    list_display = ('name', 'warehouse', 'speed', 'start_x', 'end_x')

@admin.register(MovementJob)
class MovementJobAdmin(admin.ModelAdmin):
    list_display = ('item', 'status', 'created_at', 'start_x', 'end_x')
    list_filter = ('status', 'created_at')