import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Response

from models.schemas import RegisterRequest, LoginRequest, MessageResponse
from providers import get_db
from services.abstractions.database import DatabaseProvider
from utils.auth_utils import create_token, require_role, ACCESS_TOKEN_EXPIRE_DAYS

router = APIRouter(prefix="/api/auth", tags=["auth"])

# --- Bcrypt Helper Functions ---
def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)
# -------------------------------

COOKIE_MAX_AGE = 60 * 60 * 24 * ACCESS_TOKEN_EXPIRE_DAYS


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=COOKIE_MAX_AGE,
    )


@router.post("/register")
def register(
    body: RegisterRequest,
    response: Response,
    db: DatabaseProvider = Depends(get_db),
):
    if db.get_user_by_email(body.email):
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed = hash_password(body.password)
    user_id = db.insert_user(
        {"email": body.email, "password_hash": hashed, "role": "business"}
    )

    token = create_token(user_id, "business")
    _set_auth_cookie(response, token)
    return {"message": "Registered successfully.", "next": "/onboarding"}


@router.post("/login")
def login(
    body: LoginRequest,
    response: Response,
    db: DatabaseProvider = Depends(get_db),
):
    user = db.get_user_by_email(body.email)
    
    # Updated to use the verify_password helper
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_token(user["id"], user["role"])
    _set_auth_cookie(response, token)
    return {"message": "Logged in.", "role": user["role"]}


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response):
    response.delete_cookie("auth_token")
    return {"message": "Logged out."}


@router.get("/me")
def me(
    user: dict = Depends(require_role("business")),
    db: DatabaseProvider = Depends(get_db),
):
    """Return the currently authenticated user's profile."""
    record = db.get_user_by_id(user["sub"]) if hasattr(db, "get_user_by_id") else None
    if record:
        record.pop("password_hash", None)
    return record or {"id": user["sub"], "role": user["role"]}