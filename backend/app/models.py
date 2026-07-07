from pydantic import BaseModel
from typing import List, Optional
import io


class StudentRecord(BaseModel):
    """Single student record"""
    roll_number: str
    name: str
    branch: str
    cgpa: float
    aptitude_score: int
    technical_skills: str
    has_portfolio: bool
    active_backlogs: int


class BatchAnalysisRequest(BaseModel):
    """Request body for batch analysis"""
    jd_text: str
    csv_data: str  # CSV as string
    api_key: str  # Gemini API key from frontend


class BatchAnalysisResponse(BaseModel):
    """Response from batch analysis"""
    readiness_score: str
    is_eligible: str
    missing_skills: str
    ai_insight: str


class PillarBreakdown(BaseModel):
    """Pillar scores breakdown (6 pillars)"""
    skills: float
    academics: float
    corporate_readiness: float
    aptitude: float
    portfolio: float
    ai_growth: float


class WeightProfile(BaseModel):
    """Weight profile based on JD type"""
    skills: int
    academic: int
    portfolio: int
    aptitude: int
    ai: int


class StudentAnalysisResult(BaseModel):
    """Complete analysis result for a student"""
    name: str
    roll_number: str
    cgpa: float
    eligible: bool
    fail_reason: str = ""
    gate_type: str = ""  # "backlog", "cgpa", "skill_mismatch", or ""
    final_score: float
    tier: str  # "Qualified", "Potential", "Needs Training"
    jd_type: str  # "service_based", "product_based", "academic", "balanced"
    jd_type_description: str
    present_skills: List[str]
    missing_skills: List[str]
    corporate_matches: List[str] = []
    zero_skill_note: str = ""
    portfolio_gate_note: str = ""
    portfolio_multiplier: float = 1.0
    aptitude_bonus_applied: bool = False
    pillar_breakdown: PillarBreakdown
    confidence_level: str  # "High", "Medium", "Low"
    confidence_note: str
    ai_insight: str
    growth_reasoning: str


class ResumeAnalysisRequest(BaseModel):
    """Request body for resume analysis"""
    jd_text: str
    resume_base64: str  # Base64 encoded PDF
    api_key: str  # Gemini API key from frontend


class ResumeAnalysisResponse(BaseModel):
    """Response from resume analysis"""
    overall_score: str
    recommendation: str
    strengths: List[str]
    gaps: List[str]
    detailed_feedback: str
    pillar_breakdown: Optional[PillarBreakdown] = None
