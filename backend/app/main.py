from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import data, forecast, risk, schedule, explain
from app.chargewise.routes import api as chargewise_api
from app.utils.config import config

app = FastAPI(title="ChargeWise AI + Grid Optimizer", debug=config.DEBUG)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ChargeWise AI routes
app.include_router(chargewise_api.router)

# Legacy Grid Optimizer routes
app.include_router(data.router)
app.include_router(forecast.router)
app.include_router(risk.router)
app.include_router(schedule.router)
app.include_router(explain.router)

@app.get("/")
def root():
    return {"status": "ok", "message": "ChargeWise AI + Grid Optimizer API"}
