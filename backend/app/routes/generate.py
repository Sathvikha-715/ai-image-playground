from fastapi import APIRouter, HTTPException

from app.models.schemas import GenerateRequest, GenerateResponse
from app.services.diffusion import generate_image
from app.services import database as db

router = APIRouter()


@router.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    try:
        result = generate_image(
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

    result["id"] = db.save_generation(
        prompt=req.prompt,
        negative_prompt=req.negative_prompt,
        steps=result["steps"],
        guidance_scale=result["guidance_scale"],
        seed=result["seed"],
        width=req.width,
        height=req.height,
        generation_time_s=result["generation_time_s"],
        image_path=result["image_path"],
    )
    return result