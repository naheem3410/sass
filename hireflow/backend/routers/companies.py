from fastapi import APIRouter, Depends, HTTPException

from models.schemas import (
    CompanyCreateSchema,
    CompanyUpdateSchema,
    GenerateDescriptionRequest,
)
from models.ai_outputs import CompanyDescriptionOutput
from providers import get_db, get_llm
from services.abstractions.database import DatabaseProvider
from services.abstractions.llm import LLMProvider
from services import rag_service
from utils.auth_utils import require_role

router = APIRouter(prefix="/api/companies", tags=["companies"])


@router.post("/generate-description")
def generate_description(
    body: GenerateDescriptionRequest,
    llm: LLMProvider = Depends(get_llm),
    user: dict = Depends(require_role("business")),
):
    """Step 1 of onboarding: generate AI description from company name and website."""
    website_line = (
        f"Their website is: {body.website}" if body.website else "They have not provided a website."
    )
    prompt = f"""
You are a professional copywriter. A company called "{body.name}" is setting up
their hiring profile.
{website_line}

Write a clear, professional company description (3-4 sentences) that explains
what kind of company this is, what they likely do, and what kind of culture
and work environment they might offer.

Also write a short tagline under 12 words.

Base your response only on the company name and website provided.
Do not invent specific facts — write in general but credible terms.
"""
    result = llm.complete(prompt, CompanyDescriptionOutput)
    return {"description": result.description, "tagline": result.tagline}


@router.post("")
def create_company(
    company: CompanyCreateSchema,
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    """Step 2 of onboarding: save the (possibly edited) company profile."""
    if db.get_company_by_user(user["sub"]):
        raise HTTPException(status_code=400, detail="Company already exists for this account.")

    company_id = db.insert_company(
        {
            "user_id": user["sub"],
            "name": company.name,
            "website": company.website,
            "industry": company.industry,
            "size": company.size,
            "description": company.description,
            "tagline": company.tagline,
        }
    )

    rag_service.index_company(company_id, company.model_dump())
    return {"company_id": company_id, "next": "/dashboard"}


@router.get("/me")
def get_my_company(
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    company = db.get_company_by_user(user["sub"])
    if not company:
        raise HTTPException(status_code=404, detail="No company found. Please complete onboarding.")
    return company


@router.patch("/me")
def update_my_company(
    body: CompanyUpdateSchema,
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    company = db.get_company_by_user(user["sub"])
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    db.update_company(company["id"], updates)

    # Re-index into ChromaDB with updated data
    updated = {**company, **updates}
    rag_service.index_company(company["id"], updated)

    return {"message": "Company updated."}
