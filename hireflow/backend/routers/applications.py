import json
import uuid
import secrets

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response as FastAPIResponse

from providers import get_db, get_storage
from services.abstractions.database import DatabaseProvider
from services.abstractions.storage import StorageProvider
from services import email_service
from utils.auth_utils import require_role
from utils.file_utils import validate_upload

import os

APP_URL = os.environ.get("APP_URL", "https://hireflow.ng")

router = APIRouter(tags=["applications"])


@router.post("/api/applications/{job_slug}")
async def submit_application(
    job_slug: str,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(None),
    cover_note: str = Form(None),
    form_responses: str = Form("{}"),
    cv: UploadFile = File(...),
    db: DatabaseProvider = Depends(get_db),
    storage: StorageProvider = Depends(get_storage),
):
    # 1. Validate the job exists and is active
    job = db.get_job_by_slug(job_slug)
    if not job or job["status"] != "active":
        raise HTTPException(status_code=404, detail="Job not found or no longer accepting applications.")

    # 2. Validate and read file
    cv_bytes = await cv.read()
    ext = validate_upload(cv.filename, cv_bytes)

    # 3. Validate form_responses is valid JSON
    try:
        json.loads(form_responses)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="form_responses must be valid JSON.")

    # 4. Create unverified application record
    application_id = db.insert_application(
        {
            "job_id": job["id"],
            "candidate_name": name,
            "candidate_email": email,
            "candidate_phone": phone,
            "cover_note": cover_note,
            "form_responses": form_responses,
            "status": "pending_verification",
        }
    )

    # 5. Store document — preserve extension in the filename for later parsing
    filename = f"cv_{application_id}_{uuid.uuid4().hex[:8]}.{ext}"
    cv_path = storage.save(cv_bytes, filename)
    db.update_application(application_id, {"cv_path": cv_path})

    # 6. Generate secure token and create session
    secure_token = secrets.token_urlsafe(32)
    db.insert_candidate_session(
        {
            "application_id": application_id,
            "email": email,
            "secure_token": secure_token,
        }
    )

    # 7. Send verification email
    verification_url = f"{APP_URL}/apply/verify?token={secure_token}&job={job_slug}"
    email_service.send_verification_link(
        to=email,
        candidate_name=name,
        job_title=job["title"],
        verification_url=verification_url,
    )

    return {
        "message": "Application submitted. Please check your email to verify your identity."
    }


@router.get("/api/applications/{application_id}/document")
def download_document(
    application_id: int,
    db: DatabaseProvider = Depends(get_db),
    storage: StorageProvider = Depends(get_storage),
    user: dict = Depends(require_role("business")),
):
    """Download the CV/document for a specific application (authenticated hiring managers only)."""
    application = db.get_application(application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Verify the requesting user owns the job this application belongs to
    job = db.get_job_owned_by_user(application["job_id"], user["sub"])
    if not job:
        raise HTTPException(status_code=403, detail="Forbidden.")

    cv_path = application.get("cv_path")
    if not cv_path:
        raise HTTPException(status_code=404, detail="No document attached to this application.")

    try:
        file_bytes = storage.retrieve(cv_path)
    except Exception:
        raise HTTPException(status_code=404, detail="Document file not found.")

    filename = cv_path.rsplit("/", 1)[-1]
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"

    media_types = {
        "pdf": "application/pdf",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "txt": "text/plain",
        "md": "text/markdown",
        "rtf": "application/rtf",
        "odt": "application/vnd.oasis.opendocument.text",
    }
    media_type = media_types.get(ext, "application/octet-stream")

    return FastAPIResponse(
        content=file_bytes,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
