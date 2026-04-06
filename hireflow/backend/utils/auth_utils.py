import os
import datetime
from jose import jwt, JWTError
from fastapi import Cookie, HTTPException

SECRET_KEY = os.environ.get("SECRET_KEY", "change-me-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = int(os.environ.get("ACCESS_TOKEN_EXPIRE_DAYS", "7"))


def create_token(user_id: int, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": datetime.datetime.utcnow()
        + datetime.timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        payload["sub"] = int(payload["sub"])
        return payload
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def require_role(*roles: str):
    """FastAPI dependency: validates JWT cookie and enforces allowed roles."""

    def checker(auth_token: str | None = Cookie(default=None)) -> dict:
        if not auth_token:
            raise HTTPException(status_code=401, detail="Not authenticated")
        payload = decode_token(auth_token)
        if payload["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return payload

    return checker
