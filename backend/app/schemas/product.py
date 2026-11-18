from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

class ProductMilestoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: str = "pending"  # pending / in_progress / completed / delayed
    owner_id: Optional[str] = None
    evidence: Optional[str] = None
    completion_percentage: float = 0.0
    sort_order: int = 0

class ProductMilestoneCreate(ProductMilestoneBase):
    product_id: str

class ProductMilestoneUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    actual_date: Optional[date] = None
    status: Optional[str] = None
    owner_id: Optional[str] = None
    evidence: Optional[str] = None
    completion_percentage: Optional[float] = None
    sort_order: Optional[int] = None

class ProductMilestoneOut(ProductMilestoneBase):
    id: str
    product_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    category: str  # PMS / CAT_II_AIF / CAT_III_AIF / Other
    product_owner_id: Optional[str] = None
    target_launch_date: Optional[date] = None
    actual_launch_date: Optional[date] = None
    status: str = "concept"  # concept / research / development / compliance / ready / launched
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    product_owner_id: Optional[str] = None
    target_launch_date: Optional[date] = None
    actual_launch_date: Optional[date] = None
    status: Optional[str] = None
    description: Optional[str] = None

class ProductOut(ProductBase):
    id: str
    created_at: datetime
    updated_at: datetime
    milestones: List[ProductMilestoneOut] = []
    overall_progress_pct: float = 0.0

    class Config:
        from_attributes = True
