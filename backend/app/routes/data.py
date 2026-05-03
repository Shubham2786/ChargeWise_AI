from fastapi import APIRouter
from app.services.data_generator import generate_data

router = APIRouter()

@router.get("/generate-data")
def generate_data_endpoint():
    path = generate_data()
    return {"message": "Data generated", "path": path}
