# EduPath

**Evidence-Based Career Gap & Learning Execution Platform**

EduPath helps learners understand the gap between their current demonstrated capabilities and a selected career target, converts those gaps into executable learning and practice tasks, collects evidence of completed work, reassesses capability, and dynamically updates the learner's next actions.

## Product Overview

EduPath replaces speculative self-study with a structured cycle that turns verified practice into career qualification:

1. **Evidence-Based Profiling** - Upload resumes, certificates, and project documentation to extract demonstrated capabilities
2. **Target Career Mapping** - Select from 7 standard career roles with detailed competency benchmarks
3. **Prioritized Gap Analysis** - Compare verified evidence against role requirements with explainable prioritization
4. **7-Day Execution Plan** - Convert high-priority gaps into structured daily practice activities with deliverables
5. **Evidence Verification & Reassessment** - Submit project evidence; system updates capability maturity and refines the plan

## Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: FastAPI (Python 3.14 compatible) with PostgreSQL database
- **State Management**: Hybrid approach - API service with localStorage fallback for demo mode
- **Deployment**: Frontend via Vercel, Backend via Render

## Technology Stack

### Frontend
- React 19.0.1
- TypeScript 7.0.2
- Vite 8.3.0
- Tailwind CSS 4.3.3
- Lucide React (icons)
- Motion (animations)

### Backend
- FastAPI 0.115.0
- SQLAlchemy 2.0.35
- PostgreSQL (psycopg2-binary)
- Pydantic 2.9.2
- Uvicorn (ASGI server)

## Core Features

- **Dashboard**: Real-time next action calculation, priority gap visualization, weekly progress tracking
- **Profile Builder**: Upload documents, specify skills, set career targets with weekly hour planning
- **Skill Profile**: Evidence-based capability assessment with strength levels and validation status
- **Career Target**: 7 pre-defined career paths (Data Analyst, Software Developer, Product Manager, etc.)
- **Gap Analysis**: Explainable gap prioritization with recommended actions and time estimates
- **Execution Plan**: Personalized 7-day task schedule with objectives, practice activities, and deliverables
- **Evidence System**: Multiple evidence types (GitHub links, project links, screenshots, file uploads, text responses)
- **Reassessment**: Dynamic capability updates based on submitted evidence with demonstrated vs. missing skills
- **Ask Your Path**: Natural language interface that queries actual stored learner data

## Setup & Development

### Frontend Development

**Prerequisites**: Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Preview production build:
   ```bash
   npm run preview
   ```

5. Type checking:
   ```bash
   npm run lint
   ```

### Backend Development

**Prerequisites**: Python 3.10+, PostgreSQL

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Set environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other settings
   ```

5. Initialize database:
   ```bash
   python -m app.db.init_db
   ```

6. Run development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

7. API documentation available at: http://localhost:8000/docs

## Environment Variables

### Frontend
- `VITE_API_BASE_URL` - Backend API URL (optional, for local development: `http://localhost:8000`, for production: your Render URL)
  - Leave empty to use localStorage fallback (demo mode)

### Backend
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - Secret key for security
- `ENVIRONMENT` - `development` or `production`
- `CORS_ORIGINS` - Comma-separated list of allowed origins

## Deployment

### Frontend (Vercel)

1. Push repository to GitHub
2. Import project in Vercel
3. Vercel will automatically detect Vite configuration
4. Set environment variable `VITE_API_BASE_URL` (optional)
5. Deploy

### Backend (Render)

1. Push repository to GitHub
2. Create new web service on Render
3. Connect to GitHub repository
4. Set root directory to `backend`
5. Configure environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `SECRET_KEY` - Generate a secure random string
   - `CORS_ORIGINS` - Your Vercel frontend URL
6. Deploy

## Database Setup

### PostgreSQL (Production - Render)

Render provides managed PostgreSQL databases. Create a PostgreSQL instance and use the connection string in your `DATABASE_URL` environment variable.

### Local Development

For local development, you can use:
- PostgreSQL installed locally
- Docker with PostgreSQL
- SQLite (fallback - modify `DATABASE_URL` to use sqlite:///edupath.db)

## Demo Flow

The application includes a demo learner (Alex Chen) with pre-populated data:

1. Click "Explore Sample Learner" on landing page
2. View Alex's target: Data Analyst
3. Review skill profile with evidence strength levels
4. Inspect gap analysis with prioritized recommendations
5. Examine 7-day execution plan with practice tasks
6. Submit evidence for a task (use "Fill Realistic Sample Deliverable")
7. View reassessment results and updated capability levels
8. Ask questions via "Ask Your Path" using actual learner data

## Data Persistence

EduPath uses a hybrid persistence approach:

**Production Mode** (with backend):
- Learner profiles and state stored in PostgreSQL database
- All operations go through FastAPI backend
- Multi-device synchronization

**Demo/Offline Mode** (localStorage fallback):
- Learner profiles and state stored in browser localStorage
- Works without backend connection
- Demo data seeded on first load
- Data persists across browser sessions

## Core User Journey

1. User opens EduPath and sees landing page
2. User creates learner profile or explores demo
3. User uploads resume/CV and supporting documents
4. System extracts relevant skills from documents
5. User selects target career role
6. System generates capability profile from evidence
7. System maps target-role requirements
8. System compares current evidence against requirements
9. System identifies and prioritizes capability gaps
10. System generates personalized 7-day execution plan
11. User starts tasks and marks work in progress
12. User submits evidence for completed tasks
13. System reassesses related capabilities
14. System updates learner progress and remaining tasks
15. System determines next useful action
16. User can ask questions through "Ask Your Path"

## Security Notes

- All API communication over HTTPS in production
- Environment-based configuration (no hardcoded secrets)
- CORS restricted to configured origins
- Rate limiting on API endpoints
- Security headers (CSP, X-Frame-Options, etc.)
- Parameterized database operations
- No secrets committed to repository
- Document processing is client-side simulation for demo purposes

## Project Structure

```
edupath/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── dashboard/           # Dashboard view
│   │   ├── profile/             # Profile builder
│   │   ├── skills/              # Skill profile
│   │   ├── target/              # Career target selection
│   │   ├── gap/                 # Gap analysis
│   │   ├── plan/                # Execution plan
│   │   ├── evidence/             # Evidence submission
│   │   ├── progress/            # Progress tracking
│   │   ├── pathquery/           # Ask Your Path
│   │   ├── common/              # Shared components
│   │   ├── landing/             # Landing page
│   │   └── auth/                # Authentication modals
│   ├── services/                # Business logic
│   │   ├── storageService.ts    # localStorage fallback
│   │   ├── api.ts               # API service layer
│   │   ├── evaluationEngine.ts  # Core business logic
│   │   └── authService.ts       # Authentication (optional)
│   ├── data/                    # Static data
│   │   ├── demoData.ts          # Demo learner data
│   │   └── rolesData.ts         # Career requirements
│   ├── types/                   # TypeScript definitions
│   └── App.tsx                  # Main application
├── backend/                     # Backend source
│   ├── app/
│   │   ├── api/                 # API routes
│   │   │   └── v1/
│   │   │       ├── api.py       # Router configuration
│   │   │       └── endpoints/   # Endpoint implementations
│   │   ├── core/                # Configuration
│   │   ├── db/                  # Database layer
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic
│   │   └── data/                # Static data
│   ├── main.py                  # FastAPI entry point
│   ├── requirements.txt        # Python dependencies
│   └── render.yaml             # Render deployment config
├── package.json                 # Frontend dependencies
├── vite.config.ts              # Vite configuration
├── vercel.json                 # Vercel deployment config
└── .env.example                # Environment variables template
```

## API Endpoints

### Health
- `GET /health` - Health check

### Learners
- `POST /api/v1/learners/` - Create learner
- `GET /api/v1/learners/{learner_id}` - Get learner
- `GET /api/v1/learners/` - Get all learners
- `DELETE /api/v1/learners/{learner_id}` - Delete learner
- `GET /api/v1/learners/{learner_id}/state` - Get learner state
- `PUT /api/v1/learners/{learner_id}/state` - Update learner state

### Profile
- `POST /api/v1/profile/{learner_id}` - Create/update profile
- `GET /api/v1/profile/{learner_id}` - Get profile

### Documents
- `POST /api/v1/documents/{learner_id}` - Upload document
- `GET /api/v1/documents/{learner_id}` - Get documents
- `DELETE /api/v1/documents/{learner_id}/{document_id}` - Delete document

### Analysis
- `POST /api/v1/analysis/profile` - Analyze profile
- `POST /api/v1/analysis/gaps` - Compute gaps
- `GET /api/v1/analysis/{learner_id}/gaps` - Get gaps

### Plans
- `POST /api/v1/plans/generate` - Generate learning plan
- `GET /api/v1/plans/{learner_id}` - Get learning plan

### Tasks
- `PATCH /api/v1/tasks/{task_id}` - Update task status

### Evidence
- `POST /api/v1/evidence/submit` - Submit evidence
- `GET /api/v1/evidence/{learner_id}` - Get evidence history

### Dashboard
- `GET /api/v1/dashboard/{learner_id}/progress` - Get dashboard progress
- `GET /api/v1/dashboard/{learner_id}/next-action` - Get next action

### Conversations
- `POST /api/v1/conversations/ask` - Ask path query
- `GET /api/v1/conversations/{learner_id}` - Get conversations

## License

This project is a hackathon submission for demonstration purposes.
