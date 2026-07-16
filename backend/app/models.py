from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
import datetime
try:
    from .database import Base
except (ImportError, ValueError):
    from database import Base

# ============================================================================
# PYDANTIC MODEL SCHEMAS
# ============================================================================

class StudentRecord(BaseModel):
    roll_number: str
    name: str
    branch: str
    cgpa: float
    aptitude_score: int
    technical_skills: str
    has_portfolio: bool
    active_backlogs: int

class BatchAnalysisRequest(BaseModel):
    jd_text: str
    csv_data: str
    api_key: str

class BatchAnalysisResponse(BaseModel):
    readiness_score: str
    is_eligible: str
    missing_skills: str
    ai_insight: str

class PillarBreakdown(BaseModel):
    skills: float
    academics: float
    corporate_readiness: float
    aptitude: float
    portfolio: float
    ai_growth: float

class WeightProfile(BaseModel):
    skills: int
    academic: int
    portfolio: int
    aptitude: int
    ai: int

class StudentAnalysisResult(BaseModel):
    name: str
    roll_number: str
    cgpa: float
    eligible: bool
    fail_reason: str = ""
    gate_type: str = ""
    final_score: float
    tier: str
    jd_type: str
    jd_type_description: str
    present_skills: List[str]
    missing_skills: List[str]
    corporate_matches: List[str] = []
    zero_skill_note: str = ""
    portfolio_gate_note: str = ""
    portfolio_multiplier: float = 1.0
    aptitude_bonus_applied: bool = False
    pillar_breakdown: PillarBreakdown
    confidence_level: str
    confidence_note: str
    ai_insight: str
    growth_reasoning: str

class ResumeAnalysisRequest(BaseModel):
    jd_text: str
    resume_base64: str
    api_key: str

class ResumeAnalysisResponse(BaseModel):
    overall_score: str
    recommendation: str
    strengths: List[str]
    gaps: List[str]
    detailed_feedback: str
    pillar_breakdown: Optional[PillarBreakdown] = None

class UserRegister(BaseModel):
    email: str
    password: str
    role: str = "student" # "student" or "admin"

class UserLogin(BaseModel):
    email: str
    password: str

class InterviewRequest(BaseModel):
    question: str
    answer: str

class InterviewResponse(BaseModel):
    content_score: float
    sentiment_score: float
    tone: str
    feedback: str

# ============================================================================
# SQLALCHEMY DATABASE MODELS
# ============================================================================

class DBUser(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="student")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    analyses = relationship("DBAnalysisHistory", back_populates="user")

class DBAnalysisHistory(Base):
    __tablename__ = "analysis_history"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    jd_text = Column(String, nullable=False)
    student_name = Column(String, nullable=False)
    score = Column(Float, nullable=False)
    recommendation = Column(String, nullable=False)
    analysis_type = Column(String, nullable=False) # "resume" or "batch"
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("DBUser", back_populates="analyses")
