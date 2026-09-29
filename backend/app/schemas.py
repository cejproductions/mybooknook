from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=40, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    username: str
    bio: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ItemIn(BaseModel):
    kind: Literal["book", "vinyl"]
    title: str = Field(min_length=1, max_length=300)
    creator: str = Field(default="", max_length=300)
    identifier: str | None = Field(default=None, max_length=32)
    cover_url: str | None = None
    year: int | None = Field(default=None, ge=1400, le=2200)
    description: str = ""

class EntryIn(BaseModel):
    item: ItemIn
    status: Literal["owned", "wishlist", "reading", "finished", "listening"] = "owned"
    visibility: Literal["private", "public"] = "private"

class EntryPatch(BaseModel):
    status: Literal["owned", "wishlist", "reading", "finished", "listening"] | None = None
    visibility: Literal["private", "public"] | None = None
    rating: int | None = Field(default=None, ge=1, le=5)
    review: str | None = Field(default=None, max_length=5000)

class ItemOut(ItemIn):
    model_config = ConfigDict(from_attributes=True)
    id: str

class EntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    status: str
    visibility: str
    rating: int | None
    review: str
    added_at: datetime
    item: ItemOut
