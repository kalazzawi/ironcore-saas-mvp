from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class TenantBase(BaseModel):
    name: str
    slug: str
    subscription_type: Optional[str] = "free"

class TenantCreate(TenantBase):
    pass

class Tenant(TenantBase):
    id: str
    subscription_status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_tenant_admin: Optional[bool] = False
    permissions: Optional[List[str]] = []

class UserCreate(UserBase):
    password: str
    tenant_id: str

class User(UserBase):
    id: str
    tenant_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class IPAMScopeBase(BaseModel):
    name: str
    description: Optional[str] = None
    scope_type: str  # "public" or "private"
    is_default: Optional[bool] = False

class IPAMScopeCreate(IPAMScopeBase):
    pass

class IPAMScope(IPAMScopeBase):
    id: str
    tenant_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class IPAMPoolBase(BaseModel):
    name: str
    description: Optional[str] = None
    cidr_block: str
    region: Optional[str] = None
    environment: Optional[str] = None
    auto_import: Optional[bool] = False
    allocation_min_netmask_length: Optional[int] = 24
    allocation_max_netmask_length: Optional[int] = 28
    allocation_default_netmask_length: Optional[int] = 24

class IPAMPoolCreate(IPAMPoolBase):
    scope_id: str

class IPAMPool(IPAMPoolBase):
    id: str
    tenant_id: str
    scope_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class IPAMAllocationBase(BaseModel):
    cidr_block: str
    resource_type: str
    resource_id: Optional[str] = None
    resource_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "allocated"
    tags: Optional[Dict[str, Any]] = {}

class IPAMAllocationCreate(IPAMAllocationBase):
    pool_id: str

class IPAMAllocation(IPAMAllocationBase):
    id: str
    tenant_id: str
    pool_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class IPAddressBase(BaseModel):
    ip_address: str
    hostname: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "available"
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    tags: Optional[Dict[str, Any]] = {}

class IPAddressCreate(IPAddressBase):
    allocation_id: Optional[str] = None

class IPAddress(IPAddressBase):
    id: str
    tenant_id: str
    allocation_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    tenant: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    account_type: str  # "personal" or "existing"
    tenant: Optional[str] = None  # Required only for existing tenant
    organization_name: Optional[str] = None  # Required only for personal account

class TokenData(BaseModel):
    email: str
    tenant_id: Optional[str] = None
