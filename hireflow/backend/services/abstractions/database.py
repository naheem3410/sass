from abc import ABC, abstractmethod


class DatabaseProvider(ABC):
    @abstractmethod
    def get_user_by_email(self, email: str) -> dict | None: pass

    @abstractmethod
    def insert_user(self, data: dict) -> int: pass

    @abstractmethod
    def get_company_by_user(self, user_id: int) -> dict | None: pass

    @abstractmethod
    def insert_company(self, data: dict) -> int: pass

    @abstractmethod
    def update_company(self, company_id: int, data: dict) -> None: pass

    @abstractmethod
    def get_job_by_slug(self, slug: str) -> dict | None: pass

    @abstractmethod
    def get_job_by_id(self, job_id: int) -> dict | None: pass

    @abstractmethod
    def get_job_owned_by_user(self, job_id: int, user_id: int) -> dict | None: pass

    @abstractmethod
    def get_jobs_by_company(self, company_id: int) -> list[dict]: pass

    @abstractmethod
    def insert_job(self, data: dict) -> int: pass

    @abstractmethod
    def update_job(self, job_id: int, data: dict) -> None: pass

    @abstractmethod
    def get_application(self, application_id: int) -> dict | None: pass

    @abstractmethod
    def insert_application(self, data: dict) -> int: pass

    @abstractmethod
    def update_application(self, application_id: int, data: dict) -> None: pass

    @abstractmethod
    def update_application_score(self, application_id: int, data: dict) -> None: pass

    @abstractmethod
    def get_ranked_candidates(self, job_id: int) -> list[dict]: pass

    @abstractmethod
    def insert_candidate_session(self, data: dict) -> int: pass

    @abstractmethod
    def get_candidate_session_by_token(self, token: str) -> dict | None: pass

    @abstractmethod
    def update_candidate_session(self, session_id: int, data: dict) -> None: pass
