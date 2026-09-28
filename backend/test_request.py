import requests

payload = {
    "delivery_partner": "delhivery",
    "package_type": "electronics",
    "vehicle_type": "bike",
    "delivery_mode": "express",
    "region": "west",
    "weather_condition": "rainy",
    "distance_km": 150,
    "package_weight_kg": 10,
    "expected_time_hours": 8,
    "delivery_cost": 800,
}

response = requests.post("http://127.0.0.1:8000/predict", json=payload, timeout=30)
response.raise_for_status()
print(response.json())
