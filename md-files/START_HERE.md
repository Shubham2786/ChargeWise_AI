# 🚀 START HERE - Grid Optimizer MVP

## Welcome! 👋

You have a **complete, production-ready Grid Optimizer MVP** with ML-powered forecasting, risk detection, and optimization.

---

## ⚡ Quick Start (3 Steps)

### Step 1: Verify Installation
Double-click: **`verify-installation.bat`**

This checks if Python and Node.js are installed.

### Step 2: Start Backend
Double-click: **`start-backend.bat`**

Wait for: `Application startup complete`

### Step 3: Start Frontend (New Window)
Double-click: **`start-frontend.bat`**

Wait for: `Local: http://localhost:5173`

### Step 4: Open Browser
Navigate to: **http://localhost:5173**

---

## 📚 What to Read Next

### First Time Users
1. **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Complete setup guide
2. **[QUICKSTART.md](QUICKSTART.md)** - Quick reference

### Understanding the System
1. **[README.md](README.md)** - Main documentation
2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Architecture overview

### Configuration & Testing
1. **[ENV_VARIABLES.md](ENV_VARIABLES.md)** - Configuration options
2. **[API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)** - API testing

### Complete Index
**[INDEX.md](INDEX.md)** - Find any documentation

---

## 🎯 What You Can Do

### Dashboard (Main Page)
- View 24-hour load forecast
- See peak hour prediction
- Check risk level (🟢 LOW, 🟡 MEDIUM, 🔴 HIGH)
- Read AI explanation

### Recommendation Page
- Compare before/after optimization
- See peak reduction percentage
- Understand load shifting strategy

### Planning Page
- View infrastructure health scores
- See location assessments
- Review upgrade recommendations

---

## 🔧 Troubleshooting

### Backend Won't Start
- Ensure Python 3.11+ is installed
- Check if port 8000 is available
- Run: `python --version`

### Frontend Won't Start
- Ensure Node.js 16+ is installed
- Check if port 5173 is available
- Run: `node --version`

### Can't Connect
- Ensure both backend and frontend are running
- Check URLs:
  - Backend: http://localhost:8000
  - Frontend: http://localhost:5173

---

## 📊 Project Structure

```
AI4bharat/
├── backend/          # Python FastAPI backend
├── frontend/         # React frontend
├── *.md             # Documentation files
└── *.bat            # Startup scripts
```

---

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Main application |
| **Backend** | http://localhost:8000 | API server |
| **API Docs** | http://localhost:8000/docs | Swagger UI |

---

## 📖 Documentation Files

| File | Purpose |
|------|---------|
| **INDEX.md** | Documentation index |
| **INSTALLATION_GUIDE.md** | Complete setup guide |
| **QUICKSTART.md** | Quick reference |
| **README.md** | Main documentation |
| **PROJECT_SUMMARY.md** | Architecture overview |
| **ENV_VARIABLES.md** | Configuration reference |
| **API_TESTING_GUIDE.md** | API testing guide |
| **FILE_TREE.md** | Complete file structure |
| **PROJECT_COMPLETE.md** | Completion summary |

---

## ✅ Success Checklist

- [ ] Run `verify-installation.bat`
- [ ] Start backend with `start-backend.bat`
- [ ] Start frontend with `start-frontend.bat`
- [ ] Open http://localhost:5173
- [ ] See dashboard with charts
- [ ] Navigate to all pages
- [ ] Read INSTALLATION_GUIDE.md

---

## 🎓 Learning Path

1. **Run the application** (follow Quick Start above)
2. **Explore the UI** (Dashboard, Recommendation, Planning)
3. **Read [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** (understand setup)
4. **Read [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** (understand architecture)
5. **Test APIs** (use [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md))
6. **Customize** (edit .env files, see [ENV_VARIABLES.md](ENV_VARIABLES.md))

---

## 🆘 Need Help?

1. **Installation Issues**: Read [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
2. **Configuration**: Read [ENV_VARIABLES.md](ENV_VARIABLES.md)
3. **API Testing**: Read [API_TESTING_GUIDE.md](API_TESTING_GUIDE.md)
4. **General Questions**: Read [README.md](README.md)
5. **Find Documentation**: Read [INDEX.md](INDEX.md)

---

## 🎉 You're Ready!

Everything is set up and ready to use. Just follow the Quick Start steps above!

**Happy coding! 🚀**

---

## 📝 Quick Commands

### Backend (Manual)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend (Manual)
```bash
cd frontend
npm install
npm run dev
```

### Test API
```bash
curl http://localhost:8000/
curl http://localhost:8000/forecast
```

---

**For detailed instructions, see [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)**
