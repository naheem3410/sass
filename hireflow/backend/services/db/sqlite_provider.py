import sqlite3
import os
from services.abstractions.database import DatabaseProvider


class SQLiteProvider(DatabaseProvider):
    def __init__(self, path: str = "./hireflow.db"):
        self.path = path
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        return conn

    def _init_db(self):
        """Run all migrations / create all tables if they don't exist."""
        ddl = """
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL CHECK(role IN ('business', 'candidate')),
            created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS companies (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     INTEGER UNIQUE NOT NULL REFERENCES users(id),
            name        TEXT NOT NULL,
            website     TEXT,
            industry    TEXT,
            size        TEXT,
            description TEXT NOT NULL,
            tagline     TEXT,
            created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            company_id   INTEGER NOT NULL REFERENCES companies(id),
            title        TEXT NOT NULL,
            description  TEXT NOT NULL,
            requirements TEXT,
            location     TEXT,
            job_type     TEXT,
            salary_range TEXT,
            form_schema  TEXT NOT NULL DEFAULT '{\"fields\":[]}',
            slug         TEXT UNIQUE NOT NULL,
            status       TEXT DEFAULT 'active' CHECK(status IN ('active','closed','draft')),
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS applications (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id          INTEGER NOT NULL REFERENCES jobs(id),
            candidate_name  TEXT NOT NULL,
            candidate_email TEXT NOT NULL,
            candidate_phone TEXT,
            cv_path         TEXT,
            cv_text         TEXT,
            cover_note      TEXT,
            form_responses  TEXT,
            ai_score        REAL,
            score_breakdown TEXT,
            score_summary   TEXT,
            status          TEXT DEFAULT 'pending_verification',
            applied_at      DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS candidate_sessions (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL REFERENCES applications(id),
            email          TEXT NOT NULL,
            secure_token   TEXT UNIQUE NOT NULL,
            otp_hash       TEXT,
            otp_expires_at DATETIME,
            verified       INTEGER DEFAULT 0,
            created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        """
        with self._connect() as conn:
            conn.executescript(ddl)

    # ------------------------------------------------------------------ users
    def get_user_by_email(self, email: str) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE email = ?", (email,)
            ).fetchone()
            return dict(row) if row else None

    def get_user_by_id(self, user_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM users WHERE id = ?", (user_id,)
            ).fetchone()
            return dict(row) if row else None

    def insert_user(self, data: dict) -> int:
        with self._connect() as conn:
            cur = conn.execute(
                "INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)",
                (data["email"], data["password_hash"], data["role"]),
            )
            conn.commit()
            return cur.lastrowid

    # --------------------------------------------------------------- companies
    def get_company_by_user(self, user_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM companies WHERE user_id = ?", (user_id,)
            ).fetchone()
            return dict(row) if row else None

    def get_company_by_id(self, company_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM companies WHERE id = ?", (company_id,)
            ).fetchone()
            return dict(row) if row else None

    def insert_company(self, data: dict) -> int:
        with self._connect() as conn:
            cur = conn.execute(
                """INSERT INTO companies
                   (user_id, name, website, industry, size, description, tagline)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    data["user_id"],
                    data["name"],
                    data.get("website"),
                    data.get("industry"),
                    data.get("size"),
                    data["description"],
                    data.get("tagline"),
                ),
            )
            conn.commit()
            return cur.lastrowid

    def update_company(self, company_id: int, data: dict) -> None:
        fields = ", ".join(f"{k} = ?" for k in data)
        values = list(data.values()) + [company_id]
        with self._connect() as conn:
            conn.execute(
                f"UPDATE companies SET {fields} WHERE id = ?", values
            )
            conn.commit()

    # -------------------------------------------------------------------- jobs
    def get_job_by_slug(self, slug: str) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM jobs WHERE slug = ?", (slug,)
            ).fetchone()
            return dict(row) if row else None

    def get_job_by_id(self, job_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM jobs WHERE id = ?", (job_id,)
            ).fetchone()
            return dict(row) if row else None

    def get_job_owned_by_user(self, job_id: int, user_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                """SELECT j.* FROM jobs j
                   JOIN companies c ON j.company_id = c.id
                   WHERE j.id = ? AND c.user_id = ?""",
                (job_id, user_id),
            ).fetchone()
            return dict(row) if row else None

    def get_jobs_by_company(self, company_id: int) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                "SELECT * FROM jobs WHERE company_id = ? ORDER BY created_at DESC",
                (company_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    def insert_job(self, data: dict) -> int:
        with self._connect() as conn:
            cur = conn.execute(
                """INSERT INTO jobs
                   (company_id, title, description, requirements, location,
                    job_type, salary_range, form_schema, slug, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (
                    data["company_id"],
                    data["title"],
                    data["description"],
                    data.get("requirements"),
                    data.get("location"),
                    data.get("job_type"),
                    data.get("salary_range"),
                    data.get("form_schema", '{"fields":[]}'),
                    data["slug"],
                    data.get("status", "active"),
                ),
            )
            conn.commit()
            return cur.lastrowid

    def update_job(self, job_id: int, data: dict) -> None:
        fields = ", ".join(f"{k} = ?" for k in data)
        values = list(data.values()) + [job_id]
        with self._connect() as conn:
            conn.execute(f"UPDATE jobs SET {fields} WHERE id = ?", values)
            conn.commit()

    # ----------------------------------------------------------- applications
    def get_application(self, application_id: int) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM applications WHERE id = ?", (application_id,)
            ).fetchone()
            return dict(row) if row else None

    def insert_application(self, data: dict) -> int:
        with self._connect() as conn:
            cur = conn.execute(
                """INSERT INTO applications
                   (job_id, candidate_name, candidate_email, candidate_phone,
                    cover_note, form_responses, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    data["job_id"],
                    data["candidate_name"],
                    data["candidate_email"],
                    data.get("candidate_phone"),
                    data.get("cover_note"),
                    data.get("form_responses", "{}"),
                    data.get("status", "pending_verification"),
                ),
            )
            conn.commit()
            return cur.lastrowid

    def update_application(self, application_id: int, data: dict) -> None:
        fields = ", ".join(f"{k} = ?" for k in data)
        values = list(data.values()) + [application_id]
        with self._connect() as conn:
            conn.execute(
                f"UPDATE applications SET {fields} WHERE id = ?", values
            )
            conn.commit()

    def update_application_score(self, application_id: int, data: dict) -> None:
        self.update_application(application_id, data)

    def get_ranked_candidates(self, job_id: int) -> list[dict]:
        with self._connect() as conn:
            rows = conn.execute(
                """SELECT id, candidate_name, candidate_email, candidate_phone,
                          ai_score, score_breakdown, score_summary, status,
                          form_responses, cv_path, applied_at
                   FROM applications
                   WHERE job_id = ? AND status NOT IN ('pending_verification')
                   ORDER BY ai_score DESC NULLS LAST""",
                (job_id,),
            ).fetchall()
            return [dict(r) for r in rows]

    # ----------------------------------------------------- candidate_sessions
    def insert_candidate_session(self, data: dict) -> int:
        with self._connect() as conn:
            cur = conn.execute(
                """INSERT INTO candidate_sessions
                   (application_id, email, secure_token)
                   VALUES (?, ?, ?)""",
                (data["application_id"], data["email"], data["secure_token"]),
            )
            conn.commit()
            return cur.lastrowid

    def get_candidate_session_by_token(self, token: str) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM candidate_sessions WHERE secure_token = ?",
                (token,),
            ).fetchone()
            return dict(row) if row else None

    def update_candidate_session(self, session_id: int, data: dict) -> None:
        fields = ", ".join(f"{k} = ?" for k in data)
        values = list(data.values()) + [session_id]
        with self._connect() as conn:
            conn.execute(
                f"UPDATE candidate_sessions SET {fields} WHERE id = ?", values
            )
            conn.commit()
