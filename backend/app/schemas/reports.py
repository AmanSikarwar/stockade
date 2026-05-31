from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, field_serializer


class RevenuePointResponse(BaseModel):
    date: date
    revenue: Decimal
    order_count: int

    @field_serializer("revenue")
    def serialize_revenue(self, value: Decimal) -> str:
        return f"{value:.2f}"


class RevenueOverTimeResponse(BaseModel):
    days: int
    total_revenue: Decimal
    total_orders: int
    points: list[RevenuePointResponse]

    @field_serializer("total_revenue")
    def serialize_total_revenue(self, value: Decimal) -> str:
        return f"{value:.2f}"


class TopProductResponse(BaseModel):
    product_id: UUID
    name: str
    sku: str
    quantity_sold: int
    revenue: Decimal

    @field_serializer("revenue")
    def serialize_revenue(self, value: Decimal) -> str:
        return f"{value:.2f}"


class TopProductsResponse(BaseModel):
    items: list[TopProductResponse]


class CustomerSalesResponse(BaseModel):
    customer_id: UUID
    full_name: str
    order_count: int
    revenue: Decimal

    @field_serializer("revenue")
    def serialize_revenue(self, value: Decimal) -> str:
        return f"{value:.2f}"


class SalesByCustomerResponse(BaseModel):
    items: list[CustomerSalesResponse]
