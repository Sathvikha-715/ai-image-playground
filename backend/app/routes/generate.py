from fastapi import APIRouter, HTTPException

from app.models.schemas import GenerateRequest, GenerateResponse
from app.services.diffusion import generate_image

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    try:
        return generate_image(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            steps=req.steps,
            guidance_scale=req.guidance_scale,
            seed=req.seed,
            width=req.width,
            height=req.height,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))