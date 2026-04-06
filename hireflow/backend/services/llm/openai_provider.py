from pydantic import BaseModel
from openai import OpenAI
from services.abstractions.llm import LLMProvider


class OpenAIProvider(LLMProvider):
    def __init__(self, model: str = "gpt-5-nano"):
        self.client = OpenAI()
        self.model = model

    def complete(self, prompt: str, response_model: type[BaseModel]) -> BaseModel:
        completion = self.client.beta.chat.completions.parse(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format=response_model,
        )
        return completion.choices[0].message.parsed
