from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime

class LeadBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    city: Optional[str] = None
    occupation: Optional[str] = None
    investment_amount: Optional[Decimal] = None
    lead_source: Optional[str] = "Manual"
    call_output: Optional[str] = "DNP"

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("Name is required and cannot be empty")
        return value.strip()

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        cleaned = "".join(filter(str.isdigit, str(value)))
        if len(cleaned) >= 10:
            cleaned = cleaned[-10:]
        else:
            raise ValueError("Phone number must be at least 10 digits")
        return cleaned

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    occupation: Optional[str] = None
    investment_amount: Optional[Decimal] = None
    call_output: Optional[str] = None
    lead_source: Optional[str] = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and (not value or not value.strip()):
            raise ValueError("Name cannot be empty")
        return value.strip() if value is not None else None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: Optional[str]) -> Optional[str]:
        if value is not None:
            cleaned = "".join(filter(str.isdigit, str(value)))
            if len(cleaned) >= 10:
                cleaned = cleaned[-10:]
            else:
                raise ValueError("Phone number must be at least 10 digits")
            return cleaned
        return None

class LeadResponse(BaseModel):
    id: int
    name: str
    email: Optional[str] = None
    phone: str
    city: Optional[str] = None
    occupation: Optional[str] = None
    investment_amount: Optional[Decimal] = None
    call_output: Optional[str] = None
    lead_source: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FacebookConfigSchema(BaseModel):
    access_token: Optional[str] = None
    page_id: Optional[str] = None
    verify_token: Optional[str] = None
    public_webhook_url: Optional[str] = None

    class Config:
        from_attributes = True
