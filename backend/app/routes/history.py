import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.services import database as db

router = APIRouter()


@router.get("/history")
def history(limit: int = 50):
    return db.list_generations(limit)


@router.get("/history/{gen_id}/image")
def history_image(gen_id: int):
    row = db.get_generation(gen_id)
    if not row or not row["image_path"] or not os.path.exists(row["image_path"]):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(row["image_path"], media_type="image/png")


@router.delete("/history/{gen_id}")
def delete_history(gen_id: int):
    row = db.get_generation(gen_id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    if row["image_path"] and os.path.exists(row["image_path"]):
        os.remove(row["image_path"])
    db.delete_generation(gen_id)
    return {"deleted": gen_id}