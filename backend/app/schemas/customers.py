from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerCreateRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone_number: str | None = Field(default=None, max_length=50)


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    full_name: str
    email: EmailStr
    phone_number: str | None
    created_at: datetime
    updated_at: datetime


class CustomerListResponse(BaseModel):
    items: list[CustomerResponse]
    total: int
    limit: int
    offset: int
