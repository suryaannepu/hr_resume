# Agentic AI Hiring Assistant

## Quick Start

### Backend Setup (Terminal 1)

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
```

### Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm start
```

## Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Demo Workflow

1. Register recruiter account
2. Post a job
3. Register candidate account
4. Apply to job with sample resume
5. View AI-ranked candidates
6. Approve shortlist

## Environment Setup

Before starting, create:
- `backend/.env` with GROQ_API_KEY
- `frontend/.env` with REACT_APP_API_URL

See SETUP_GUIDE.md for detailed instructions.
