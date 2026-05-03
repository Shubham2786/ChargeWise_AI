# API Testing Guide

Complete guide for testing all Grid Optimizer API endpoints.

## Prerequisites

- Backend running on http://localhost:8000
- Tools: curl, Postman, or browser

## Base URL

```
http://localhost:8000
```

## Endpoints

### 1. Health Check

**Endpoint**: `GET /`

**Description**: Verify API is running

**Request**:
```bash
curl http://localhost:8000/
```

**Expected Response**:
```json
{
  "status": "ok",
  "message": "Grid Optimizer API"
}
```

**Status Code**: 200

---

### 2. Generate Data

**Endpoint**: `GET /generate-data`

**Description**: Generate synthetic grid data for 3 zones over 30 days

**Request**:
```bash
curl http://localhost:8000/generate-data
```

**Expected Response**:
```json
{
  "message": "Data generated",
  "path": "backend/app/data/grid_data.csv"
}
```

**Status Code**: 200

**Notes**:
- Creates CSV file with 2,160 records (30 days × 24 hours × 3 zones)
- Overwrites existing data
- Must be called before other endpoints

---

### 3. Get Forecast

**Endpoint**: `GET /forecast`

**Description**: Get 24-hour load forecast using XGBoost

**Request**:
```bash
curl http://localhost:8000/forecast
```

**Expected Response**:
```json
{
  "predictions": [
    65.23, 68.45, 71.12, 73.89, 76.34, 78.56,
    80.12, 81.45, 82.34, 83.12, 84.56, 85.78,
    86.45, 87.12, 88.34, 89.56, 90.12, 91.45,
    92.34, 91.12, 89.56, 87.34, 85.12, 82.45
  ],
  "peak_hour": 18
}
```

**Status Code**: 200

**Response Fields**:
- `predictions`: Array of 24 load values (kW)
- `peak_hour`: Hour with maximum load (0-23)

**Notes**:
- First call trains the model (~1-2 seconds)
- Subsequent calls use cached model (~50ms)
- Predicts for Zone_A only

---

### 4. Detect Risk

**Endpoint**: `GET /risk`

**Description**: Detect risk level based on capacity thresholds

**Request**:
```bash
curl http://localhost:8000/risk
```

**Expected Response**:
```json
{
  "risk_level": "HIGH",
  "max_load": 92.34,
  "capacity_percent": 92.34
}
```

**Status Code**: 200

**Response Fields**:
- `risk_level`: "LOW" | "MEDIUM" | "HIGH"
- `max_load`: Maximum predicted load (kW)
- `capacity_percent`: Percentage of max capacity

**Risk Levels**:
- **HIGH**: > 80% capacity
- **MEDIUM**: 60-80% capacity
- **LOW**: < 60% capacity

**Notes**:
- Internally calls `/forecast` endpoint
- Thresholds configurable in .env

---

### 5. Optimize Schedule

**Endpoint**: `GET /schedule`

**Description**: Optimize load schedule by shifting EV charging

**Request**:
```bash
curl http://localhost:8000/schedule
```

**Expected Response**:
```json
{
  "before": [
    65.23, 68.45, 71.12, 73.89, 76.34, 78.56,
    80.12, 81.45, 82.34, 83.12, 84.56, 85.78,
    86.45, 87.12, 88.34, 89.56, 90.12, 91.45,
    92.34, 91.12, 89.56, 87.34, 85.12, 82.45
  ],
  "after": [
    65.23, 68.45, 71.12, 73.89, 76.34, 78.56,
    80.12, 81.45, 82.34, 83.12, 84.56, 85.78,
    86.45, 87.12, 88.34, 89.56, 67.59, 68.59,
    69.18, 91.12, 89.56, 87.34, 90.75, 82.45
  ],
  "improvement_percent": 12.5
}
```

**Status Code**: 200

**Response Fields**:
- `before`: Original 24-hour load profile
- `after`: Optimized 24-hour load profile
- `improvement_percent`: Peak reduction percentage

**Optimization Strategy**:
- If risk is HIGH: shift 25% of load from hours 18-22 to post-22
- If risk is MEDIUM or LOW: no changes

**Notes**:
- Internally calls `/forecast` and `/risk`
- Shift percentage configurable in .env

---

### 6. Get Explanation

**Endpoint**: `GET /explain`

**Description**: Get SHAP-based explanation of forecast

**Request**:
```bash
curl http://localhost:8000/explain
```

**Expected Response**:
```json
{
  "summary": "Top factors: lag_1, lag_2, hour"
}
```

**Status Code**: 200

**Response Fields**:
- `summary`: Human-readable explanation of top contributing features

**Features Explained**:
- `lag_1`: Load 1 hour ago
- `lag_2`: Load 2 hours ago
- `lag_3`: Load 3 hours ago
- `hour`: Hour of day (0-23)

**Notes**:
- Uses SHAP TreeExplainer
- Shows top 3 features by default
- Configurable in .env

---

## Testing Workflow

### Complete Test Sequence

```bash
# 1. Health check
curl http://localhost:8000/

# 2. Generate data
curl http://localhost:8000/generate-data

# 3. Get forecast
curl http://localhost:8000/forecast

# 4. Check risk
curl http://localhost:8000/risk

# 5. Optimize schedule
curl http://localhost:8000/schedule

# 6. Get explanation
curl http://localhost:8000/explain
```

### Expected Execution Time

| Endpoint | First Call | Subsequent Calls |
|----------|-----------|------------------|
| `/` | ~5ms | ~5ms |
| `/generate-data` | ~500ms | ~500ms |
| `/forecast` | ~1-2s (training) | ~50ms |
| `/risk` | ~1-2s (first) | ~50ms |
| `/schedule` | ~1-2s (first) | ~60ms |
| `/explain` | ~1-2s (first) | ~150ms |

---

## Testing with Python

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Health check
response = requests.get(f"{BASE_URL}/")
print("Health:", response.json())

# Generate data
response = requests.get(f"{BASE_URL}/generate-data")
print("Data:", response.json())

# Get forecast
response = requests.get(f"{BASE_URL}/forecast")
forecast = response.json()
print(f"Peak Hour: {forecast['peak_hour']}")
print(f"Max Load: {max(forecast['predictions']):.2f} kW")

# Check risk
response = requests.get(f"{BASE_URL}/risk")
risk = response.json()
print(f"Risk Level: {risk['risk_level']}")
print(f"Capacity: {risk['capacity_percent']:.2f}%")

# Optimize schedule
response = requests.get(f"{BASE_URL}/schedule")
schedule = response.json()
print(f"Improvement: {schedule['improvement_percent']:.2f}%")

# Get explanation
response = requests.get(f"{BASE_URL}/explain")
explain = response.json()
print(f"Explanation: {explain['summary']}")
```

---

## Testing with Postman

### Import Collection

Create a new collection with these requests:

1. **Health Check**
   - Method: GET
   - URL: `{{base_url}}/`

2. **Generate Data**
   - Method: GET
   - URL: `{{base_url}}/generate-data`

3. **Forecast**
   - Method: GET
   - URL: `{{base_url}}/forecast`

4. **Risk**
   - Method: GET
   - URL: `{{base_url}}/risk`

5. **Schedule**
   - Method: GET
   - URL: `{{base_url}}/schedule`

6. **Explain**
   - Method: GET
   - URL: `{{base_url}}/explain`

**Environment Variable**:
- `base_url`: `http://localhost:8000`

---

## Error Handling

### Common Errors

**1. Connection Refused**
```json
{
  "error": "Connection refused"
}
```
**Solution**: Ensure backend is running

**2. Model Not Trained**
```json
{
  "summary": "Model not trained"
}
```
**Solution**: Call `/generate-data` first

**3. File Not Found**
```
FileNotFoundError: grid_data.csv
```
**Solution**: Call `/generate-data` to create data file

**4. CORS Error** (from browser)
```
Access to fetch at 'http://localhost:8000' has been blocked by CORS policy
```
**Solution**: Check CORS_ORIGINS in backend/.env

---

## Interactive API Documentation

FastAPI provides automatic interactive documentation:

### Swagger UI
**URL**: http://localhost:8000/docs

Features:
- Try out endpoints directly
- See request/response schemas
- View parameter descriptions
- Test with different inputs

### ReDoc
**URL**: http://localhost:8000/redoc

Features:
- Clean, readable documentation
- Detailed schema information
- Code examples
- Search functionality

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test forecast endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 http://localhost:8000/forecast

# Test risk endpoint
ab -n 100 -c 10 http://localhost:8000/risk
```

### Expected Results
- Requests per second: ~100-200
- Mean response time: ~50-100ms
- No failed requests

---

## Validation Tests

### Test Data Generation
```bash
# Should create CSV with 2,160 rows
curl http://localhost:8000/generate-data

# Verify file exists
dir backend\app\data\grid_data.csv
```

### Test Forecast Accuracy
```python
import requests

response = requests.get("http://localhost:8000/forecast")
forecast = response.json()

# Validate response structure
assert "predictions" in forecast
assert "peak_hour" in forecast
assert len(forecast["predictions"]) == 24
assert 0 <= forecast["peak_hour"] <= 23
```

### Test Risk Classification
```python
response = requests.get("http://localhost:8000/risk")
risk = response.json()

# Validate risk level
assert risk["risk_level"] in ["LOW", "MEDIUM", "HIGH"]
assert 0 <= risk["capacity_percent"] <= 200
```

---

## Troubleshooting

### Backend Not Responding
```bash
# Check if backend is running
curl http://localhost:8000/

# Check backend logs
# Look for errors in terminal where backend is running
```

### Slow Response Times
- First call trains model (1-2 seconds)
- Subsequent calls should be fast (<100ms)
- If consistently slow, check system resources

### Incorrect Results
- Ensure data is generated: `curl http://localhost:8000/generate-data`
- Check .env configuration
- Review backend logs for errors

---

## Summary

All endpoints are working correctly if:
- ✅ Health check returns 200
- ✅ Data generation creates CSV file
- ✅ Forecast returns 24 predictions
- ✅ Risk returns valid level
- ✅ Schedule shows improvement
- ✅ Explain returns feature summary

For issues, check:
1. Backend is running
2. Data is generated
3. .env configuration is correct
4. No errors in backend logs
