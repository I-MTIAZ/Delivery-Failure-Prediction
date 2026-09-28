# Delivery Failure Prediction API

FastAPI backend for the final XGBoost model used by the Delivery Failure Prediction project.

## What it does

1. Validates the 10 user inputs.
2. Applies the saved `preprocessor.pkl`.
3. Runs the saved XGBoost model.
4. Converts the predicted probability into a binary decision using the saved operating threshold.
5. Returns JSON for the Next.js frontend.

## Model files

```text
models/
├── preprocessor.pkl
└── final_xgboost_model.pkl
```

The model bundle contains the trained XGBoost model and its saved threshold.

## Run locally

Use Python with the same model-training versions:

```bash
python -m venv .venv
```

Windows:

```bash
.venv\\Scripts\\activate
```

macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the API:

```bash
uvicorn main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

## Endpoints

### Health

`GET /health`

### Prediction

`POST /predict`

Example request:

```json
{
  "delivery_partner": "delhivery",
  "package_type": "electronics",
  "vehicle_type": "bike",
  "delivery_mode": "express",
  "region": "west",
  "weather_condition": "rainy",
  "distance_km": 150,
  "package_weight_kg": 10,
  "expected_time_hours": 8,
  "delivery_cost": 800
}
```

## Frontend connection

The Next.js frontend should send the form data to:

```text
POST http://127.0.0.1:8000/predict
```

For deployment, set `FRONTEND_URL` to the deployed frontend origin so CORS only allows the intended frontend.

## Deployment

A Render web service can use:

**Build command**

```text
pip install -r requirements.txt
```

**Start command**

```text
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Do not commit secrets or environment files.
