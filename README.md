# Agentic AI Hiring Assistant - Phase 1

A production-style AI-powered recruitment platform that automates the early hiring process using multiple AI agents.

## 🎯 Features

- **Multi-Company Job Marketplace**: Recruiters from different companies post jobs, candidates browse and apply
- **AI-Powered Candidate Evaluation**:
  - Resume Parsing - Extracts candidate data automatically
  - Skill Normalization - Standardizes skill names for better matching
  - Resume Scoring - Compares candidate skills with job requirements
  - Candidate Ranking - Ranks all applicants by fit score
  - Candidate Insights - Generates detailed analysis of strengths and gaps
  - Shortlist Recommendations - AI recommends candidates for shortlisting
  
- **Human-in-the-Loop Approval**: Recruiters manually approve AI recommendations before final shortlisting
- **Role-Based Access**: Separate dashboards for Recruiters and Candidates
- **Professional SaaS UI**: Clean white dashboard design with intuitive navigation

## 🛠 Tech Stack

- **Backend**: Python + Flask
- **AI Agents**: CrewAI with Groq LLM (llama-3.3-70b-versatile)
- **Frontend**: React 18
- **Database**: MongoDB
- **Resume Processing**: PyMuPDF
- **Skill Matching**: Sentence Transformers
- **Authentication**: JWT + bcrypt

## 📋 Prerequisites

- Python 3.9+
- Node.js 14+
- MongoDB (local or cloud)
- Groq API key (get at https://console.groq.com)

## 🚀 Quick Start

### 1. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Or activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

Create `backend/.env` file:

```
FLASK_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hiring_platform
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### 3. Setup MongoDB

**Option A: Local MongoDB**
```bash
# Install MongoDB and run
mongod
```

**Option B: MongoDB Atlas (Cloud)**
```
Update MONGODB_URI in .env with your connection string
```

### 4. Start Backend Server

```bash
python main.py
```

Server runs on http://localhost:5000

### 5. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
# REACT_APP_API_URL=http://localhost:5000/api

# Start development server
npm start
```

Frontend runs on http://localhost:3000

## 📖 System Workflow

### For Recruiters:
1. Register/Login
2. Post job description with required skills
3. Job appears in marketplace
4. Candidates apply with resumes
5. AI automatically processes applications
6. Review ranked candidates and AI insights
7. Approve shortlist (Human-in-the-Loop)

### For Candidates:
1. Register/Login
2. Browse available jobs
3. Apply to jobs with resume upload
4. Receive AI evaluation feedback
5. Track application status

## 🤖 AI Agent Pipeline

When a candidate applies:

```
Resume Uploaded
    ↓
[Resume Parser] - Extracts: name, skills, education, experience, projects
    ↓
[Job Description Analyzer] - Extracts: required skills, experience, education
    ↓
[Skill Normalization] - Standardizes skills for accurate matching
    ↓
[Resume Scoring] - Calculates match score (0-100)
    ↓
[Candidate Ranking] - Ranks against other applicants
    ↓
[Candidate Insights] - Generates strengths, gaps, recommendations
    ↓
[Shortlist Recommendation] - Suggests candidates for shortlisting
    ↓
Recruiter Reviews & Approves
```

## 📊 Database Schema

### users
```
{
  name: String,
  email: String (unique),
  password_hash: String,
  role: "recruiter" | "candidate",
  company_name: String (recruiters only),
  created_at: DateTime
}
```

### jobs
```
{
  recruiter_id: ObjectId,
  company_name: String,
  job_title: String,
  description: String,
  required_skills: [String],
  created_at: DateTime,
  status: "active" | "closed"
}
```

### applications
```
{
  job_id: ObjectId,
  candidate_id: ObjectId,
  resume_text: String,
  candidate_name: String,
  candidate_skills: [String],
  match_score: Number (0-100),
  recommendation: String,
  key_strengths: [String],
  skill_gaps: [String],
  status: "uploaded" | "processing" | "processed" | "failed",
  created_at: DateTime
}
```

### shortlisted_candidates
```
{
  job_id: ObjectId,
  candidate_id: ObjectId,
  application_id: ObjectId,
  score: Number,
  rank: Number,
  approved_by_recruiter: Boolean,
  created_at: DateTime
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user

### Jobs
- `POST /api/jobs/create` - Create job (recruiter)
- `GET /api/jobs/list` - List all jobs
- `GET /api/jobs/<id>` - Get job details

### Applications
- `POST /api/applications/apply` - Apply to job
- `GET /api/applications/status/<id>` - Get application status
- `GET /api/applications/candidate/all` - Get candidate's applications
- `GET /api/applications/job/<job_id>/list` - Get job applications (recruiter)

### Recruiter Dashboard
- `GET /api/recruiter/dashboard` - Get dashboard summary
- `GET /api/recruiter/job/<job_id>/ranked-candidates` - Get ranked candidates
- `GET /api/recruiter/job/<job_id>/recommendations` - Get shortlist recommendations
- `POST /api/recruiter/job/<job_id>/shortlist/approve` - Approve shortlist
- `GET /api/recruiter/job/<job_id>/shortlist` - Get approved shortlist

## 🎨 UI Components

- **Navigation** - Top navigation with role-based menu
- **Auth Pages** - Login and registration with form validation
- **Job Marketplace** - Browse and filter job listings
- **Recruiter Dashboard** - Overview of all jobs and applications
- **Candidate List** - Ranked candidates with AI scores and insights
- **Score Visualization** - Color-coded match score bars
- **Modal Dialogs** - Confirmation modals for approvals
- **Alerts** - Toast notifications for success/error messages

## 🔐 Security

- Password hashing with bcrypt
- JWT authentication with token expiration
- CORS protection
- Protected API routes
- Input validation on frontend and backend

## 📝 Notes

- **Phase 1 Scope**: Resume parsing, scoring, ranking, and human-approved shortlisting
- **Not Included**: Email automation, scheduled interviews, video interviewing
- **Async Processing**: In production, AI agent processing should be moved to background workers (Celery/RQ)
- **LLM Integration**: Uses Groq API for fast, cost-effective LLM inference
- **Database**: Can easily switch to other databases by modifying database.py

## 🚀 Production Deployment

### Backend
```bash
# Use production server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 main:app
```

### Frontend
```bash
npm run build
# Serve build folder with nginx or your hosting
```

### Environment
- Use MongoDB Atlas for production database
- Store secrets in environment variables
- Enable HTTPS
- Set proper CORS origins
- Use production LLM API keys
- Consider async job processing with Celery

## 📞 Support

For issues or questions, check:
- Backend logs in terminal
- Browser console for frontend errors
- MongoDB connection in .env
- Groq API key validity

## 📄 License

Built for educational and demonstration purposes.
