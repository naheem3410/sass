# HireFlow Backend

AI-powered hiring operating system — FastAPI backend.

## Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Database | SQLite (MVP) → PostgreSQL (production) |
| Vector store | ChromaDB |
| LLM | OpenAI GPT-4o (swappable to AWS Bedrock) |
| Storage | Local filesystem (MVP) → AWS S3 (production) |
| Email | Resend |
| Auth | JWT in HttpOnly cookies |
| Doc parsing | UniversalDocumentParser (PDF, DOCX, MD, TXT, RTF, ODT) |

---

## Quick start

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set OPENAI_API_KEY, EMAIL_API_KEY, SECRET_KEY at minimum

# Start the dev server
uvicorn main:app --reload --port 8000
```

Interactive docs: http://localhost:8000/docs

---

## Project structure

```
backend/
├── main.py                  # FastAPI app, CORS, router registration
├── providers.py             # Single file to swap all external dependencies
├── requirements.txt
├── .env.example
│
├── routers/
│   ├── auth.py              # POST /api/auth/register|login|logout, GET /api/auth/me
│   ├── companies.py         # POST /api/companies/generate-description, /api/companies
│   ├── jobs.py              # Job CRUD, AI suggestion, public job fetch, candidate pipeline
│   ├── applications.py      # POST /api/applications/{slug}, GET document download
│   └── verify.py            # GET /api/verify, POST /api/verify/otp, GET /api/verify/resend
│
├── services/
│   ├── abstractions/        # Abstract base classes — never import concrete providers here
│   │   ├── storage.py
│   │   ├── document_parser.py
│   │   ├── llm.py
│   │   └── database.py
│   ├── storage/
│   │   ├── local.py         # LocalStorageProvider
│   │   └── s3.py            # S3StorageProvider
│   ├── document/
│   │   └── universal_parser.py
│   ├── llm/
│   │   ├── openai_provider.py
│   │   └── bedrock_provider.py
│   ├── db/
│   │   ├── sqlite_provider.py
│   │   └── postgres_provider.py
│   ├── rag_service.py       # ChromaDB indexing and retrieval
│   ├── email_service.py     # Resend transactional email
│   ├── otp_service.py       # OTP generation and verification
│   ├── scoring_service.py   # AI candidate scoring
│   └── processing_service.py # Background document processing pipeline
│
├── models/
│   ├── schemas.py           # Pydantic request/response models
│   └── ai_outputs.py        # Structured output models for all LLM calls
│
├── utils/
│   ├── auth_utils.py        # JWT creation, decode, require_role dependency
│   ├── slug.py              # Job URL slug generation
│   └── file_utils.py        # File extension and size validation
│
└── db/
    └── migrations/
        └── 001_initial.sql  # Schema reference (auto-applied by SQLiteProvider)
```

---

## API reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register business account |
| POST | `/api/auth/login` | — | Login, sets HttpOnly cookie |
| POST | `/api/auth/logout` | Cookie | Clear auth cookie |
| GET | `/api/auth/me` | Cookie | Current user info |

### Company
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/companies/generate-description` | Cookie | AI-generate description from name + website |
| POST | `/api/companies` | Cookie | Save company (indexes to ChromaDB) |
| GET | `/api/companies/me` | Cookie | Get authenticated user's company |
| PATCH | `/api/companies/me` | Cookie | Update company details |

### Jobs
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/jobs/suggest-description` | Cookie | AI-generate JD using company RAG context |
| POST | `/api/jobs` | Cookie | Create job post, returns public URL |
| GET | `/api/jobs` | Cookie | List all jobs for authenticated company |
| GET | `/api/jobs/{id}` | Cookie | Get single job |
| PATCH | `/api/jobs/{id}` | Cookie | Update job |
| GET | `/api/jobs/{id}/candidates` | Cookie | Ranked candidate list |
| PATCH | `/api/jobs/{id}/candidates/{appId}` | Cookie | Advance candidate pipeline status |
| GET | `/api/public/jobs/{slug}` | — | Public job detail (for apply page) |

### Applications
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/applications/{slug}` | — | Submit application + CV upload |
| GET | `/api/applications/{id}/document` | Cookie | Download candidate CV |

### Verification
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/verify?token=` | — | Validate secure link, send OTP |
| POST | `/api/verify/otp` | — | Submit OTP, trigger processing |
| GET | `/api/verify/resend?token=` | — | Resend a fresh OTP |

---

## Swapping providers

Every external dependency is behind an abstract base class. To migrate to production infrastructure, edit **only** `providers.py`:

```python
# providers.py — production example
from services.storage.s3 import S3StorageProvider
from services.llm.bedrock_provider import BedrockProvider
from services.db.postgres_provider import PostgreSQLProvider

storage        = S3StorageProvider(bucket="hireflow-cvs")
llm            = BedrockProvider(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0")
db             = PostgreSQLProvider(url=os.environ["DATABASE_URL"])
document_parser = UniversalDocumentParser()  # unchanged
```

No business logic changes required anywhere else.

---

## Application status flow

```
pending_verification  →  new  →  [shortlisted | interview | rejected | hired]
                              ↘  needs_review   (document could not be parsed)
```

- `pending_verification` — submitted, email not yet verified
- `new` — OTP verified, processing complete (or in progress)
- `needs_review` — document parsing or scoring failed; hiring manager must follow up
- Any other value — set manually by hiring manager via PATCH `/api/jobs/{id}/candidates/{appId}`

---

## Supported document formats

| Format | Parser |
|---|---|
| PDF | pdfplumber |
| DOCX | python-docx |
| Markdown | markdown + BeautifulSoup |
| TXT | UTF-8 decode |
| RTF | striprtf |
| ODT | zipfile + BeautifulSoup (XML) |
| DOC | ❌ Not supported (flags `needs_review`, prompts re-upload) |
