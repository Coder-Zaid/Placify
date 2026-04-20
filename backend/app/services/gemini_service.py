import os
import time
import json
from typing import Tuple
import io
import base64
import PyPDF2
from .llm_service import UniversalLLMService

from google import genai


def get_working_model(api_key: str) -> str:
    """Simplified model selection - no pinging to protect free-tier 15 RPM quota.
    
    CRITICAL: The previous logic sent "Hi" prompts to test each model, consuming RPM quota instantly.
    This version simply returns the best stable model without any API calls.
    
    Args:
        api_key: Gemini API key (validated caller responsibility)
        
    Returns:
        Name of the best available model for free-tier
    """
    print(f"[MODEL] Using gemini-2.0-flash (no pinging - RPM quota protected)")
    return 'gemini-2.0-flash'


class GeminiService:
    """Legacy service wrapper - now uses UniversalLLMService for multi-provider support"""
    
    def __init__(self, api_key: str = None):
        """Initialize with optional API key (now unused, uses env vars)"""
        self.llm_service = UniversalLLMService()
    
    def analyze_student_batch(self, jd_text: str, student_info: str) -> Tuple[str, str, str, str]:
        """
        Analyze a single student against job description.
        Returns: (readiness_score, is_eligible, missing_skills, ai_insight)
        """
        prompt = f"""You are an expert technical recruiter. Compare this student to the job description.

JD: {jd_text}
STUDENT: {student_info}

CRITICAL: Return ONLY valid JSON with no extra text. Use this exact format:
{{
  "readiness_score": <0-100>,
  "is_eligible": "yes" or "no",
  "missing": ["skill1", "skill2"],
  "ai_insight": "2-3 sentence evaluation"
}}
"""
        
        try:
            import asyncio
            response = asyncio.run(self.llm_service.generate_content_with_fallback(prompt))
            raw_text = response.strip()
            
            # Extract JSON
            raw_text = raw_text.replace('```json', '').replace('```', '').strip()
            start = raw_text.find('{')
            end = raw_text.rfind('}') + 1
            if start >= 0 and end > start:
                raw_text = raw_text[start:end]
            
            data = json.loads(raw_text)
            
            return (
                str(data.get('readiness_score', 'N/A')),
                str(data.get('is_eligible', 'N/A')),
                ','.join(data.get('missing', [])),
                str(data.get('ai_insight', 'N/A'))
            )
        except Exception as e:
            raise Exception(f"Error analyzing student: {str(e)}")
    
    def analyze_resume(self, jd_text: str, resume_base64: str) -> Tuple[str, str, list, list, str]:
        """
        Analyze a single resume against job description (PDF as base64).
        Returns: (overall_score, recommendation, strengths, gaps, detailed_feedback)
        """
        prompt = f"""You are an expert technical recruiter. Analyze this resume against the job description.

JD: {jd_text}

CRITICAL: Return ONLY valid JSON with no extra text. Use this exact format:
{{
  "overall_score": <0-100>,
  "recommendation": "Highly Recommended" or "Recommended" or "Consider" or "Not Recommended",
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2", "gap3"],
  "detailed_feedback": "3-4 sentence assessment"
}}
"""
        
        try:
            import asyncio
            
            # Decode resume PDF
            pdf_data = base64.b64decode(resume_base64)
            
            # Convert PDF to text
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_data))
            resume_text = ""
            for page in pdf_reader.pages:
                resume_text += page.extract_text()
            
            full_prompt = prompt.replace("[RESUME_TEXT]", resume_text)
            
            response = asyncio.run(self.llm_service.generate_content_with_fallback(full_prompt))
            raw_text = response.strip()
            
            # Extract JSON
            raw_text = raw_text.replace('```json', '').replace('```', '').strip()
            start = raw_text.find('{')
            end = raw_text.rfind('}') + 1
            if start >= 0 and end > start:
                raw_text = raw_text[start:end]
            
            data = json.loads(raw_text)
            
            return (
                str(data.get('overall_score', 'N/A')),
                str(data.get('recommendation', 'N/A')),
                data.get('strengths', []),
                data.get('gaps', []),
                str(data.get('detailed_feedback', 'N/A'))
            )
        
        except Exception as e:
            raise Exception(f"Error analyzing resume: {str(e)}")
