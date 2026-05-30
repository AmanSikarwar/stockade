from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_serializer, model_validator


class ProductCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sku: str = Field(min_length=1, max_length=100)
    price: Decimal = Field(ge=Decimal("0"), max_digits=12, decimal_places=2)
    quantity_in_stock: int = Field(ge=0)


class ProductUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    sku: str | None = Field(default=None, min_length=1, max_length=100)
    price: Decimal | None = Field(default=None, ge=Decimal("0"), max_digits=12, decimal_places=2)
    quantity_in_stock: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> ProductUpdateRequest:
        if not self.model_fields_set:
            raise ValueError("At least one product field must be provided")
        return self


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    sku: str
    price: Decimal
    quantity_in_stock: int
    active: bool
    created_at: datetime
    updated_at: datetime

    @field_serializer("price")
    def serialize_price(self, value: Decimal) -> str:
        return f"{value:.2f}"


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    limit: int
    offset: int
