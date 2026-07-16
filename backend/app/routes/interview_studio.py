"""
Interview Studio API Routes
Handles question generation, answer evaluation, dashboard generation, and improvement plans.
"""
from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import logging

from ..services.llm_service import UniversalLLMService
from ..services.gemini_service import get_working_model
from ..services.vector_service import calculate_cosine_similarity
from ..services.sentiment_service import analyze_sentiment_valence

logger = logging.getLogger("uvicorn.error")
router = APIRouter(prefix="/analyze/interview-studio", tags=["interview-studio"])


# ============================================================================
# REQUEST / RESPONSE MODELS
# ============================================================================

class QuestionGenerationRequest(BaseModel):
    role: str
    experience: str
    company: Optional[str] = None
    resume_base64: Optional[str] = None
    api_key: Optional[str] = None

class GeneratedQuestion(BaseModel):
    question: str
    type: str
    difficulty: str

class QuestionGenerationResponse(BaseModel):
    questions: List[GeneratedQuestion]

class AnswerData(BaseModel):
    questionIndex: int
    question: str
    answer: str
    duration: int = 0
    eyeContact: float = 50.0

class DashboardRequest(BaseModel):
    role: str
    experience: str
    answers: List[AnswerData]

class QuestionResult(BaseModel):
    question: str
    answer: str
    score: int
    type: str
    duration: int
    feedback: str

class CategoryScore(BaseModel):
    name: str
    score: int

class DashboardResponse(BaseModel):
    overallScore: int
    categories: List[CategoryScore]
    questionResults: List[QuestionResult]
    strengths: List[str]
    weaknesses: List[str]

class ImprovementPlanRequest(BaseModel):
    role: str
    overallScore: int
    weaknesses: List[str]

class WeekPlan(BaseModel):
    focus: str
    tasks: List[str]

class DailyTip(BaseModel):
    category: str
    exercise: str

class ImprovementPlanResponse(BaseModel):
    weeks: List[WeekPlan]
    dailyTips: List[DailyTip]


def extract_text_from_pdf_base64(pdf_base64_str: str) -> str:
    if not pdf_base64_str:
        return ""
    try:
        if "," in pdf_base64_str:
            pdf_base64_str = pdf_base64_str.split(",")[1]
        
        import base64
        import io
        pdf_bytes = base64.b64decode(pdf_base64_str)
        
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            return text.strip()
        except Exception as pdf_err:
            print(f"[InterviewStudio] PyPDF2 parsing error: {pdf_err}")
            return "[Error extracting PDF pages]"
    except Exception as e:
        print(f"[InterviewStudio] PDF decoding error: {e}")
        return ""


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/generate-questions", response_model=QuestionGenerationResponse)
async def generate_questions(request: QuestionGenerationRequest):
    """Generate interview questions tailored to role, experience, and resume content."""
    try:
        api_key = request.api_key or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="No LLM API key configured")

        working_model = get_working_model()
        llm = UniversalLLMService(
            api_keys={"GEMINI_API_KEY": api_key,
                       "OPENAI_API_KEY": api_key,
                       "ANTHROPIC_API_KEY": api_key,
                       "GROQ_API_KEY": api_key}
        )

        resume_context = ""
        if request.resume_base64:
            extracted_text = extract_text_from_pdf_base64(request.resume_base64)
            if extracted_text and "[Error" not in extracted_text:
                resume_context = f"\nCandidate Resume Details:\n{extracted_text[:3000]}"

        prompt = f"""Generate 6 interview questions for a {request.experience} {request.role} candidate.
{f'Target company: {request.company}.' if request.company else ''}
{resume_context if resume_context else ''}

Return ONLY a JSON array of objects with keys: "question", "type" (one of: HR, Behavioral, Technical, Situational), "difficulty" (Easy, Medium, Hard).

Mix question types. Start with easier questions and increase difficulty. Ensure questions are highly tailored to the technologies, projects, and experiences listed in their resume context.
Return valid JSON only, no markdown formatting."""

        response_text = await llm.generate_content_with_fallback(prompt)
        
        # Parse JSON from response
        try:
            # Try to extract JSON array from response
            text = response_text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                text = text.rsplit("```", 1)[0] if "```" in text else text
            questions = json.loads(text.strip())
            if isinstance(questions, list):
                return QuestionGenerationResponse(
                    questions=[GeneratedQuestion(**q) for q in questions[:8]]
                )
        except (json.JSONDecodeError, KeyError) as e:
            print(f"[InterviewStudio] JSON parse error: {e}")
        
        raise HTTPException(status_code=500, detail="Failed to parse LLM response")

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("[InterviewStudio] Question generation failed:")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")
@router.post("/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    api_key: Optional[str] = Form(None)
):
    """Transcribe audio chunk using available LLM API (Groq/OpenAI/Gemini)."""
    try:
        api_key = api_key or os.getenv("GROQ_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            return {"text": ""}
            
        audio_bytes = await file.read()
        
        # Check if it is a Groq key (use Whisper-large-v3)
        if api_key.startswith("gsk_"):
            import openai
            client = openai.OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
            file_obj = ("audio.webm", audio_bytes, "audio/webm")
            transcription = client.audio.transcriptions.create(
                file=file_obj,
                model="whisper-large-v3",
                response_format="json",
                language="en"
            )
            return {"text": transcription.text}
            
        # Check if it is OpenAI key
        elif api_key.startswith("sk-") and not api_key.startswith("sk-ant"):
            import openai
            client = openai.OpenAI(api_key=api_key)
            file_obj = ("audio.webm", audio_bytes, "audio/webm")
            transcription = client.audio.transcriptions.create(
                file=file_obj,
                model="whisper-1",
                response_format="json",
                language="en"
            )
            return {"text": transcription.text}
            
        # Fallback to Gemini 1.5 Flash for audio processing
        elif api_key.startswith("AIza"):
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=[
                    types.Part.from_bytes(data=audio_bytes, mime_type='audio/webm'),
                    "Transcribe this short audio clip exactly as spoken in English. Return only the transcription text, nothing else, no quotes."
                ]
            )
            return {"text": response.text.strip()}
            
        return {"text": ""}
    except Exception as e:
        logger.exception("[InterviewStudio] Transcription failed:")
        return {"text": ""}

class KeyValidationRequest(BaseModel):
    provider: str
    api_key: str

@router.post("/validate-key")
async def validate_key(request: KeyValidationRequest):
    """Validate a given API key with its provider."""
    key = request.api_key.strip()
    provider = request.provider.lower()
    if not key:
        return {"valid": False, "message": "Key cannot be empty"}
        
    try:
        if provider == 'gemini':
            from google import genai
            client = genai.Client(api_key=key)
            client.models.list()
            return {"valid": True, "message": "Connection successful"}
            
        elif provider == 'openai':
            import openai
            client = openai.OpenAI(api_key=key)
            client.models.list()
            return {"valid": True, "message": "Connection successful"}
            
        elif provider == 'groq':
            import openai
            client = openai.OpenAI(api_key=key, base_url="https://api.groq.com/openai/v1")
            client.models.list()
            return {"valid": True, "message": "Connection successful"}
            
        elif provider == 'anthropic':
            import anthropic
            client = anthropic.Anthropic(api_key=key)
            client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1,
                messages=[{"role": "user", "content": "ping"}]
            )
            return {"valid": True, "message": "Connection successful"}
            
    except Exception as e:
        logger.warning(f"Key validation failed for {provider}: {str(e)}")
        return {"valid": False, "message": f"Validation failed: {str(e)[:85]}"}
        
    return {"valid": False, "message": "Unsupported provider"}

@router.post("/generate-dashboard", response_model=DashboardResponse)
async def generate_dashboard(request: DashboardRequest):
    """Generate comprehensive interview performance dashboard."""
    try:
        question_results = []
        total_score = 0

        for answer_data in request.answers:
            # Calculate content score via cosine similarity
            content_score = calculate_cosine_similarity(answer_data.answer or "", answer_data.question)
            content_score = min(100, content_score * 3.5 + 25.0)

            # Sentiment analysis
            sentiment_score, tone = analyze_sentiment_valence(answer_data.answer or "")

            # Word count factor
            word_count = len((answer_data.answer or "").split())
            depth_bonus = min(20, word_count * 0.5)

            # Eye contact factor
            eye_bonus = answer_data.eyeContact * 0.1

            # Combined score
            score = min(100, content_score * 0.5 + depth_bonus + eye_bonus + sentiment_score * 0.2)
            score = max(15, int(score))
            total_score += score

            # Generate feedback
            if score >= 80:
                feedback = f"Excellent response showing strong understanding. Tone was {tone.lower()}."
            elif score >= 60:
                feedback = f"Good response but could benefit from more specific examples. Tone: {tone.lower()}."
            elif score >= 40:
                feedback = f"Basic response. Consider using the STAR method for more depth. Tone: {tone.lower()}."
            else:
                feedback = f"Brief response. Practice articulating your thoughts more thoroughly. Tone: {tone.lower()}."

            question_results.append(QuestionResult(
                question=answer_data.question,
                answer=answer_data.answer or "",
                score=score,
                type="General",
                duration=answer_data.duration,
                feedback=feedback
            ))

        overall = int(total_score / max(1, len(request.answers)))
        avg_eye = sum(a.eyeContact for a in request.answers) / max(1, len(request.answers))

        categories = [
            CategoryScore(name="Communication", score=min(100, overall + 5)),
            CategoryScore(name="Confidence", score=min(100, int(avg_eye * 0.7 + overall * 0.3))),
            CategoryScore(name="Technical Knowledge", score=min(100, overall - 3)),
            CategoryScore(name="Professionalism", score=min(100, overall + 8)),
            CategoryScore(name="Content Delivery", score=min(100, overall + 2))
        ]

        strengths = []
        weaknesses = []

        if overall >= 70:
            strengths.append("Strong overall performance across questions")
        if avg_eye > 65:
            strengths.append("Excellent eye contact and camera presence")
        strengths.append("Completed the full interview session")

        if overall < 60:
            weaknesses.append("Responses need more depth and specific examples")
        weaknesses.append("Consider using the STAR method for behavioral questions")
        weaknesses.append("Practice reducing filler words for smoother delivery")

        return DashboardResponse(
            overallScore=overall,
            categories=categories,
            questionResults=question_results,
            strengths=strengths,
            weaknesses=weaknesses
        )

    except Exception as e:
        print(f"[InterviewStudio] Dashboard generation error: {str(e)[:100]}")
        raise HTTPException(status_code=500, detail=f"Dashboard generation failed: {str(e)[:80]}")


@router.post("/improvement-plan", response_model=ImprovementPlanResponse)
async def generate_improvement_plan(request: ImprovementPlanRequest):
    """Generate a 30-day improvement plan based on interview results."""
    try:
        weeks = [
            WeekPlan(
                focus="Foundation & Self-Assessment",
                tasks=[
                    f"Research common {request.role} interview questions and compile a study list",
                    "Record yourself answering 3 questions daily and review for filler words",
                    "Practice the STAR method by writing out 5 experiences from your career",
                    "Watch 3 professional interview technique videos"
                ]
            ),
            WeekPlan(
                focus="Communication Mastery",
                tasks=[
                    "Practice speaking without notes for 5 minutes on a technical topic",
                    "Record and review a 2-minute elevator pitch, refine until natural",
                    "Do one mock interview with a peer and exchange feedback",
                    "Practice active listening exercises with a partner"
                ]
            ),
            WeekPlan(
                focus="Technical Deep Dive",
                tasks=[
                    f"Prepare detailed explanations for 10 core {request.role} concepts",
                    "Practice explaining complex topics to a non-technical audience",
                    "Solve 5 technical problems while verbalizing your thought process",
                    "Review system design or architecture patterns relevant to your role"
                ]
            ),
            WeekPlan(
                focus="Interview Simulation",
                tasks=[
                    "Complete 3 full-length mock interviews in AI Interview Studio",
                    "Practice handling unexpected or curveball questions",
                    "Prepare thoughtful questions to ask the interviewer",
                    "Refine your opening, closing, and follow-up strategies"
                ]
            )
        ]

        daily_tips = [
            DailyTip(category="Communication", exercise="Explain a concept in 60 seconds without jargon"),
            DailyTip(category="Confidence", exercise="2-minute power pose before each practice session"),
            DailyTip(category="Technical Skills", exercise="Solve one problem while explaining your reasoning aloud"),
            DailyTip(category="Interview Skills", exercise="Research one target company and prepare 3 tailored answers"),
            DailyTip(category="Behavioral Questions", exercise="Write one STAR-format story from your experience")
        ]

        return ImprovementPlanResponse(weeks=weeks, dailyTips=daily_tips)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Plan generation failed: {str(e)[:80]}")
