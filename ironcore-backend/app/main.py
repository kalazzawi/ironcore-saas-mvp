from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from app.database import SessionLocal, engine, get_db
from app import models, schemas, crud, auth

models.Base.metadata.create_all(bind=engine)

def create_admin_data():
    db = SessionLocal()
    try:
        ironcore_tenant = crud.get_tenant_by_name(db, "IroncoreAI")
        if not ironcore_tenant:
            tenant_create = schemas.TenantCreate(
                name="IroncoreAI",
                slug="ironcore-ai",
                subscription_type="enterprise"
            )
            ironcore_tenant = crud.create_tenant(db=db, tenant=tenant_create)
        
        admin_user = auth.get_user_by_email(db, "kalazzawi@ironcore.ai")
        if not admin_user:
            admin_create = schemas.UserCreate(
                email="kalazzawi@ironcore.ai",
                password="IM12know!!!!",
                full_name="Karim Alazzawi",
                tenant_id=ironcore_tenant.id,
                is_active=True,
                is_tenant_admin=True,
                permissions=["read", "create", "modify", "approve", "admin"]
            )
            crud.create_user(db=db, user=admin_create)
    finally:
        db.close()

create_admin_data()

app = FastAPI(
    title="IroncoreAI IPAM API",
    description="AI-powered multi-tenant IPAM platform with AWS-style hierarchy",
    version="1.0.0"
)

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.get("/healthz")
async def healthz():
    return {"status": "ok", "service": "IroncoreAI IPAM API"}

@app.post("/auth/login", response_model=schemas.Token)
async def login(form_data: schemas.LoginRequest, db: Session = Depends(get_db)):
    tenant = crud.get_tenant_by_name_or_slug(db, form_data.tenant)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid tenant",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = auth.authenticate_user(db, form_data.email, form_data.password)
    if not user or user.tenant_id != tenant.id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "tenant_id": user.tenant_id}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/register", response_model=schemas.User)
async def register(form_data: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing_user = auth.get_user_by_email(db, email=form_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if form_data.account_type == "personal":
        if not form_data.organization_name:
            raise HTTPException(status_code=400, detail="Organization name is required for personal accounts")
        
        tenant_slug = form_data.organization_name.lower().replace(" ", "-").replace("_", "-")
        existing_tenant = crud.get_tenant_by_slug(db, tenant_slug)
        if existing_tenant:
            raise HTTPException(status_code=400, detail="Organization name already exists")
        
        tenant_create = schemas.TenantCreate(
            name=form_data.organization_name,
            slug=tenant_slug,
            subscription_type="free"
        )
        tenant = crud.create_tenant(db=db, tenant=tenant_create)
        is_tenant_admin = True  # Personal account owner is admin
        
    elif form_data.account_type == "existing":
        if not form_data.tenant:
            raise HTTPException(status_code=400, detail="Tenant name is required for existing tenant accounts")
        
        tenant = crud.get_tenant_by_name_or_slug(db, form_data.tenant)
        if not tenant:
            raise HTTPException(status_code=400, detail="Invalid tenant")
        is_tenant_admin = False  # Joining existing tenant as regular user
        
    else:
        raise HTTPException(status_code=400, detail="Invalid account type")
    
    user_create = schemas.UserCreate(
        email=form_data.email,
        password=form_data.password,
        full_name=form_data.full_name,
        tenant_id=tenant.id,
        is_active=True,
        is_tenant_admin=is_tenant_admin,
        permissions=["read", "create", "modify"] if is_tenant_admin else ["read"]
    )
    return crud.create_user(db=db, user=user_create)

@app.post("/tenants/", response_model=schemas.Tenant)
async def create_tenant(tenant: schemas.TenantCreate, db: Session = Depends(get_db)):
    db_tenant = crud.get_tenant_by_slug(db, slug=tenant.slug)
    if db_tenant:
        raise HTTPException(status_code=400, detail="Tenant slug already registered")
    return crud.create_tenant(db=db, tenant=tenant)

@app.get("/tenants/{tenant_id}", response_model=schemas.Tenant)
async def read_tenant(tenant_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    auth.check_tenant_access(current_user, tenant_id)
    db_tenant = crud.get_tenant(db, tenant_id=tenant_id)
    if db_tenant is None:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return db_tenant

@app.post("/users/", response_model=schemas.User)
async def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = auth.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(auth.get_current_active_user)):
    return current_user

@app.post("/ipam/scopes/", response_model=schemas.IPAMScope)
async def create_ipam_scope(scope: schemas.IPAMScopeCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_ipam_scope(db=db, scope=scope, tenant_id=current_user.tenant_id)

@app.get("/ipam/scopes/", response_model=List[schemas.IPAMScope])
async def read_ipam_scopes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_ipam_scopes_by_tenant(db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)

@app.get("/ipam/scopes/{scope_id}", response_model=schemas.IPAMScope)
async def read_ipam_scope(scope_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_scope = crud.get_ipam_scope(db, scope_id=scope_id, tenant_id=current_user.tenant_id)
    if db_scope is None:
        raise HTTPException(status_code=404, detail="IPAM scope not found")
    return db_scope

@app.post("/ipam/pools/", response_model=schemas.IPAMPool)
async def create_ipam_pool(pool: schemas.IPAMPoolCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_ipam_pool(db=db, pool=pool, tenant_id=current_user.tenant_id)

@app.get("/ipam/pools/", response_model=List[schemas.IPAMPool])
async def read_ipam_pools(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_ipam_pools_by_tenant(db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)

@app.get("/ipam/pools/{pool_id}", response_model=schemas.IPAMPool)
async def read_ipam_pool(pool_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_pool = crud.get_ipam_pool(db, pool_id=pool_id, tenant_id=current_user.tenant_id)
    if db_pool is None:
        raise HTTPException(status_code=404, detail="IPAM pool not found")
    return db_pool

@app.post("/ipam/allocations/", response_model=schemas.IPAMAllocation)
async def create_ipam_allocation(allocation: schemas.IPAMAllocationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_ipam_allocation(db=db, allocation=allocation, tenant_id=current_user.tenant_id)

@app.get("/ipam/allocations/", response_model=List[schemas.IPAMAllocation])
async def read_ipam_allocations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_ipam_allocations_by_tenant(db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)

@app.get("/ipam/allocations/{allocation_id}", response_model=schemas.IPAMAllocation)
async def read_ipam_allocation(allocation_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    db_allocation = crud.get_ipam_allocation(db, allocation_id=allocation_id, tenant_id=current_user.tenant_id)
    if db_allocation is None:
        raise HTTPException(status_code=404, detail="IPAM allocation not found")
    return db_allocation

@app.post("/ipam/ip-addresses/", response_model=schemas.IPAddress)
async def create_ip_address(ip_address: schemas.IPAddressCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.create_ip_address(db=db, ip_address=ip_address, tenant_id=current_user.tenant_id)

@app.get("/ipam/ip-addresses/", response_model=List[schemas.IPAddress])
async def read_ip_addresses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_active_user)):
    return crud.get_ip_addresses_by_tenant(db, tenant_id=current_user.tenant_id, skip=skip, limit=limit)
