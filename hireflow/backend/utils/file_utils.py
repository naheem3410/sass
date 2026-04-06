from fastapi import HTTPException

SUPPORTED_EXTENSIONS = {"pdf", "docx", "doc", "md", "txt", "rtf", "odt"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_upload(filename: str, file_bytes: bytes) -> str:
    """Validate file extension and size. Returns lowercased extension or raises HTTPException."""
    if "." not in filename:
        raise HTTPException(status_code=400, detail="File has no extension.")

    ext = filename.rsplit(".", 1)[-1].lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '.{ext}'. "
                f"Accepted formats: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ),
        )

    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds the 10 MB size limit.")

    return ext
