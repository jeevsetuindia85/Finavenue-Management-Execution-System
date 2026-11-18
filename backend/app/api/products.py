from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.product import Product, ProductMilestone
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut,
    ProductMilestoneBase, ProductMilestoneCreate, ProductMilestoneUpdate, ProductMilestoneOut
)

router = APIRouter(prefix="/products", tags=["Product Development"])

DEFAULT_MILESTONES = [
    "Concept finalization",
    "Market research",
    "Competitor analysis",
    "Strategy / mandate",
    "Product structure",
    "Regulatory & compliance",
    "Internal approvals",
    "Documentation",
    "Marketing material",
    "Launch readiness",
    "Actual launch",
]

def calculate_progress(product: Product) -> float:
    if not product.milestones:
        return 0.0
    total = sum(m.completion_percentage or 0.0 for m in product.milestones)
    return round(total / len(product.milestones), 1)

@router.get("/", response_model=List[ProductOut])
async def list_products(
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Product).options(selectinload(Product.milestones)).order_by(Product.name)
    if category:
        query = query.where(Product.category == category)
    result = await db.execute(query)
    products = result.scalars().all()
    
    out = []
    for p in products:
        p_dict = ProductOut.model_validate(p)
        p_dict.overall_progress_pct = calculate_progress(p)
        out.append(p_dict)
    return out

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    prod_in: ProductCreate,
    init_default_milestones: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "goal_owner", "admin", "coordinator"))
):
    product = Product(**prod_in.model_dump())
    if not product.product_owner_id:
        product.product_owner_id = current_user.id
    db.add(product)
    await db.flush()
    
    if init_default_milestones:
        for idx, m_name in enumerate(DEFAULT_MILESTONES):
            db.add(ProductMilestone(
                product_id=product.id,
                name=m_name,
                sort_order=idx,
                completion_percentage=0.0,
                status="pending",
                owner_id=product.product_owner_id,
            ))
    
    await db.commit()
    query = select(Product).options(selectinload(Product.milestones)).where(Product.id == product.id)
    refreshed = await db.execute(query)
    prod_obj = refreshed.scalar_one()
    out = ProductOut.model_validate(prod_obj)
    out.overall_progress_pct = calculate_progress(prod_obj)
    return out

@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Product).options(selectinload(Product.milestones)).where(Product.id == product_id)
    result = await db.execute(query)
    prod = result.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    out = ProductOut.model_validate(prod)
    out.overall_progress_pct = calculate_progress(prod)
    return out

@router.patch("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    prod_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "goal_owner", "admin", "coordinator"))
):
    result = await db.execute(select(Product).options(selectinload(Product.milestones)).where(Product.id == product_id))
    prod = result.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, val in prod_in.model_dump(exclude_unset=True).items():
        setattr(prod, field, val)
    await db.commit()
    await db.refresh(prod)
    out = ProductOut.model_validate(prod)
    out.overall_progress_pct = calculate_progress(prod)
    return out

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin"))
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    prod = result.scalar_one_or_none()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    await db.delete(prod)
    await db.commit()
    return None

# --- PRODUCT MILESTONES ---
@router.post("/{product_id}/milestones", response_model=ProductMilestoneOut, status_code=status.HTTP_201_CREATED)
async def add_product_milestone(
    product_id: str,
    ms_in: ProductMilestoneBase,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    res = await db.execute(select(Product).where(Product.id == product_id))
    if not res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")
    ms = ProductMilestone(product_id=product_id, **ms_in.model_dump())
    db.add(ms)
    await db.commit()
    await db.refresh(ms)
    return ms

@router.patch("/milestones/{milestone_id}", response_model=ProductMilestoneOut)
async def update_product_milestone(
    milestone_id: str,
    ms_in: ProductMilestoneUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ProductMilestone).where(ProductMilestone.id == milestone_id))
    ms = result.scalar_one_or_none()
    if not ms:
        raise HTTPException(status_code=404, detail="Product milestone not found")
    for field, val in ms_in.model_dump(exclude_unset=True).items():
        setattr(ms, field, val)
    if ms.completion_percentage >= 100.0 and ms.status != "completed":
        ms.status = "completed"
    await db.commit()
    await db.refresh(ms)
    return ms

@router.delete("/milestones/{milestone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_milestone(
    milestone_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin", "goal_owner"))
):
    result = await db.execute(select(ProductMilestone).where(ProductMilestone.id == milestone_id))
    ms = result.scalar_one_or_none()
    if not ms:
        raise HTTPException(status_code=404, detail="Product milestone not found")
    await db.delete(ms)
    await db.commit()
    return None
