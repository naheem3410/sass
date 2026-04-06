import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from models.schemas import OTPVerifyRequest
from providers import get_db, get_storage, get_parser, get_llm
from services.abstractions.database import DatabaseProvider
from services.abstractions.storage import StorageProvider
from services.abstractions.document_parser import DocumentParser
from services.abstractions.llm import LLMProvider
from services import email_service, otp_service
from services.processing_service import process_application

router = APIRouter(prefix="/api/verify", tags=["verify"])

OTP_TTL_MINUTES = 10


@router.get("")
def verify_link(
    token: str,
    db: DatabaseProvider = Depends(get_db),
):
    """
    Candidate clicks the secure link from their email.
    Validates the token, generates an OTP, and emails it.
    """
    session = db.get_candidate_session_by_token(token)
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or expired verification link.")
    if session["verified"]:
        raise HTTPException(status_code=400, detail="This application has already been verified.")

    # Generate and store OTP
    otp = otp_service.generate_otp()
    otp_hash = otp_service.hash_otp(otp)
    expires_at = (
        datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_TTL_MINUTES)
    ).isoformat()

    db.update_candidate_session(
        session["id"],
        {
            "otp_hash": otp_hash,
            "otp_expires_at": expires_at,
        },
    )

    email_service.send_otp(to=session["email"], otp=otp)

    return {
        "message": f"A verification code has been sent to your email.",
        "session_token": token,
    }


@router.post("/otp")
def verify_otp(
    body: OTPVerifyRequest,
    background_tasks: BackgroundTasks,
    db: DatabaseProvider = Depends(get_db),
    storage: StorageProvider = Depends(get_storage),
    parser: DocumentParser = Depends(get_parser),
    llm: LLMProvider = Depends(get_llm),
):
    """
    Candidate submits the OTP.
    On success, marks the application verified and enqueues background processing.
    """
    session = db.get_candidate_session_by_token(body.session_token)
    if not session:
        raise HTTPException(status_code=404, detail="Invalid session.")
    if session["verified"]:
        raise HTTPException(status_code=400, detail="Already verified.")
    if not session.get("otp_hash"):
        raise HTTPException(
            status_code=400,
            detail="No OTP requested yet. Please click the verification link first.",
        )

    # Check expiry
    expires_at_str = session.get("otp_expires_at")
    if expires_at_str:
        try:
            expires_at = datetime.datetime.fromisoformat(expires_at_str)
            if datetime.datetime.utcnow() > expires_at:
                raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        except ValueError:
            pass  # malformed timestamp — proceed, let hash check handle it

    # Verify OTP hash
    if not otp_service.verify_otp(body.otp, session["otp_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect verification code.")

    # Mark session and application as verified/new
    db.update_candidate_session(session["id"], {"verified": 1})
    db.update_application(session["application_id"], {"status": "new"})

    # Kick off async document processing
    background_tasks.add_task(
        process_application,
        session["application_id"],
        storage,
        parser,
        llm,
        db,
    )

    return {
        "message": "Identity verified. Your application is being processed — we'll be in touch soon."
    }


@router.get("/resend")
def resend_otp(
    token: str,
    db: DatabaseProvider = Depends(get_db),
):
    """Allow a candidate to request a fresh OTP if theirs expired."""
    session = db.get_candidate_session_by_token(token)
    if not session:
        raise HTTPException(status_code=404, detail="Invalid or expired verification link.")
    if session["verified"]:
        raise HTTPException(status_code=400, detail="Already verified.")

    otp = otp_service.generate_otp()
    otp_hash = otp_service.hash_otp(otp)
    expires_at = (
        datetime.datetime.utcnow() + datetime.timedelta(minutes=OTP_TTL_MINUTES)
    ).isoformat()

    db.update_candidate_session(
        session["id"],
        {
            "otp_hash": otp_hash,
            "otp_expires_at": expires_at,
        },
    )

    email_service.send_otp(to=session["email"], otp=otp)

    return {"message": "A new verification code has been sent.", "session_token": token}
