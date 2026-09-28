import os
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "models")

PREPROCESSOR_PATH = os.path.join(MODEL_DIR, "preprocessor.pkl")
MODEL_PATH = os.path.join(MODEL_DIR, "final_xgboost_model.pkl")

preprocessor = joblib.load(PREPROCESSOR_PATH)
model_bundle = joblib.load(MODEL_PATH)
model = model_bundle["model"]
threshold = float(model_bundle["threshold"])

app = FastAPI(
    title="Delivery Failure Prediction API",
    description="FastAPI inference service for the final XGBoost delivery-failure model.",
    version="1.0.0",
)

origins = ["http://localhost:3000"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class DeliveryInput(BaseModel):
    delivery_partner: Literal[
        "amazon logistics", "blue dart", "delhivery", "dhl",
        "ecom express", "ekart", "fedex", "shadowfax", "xpressbees"
    ]
    package_type: Literal[
        "automobile parts", "clothing", "cosmetics", "documents",
        "electronics", "fragile items", "furniture", "groceries", "pharmacy"
    ]
    vehicle_type: Literal[
        "bike", "ev bike", "ev van", "scooter", "truck", "van"
    ]
    delivery_mode: Literal[
        "express", "same day", "standard", "two day"
    ]
    region: Literal[
        "central", "east", "north", "south", "west"
    ]
    weather_condition: Literal[
        "clear", "cold", "foggy", "hot", "rainy", "stormy"
    ]
    distance_km: float = Field(ge=3.6, le=297.1)
    package_weight_kg: float = Field(ge=0.67, le=49.52)
    expected_time_hours: Literal[2, 3, 4, 5, 6, 7, 8, 16, 24]
    delivery_cost: float = Field(ge=95.6674, le=1632.7206)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": type(model).__name__,
        "threshold": threshold,
    }


@app.post("/predict")
def predict(data: DeliveryInput):
    input_df = pd.DataFrame([data.model_dump()])

    processed = preprocessor.transform(input_df)
    probability = float(model.predict_proba(processed)[0, 1])
    prediction = int(probability >= threshold)

    return {
        "prediction": prediction,
        "label": "Failed" if prediction == 1 else "Completed",
        "failure_probability": probability,
        "failure_probability_percent": round(probability * 100, 2),
        "threshold": threshold,
        "threshold_percent": round(threshold * 100, 2),
    }
