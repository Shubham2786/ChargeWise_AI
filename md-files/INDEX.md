# 📚 Grid Optimizer - Documentation Index

Welcome to the Grid Optimizer MVP! This index will guide you to the right documentation.

## 🚀 Getting Started

**New to the project? Start here:**

1. **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Complete setup guide with verification
2. **[QUICKSTART.md](QUICKSTART.md)** - Fastest way to get running
3. **[README.md](README.md)** - Main project documentation

## 📖 Documentation

### Core Documentation

| Document | Description | When to Read |
|----------|-------------|--------------|
| **[README.md](README.md)** | Main documentation with setup, features, and usage | First time setup |
| **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** | Detailed installation and verification guide | Installation issues |
| **[QUICKSTART.md](QUICKSTART.md)** | Quick start for experienced developers | Fast setup |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | Architecture, design decisions, and data flow | Understanding the system |

### Technical Documentation

| Document | Description | When to Read |
|----------|-------------|--------------|
| **[ENV_VARIABLES.md](ENV_VARIABLES.md)** | Complete environment variables reference | Configuration |
| **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** | API endpoints testing guide with examples | Testing APIs |
| **[ChargeWise_AI_Engineering_Spec.md](ChargeWise_AI_Engineering_Spec.md)** | Original specification document | Requirements |

## 🛠️ Quick Actions

### Installation & Setup

```bash
# Verify installation
verify-installation.bat

# Start backend
start-backend.bat

# Start frontend (new terminal)
start-frontend.bat
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📂 Project Structure

```
AI4bharat/
├── 📂 backend/              # Python FastAPI backend
│   ├── 📂 app/
│   │   ├── main.py         # FastAPI app
│   │   ├── 📂 routes/      # API endpoints
│   │   ├── 📂 services/    # Business logic
│   │   ├── 📂 utils/       # Configuration
│   │   └── 📂 data/        # Data storage
│   ├── .env                # Backend config
│   └── requirements.txt    # Python deps
│
├── 📂 frontend/             # React frontend
│   ├── 📂 src/
│   │   ├── 📂 pages/       # Page components
│   │   ├── 📂 services/    # API client
│   │   └── App.jsx         # Root component
│   ├── .env                # Frontend config
│   └── package.json        # Node deps
│
└── 📄 Documentation files
```

## 🎯 Common Tasks

### First Time Setup

1. Read: [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
2. Run: `verify-installation.bat`
3. Run: `start-backend.bat`
4. Run: `start-frontend.bat` (new terminal)
5. Open: http://localhost:5173

### Configuration

1. Read: [ENV_VARIABLES.md](ENV_VARIABLES.md)
2. Edit: `backend/.env` for backend config
3. Edit: `frontend/.env` for frontend config
4. Restart servers

### Testing APIs

1. Read: [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)
2. Use: http://localhost:8000/docs (Swagger UI)
3. Test: `curl http://localhost:8000/forecast`

### Understanding Architecture

1. Read: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
2. Review: Data flow diagrams
3. Explore: Code structure

## 🔍 Find What You Need

### "How do I install?"
→ [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

### "How do I configure?"
→ [ENV_VARIABLES.md](ENV_VARIABLES.md)

### "How do I test APIs?"
→ [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)

### "How does it work?"
→ [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

### "What are the requirements?"
→ [ChargeWise_AI_Engineering_Spec.md](ChargeWise_AI_Engineering_Spec.md)

### "Quick start?"
→ [QUICKSTART.md](QUICKSTART.md)

### "Complete guide?"
→ [README.md](README.md)

## 🎓 Learning Path

### Beginner
1. [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) - Setup
2. [QUICKSTART.md](QUICKSTART.md) - Run the app
3. [README.md](README.md) - Understand features

### Intermediate
1. [ENV_VARIABLES.md](ENV_VARIABLES.md) - Configuration
2. [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) - Test APIs
3. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Architecture

### Advanced
1. [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Deep dive
2. [ChargeWise_AI_Engineering_Spec.md](ChargeWise_AI_Engineering_Spec.md) - Requirements
3. Source code exploration

## 🐛 Troubleshooting

### Installation Issues
→ [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) - Troubleshooting section

### Configuration Issues
→ [ENV_VARIABLES.md](ENV_VARIABLES.md) - Validation section

### API Issues
→ [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md) - Error handling section

### General Issues
→ [README.md](README.md) - Troubleshooting section

## 📊 Features Overview

### Backend Features
- ✅ Data generation (synthetic grid data)
- ✅ Load forecasting (XGBoost)
- ✅ Risk detection (threshold-based)
- ✅ Schedule optimization (load shifting)
- ✅ AI explainability (SHAP)

### Frontend Features
- ✅ Dashboard (forecast + risk)
- ✅ Recommendation (optimization)
- ✅ Planning (infrastructure)
- ✅ Interactive charts (Recharts)
- ✅ Responsive design (Tailwind)

## 🔗 External Resources

### Technologies Used
- **FastAPI**: https://fastapi.tiangolo.com/
- **XGBoost**: https://xgboost.readthedocs.io/
- **SHAP**: https://shap.readthedocs.io/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **Recharts**: https://recharts.org/

## 📝 Quick Reference

### Environment Files
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration
- `backend/.env.example` - Backend template
- `frontend/.env.example` - Frontend template

### Scripts
- `verify-installation.bat` - Check installation
- `start-backend.bat` - Start backend
- `start-frontend.bat` - Start frontend

### URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### API Endpoints
- `GET /` - Health check
- `GET /generate-data` - Generate data
- `GET /forecast` - Get forecast
- `GET /risk` - Detect risk
- `GET /schedule` - Optimize schedule
- `GET /explain` - Get explanation

## ✅ Checklist

### Installation
- [ ] Python 3.11+ installed
- [ ] Node.js 16+ installed
- [ ] Run `verify-installation.bat`
- [ ] Backend starts successfully
- [ ] Frontend starts successfully

### Configuration
- [ ] Review `backend/.env`
- [ ] Review `frontend/.env`
- [ ] Understand key variables
- [ ] Customize if needed

### Testing
- [ ] Access frontend (http://localhost:5173)
- [ ] Access backend (http://localhost:8000)
- [ ] Test all API endpoints
- [ ] Verify all pages work

### Understanding
- [ ] Read PROJECT_SUMMARY.md
- [ ] Understand data flow
- [ ] Review architecture
- [ ] Explore code structure

## 🎉 Success Criteria

You're ready to use Grid Optimizer when:
- ✅ Both servers running without errors
- ✅ Frontend loads in browser
- ✅ Dashboard shows charts
- ✅ All pages navigate correctly
- ✅ API endpoints respond correctly
- ✅ You understand the basic workflow

## 📞 Support

If you need help:
1. Check relevant documentation above
2. Review troubleshooting sections
3. Check error messages in terminal
4. Review browser console
5. Test API endpoints individually

## 🚀 Next Steps

After successful setup:
1. Explore the application
2. Test different configurations
3. Review the code
4. Customize for your needs
5. Build new features

---

**Happy coding! 🎉**

For the most comprehensive guide, start with [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
