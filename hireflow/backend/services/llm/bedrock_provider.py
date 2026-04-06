import json
import boto3
from pydantic import BaseModel
from services.abstractions.llm import LLMProvider


class BedrockProvider(LLMProvider):
    def __init__(self, model_id: str):
        self.client = boto3.client("bedrock-runtime")
        self.model_id = model_id

    def complete(self, prompt: str, response_model: type[BaseModel]) -> BaseModel:
        body = json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 1000,
            }
        )
        response = self.client.invoke_model(modelId=self.model_id, body=body)
        raw = json.loads(response["body"].read())
        return response_model.model_validate_json(raw["content"][0]["text"])
