from typing import Optional
from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=500)
    negative_prompt: str = "blurry, distorted, low quality"
    steps: int = Field(30, ge=10, le=50)
    guidance_scale: float = Field(7.5, ge=1, le=20)
    seed: Optional[int] = None
    width: int = 512
    height: int = 512


class GenerateResponse(BaseModel):
    image_base64: str
    seed: int
    steps: int
    guidance_scale: float
    generation_time_s: float
    image_path: str