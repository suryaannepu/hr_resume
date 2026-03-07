# Agentic AI Hiring Assistant - Project Setup Guide

## Project Structure

```
RESUME_AI/
├── backend/
│   ├── agents/              # CrewAI agents for candidate evaluation
│   │   ├── jd_agent.py       # Job description analyzer
│   │   ├── resume_agent.py   # Resume parser agent
│   │   ├── skill_agent.py    # Skill normalization agent
│   │   ├── scoring_agent.py  # Resume scoring agent
│   │   ├── ranking_agent.py  # Candidate ranking agent
│   │   ├── insight_agent.py  # Candidate insight generator
│   │   ├── shortlist_agent.py # Shortlist recommendation agent
│   │   └── pipeline.py       # Orchestrates all agents
│   │
│   ├── auth/                # Authentication
│   │   └── auth_handler.py   # JWT and password handling
│   │
│   ├── routes/              # Flask routes
│   │   ├── auth_routes.py    # /api/auth endpoints
│   │   ├── job_routes.py     # /api/jobs endpoints
│   │   ├── application_routes.py # /api/applications endpoints
│   │   └── recruiter_routes.py # /api/recruiter endpoints
│   │
│   ├── models/              # Database models
│   │   └── db_models.py      # MongoDB operations
│   │
│   ├── utils/               # Utilities
│   │   ├── resume_parser.py  # PDF to text extraction
│   │   └── similarity.py     # Skill matching with embeddings
│   │
│   ├── main.py              # Flask app entry point
│   ├── config.py            # Configuration settings
│   ├── database.py          # MongoDB connection
│   ├── requirements.txt      # Python dependencies
│   └── .env                 # Environment variables
│
├── frontend/
│   ├── public/
│   │   └── index.html       # HTML template
│   │
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── Common.jsx    # Reusable UI components
│   │   │   └── Navigation.jsx # Navigation bar
│   │   │
│   │   ├── pages/           # Page components
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Register.jsx        # Registration page
│   │   │   ├── RecruiterDashboard.jsx # Recruiter main dashboard
│   │   │   ├── JobCandidates.jsx   # Ranked candidates for job
│   │   │   ├── PostJob.jsx         # Post new job
│   │   │   ├── JobsMarketplace.jsx # Browse jobs
│   │   │   ├── ApplyJob.jsx        # Apply to job
│   │   │   └── CandidateDashboard.jsx # Candidate applications
│   │   │
│   │   ├── context/         # State management
│   │   │   └── authStore.js # Authentication state (Zustand)
│   │   │
│   │   ├── utils/           # Utilities
│   │   │   └── api.js       # Axios API client
│   │   │
│   │   ├── App.jsx          # Main app component
│   │   ├── index.js         # React entry point
│   │   └── styles.css       # Global styles
│   │
│   ├── package.json         # Node dependencies
│   ├── .env                 # Environment variables
│   └── .gitignore
│
└── README.md
```

## Installation Steps

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Backend Environment

Create `.env` file in `backend/`:

```
FLASK_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hiring_platform
GROQ_API_KEY=gsk_YOUR_GROQ_API_KEY
JWT_SECRET=change_this_in_production
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### 3. MongoDB Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition from https://www.mongodb.com/try

# Windows: Run MongoDB service
# Mac: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Recommended for Production)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account and cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env`

### 4. Get Groq API Key

1. Go to https://console.groq.com
2. Sign up/login
3. Create API key
4. Add to `.env` as `GROQ_API_KEY`

### 5. Start Backend

```bash
cd backend
python main.py
```

Server should start on http://localhost:5000

### 6. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

### 7. Configure Frontend Environment

Create `.env` file in `frontend/`:

```
REACT_APP_API_URL=http://localhost:5000/api
```

### 8. Start Frontend

```bash
npm start
```

Frontend should open at http://localhost:3000

## Testing the System

### 1. Create Recruiter Account
- Go to http://localhost:3000/register
- Select "Recruiter" role
- Enter company name
- Submit

### 2. Post a Job
- Login as recruiter
- Click "Post New Job"
- Enter job title, description, and required skills
- Submit

### 3. Create Candidate Account
- Go to http://localhost:3000/register
- Select "Job Candidate" role
- Submit

### 4. Apply to Job
- Login as candidate
- Click "Browse Jobs"
- Select a job
- Click "Apply Now"
- Upload resume (PDF)
- Submit

### 5. View AI Results
- Login as recruiter
- Go to Dashboard
- Click "View Candidates" for a job
- See ranked candidates with:
  - Match scores
  - Skill analysis
  - AI recommendations
  - Strengths and gaps

### 6. Approve Shortlist
- Review candidates
- Select candidates to shortlist
- Click "Approve X Candidates"
- Confirm selection

## Sample Resume for Testing

Create a simple PDF resume with:
- Name and contact info
- Skills: Python, React, SQL, Docker, AWS
- Experience: 5 years as Software Engineer
- Education: B.S. Computer Science
- Projects: Built 3+ projects

## AI Agent Behavior

Each agent uses:
- **LLM**: llama-3.3-70b-versatile via Groq
- **Processing**: Natural language understanding
- **Task**: Specific to its role in the pipeline

### Agent Descriptions

1. **Resume Parser**: Extracts structured data from resume text
2. **Job Analyzer**: Identifies required skills from job description
3. **Skill Normalizer**: Maps skill variations to standard names (e.g., "JS" → "JavaScript")
4. **Resume Scorer**: Calculates match percentage using LLM reasoning + semantic similarity
5. **Ranking Agent**: Ranks candidates by composite score
6. **Insight Generator**: Creates detailed analysis of candidate fit
7. **Shortlist Recommender**: Recommends top candidates for review

## Common Issues & Fixes

### "Cannot connect to MongoDB"
- Check MongoDB is running: `mongod` or cloud connection
- Verify MONGODB_URI in .env
- Check firewall/ports

### "Groq API key invalid"
- Get key from https://console.groq.com
- Paste full key (starts with `gsk_`)
- Check .env for typos

### "CORS error when calling API"
- Check ALLOWED_ORIGINS in backend/.env
- Should include http://localhost:3000

### "Resume parsing fails"
- Ensure PDF is readable text
- Try a simpler PDF
- Check terminal for error details

### React not starting
- Delete `node_modules/` and run `npm install` again
- Clear npm cache: `npm cache clean --force`
- Check Node version: `node --version` (should be 14+)

## Production Deployment

### Backend
```bash
# Use production server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 main:app

# Or with Docker
docker build -t hiring-backend .
docker run -p 5000:5000 hiring-backend
```

### Frontend
```bash
npm run build
# Deploy 'build' folder to hosting (Vercel, Netlify, etc)
```

### Database
- Use MongoDB Atlas (shared/dedicated cluster)
- Enable network access
- Use strong passwords

### Environment
- Store secrets in environment variables
- Enable HTTPS
- Set proper JWT_SECRET
- Disable debug mode
- Add rate limiting
- Monitor error logs

## Development Notes

- **Backend**: Synchronous request processing (good for demos, use async workers for production)
- **Frontend**: Uses Zustand for simple state management, can upgrade to Redux
- **Database**: MongoDB for flexibility, can switch to PostgreSQL if needed
- **LLM**: Groq provides fast inference, consider local models for privacy
- **UI**: Tailwind CSS utilities, customizable color scheme with CSS variables

## Next Steps (Phase 2)

- Email notifications to candidates
- Scheduled interviews/video calls
- Assessment tests integration
- Interview scheduling
- Candidate notes and feedback
- Bulk import of job descriptions
- Analytics and reporting
- Automated rejection emails
- Integration with job boards

---

Happy hiring! 🚀
