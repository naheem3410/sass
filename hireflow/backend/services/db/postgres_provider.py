"""
PostgreSQL provider — drop-in replacement for SQLiteProvider in production.
Requires: pip install psycopg2-binary
Set DATABASE_URL env var to a valid PostgreSQL connection string.
"""
import os
import psycopg2
import psycopg2.extras
from services.abstractions.database import DatabaseProvider


class PostgreSQLProvider(DatabaseProvider):
    def __init__(self, url: str | None = None):
        self.url = url or os.environ["DATABASE_URL"]
        self._init_db()

    def _connect(self):
        conn = psycopg2.connect(self.url)
        conn.autocommit = False
        return conn

    def _init_db(self):
        ddl = """
        CREATE TABLE IF NOT EXISTS users (
            id            SERIAL PRIMARY KEY,
            email         TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL CHECK(role IN ('business', 'candidate')),
            created_at    TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS companies (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER UNIQUE NOT NULL REFERENCES users(id),
            name        TEXT NOT NULL,
            website     TEXT,
            industry    TEXT,
            size        TEXT,
            description TEXT NOT NULL,
            tagline     TEXT,
            created_at  TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS jobs (
            id           SERIAL PRIMARY KEY,
            company_id   INTEGER NOT NULL REFERENCES companies(id),
            title        TEXT NOT NULL,
            description  TEXT NOT NULL,
            requirements TEXT,
            location     TEXT,
            job_type     TEXT,
            salary_range TEXT,
            form_schema  TEXT NOT NULL DEFAULT '{"fields":[]}',
            slug         TEXT UNIQUE NOT NULL,
            status       TEXT DEFAULT 'active' CHECK(status IN ('active','closed','draft')),
            created_at   TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS applications (
            id              SERIAL PRIMARY KEY,
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
            applied_at      TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS candidate_sessions (
            id             SERIAL PRIMARY KEY,
            application_id INTEGER NOT NULL REFERENCES applications(id),
            email          TEXT NOT NULL,
            secure_token   TEXT UNIQUE NOT NULL,
            otp_hash       TEXT,
            otp_expires_at TIMESTAMPTZ,
            verified       INTEGER DEFAULT 0,
            created_at     TIMESTAMPTZ DEFAULT NOW()
        );
        """
        with self._connect() as conn:
            with conn.cursor() as cur:
                cur.execute(ddl)
            conn.commit()

    def _fetchone(self, conn, query: str, params=()) -> dict | None:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            row = cur.fetchone()
            return dict(row) if row else None

    def _fetchall(self, conn, query: str, params=()) -> list[dict]:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(query, params)
            return [dict(r) for r in cur.fetchall()]

    def _insert(self, conn, query: str, params=()) -> int:
        with conn.cursor() as cur:
            cur.execute(query + " RETURNING id", params)
            row_id = cur.fetchone()[0]
        conn.commit()
        return row_id

    def _execute(self, conn, query: str, params=()) -> None:
        with conn.cursor() as cur:
            cur.execute(query, params)
        conn.commit()

    # ------------------------------------------------------------------ users
    def get_user_by_email(self, email: str) -> dict | None:
        with self._connect() as conn:
            return self._fetchone(conn, "SELECT * FROM users WHERE email = %s", (email,))

    def insert_user(self, data: dict) -> int:
        with self._connect() as conn:
            return self._insert(
                conn,
                "INSERT INTO users (email, password_hash, role) VALUES (%s, %s, %s)",
                (data["email"], data["password_hash"], data["role"]),
            )

    # --------------------------------------------------------------- companies
    def get_company_by_user(self, user_id: int) -> dict | None:
        with self._connect() as conn:
            return self._fetchone(conn, "SELECT * FROM companies WHERE user_id = %s", (user_id,))

    def insert_company(self, data: dict) -> int:
        with self._connect() as conn:
            return self._insert(
                conn,
                """INSERT INTO companies
                   (user_id, name, website, industry, size, description, tagline)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    data["user_id"], data["name"], data.get("website"),
                    data.get("industry"), data.get("size"),
                    data["description"], data.get("tagline"),
                ),
            )

    def update_company(self, company_id: int, data: dict) -> None:
        fields = ", ".join(f"{k} = %s" for k in data)
        values = list(data.values()) + [company_id]
        with self._connect() as conn:
            self._execute(conn, f"UPDATE companies SET {fields} WHERE id = %s", values)

    # -------------------------------------------------------------------- jobs
    def get_job_by_slug(self, slug: str) -> dict | None:
        with self._connect() as conn:
            return self._fetchone(conn, "SELECT * FROM jobs WHERE slug = %s", (slug,))

    def get_job_by_id(self, job_id: int) -> dict | None:
        with self._connect() as conn:
            return self._fetchone(conn, "SELECT * FROM jobs WHERE id = %s", (job_id,))

    def get_job_owned_by_user(self, job_id: int, user_id: int) -> dict | None:
        with self._connect() as conn:
            return self._fetchone(
                conn,
                """SELECT j.* FROM jobs j
                   JOIN companies c ON j.company_id = c.id
                   WHERE j.id = %s AND c.user_id = %s""",
                (job_id, user_id),
            )

    def get_jobs_by_company(self, company_id: int) -> list[dict]:
        with self._connect() as conn:
            return self._fetchall(
                conn,
                "SELECT * FROM jobs WHERE company_id = %s ORDER BY created_at DESC",
                (company_id,),
            )

    def insert_job(self, data: dict) -> int:
        with self._connect() as conn:
            return self._insert(
                conn,
                """INSERT INTO jobs
                   (company_id, title, description, requirements, location,
                    job_type, salary_range, form_schema, slug, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                (
                    data["company_id"], data["title"], data["description"],
                    data.get("requirements"), data.get("location"),
                    data.get("job_type"), data.get("salary_range"),
                    data.get("form_schema", '{"fields":[]}'),
                    data["slug"], data.get("status", "active"),
                ),
            )

    def update_job(self, job_id: int, data: dict) -> None:
        fields = ", ".join(f"{k} = %s" for k in data)
        values = list(data.values()) + [job_id]
        with self._connect() as conn:
            self._execute(conn, f"UPDATE jobs SET {fields} WHERE id = %s", values)

    # ----------------------------------------------------------- applications
    def get_application(self, application_id: int) -> dict | None:
        with self._connect() as conn:
            return self._fetchone(conn, "SELECT * FROM applications WHERE id = %s", (application_id,))

    def insert_application(self, data: dict) -> int:
        with self._connect() as conn:
            return self._insert(
                conn,
                """INSERT INTO applications
                   (job_id, candidate_name, candidate_email, candidate_phone,
                    cover_note, form_responses, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (
                    data["job_id"], data["candidate_name"], data["candidate_email"],
                    data.get("candidate_phone"), data.get("cover_note"),
                    data.get("form_responses", "{}"),
                    data.get("status", "pending_verification"),
                ),
            )

    def update_application(self, application_id: int, data: dict) -> None:
        fields = ", ".join(f"{k} = %s" for k in data)
        values = list(data.values()) + [application_id]
        with self._connect() as conn:
            self._execute(conn, f"UPDATE applications SET {fields} WHERE id = %s", values)

    def update_application_score(self, application_id: int, data: dict) -> None:
        self.update_application(application_id, data)

    def get_ranked_candidates(self, job_id: int) -> list[dict]:
        with self._connect() as conn:
            return self._fetchall(
                conn,
                """SELECT id, candidate_name, candidate_email, candidate_phone,
                          ai_score, score_breakdown, score_summary, status,
                          form_responses, cv_path, applied_at
                   FROM applications
                   WHERE job_id = %s AND status NOT IN ('pending_verification')
                   ORDER BY ai_score DESC NULLS LAST""",
                (job_id,),
            )

    # ----------------------------------------------------- candidate_sessions
    def insert_candidate_session(self, data: dict) -> int:
        with self._connect() as conn:
            return self._insert(
                conn,
                """INSERT INTO candidate_sessions
                   (application_id, email, secure_token)
                   VALUES (%s, %s, %s)""",
                (data["application_id"], data["email"], data["secure_token"]),
            )

    def get_candidate_session_by_token(self, token: str) -> dict | None:
        with self._connect() as conn:
            return self._fetchone(
                conn,
                "SELECT * FROM candidate_sessions WHERE secure_token = %s",
                (token,),
            )

    def update_candidate_session(self, session_id: int, data: dict) -> None:
        fields = ", ".join(f"{k} = %s" for k in data)
        values = list(data.values()) + [session_id]
        with self._connect() as conn:
            self._execute(
                conn,
                f"UPDATE candidate_sessions SET {fields} WHERE id = %s",
                values,
            )
