-- HireFlow SQLite schema
-- Run automatically on startup via SQLiteProvider._init_db()
-- This file is kept as a reference and for manual inspection.

PRAGMA foreign_keys = ON;

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
    form_schema  TEXT NOT NULL DEFAULT '{"fields":[]}',
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
