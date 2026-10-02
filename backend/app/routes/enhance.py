from fastapi import APIRouter, HTTPException

from app.models.schemas import EnhanceRequest, EnhanceResponse
from app.services.llm import enhance_prompt

router = APIRouter()


@router.post("/enhance", response_model=EnhanceResponse)
def enhance(req: EnhanceRequest):
    try:
        enhanced = enhance_prompt(req.prompt)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM error: {e}")
    return {"original": req.prompt, "enhanced": enhanced}