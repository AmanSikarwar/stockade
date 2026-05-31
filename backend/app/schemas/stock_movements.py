from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

ManualReason = Literal["manual", "correction", "restock", "damage"]


class StockAdjustRequest(BaseModel):
    delta: int = Field(description="Signed change to apply to on-hand quantity; must be non-zero.")
    reason: ManualReason = "manual"
    note: str | None = Field(default=None, max_length=255)

    @model_validator(mode="after")
    def reject_zero_delta(self) -> StockAdjustRequest:
        if self.delta == 0:
            raise ValueError("delta must be non-zero")
        return self


class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    product_id: UUID
    delta: int
    resulting_quantity: int
    reason: str
    note: str | None
    reference_order_id: UUID | None
    created_at: datetime


class StockMovementListResponse(BaseModel):
    items: list[StockMovementResponse]
    total: int
    limit: int
    offset: int
