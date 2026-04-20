"""
Universal LLM Service - Auto-detecting Omni-Model wrapper
Supports: Gemini, OpenAI, Anthropic with zero frontend changes
Auto-detection based on API key format:
  - AIza* → Google Gemini
  - sk-ant* → Anthropic Claude
  - sk-* → OpenAI GPT
"""
import os
import json
import base64
import io
import asyncio
from typing import Tuple, Optional
import time

try:
    import PyPDF2
except ImportError:
    PyPDF2 = None

from google import genai
import openai
import anthropic


class UniversalLLMService:
    """Omni-Model LLM service with auto-detection based on API key format."""
    
    def __init__(self, api_keys: dict = None, working_model: str = None):
        """Initialize with auto-detection based on API key format.
        
        Args:
            api_keys: Dict with API keys (at least one of: GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY)
            working_model: Optional manual override for model name
        
        Raises:
            Exception: If no valid API key or unsupported format
        """
        self.api_keys = api_keys or {}
        self.api_key = None
        self.provider = None
        self.working_model = working_model
        
        # Auto-detect provider based on API key format
        # Priority: GEMINI > ANTHROPIC > OPENAI
        
        # Check for Gemini (AIza prefix)
        if 'GEMINI_API_KEY' in self.api_keys:
            gemini_key = self.api_keys.get('GEMINI_API_KEY', '').strip()
            if gemini_key and gemini_key.startswith('AIza'):
                self.api_key = gemini_key
                self.provider = 'gemini'
                self.working_model = working_model or 'gemini-2.0-flash'
                self.client = genai.Client(api_key=self.api_key)
                print(f"[LLM] ✓ Gemini provider auto-detected. Model: {self.working_model}")
                return
        
        # Check for Anthropic (sk-ant prefix)
        if 'ANTHROPIC_API_KEY' in self.api_keys:
            anthropic_key = self.api_keys.get('ANTHROPIC_API_KEY', '').strip()
            if anthropic_key and anthropic_key.startswith('sk-ant'):
                self.api_key = anthropic_key
                self.provider = 'anthropic'
                self.working_model = working_model or 'claude-3-5-sonnet-20241022'
                self.client = anthropic.Anthropic(api_key=self.api_key)
                print(f"[LLM] ✓ Anthropic provider auto-detected. Model: {self.working_model}")
                return
        
        # Check for OpenAI (sk- prefix, but not sk-ant)
        if 'OPENAI_API_KEY' in self.api_keys:
            openai_key = self.api_keys.get('OPENAI_API_KEY', '').strip()
            if openai_key and openai_key.startswith('sk-') and not openai_key.startswith('sk-ant'):
                self.api_key = openai_key
                self.provider = 'openai'
                self.working_model = working_model or 'gpt-4o-mini'
                self.client = openai.OpenAI(api_key=self.api_key)
                print(f"[LLM] ✓ OpenAI provider auto-detected. Model: {self.working_model}")
                return
        
        # Fallback: Try to auto-detect from generic GEMINI_API_KEY injection
        if 'GEMINI_API_KEY' in self.api_keys:
            gemini_key = self.api_keys.get('GEMINI_API_KEY', '').strip()
            if gemini_key:
                # Try to detect based on key format
                if gemini_key.startswith('AIza'):
                    self.api_key = gemini_key
                    self.provider = 'gemini'
                    self.working_model = working_model or 'gemini-2.0-flash'
                    self.client = genai.Client(api_key=self.api_key)
                    print(f"[LLM] ✓ Gemini provider auto-detected. Model: {self.working_model}")
                    return
        
        # No valid API key found
        raise Exception(
            "No valid API key detected. "
            "Please provide one of: GEMINI_API_KEY (AIza*), ANTHROPIC_API_KEY (sk-ant*), or OPENAI_API_KEY (sk-*)"
        )
    
    def _call_gemini(self, prompt: str, model: str = None) -> str:
        """Call Gemini API.
        
        Args:
            prompt: The prompt text
            model: Model name to use (defaults to self.working_model)
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If API call fails
        """
        if model is None:
            model = self.working_model
        
        try:
            response = self.client.models.generate_content(
                model=model,
                contents=prompt
            )
            return response.text.strip()
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")
    
    def _call_openai(self, prompt: str, model: str = None, use_json_mode: bool = False) -> str:
        """Call OpenAI API with optional JSON mode.
        
        Args:
            prompt: The prompt text
            model: Model name to use (defaults to self.working_model)
            use_json_mode: Whether to request JSON mode response_format
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If API call fails
        """
        if model is None:
            model = self.working_model
        
        try:
            # Build request kwargs
            kwargs = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
            }
            
            # Add JSON mode if requested (enforces valid JSON output)
            if use_json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            
            response = self.client.chat.completions.create(**kwargs)
            return response.choices[0].message.content.strip()
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    def _call_anthropic(self, prompt: str, model: str = None) -> str:
        """Call Anthropic API with JSON instruction enforcement.
        
        Args:
            prompt: The prompt text
            model: Model name to use (defaults to self.working_model)
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If API call fails
        """
        if model is None:
            model = self.working_model
        
        try:
            # Append strict JSON instruction to prompt for Anthropic
            json_instruction = "\n\nIMPORTANT: Return ONLY valid JSON output with no extra text, markdown, or explanation."
            full_prompt = prompt + json_instruction if "ONLY valid JSON" not in prompt else prompt
            
            response = self.client.messages.create(
                model=model,
                max_tokens=2048,
                messages=[{"role": "user", "content": full_prompt}]
            )
            return response.content[0].text.strip()
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
    
    async def generate_content_with_fallback(
        self, 
        prompt: str, 
        model: str = None, 
        max_retries: int = 4,
        use_json_mode: bool = True
    ) -> str:
        """Generate content using the auto-detected provider with universal rate limit protection.
        
        PRODUCTION-GRADE:
        - Routes to correct provider (Gemini, OpenAI, Anthropic)
        - Enforces JSON mode for OpenAI
        - Appends JSON instruction for Anthropic
        - Retries up to 4 times on rate limits (429) with 10s penalty sleep
        - Fails immediately on auth errors
        - Returns generated content
        
        Args:
            prompt: The prompt text
            model: Model name to use (if not set, uses self.working_model)
            max_retries: Number of retries on transient failures (default: 4)
            use_json_mode: For OpenAI, request JSON mode response format (default: True)
        
        Returns:
            Generated content string
        
        Raises:
            Exception: If generation fails after retries or auth error
        """
        if model is None:
            model = self.working_model
        
        if not model:
            raise Exception(f"No model specified for {self.provider} provider")
        
        last_error = None
        
        for attempt in range(max_retries):
            try:
                print(f"[LLM] [{self.provider.upper()}] Calling {model} (attempt {attempt + 1}/{max_retries})...")
                
                # Route to correct provider
                if self.provider == 'gemini':
                    result = self._call_gemini(prompt, model)
                elif self.provider == 'openai':
                    result = self._call_openai(prompt, model, use_json_mode=use_json_mode)
                elif self.provider == 'anthropic':
                    result = self._call_anthropic(prompt, model)
                else:
                    raise Exception(f"Unknown provider: {self.provider}")
                
                print(f"[LLM] [{self.provider.upper()}] ✓ Response successful")
                return result
            
            except Exception as e:
                last_error = e
                error_str = str(e).lower()
                
                print(f"[LLM] [{self.provider.upper()}] Error on attempt {attempt + 1}: {error_str[:80]}")
                
                # RATE LIMIT HANDLING: 10s sleep and retry
                if any(keyword in error_str for keyword in ['429', 'quota', 'rate_limit', 'resource_exhausted', 'rate limited']):
                    if attempt < max_retries - 1:
                        print(f"[LLM] [{self.provider.upper()}] ⏱ Rate limit hit. Sleeping 10s and retrying...")
                        await asyncio.sleep(10)
                        continue
                    else:
                        print(f"[LLM] [{self.provider.upper()}] ✗ Rate limit persists after {max_retries} retries")
                        raise Exception(f"Rate limit reached. Daily quota may be exhausted. Wait 1 hour and retry.")
                
                # AUTHENTICATION ERRORS: Fail immediately
                if any(keyword in error_str for keyword in ['invalid', 'authentication', 'unauthorized', 'permission', 'api_key', '401', '403']):
                    print(f"[LLM] [{self.provider.upper()}] ✗ Auth error (permanent). Failing immediately.")
                    raise Exception(f"Invalid {self.provider} API key. Please check your credentials.")
                
                # SERVICE UNAVAILABLE (503): Retry with backoff
                if any(keyword in error_str for keyword in ['503', 'unavailable', 'service_unavailable', 'temporarily_unavailable']):
                    if attempt < max_retries - 1:
                        backoff = 2 ** attempt  # Exponential: 1s, 2s, 4s, 8s
                        print(f"[LLM] [{self.provider.upper()}] Service unavailable. Waiting {backoff}s and retrying...")
                        await asyncio.sleep(backoff)
                        continue
                    else:
                        raise Exception(f"{self.provider} service temporarily unavailable. Please retry later.")
                
                # TRANSIENT ERRORS: Retry with backoff
                if attempt < max_retries - 1:
                    backoff = 1 + (attempt * 0.5)  # 1s, 1.5s, 2s, 2.5s
                    print(f"[LLM] [{self.provider.upper()}] Transient error. Waiting {backoff}s and retrying...")
                    await asyncio.sleep(backoff)
                    continue
                
        # All retries exhausted
        raise Exception(f"{self.provider} API failed after {max_retries} attempts: {str(last_error)}")
    
    async def analyze_resume(self, jd_text: str, resume_base64: str, model: str = None) -> Tuple[str, str, list, list, str]:
        """Analyze a resume against job description using the auto-detected provider with strict JSON.
        
        PRODUCTION-GRADE: Works with Gemini, OpenAI, and Anthropic seamlessly.
        Returns: (overall_score, recommendation, strengths, gaps, detailed_feedback)
        """
        if model is None:
            model = self.working_model
        
        if not model:
            raise Exception(f"No model specified for {self.provider} provider")
        
        prompt = f"""You are an expert technical recruiter. Analyze this resume against the job description.

JD: {jd_text}

CRITICAL: Return ONLY valid JSON with no markdown or extra text. Use this exact schema:
{{
  "overall_score": <0-100>,
  "recommendation": "Highly Recommended|Recommended|Consider|Not Recommended",
  "strengths": ["strength1", "strength2", "strength3"],
  "gaps": ["gap1", "gap2", "gap3"],
  "detailed_feedback": "3-4 sentence assessment"
}}

Be specific and professional."""
        
        try:
            # Decode resume PDF
            pdf_data = base64.b64decode(resume_base64)
            
            # Convert PDF to text
            resume_text = "[Resume content unavailable]"
            if PyPDF2:
                try:
                    pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_data))
                    resume_text = ""
                    for page in pdf_reader.pages:
                        resume_text += page.extract_text()
                except Exception as pdf_error:
                    print(f"[RESUME] PDF parsing failed: {str(pdf_error)}")
            
            full_prompt = f"{prompt}\n\nResume Content:\n{resume_text}"
            
            # Use provider's method with JSON mode (OpenAI) or JSON instruction (Anthropic)
            response = await self.generate_content_with_fallback(full_prompt, model, use_json_mode=True)
            raw_text = response.strip()
            
            # Extract JSON object (handles markdown wrapping)
            raw_text = raw_text.replace('```json', '').replace('```', '').strip()
            start = raw_text.find('{')
            end = raw_text.rfind('}') + 1
            if start >= 0 and end > start:
                raw_text = raw_text[start:end]
            
            # Parse JSON with strict error handling
            try:
                data = json.loads(raw_text)
                
                overall_score = str(data.get('overall_score', 'N/A'))
                recommendation = str(data.get('recommendation', 'N/A'))
                strengths = data.get('strengths', [])
                gaps = data.get('gaps', [])
                detailed_feedback = str(data.get('detailed_feedback', 'N/A'))
                
                return (
                    overall_score,
                    recommendation,
                    strengths,
                    gaps,
                    detailed_feedback
                )
            
            except json.JSONDecodeError as json_err:
                print(f"[RESUME] JSON parse failed: {str(json_err)}")
                return (
                    "N/A",
                    "N/A",
                    [],
                    [],
                    f"Analysis complete but JSON parsing failed. Raw: {raw_text[:200]}"
                )
        
        except Exception as error:
            print(f"[RESUME] Analysis failed: {str(error)}")
            raise Exception(f"Resume analysis failed: {str(error)}")
    
    def get_status(self) -> dict:
        """Get service status and provider info."""
        return {
            "provider": self.provider,
            "model": self.working_model,
            "available_providers": [self.provider],
            "total_providers": 1,
            "has_fallback": False
        }


