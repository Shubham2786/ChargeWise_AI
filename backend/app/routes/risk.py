from fastapi import APIRouter
from app.services.risk_detector import detect_risk

router = APIRouter()

@router.get("/risk")
def risk_endpoint():
    result = detect_risk()
    return result
