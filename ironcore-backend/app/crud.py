from sqlalchemy.orm import Session
from sqlalchemy import and_
from app import models, schemas
from app.auth import get_password_hash
import uuid

def create_tenant(db: Session, tenant: schemas.TenantCreate):
    db_tenant = models.Tenant(
        id=str(uuid.uuid4()),
        name=tenant.name,
        slug=tenant.slug,
        subscription_type=tenant.subscription_type
    )
    db.add(db_tenant)
    db.commit()
    db.refresh(db_tenant)
    return db_tenant

def get_tenant(db: Session, tenant_id: str):
    return db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()

def get_tenant_by_slug(db: Session, slug: str):
    return db.query(models.Tenant).filter(models.Tenant.slug == slug).first()

def get_tenant_by_name(db: Session, name: str):
    return db.query(models.Tenant).filter(models.Tenant.name == name).first()

def get_tenant_by_name_or_slug(db: Session, identifier: str):
    tenant = db.query(models.Tenant).filter(models.Tenant.name == identifier).first()
    if not tenant:
        tenant = db.query(models.Tenant).filter(models.Tenant.slug == identifier).first()
    return tenant

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        id=str(uuid.uuid4()),
        tenant_id=user.tenant_id,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=user.is_active,
        is_tenant_admin=user.is_tenant_admin,
        permissions=user.permissions
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def get_users_by_tenant(db: Session, tenant_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.User).filter(models.User.tenant_id == tenant_id).offset(skip).limit(limit).all()

def create_ipam_scope(db: Session, scope: schemas.IPAMScopeCreate, tenant_id: str):
    db_scope = models.IPAMScope(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        name=scope.name,
        description=scope.description,
        scope_type=scope.scope_type,
        is_default=scope.is_default
    )
    db.add(db_scope)
    db.commit()
    db.refresh(db_scope)
    return db_scope

def get_ipam_scopes_by_tenant(db: Session, tenant_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.IPAMScope).filter(models.IPAMScope.tenant_id == tenant_id).offset(skip).limit(limit).all()

def get_ipam_scope(db: Session, scope_id: str, tenant_id: str):
    return db.query(models.IPAMScope).filter(
        and_(models.IPAMScope.id == scope_id, models.IPAMScope.tenant_id == tenant_id)
    ).first()

def create_ipam_pool(db: Session, pool: schemas.IPAMPoolCreate, tenant_id: str):
    db_pool = models.IPAMPool(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        scope_id=pool.scope_id,
        name=pool.name,
        description=pool.description,
        cidr_block=pool.cidr_block,
        region=pool.region,
        environment=pool.environment,
        auto_import=pool.auto_import,
        allocation_min_netmask_length=pool.allocation_min_netmask_length,
        allocation_max_netmask_length=pool.allocation_max_netmask_length,
        allocation_default_netmask_length=pool.allocation_default_netmask_length
    )
    db.add(db_pool)
    db.commit()
    db.refresh(db_pool)
    return db_pool

def get_ipam_pools_by_tenant(db: Session, tenant_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.IPAMPool).filter(models.IPAMPool.tenant_id == tenant_id).offset(skip).limit(limit).all()

def get_ipam_pools_by_scope(db: Session, scope_id: str, tenant_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.IPAMPool).filter(
        and_(models.IPAMPool.scope_id == scope_id, models.IPAMPool.tenant_id == tenant_id)
    ).offset(skip).limit(limit).all()

def get_ipam_pool(db: Session, pool_id: str, tenant_id: str):
    return db.query(models.IPAMPool).filter(
        and_(models.IPAMPool.id == pool_id, models.IPAMPool.tenant_id == tenant_id)
    ).first()

def create_ipam_allocation(db: Session, allocation: schemas.IPAMAllocationCreate, tenant_id: str):
    db_allocation = models.IPAMAllocation(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        pool_id=allocation.pool_id,
        cidr_block=allocation.cidr_block,
        resource_type=allocation.resource_type,
        resource_id=allocation.resource_id,
        resource_name=allocation.resource_name,
        description=allocation.description,
        status=allocation.status,
        tags=allocation.tags
    )
    db.add(db_allocation)
    db.commit()
    db.refresh(db_allocation)
    return db_allocation

def get_ipam_allocations_by_tenant(db: Session, tenant_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.IPAMAllocation).filter(models.IPAMAllocation.tenant_id == tenant_id).offset(skip).limit(limit).all()

def get_ipam_allocations_by_pool(db: Session, pool_id: str, tenant_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.IPAMAllocation).filter(
        and_(models.IPAMAllocation.pool_id == pool_id, models.IPAMAllocation.tenant_id == tenant_id)
    ).offset(skip).limit(limit).all()

def get_ipam_allocation(db: Session, allocation_id: str, tenant_id: str):
    return db.query(models.IPAMAllocation).filter(
        and_(models.IPAMAllocation.id == allocation_id, models.IPAMAllocation.tenant_id == tenant_id)
    ).first()

def create_ip_address(db: Session, ip_address: schemas.IPAddressCreate, tenant_id: str):
    db_ip = models.IPAddress(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        allocation_id=ip_address.allocation_id,
        ip_address=ip_address.ip_address,
        hostname=ip_address.hostname,
        description=ip_address.description,
        status=ip_address.status,
        resource_type=ip_address.resource_type,
        resource_id=ip_address.resource_id,
        tags=ip_address.tags
    )
    db.add(db_ip)
    db.commit()
    db.refresh(db_ip)
    return db_ip

def get_ip_addresses_by_tenant(db: Session, tenant_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.IPAddress).filter(models.IPAddress.tenant_id == tenant_id).offset(skip).limit(limit).all()

def get_ip_addresses_by_allocation(db: Session, allocation_id: str, tenant_id: str, skip: int = 0, limit: int = 100):
    return db.query(models.IPAddress).filter(
        and_(models.IPAddress.allocation_id == allocation_id, models.IPAddress.tenant_id == tenant_id)
    ).offset(skip).limit(limit).all()

def get_ip_address(db: Session, ip_id: str, tenant_id: str):
    return db.query(models.IPAddress).filter(
        and_(models.IPAddress.id == ip_id, models.IPAddress.tenant_id == tenant_id)
    ).first()
