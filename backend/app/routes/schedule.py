from fastapi import APIRouter
from app.services.scheduler import optimize_schedule

router = APIRouter()

@router.get("/schedule")
def schedule_endpoint():
    result = optimize_schedule()
    return result
