# EduPath Project Information

## Project Overview
EduPath is an evidence-based career gap and learning execution platform that helps learners understand the gap between their current demonstrated capabilities and a selected career target, converts those gaps into executable learning and practice tasks, collects evidence of completed work, reassesses capability, and dynamically updates the learner's next actions.

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

## Key Files
### Frontend
- `src/App.tsx` - Main application with routing and state management
- `src/types/index.ts` - Complete TypeScript type definitions
- `src/services/storageService.ts` - localStorage-based state persistence (fallback)
- `src/services/api.ts` - API service layer with backend communication
- `src/services/evaluationEngine.ts` - Core business logic for gap analysis, plan generation, evidence reassessment
- `src/data/demoData.ts` - Demo learner data (Alex Chen, Marcus Vance)
- `src/data/rolesData.ts` - Career targets and requirements for 7 standard roles
- `src/components/` - All UI components organized by feature

### Backend
- `backend/main.py` - FastAPI application entry point
- `backend/app/api/v1/api.py` - API router configuration
- `backend/app/services/learner_service.py` - Learner state management
- `backend/app/services/evaluation_service.py` - Business logic (port of frontend evaluationEngine)
- `backend/app/models/learner.py` - SQLAlchemy database models
- `backend/app/schemas/learner.py` - Pydantic schemas
- `backend/app/data/roles_data.py` - Career requirements data
- `backend/requirements.txt` - Python dependencies
- `backend/render.yaml` - Render deployment configuration

## Build Commands
### Frontend
- `npm install` - Install dependencies
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - TypeScript type checking

### Backend
- `cd backend`
- `python -m venv venv`
- `source venv/bin/activate` (Windows: `venv\Scripts\activate`)
- `pip install -r requirements.txt`
- `python -m app.db.init_db` - Initialize database tables
- `uvicorn main:app --reload --host 0.0.0.0 --port 8000` - Start development server

## Core User Flow
1. Landing page → Explore demo or create new learner
2. Profile builder → Upload documents, specify skills, set target
3. Skill profile → Evidence-based capability assessment
4. Career target → Select from 7 standard roles
5. Gap analysis → Prioritized capability gaps
6. Execution plan → 7-day personalized task schedule
7. Evidence submission → Submit work for verification
8. Reassessment → Dynamic capability updates
9. Dashboard → Next action calculation and progress tracking
10. Ask Your Path → Natural language queries about learner data

## Important Notes
- **API Communication**: Frontend uses `apiService` which tries backend first, falls back to localStorage
- **Demo Mode**: When `VITE_API_BASE_URL` is empty or backend unavailable, app uses localStorage
- **Environment Variables**: 
  - Frontend: `VITE_API_BASE_URL` (optional, for backend URL)
  - Backend: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`
- **Authentication**: Optional PBKDF2 password hashing system exists (client-side for demo)
- **Document Processing**: Client-side simulation for demo purposes

## Deployment
### Frontend (Vercel)
- Configuration in `vercel.json`
- Static site with SPA routing
- Build output: `dist/` directory
- Environment variable: `VITE_API_BASE_URL` (optional)

### Backend (Render)
- Configuration in `backend/render.yaml`
- PostgreSQL database required
- Health check at `/health`
- Environment variables: `DATABASE_URL`, `SECRET_KEY`, `CORS_ORIGINS`

## Development Notes
- The application uses `@` alias for imports (configured in vite.config.ts)
- Navigation uses tab-based routing (no React Router)
- State updates propagate via storageService subscription pattern
- All components use functional React with hooks
- Tailwind CSS 4 with @import syntax
- Responsive design with mobile-first approach
- Backend business logic mirrors frontend evaluationEngine for consistency