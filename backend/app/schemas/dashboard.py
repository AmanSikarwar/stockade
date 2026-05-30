from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, field_serializer


class DashboardLowStockProductResponse(BaseModel):
    id: UUID
    name: str
    sku: str
    price: Decimal
    quantity_in_stock: int

    @field_serializer("price")
    def serialize_price(self, value: Decimal) -> str:
        return f"{value:.2f}"


class DashboardMetricsResponse(BaseModel):
    total_products: int
    total_active_products: int
    total_customers: int
    total_orders: int
    total_active_orders: int
    total_cancelled_orders: int
    low_stock_threshold: int
    low_stock_products_count: int
    low_stock_products: list[DashboardLowStockProductResponse]
