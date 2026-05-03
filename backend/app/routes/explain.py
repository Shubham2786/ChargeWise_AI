from fastapi import APIRouter
from app.services.explainer import explain_forecast

router = APIRouter()

@router.get("/explain")
def explain_endpoint():
    result = explain_forecast()
    return result
