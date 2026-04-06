from services.abstractions.storage import StorageProvider
from services.abstractions.document_parser import DocumentParser
from services.abstractions.llm import LLMProvider
from services.abstractions.database import DatabaseProvider
from services import scoring_service


def process_application(
    application_id: int,
    storage: StorageProvider,
    parser: DocumentParser,
    llm: LLMProvider,
    db: DatabaseProvider,
) -> None:
    application = db.get_application(application_id)
    if not application:
        return

    job = db.get_job_by_id(application["job_id"])
    if not job:
        return

    # 1. Retrieve document bytes
    cv_path = application.get("cv_path")
    if not cv_path:
        db.update_application(application_id, {
            "status": "needs_review",
            "score_summary": "No document was attached to this application.",
        })
        return

    try:
        cv_bytes = storage.retrieve(cv_path)
    except Exception as e:
        db.update_application(application_id, {
            "status": "needs_review",
            "score_summary": f"Could not retrieve document: {e}",
        })
        return

    # 2. Extract text — use the stored filename to detect the format
    filename = cv_path.rsplit("/", 1)[-1]
    try:
        cv_text = parser.extract_text(cv_bytes, filename)
    except ValueError as e:
        db.update_application(application_id, {
            "cv_text": "",
            "status": "needs_review",
            "score_summary": str(e),
        })
        return

    db.update_application(application_id, {"cv_text": cv_text})

    # 3. Score against the job description
    try:
        score_result = scoring_service.score_application(
            cv_text=cv_text,
            form_responses=application.get("form_responses") or "{}",
            job_description=job["description"],
            llm=llm,
        )
        db.update_application_score(application_id, {
            "ai_score": score_result.overall_score,
            "score_breakdown": score_result.breakdown.model_dump_json(),
            "score_summary": score_result.summary,
        })
    except Exception as e:
        db.update_application(application_id, {
            "status": "needs_review",
            "score_summary": f"Scoring failed: {e}",
        })
