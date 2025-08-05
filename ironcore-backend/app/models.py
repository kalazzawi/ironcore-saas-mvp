from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    subscription_type = Column(String, default="free")  # free, basic, pro, enterprise
    subscription_status = Column(String, default="active")  # active, suspended, expired
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    users = relationship("User", back_populates="tenant")
    ipam_scopes = relationship("IPAMScope", back_populates="tenant")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_tenant_admin = Column(Boolean, default=False)
    permissions = Column(JSON, default=list)  # ["read", "create", "modify", "approve", "admin"]
    created_at = Column(DateTime, server_default=func.now())
    
    tenant = relationship("Tenant", back_populates="users")


class IPAMScope(Base):
    __tablename__ = "ipam_scopes"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    scope_type = Column(String, nullable=False)  # "public" or "private"
    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    tenant = relationship("Tenant", back_populates="ipam_scopes")
    pools = relationship("IPAMPool", back_populates="scope")

class IPAMPool(Base):
    __tablename__ = "ipam_pools"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    scope_id = Column(String, ForeignKey("ipam_scopes.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    cidr_block = Column(String, nullable=False)  # e.g., "10.0.0.0/16"
    region = Column(String)  # AWS region or custom region identifier
    environment = Column(String)  # "production", "staging", "development"
    auto_import = Column(Boolean, default=False)
    allocation_min_netmask_length = Column(Integer, default=24)
    allocation_max_netmask_length = Column(Integer, default=28)
    allocation_default_netmask_length = Column(Integer, default=24)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    scope = relationship("IPAMScope", back_populates="pools")
    allocations = relationship("IPAMAllocation", back_populates="pool")

class IPAMAllocation(Base):
    __tablename__ = "ipam_allocations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    pool_id = Column(String, ForeignKey("ipam_pools.id"), nullable=False)
    cidr_block = Column(String, nullable=False)  # e.g., "10.0.1.0/24"
    resource_type = Column(String, nullable=False)  # "vpc", "subnet", "manual"
    resource_id = Column(String)  # AWS VPC ID, subnet ID, etc.
    resource_name = Column(String)
    description = Column(Text)
    status = Column(String, default="allocated")  # "allocated", "released", "pending"
    tags = Column(JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    pool = relationship("IPAMPool", back_populates="allocations")

class IPAddress(Base):
    __tablename__ = "ip_addresses"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    allocation_id = Column(String, ForeignKey("ipam_allocations.id"))
    ip_address = Column(String, nullable=False)  # e.g., "10.0.1.100"
    hostname = Column(String)
    description = Column(Text)
    status = Column(String, default="available")  # "available", "assigned", "reserved", "dhcp"
    resource_type = Column(String)  # "server", "container", "device", "gateway"
    resource_id = Column(String)
    tags = Column(JSON, default=dict)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
