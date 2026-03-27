from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# Request schemas
class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    user_type: str = Field(..., max_length=100)
    location: Optional[str] = Field(None, max_length=255)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response schemas
class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    user_type: str
    location: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: UserResponse