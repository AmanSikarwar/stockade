from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class CategoryCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class CategoryUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)

    @model_validator(mode="after")
    def require_at_least_one_field(self) -> CategoryUpdateRequest:
        if not self.model_fields_set:
            raise ValueError("At least one category field must be provided")
        return self


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    product_count: int
    created_at: datetime
    updated_at: datetime


class CategoryListResponse(BaseModel):
    items: list[CategoryResponse]
    total: int
    limit: int
    offset: int
