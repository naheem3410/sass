from models.ai_outputs import CandidateScoringOutput
from services.abstractions.llm import LLMProvider


def score_application(
    cv_text: str,
    form_responses: str,
    job_description: str,
    llm: LLMProvider,
) -> CandidateScoringOutput:
    prompt = f"""
You are an expert recruiter. Score the candidate against the job description.

Consider both their CV or resume document and their answers to the application
questions.

JOB DESCRIPTION:
{job_description}

CANDIDATE DOCUMENT:
{cv_text}

CANDIDATE APPLICATION RESPONSES:
{form_responses}

Return a score from 0 to 100, a breakdown across skills match, experience
relevance, and education fit, up to 3 strengths, up to 3 gaps, and a
2-3 sentence recruiter-style summary.
"""
    return llm.complete(prompt, CandidateScoringOutput)
