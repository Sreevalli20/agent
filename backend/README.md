# EduPath Backend

FastAPI backend for the EduPath Career Gap & Learning Execution Platform.

## Setup

### Prerequisites
- Python 3.10+
- PostgreSQL database

### Installation

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set environment variables:
```bash
cp .env.example .env
# Edit .env with your database URL and other settings
```

4. Initialize database:
```bash
python -m app.db.init_db
```

5. Run development server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit http://localhost:8000/docs for interactive API documentation.

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Secret key for security
- `ENVIRONMENT`: development or production
- `CORS_ORIGINS`: Comma-separated list of allowed origins

## Deployment

### Render Deployment

1. Push code to GitHub
2. Create new web service on Render
3. Connect to GitHub repository
4. Set root directory to `backend`
5. Configure environment variables
6. Deploy

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
