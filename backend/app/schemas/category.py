from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field


class CategoryResponse(BaseModel):
    id: int
    uuid: UUID
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
