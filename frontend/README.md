# Delivery Failure Predictor — Frontend

Next.js + Tailwind CSS single-page frontend for the Delivery Failure Prediction ML project.

## Connected to the ML API

The form now sends validated inputs to the FastAPI backend:

```text
Next.js form
    ↓
POST /predict
    ↓
FastAPI
    ↓
preprocessor.pkl
    ↓
final_xgboost_model.pkl
    ↓
probability + threshold + prediction
```

The frontend reads the API URL from `NEXT_PUBLIC_API_URL`. If it is not set, it defaults to `http://localhost:8000`.

For local development, create `.env.local` if desired:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Run locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

The FastAPI backend must be running separately on port 8000.

## Model-aligned inputs

Categorical inputs:

- Delivery partner
- Package type
- Vehicle type
- Delivery mode
- Region
- Weather condition

Numeric inputs:

- Distance (3.6–297.1 km)
- Package weight (0.67–49.52 kg)
- Expected delivery time (2, 3, 4, 5, 6, 7, 8, 16, or 24 hours)
- Delivery cost (95.6674–1632.7206)

The UI uses dropdowns for categorical variables and validates numeric values before calling the API.
