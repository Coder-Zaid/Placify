import asyncio
import base64
import io
import json
import logging
from typing import Tuple, Dict, List, Any

import PyPDF2

try:
    from .llm_service import UniversalLLMService
except (ImportError, ValueError):
    from llm_service import UniversalLLMService

logger = logging.getLogger(__name__)


def get_working_model(api_key: str = None) -> str:
    """
    Simplified model selection - no pinging to protect free-tier 15 RPM quota.
    
    CRITICAL: The previous logic sent "Hi" prompts to test each model, consuming RPM quota instantly.
    This version simply returns the best stable model without any API calls.
    
    Args:
        api_key: Gemini API key (optional, validated by caller responsibility)
        
    Returns:
        Name of the best available model for free-tier
    """
    logger.info("[MODEL] Using gemini-1.5-flash (no pinging - RPM quota protected)")
    return 'gemini-1.5-flash'


class GeminiService:
    """
    Service wrapper for multi-provider LLM analysis with Gemini as primary provider.
    Handles resume analysis, student evaluation, and batch processing with fallback support.
    """

    def __init__(self, api_key: str = None):
        """
        Initialize GeminiService with UniversalLLMService for multi-provider support.
        
        Args:
            api_key: Optional API key (provider API keys are loaded from environment)
        """
        self.llm_service = UniversalLLMService()

    @staticmethod
    def _extract_json_from_response(raw_text: str) -> Dict[str, Any]:
        """
        Extract and parse JSON from LLM response, handling markdown formatting.
        
        Args:
            raw_text: Raw response text from LLM
            
        Returns:
            Parsed JSON dictionary
            
        Raises:
            ValueError: If valid JSON cannot be extracted
            json.JSONDecodeError: If JSON parsing fails
        """
        try:
            # Remove markdown code block formatters
            clean_text = raw_text.replace('```json', '').replace('```', '').strip()
            
            # Find JSON object boundaries
            start_idx = clean_text.find('{')
            end_idx = clean_text.rfind('}') + 1
            
            if start_idx < 0 or end_idx <= start_idx:
                raise ValueError("No JSON object found in response")
            
            json_str = clean_text[start_idx:end_idx]
            return json.loads(json_str)
        
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}, Raw text: {raw_text}")
            raise ValueError(f"Failed to parse JSON response: {str(e)}")
        except Exception as e:
            logger.error(f"Error extracting JSON: {e}")
            raise

    async def analyze_student_batch(self, jd_text: str, student_info: str) -> Tuple[str, str, str, str]:
        """
        Analyze a single student against a job description.
        
        Args:
            jd_text: Job description text
            student_info: Student profile information
            
        Returns:
            Tuple containing: (readiness_score, is_eligible, missing_skills, ai_insight)
            
        Raises:
            ValueError: If analysis fails or response cannot be parsed
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
            logger.info("Starting student batch analysis")
            response = await self.llm_service.generate_content_with_fallback(prompt)
            
            if not response:
                raise ValueError("Empty response from LLM service")
            
            data = self._extract_json_from_response(response)
            
            # Validate required fields
            required_fields = ['readiness_score', 'is_eligible', 'missing', 'ai_insight']
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field in response: {field}")
            
            logger.info(f"Student analysis completed: score={data['readiness_score']}")
            
            return (
                str(data.get('readiness_score', 'N/A')),
                str(data.get('is_eligible', 'N/A')),
                ','.join(data.get('missing', [])),
                str(data.get('ai_insight', 'N/A'))
            )
        
        except ValueError as e:
            logger.error(f"Validation error in student analysis: {e}")
            raise
        except Exception as e:
            logger.error(f"Error analyzing student: {type(e).__name__}: {str(e)}")
            raise ValueError(f"Error analyzing student: {str(e)}")

    async def analyze_resume(self, jd_text: str, resume_base64: str) -> Tuple[str, str, List[str], List[str], str]:
        """
        Analyze a resume (PDF) against a job description.
        
        Args:
            jd_text: Job description text
            resume_base64: Resume PDF encoded in base64
            
        Returns:
            Tuple containing: (overall_score, recommendation, strengths, gaps, detailed_feedback)
            
        Raises:
            ValueError: If analysis fails, resume cannot be decoded, or response cannot be parsed
        """
        prompt = f"""You are an expert technical recruiter. Analyze this resume against the job description.

JD: {jd_text}

RESUME TEXT:
[RESUME_TEXT]

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
            logger.info("Starting resume analysis")
            
            # Decode resume PDF
            pdf_data = base64.b64decode(resume_base64)
            
            # Extract text from PDF
            resume_text = self._extract_text_from_pdf(pdf_data)
            
            if not resume_text.strip():
                raise ValueError("Resume PDF is empty or contains no extractable text")
            
            # Replace placeholder with actual resume text
            full_prompt = prompt.replace("[RESUME_TEXT]", resume_text)
            
            # Get analysis from LLM
            response = await self.llm_service.generate_content_with_fallback(full_prompt)
            
            if not response:
                raise ValueError("Empty response from LLM service")
            
            data = self._extract_json_from_response(response)
            
            # Validate required fields
            required_fields = ['overall_score', 'recommendation', 'strengths', 'gaps', 'detailed_feedback']
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field in response: {field}")
            
            logger.info(f"Resume analysis completed: score={data['overall_score']}")
            
            return (
                str(data.get('overall_score', 'N/A')),
                str(data.get('recommendation', 'N/A')),
                data.get('strengths', []),
                data.get('gaps', []),
                str(data.get('detailed_feedback', 'N/A'))
            )
        
        except ValueError as e:
            logger.error(f"Validation error in resume analysis: {e}")
            raise
        except Exception as e:
            logger.error(f"Error analyzing resume: {type(e).__name__}: {str(e)}")
            raise ValueError(f"Error analyzing resume: {str(e)}")
    
    @staticmethod
    def _extract_text_from_pdf(pdf_data: bytes) -> str:
        """
        Extract text content from a PDF file.
        
        Args:
            pdf_data: Raw PDF file bytes
            
        Returns:
            Extracted text from all pages
            
        Raises:
            ValueError: If PDF cannot be read or is invalid
        """
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_data))
            
            if len(pdf_reader.pages) == 0:
                raise ValueError("PDF contains no pages")
            
            extracted_text = ""
            for page_num, page in enumerate(pdf_reader.pages):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        extracted_text += page_text + "\n"
                except Exception as e:
                    logger.warning(f"Failed to extract text from page {page_num}: {e}")
                    continue
            
            return extracted_text
        
        except PyPDF2.PdfReadError as e:
            logger.error(f"PDF read error: {e}")
            raise ValueError(f"Invalid or corrupted PDF file: {str(e)}")
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise ValueError(f"Error extracting text from PDF: {str(e)}")
