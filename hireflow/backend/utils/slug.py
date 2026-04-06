import re
import uuid


def generate_slug(job_title: str, company_name: str) -> str:
    base = f"{company_name}-{job_title}"
    slug = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    unique_suffix = str(uuid.uuid4())[:8]
    return f"{slug}-{unique_suffix}"
