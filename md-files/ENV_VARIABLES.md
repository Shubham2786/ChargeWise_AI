# Environment Variables Documentation

This document describes all environment variables used in the Grid Optimizer application.

## Backend Environment Variables

Location: `backend/.env`

### Server Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `HOST` | string | `0.0.0.0` | Server host address |
| `PORT` | integer | `8000` | Server port number |
| `DEBUG` | boolean | `True` | Enable debug mode |

### CORS Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CORS_ORIGINS` | string (comma-separated) | `http://localhost:5173,http://localhost:3000` | Allowed CORS origins |

### Data Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MAX_CAPACITY` | integer | `100` | Maximum grid capacity in kW |
| `ZONES` | string (comma-separated) | `Zone_A,Zone_B,Zone_C` | Grid zones to simulate |
| `DATA_DAYS` | integer | `30` | Number of days of historical data to generate |

### Model Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MODEL_N_ESTIMATORS` | integer | `50` | Number of XGBoost trees |
| `MODEL_MAX_DEPTH` | integer | `4` | Maximum tree depth |
| `MODEL_RANDOM_STATE` | integer | `42` | Random seed for reproducibility |
| `LAG_FEATURES` | integer | `3` | Number of lag features (1h, 2h, 3h, etc.) |

### Risk Thresholds

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RISK_HIGH_THRESHOLD` | integer | `80` | High risk threshold (% of max capacity) |
| `RISK_MEDIUM_THRESHOLD` | integer | `60` | Medium risk threshold (% of max capacity) |

Risk levels:
- **HIGH**: > 80% capacity
- **MEDIUM**: 60-80% capacity
- **LOW**: < 60% capacity

### Scheduling Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LOAD_SHIFT_PERCENT` | integer | `25` | Percentage of load to shift (0-100) |
| `EV_SPIKE_START_HOUR` | integer | `18` | EV charging spike start hour (24h format) |
| `EV_SPIKE_END_HOUR` | integer | `22` | EV charging spike end hour (24h format) |

### SHAP Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `SHAP_TOP_FEATURES` | integer | `3` | Number of top features to explain |

### Database Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DATABASE_URL` | string | `sqlite:///./grid_optimizer.db` | Database connection URL (for future use) |

## Frontend Environment Variables

Location: `frontend/.env`

### API Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `VITE_API_URL` | string | `http://localhost:8000` | Backend API base URL |

**Note**: All Vite environment variables must be prefixed with `VITE_` to be exposed to the client.

## Configuration Examples

### Development Setup

**Backend** (`backend/.env`):
```env
HOST=0.0.0.0
PORT=8000
DEBUG=True
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

### Production Setup

**Backend** (`backend/.env`):
```env
HOST=0.0.0.0
PORT=8000
DEBUG=False
CORS_ORIGINS=https://yourdomain.com
MAX_CAPACITY=150
MODEL_N_ESTIMATORS=100
MODEL_MAX_DEPTH=6
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=https://api.yourdomain.com
```

### Custom Risk Thresholds

For more conservative risk detection:
```env
RISK_HIGH_THRESHOLD=70
RISK_MEDIUM_THRESHOLD=50
```

### Aggressive Load Shifting

To shift more load during optimization:
```env
LOAD_SHIFT_PERCENT=40
```

### Extended Lag Features

For more historical context in predictions:
```env
LAG_FEATURES=5
MODEL_N_ESTIMATORS=100
MODEL_MAX_DEPTH=6
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. Use `.env.example` as a template
3. Keep production secrets separate from development
4. Rotate sensitive values regularly
5. Use environment-specific configurations

## Validation

The application validates environment variables on startup. Invalid values will cause the application to fail with descriptive error messages.

## Troubleshooting

### Backend won't start
- Check that all required variables are set
- Verify PORT is not in use
- Ensure boolean values are `True` or `False` (case-sensitive)

### Frontend can't connect to backend
- Verify `VITE_API_URL` matches backend URL
- Check CORS_ORIGINS includes frontend URL
- Ensure both servers are running

### Model performance issues
- Increase `MODEL_N_ESTIMATORS` (50 → 100)
- Increase `MODEL_MAX_DEPTH` (4 → 6)
- Add more `LAG_FEATURES` (3 → 5)

### Risk detection too sensitive
- Increase `RISK_HIGH_THRESHOLD` (80 → 85)
- Increase `RISK_MEDIUM_THRESHOLD` (60 → 70)

## Loading Order

1. Application reads `.env` file
2. Environment variables override `.env` values
3. Default values used if neither exists

Priority: **System Environment > .env File > Defaults**
