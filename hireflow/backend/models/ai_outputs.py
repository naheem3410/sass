from pydantic import BaseModel, Field


class CompanyDescriptionOutput(BaseModel):
    description: str
    tagline: str


class JobDescriptionOutput(BaseModel):
    summary: str
    responsibilities: list[str]
    required_qualifications: list[str]
    preferred_qualifications: list[str]
    what_we_offer: list[str]


class ScoreBreakdown(BaseModel):
    skills_match: float = Field(ge=0, le=100)
    experience_relevance: float = Field(ge=0, le=100)
    education_fit: float = Field(ge=0, le=100)


class CandidateScoringOutput(BaseModel):
    overall_score: float = Field(ge=0, le=100)
    breakdown: ScoreBreakdown
    strengths: list[str]
    gaps: list[str]
    summary: str
