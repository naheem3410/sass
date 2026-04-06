import json

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import (
    JobCreateSchema,
    JobUpdateSchema,
    SuggestDescriptionRequest,
    JobPublicResponse,
    AdvanceCandidateRequest,
)
from models.ai_outputs import JobDescriptionOutput
from providers import get_db, get_llm
from services.abstractions.database import DatabaseProvider
from services.abstractions.llm import LLMProvider
from services import rag_service
from utils.auth_utils import require_role
from utils.slug import generate_slug

router = APIRouter(tags=["jobs"])

APP_URL = __import__("os").environ.get("APP_URL", "https://hireflow.ng")


# ─── AI suggestion (authenticated) ──────────────────────────────────────────

@router.post("/api/jobs/suggest-description")
def suggest_description(
    body: SuggestDescriptionRequest,
    llm: LLMProvider = Depends(get_llm),
    user: dict = Depends(require_role("business")),
):
    company_context = rag_service.get_company_context(body.company_id)
    prompt = f"""
You are an expert HR writer. Write a professional job description for a
{body.job_title} role at the following company:

{company_context}

Include a role summary, key responsibilities, required qualifications,
preferred qualifications, and what the company offers.
"""
    result = llm.complete(prompt, JobDescriptionOutput)
    return result.model_dump()


# ─── Authenticated job management ───────────────────────────────────────────

@router.post("/api/jobs")
def create_job(
    job: JobCreateSchema,
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    company = db.get_company_by_user(user["sub"])
    if not company:
        raise HTTPException(status_code=400, detail="Complete company onboarding first.")

    slug = generate_slug(job.title, company["name"])
    job_id = db.insert_job(
        {
            "company_id": company["id"],
            "title": job.title,
            "description": job.description,
            "requirements": json.dumps(job.requirements),
            "location": job.location,
            "job_type": job.job_type,
            "salary_range": job.salary_range,
            "form_schema": job.form_schema.model_dump_json(),
            "slug": slug,
            "status": "active",
        }
    )
    return {
        "job_id": job_id,
        "slug": slug,
        "url": f"{APP_URL}/apply/{slug}",
    }


@router.get("/api/jobs")
def list_jobs(
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    company = db.get_company_by_user(user["sub"])
    if not company:
        raise HTTPException(status_code=404, detail="No company found.")
    jobs = db.get_jobs_by_company(company["id"])
    # Deserialise JSON string fields for the response
    for j in jobs:
        for field in ("requirements", "form_schema"):
            if isinstance(j.get(field), str):
                try:
                    j[field] = json.loads(j[field])
                except Exception:
                    pass
    return {"jobs": jobs}


@router.get("/api/jobs/{job_id}")
def get_job(
    job_id: int,
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    job = db.get_job_owned_by_user(job_id, user["sub"])
    if not job:
        raise HTTPException(status_code=403, detail="Job not found or access denied.")
    for field in ("requirements", "form_schema"):
        if isinstance(job.get(field), str):
            try:
                job[field] = json.loads(job[field])
            except Exception:
                pass
    return job


@router.patch("/api/jobs/{job_id}")
def update_job(
    job_id: int,
    body: JobUpdateSchema,
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    job = db.get_job_owned_by_user(job_id, user["sub"])
    if not job:
        raise HTTPException(status_code=403, detail="Job not found or access denied.")

    updates: dict = {}
    raw = body.model_dump(exclude_none=True)

    if "requirements" in raw:
        updates["requirements"] = json.dumps(raw.pop("requirements"))
    if "form_schema" in raw:
        updates["form_schema"] = json.dumps(raw.pop("form_schema"))

    updates.update(raw)

    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    db.update_job(job_id, updates)
    return {"message": "Job updated."}


@router.get("/api/jobs/{job_id}/candidates")
def get_ranked_candidates(
    job_id: int,
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    job = db.get_job_owned_by_user(job_id, user["sub"])
    if not job:
        raise HTTPException(status_code=403, detail="Forbidden.")

    candidates = db.get_ranked_candidates(job_id)
    for c in candidates:
        for field in ("score_breakdown", "form_responses"):
            if isinstance(c.get(field), str):
                try:
                    c[field] = json.loads(c[field])
                except Exception:
                    pass
    return {"candidates": candidates}


@router.patch("/api/jobs/{job_id}/candidates/{application_id}")
def advance_candidate(
    job_id: int,
    application_id: int,
    body: AdvanceCandidateRequest,
    db: DatabaseProvider = Depends(get_db),
    user: dict = Depends(require_role("business")),
):
    job = db.get_job_owned_by_user(job_id, user["sub"])
    if not job:
        raise HTTPException(status_code=403, detail="Forbidden.")

    application = db.get_application(application_id)
    if not application or application["job_id"] != job_id:
        raise HTTPException(status_code=404, detail="Application not found.")

    db.update_application(application_id, {"status": body.status})
    return {"message": f"Candidate status updated to '{body.status}'."}


# ─── Public endpoint — no auth required ─────────────────────────────────────

@router.get("/api/public/jobs/{job_slug}", response_model=JobPublicResponse)
def get_public_job(job_slug: str, db: DatabaseProvider = Depends(get_db)):
    job = db.get_job_by_slug(job_slug)
    if not job or job["status"] != "active":
        raise HTTPException(status_code=404, detail="Job not found or no longer active.")
    return job
