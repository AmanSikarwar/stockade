from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer


class OrderLineItemCreateRequest(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)


class OrderCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    customer_id: UUID
    line_items: list[OrderLineItemCreateRequest] = Field(min_length=1)


class OrderLineItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product_sku: str
    product_name: str
    quantity_ordered: int
    unit_price: Decimal
    line_total: Decimal

    @field_serializer("unit_price", "line_total")
    def serialize_money(self, value: Decimal) -> str:
        return f"{value:.2f}"


class OrderSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    customer_id: UUID
    status: str
    total_amount: Decimal
    created_at: datetime
    updated_at: datetime

    @field_serializer("total_amount")
    def serialize_total_amount(self, value: Decimal) -> str:
        return f"{value:.2f}"


class OrderResponse(OrderSummaryResponse):
    line_items: list[OrderLineItemResponse]


class OrderListResponse(BaseModel):
    items: list[OrderSummaryResponse]
    total: int
    limit: int
    offset: int
