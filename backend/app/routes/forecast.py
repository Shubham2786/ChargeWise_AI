from fastapi import APIRouter
from app.services.forecaster import get_forecast

router = APIRouter()

@router.get("/forecast")
def forecast_endpoint():
    result = get_forecast()
    return result
