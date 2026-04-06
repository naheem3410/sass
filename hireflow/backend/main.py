import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, companies, jobs, applications, verify

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="HireFlow API",
    description="AI-powered hiring operating system — MVP",
    version="1.0.0",
)

# ── CORS ─────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://hireflow.ng,https://www.hireflow.ng",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS],
    allow_credentials=True,   # required for HttpOnly cookie auth
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(companies.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(verify.router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
def health():
    return {"status": "ok", "service": "hireflow-api"}
