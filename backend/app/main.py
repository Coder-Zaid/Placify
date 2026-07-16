from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

import sys
# Inject path of the app directory to support flat absolute imports in Vercel serverless functions
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Import database configuration
try:
    from .database import engine, Base
except (ImportError, ValueError):
    from database import engine, Base

# Bind metadata and create tables on startup (safely wrapped for serverless/sqlite compatibility)
try:
    Base.metadata.create_all(bind=engine)
except Exception as db_err:
    import logging
    logging.getLogger("uvicorn.error").warning(f"Database initialization failed/skipped: {db_err}")

# Import routes
try:
    from .routes import analyze, auth_routes, interview_studio
except (ImportError, ValueError):
    from routes import analyze, auth_routes, interview_studio

# Create FastAPI app
app = FastAPI(
    title="Placify Intelligence Platform",
    description="AI-powered batch student analysis and resume screening",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router)
app.include_router(auth_routes.router)
app.include_router(interview_studio.router)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "running",
        "service": "Placify Intelligence Platform",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Health check for deployment"""
    return {
        "status": "healthy",
        "timestamp": "2026-04-03"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
