from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, EmailStr, field_validator
import json


# ----------------------------------------------------------------- Auth
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# --------------------------------------------------------------- Company
class CompanyCreateSchema(BaseModel):
    name: str
    website: str | None = None
    industry: str | None = None
    size: str | None = None
    description: str
    tagline: str | None = None


class CompanyUpdateSchema(BaseModel):
    name: str | None = None
    website: str | None = None
    industry: str | None = None
    size: str | None = None
    description: str | None = None
    tagline: str | None = None


class GenerateDescriptionRequest(BaseModel):
    name: str
    website: str | None = None


# --------------------------------------------------------------- Job form
SUPPORTED_FIELD_TYPES = Literal[
    "text", "textarea", "number", "email", "phone",
    "date", "select", "radio", "checkbox", "boolean", "file", "range"
]


class FieldOption(BaseModel):
    label: str
    value: str


class FormField(BaseModel):
    id: str
    label: str
    field_type: SUPPORTED_FIELD_TYPES
    required: bool = False
    placeholder: str | None = None
    options: list[FieldOption] | None = None
    min_value: int | None = None
    max_value: int | None = None
    max_length: int | None = None


class JobFormSchema(BaseModel):
    fields: list[FormField] = []


# ------------------------------------------------------------------- Job
class JobCreateSchema(BaseModel):
    title: str
    description: str
    requirements: list[str] = []
    location: str | None = None
    job_type: str | None = None
    salary_range: str | None = None
    form_schema: JobFormSchema = JobFormSchema()


class JobUpdateSchema(BaseModel):
    title: str | None = None
    description: str | None = None
    requirements: list[str] | None = None
    location: str | None = None
    job_type: str | None = None
    salary_range: str | None = None
    form_schema: JobFormSchema | None = None
    status: Literal["active", "closed", "draft"] | None = None


class SuggestDescriptionRequest(BaseModel):
    job_title: str
    company_id: int


# ------------------------------------------------------------ Application
class AdvanceCandidateRequest(BaseModel):
    status: str  # e.g. "shortlisted", "interview", "rejected", "hired"


# ----------------------------------------------------------------- OTP
class OTPVerifyRequest(BaseModel):
    session_token: str
    otp: str


# ---------------------------------------------------------- Generic responses
class MessageResponse(BaseModel):
    message: str


class JobPublicResponse(BaseModel):
    id: int
    title: str
    description: str
    requirements: Any
    location: str | None
    job_type: str | None
    salary_range: str | None
    form_schema: Any
    slug: str
    status: str
    created_at: str

    @field_validator("form_schema", "requirements", mode="before")
    @classmethod
    def parse_json_field(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return v
        return v
