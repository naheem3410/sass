from abc import ABC, abstractmethod
from pydantic import BaseModel


class LLMProvider(ABC):
    @abstractmethod
    def complete(self, prompt: str, response_model: type[BaseModel]) -> BaseModel:
        pass
