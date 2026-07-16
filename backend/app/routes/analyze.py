from fastapi import APIRouter, HTTPException
import time
import re
import json
import asyncio
import base64
import io
from io import StringIO
import pandas as pd
try:
    import PyPDF2
except ImportError:
    PyPDF2 = None
try:
    from ..models import (
        BatchAnalysisRequest, 
        StudentAnalysisResult,
        PillarBreakdown,
        ResumeAnalysisRequest,
        ResumeAnalysisResponse,
        InterviewRequest,
        InterviewResponse
    )
    from ..services.llm_service import UniversalLLMService
    from ..services.gemini_service import get_working_model
    from ..services.vector_service import calculate_cosine_similarity
    from ..services.sentiment_service import analyze_sentiment_valence
except (ImportError, ValueError):
    from models import (
        BatchAnalysisRequest, 
        StudentAnalysisResult,
        PillarBreakdown,
        ResumeAnalysisRequest,
        ResumeAnalysisResponse,
        InterviewRequest,
        InterviewResponse
    )
    from services.llm_service import UniversalLLMService
    from services.gemini_service import get_working_model
    from services.vector_service import calculate_cosine_similarity
    from services.sentiment_service import analyze_sentiment_valence
import os

router = APIRouter(prefix="/analyze", tags=["analyze"])

# Predefined skills from job market
PREDEFINED_SKILLS = [
    "python", "java", "c++", "c#", "sql", "javascript", "react",
    "node.js", "aws", "azure", "gcp", "docker", "kubernetes",
    "html", "css", "django", "flask", "git", "machine learning",
    "pandas", "numpy", "mongodb", "postgresql", "mysql",
    "typescript", "angular", "vue", "devops", "spring", "agile",
    "jira", "powerbi", "tableau", "excel", "r", "matlab",
    "figma", "kotlin", "swift", "unity", "salesforce", "sap",
    "selenium", "tensorflow", "pytorch", "spark", "hadoop"
]

# Stopword blacklist for Layer 2 NLP extraction
STOPWORD_BLACKLIST = {
    "learn", "using", "and", "or", "the", "for", "with", "from",
    "ability", "code", "new", "key", "efficient", "strong",
    "good", "basic", "knowledge", "experience", "skill",
    "skills", "work", "working", "team", "role", "system",
    "software", "responsibilities", "responsibility", "tools",
    "tool", "framework", "frameworks", "platform", "platforms",
    "development", "design", "build", "building", "manage",
    "management", "solution", "solutions", "service", "services",
    "support", "maintain", "maintenance", "implement",
    "implementation", "contribute", "contribution", "apply",
    "application", "applications", "provide", "providing",
    "to", "in", "of", "at", "on", "as", "an", "is", "be",
    "by", "it", "do", "if", "we", "up", "so", "no", "go",
    # BUG FIX 3: Additional blacklist words
    "responsibilitiessoftware", "requirement", "requirements",
    "following", "minimum", "maximum", "preferred", "required",
    "must", "should", "will", "have", "has", "been",
    "their", "your", "our", "this", "that", "within", "without",
    "through", "into", "onto", "upon"
}


def split_camelcase(word: str) -> list:
    """
    Split CamelCase or concatenated words by inserting spaces before capitals.
    Also splits words longer than 15 chars at camelCase boundaries.
    Example: "ResponsibilitiesSoftware" → ["responsibilities", "software"]
    """
    # If word is longer than 15 chars, split at camelCase boundaries
    if len(word) > 15:
        # Insert space before uppercase letters, then split
        spaced = re.sub(r'([A-Z])', r' \1', word).lower()
        return [w.strip() for w in spaced.split() if w.strip()]
    
    # Otherwise return as-is (lowercase)
    return [word.lower()]


def clean_skill(skill: str) -> str:
    """
    Nuclear skill cleaner: remove special chars, filter by token length.
    BUG FIX 1: "Responsibilitiessoftware" → "responsibilities software"
    """
    # Remove special characters, keep alphanumerics and common symbols
    skill = re.sub(r'[^a-z0-9\s\.\+#]', ' ', skill.lower())
    # Split into tokens and filter by length (2-20 chars each)
    tokens = [t for t in skill.split() 
              if len(t) >= 2 and len(t) <= 20]
    return ' '.join(tokens).strip()


def extract_jd_intelligence(jd_text: str) -> tuple:
    """
    Phase 0: Extract skills and signals from JD text.
    Returns: (combined_skill_set, jd_type, jd_type_description)
    """
    jd_lower = jd_text.lower()
    
    # Layer 1: Match predefined skills
    layer1_skills = set()
    for skill in PREDEFINED_SKILLS:
        if skill.lower() in jd_lower:
            layer1_skills.add(skill.lower())
    
    # Layer 2: Extract additional skills using NLP patterns
    layer2_skills = set()
    patterns = [
        r'(?:experience in|knowledge of|proficiency in|familiar with|must know|required skills)[:\s]+([^.\n]+)',
        r'\b([a-z]+(?:\s+[a-z]+)*)\s+(?:development|engineering|programming|development|technologies?)\b'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, jd_lower, re.IGNORECASE)
        for match in matches:
            # Extract words and apply filters with CamelCase splitting
            words = match.split()
            for word in words:
                # Split CamelCase/concatenated words
                split_words = split_camelcase(word)
                for split_word in split_words:
                    word_clean = split_word.lower().strip()
                    # Filter: min 3 chars, stopwords, special chars, numbers
                    if (len(word_clean) >= 3 and 
                        word_clean not in STOPWORD_BLACKLIST and
                        not re.search(r'[(),./?<>]', word_clean) and
                        not word_clean.isdigit()):
                        layer2_skills.add(word_clean)
    
    # Combined skill set with deduplication
    combined_skill_set = list(layer1_skills.union(layer2_skills))
    combined_skill_set = sorted([s for s in combined_skill_set if len(s) >= 2])
    
    # BUG FIX 1: Nuclear skill cleaning - apply clean_skill to each skill
    cleaned_skills = set()
    for skill in combined_skill_set:
        cleaned = clean_skill(skill)
        if cleaned and len(cleaned) >= 2:
            # Split cleaned skills back into individual tokens if multiple
            for token in cleaned.split():
                if len(token) >= 2:
                    cleaned_skills.add(token)
    
    # Apply final blacklist
    FINAL_BLACKLIST = {
        "responsibilities", "software", "minimum",
        "maximum", "following", "required", "must",
        "responsibilitiessoftware", "ability", "new",
        "learn", "using", "and", "the", "for", "with",
        "from", "into", "onto", "upon", "within",
        "without", "through", "to", "in", "of", "at",
        "on", "as", "an", "is", "be", "by", "it",
        "we", "up", "so", "no", "go", "or", "if",
        "do", "hi", "me", "my", "he", "she", "they"
    }
    
    combined_skill_set = sorted([
        s for s in cleaned_skills 
        if s.lower() not in FINAL_BLACKLIST and len(s) >= 3
    ])
    
    # JD Type Detection based on keyword counts - BUG FIX 2
    jd_lower = jd_text.lower()
    
    # Service-based signals
    service_keywords = [
        "fresher", "trainee", "entry level", "junior level",
        "entry to junior", "0-2 years", "0 to 2 years",
        "pan india", "rotational", "bond period",
        "bulk hiring", "mass hiring", "on-the-job training",
        "consulting", "client project", "deploy you",
        "sdlc", "agile methodology", "collaborative spirit",
        "global team", "service based", "train you"
    ]
    service_score = sum(1 for k in service_keywords if k in jd_lower)
    
    # Product-based signals
    product_keywords = [
        "data structures", "algorithms", "dsa",
        "system design", "low level design", "lld",
        "high level design", "hld", "distributed systems",
        "competitive programming", "leetcode", "codeforces",
        "open source contribution", "scale to millions",
        "time complexity", "space complexity",
        "tree traversal", "linked list", "dynamic programming"
    ]
    product_score = sum(1 for k in product_keywords if k in jd_lower)
    
    # Academic signals - STRICT, must be research context
    academic_keywords = [
        "phd", "research paper", "thesis", "publication",
        "professor", "research lab", "masters degree",
        "academic research", "scholarly"
    ]
    academic_score = sum(1 for k in academic_keywords if k in jd_lower)
    
    # Decision logic
    if product_score >= 2:
        jd_type = "product_based"
        jd_type_description = "Product-Based JD (Track B) — DSA, core skills and proof of work are primary gates"
    elif academic_score >= 2:
        jd_type = "academic"
        jd_type_description = "Academic JD — CGPA and research potential are primary gates"
    elif service_score >= 2:
        jd_type = "service_based"
        jd_type_description = "Service-Based JD (Track A) — academic filter and core programming are primary gates"
    else:
        jd_type = "balanced"
        jd_type_description = "Balanced JD — standard scoring applied across all pillars"
    
    print(f"[JD TYPE DETECTION] Service: {service_score}, Product: {product_score}, Academic: {academic_score} → {jd_type}")
    
    return combined_skill_set, jd_type, jd_type_description


def get_adaptive_weights(jd_type: str) -> dict:
    """
    Determine weight profile based on JD type.
    Returns dict with weights that sum to 100.
    
    SERVICE_BASED (Track A): 30% Aptitude & Academic filter, 30% Core Programming & SQL
                              20% Corporate Readiness, 20% AI Growth
    PRODUCT_BASED (Track B): 40% DSA + Core Skills, 30% Proof of Work, 20% CS Fundamentals
    """
    weights = {
        "service_based": {
            "skills": 30,
            "academic": 20,
            "corporate": 20,
            "aptitude": 10,
            "portfolio": 0,
            "ai": 20
        },
        "product_based": {
            "skills": 40,
            "academic": 20,
            "corporate": 0,
            "aptitude": 0,
            "portfolio": 30,
            "ai": 10
        },
        "academic": {
            "skills": 20,
            "academic": 45,
            "corporate": 5,
            "aptitude": 5,
            "portfolio": 10,
            "ai": 15
        },
        "balanced": {
            "skills": 35,
            "academic": 20,
            "corporate": 15,
            "aptitude": 10,
            "portfolio": 10,
            "ai": 10
        }
    }
    
    w = weights.get(jd_type, weights["balanced"])
    return {
        "skills": w["skills"],
        "academic": w["academic"],
        "corporate": w["corporate"],
        "aptitude": w["aptitude"],
        "portfolio": w["portfolio"],
        "ai": w["ai"],
        "jd_type": jd_type
    }


def check_hard_gates(row, combined_skill_set: list, jd_text: str) -> tuple:
    """
    Phase 1: Check hard eligibility gates 1 & 2.
    Gate 1: Active backlogs
    Gate 2: CGPA minimum from JD
    Gate 3 (skill mismatch) is checked after pillar 1 calculation.
    
    Returns: (eligible, fail_reason, min_cgpa, gate_type)
    """
    # Gate 1: Active backlogs
    active_backlogs = int(row.get('Active_Backlogs', 0))
    if active_backlogs > 0:
        fail_reason = (f"Active backlogs detected "
                      f"({active_backlogs} backlog/s). "
                      f"Automatically disqualified. Clear all "
                      f"backlogs before applying.")
        return False, fail_reason, 0.0, "backlog"
    
    # Gate 2: CGPA minimum from JD
    # Only match values in valid CGPA range (0.0 to 10.0) to prevent "60%" being read as CGPA 60
    min_cgpa = 0.0
    cgpa_patterns = [
        r'(\d+\.\d+)\s*(?:CGPA|cgpa|GPA|gpa)',
        r'(?:CGPA|cgpa|GPA|gpa)\s*(?:of\s*)?(\d+\.\d+)',
        r'(\d+\.\d+)\s*(?:or above|minimum|min)',
    ]
    
    for pattern in cgpa_patterns:
        matches = re.findall(pattern, jd_text)
        for match in matches:
            val = float(match)
            if 0.0 < val <= 10.0:  # STRICT: must be valid CGPA
                min_cgpa = max(min_cgpa, val)
    
    # Check if student meets CGPA gate
    student_cgpa = float(row.get('CGPA', 0))
    if min_cgpa > 0.0 and student_cgpa < min_cgpa:
        fail_reason = (f"CGPA {student_cgpa} is "
                      f"below the JD minimum of {min_cgpa}. "
                      f"This is a hard cutoff, not a soft filter.")
        return False, fail_reason, min_cgpa, "cgpa"
    
    return True, "", min_cgpa, ""


def calculate_pillar_1_skills(row, combined_skill_set: list, weight_skills: int) -> tuple:
    """
    Pillar 1: Skills Match scoring.
    Returns: (pillar_1_score, present_skills, missing_skills, insight)
    """
    # Parse and clean student skills: split by comma, strip whitespace/punctuation, deduplicate
    student_skills_raw = str(row.get('Technical_Skills', ''))
    student_skills_list = [s.strip().strip(',.').lower() for s in student_skills_raw.split(',')]
    student_skills_set = set([s for s in student_skills_list if s])
    student_skills_str = ' '.join(student_skills_set).lower()
    
    present_skills = []
    for skill in combined_skill_set:
        if skill.lower() in student_skills_set or skill.lower() in student_skills_str:
            present_skills.append(skill)
    
    missing_skills = [s for s in combined_skill_set if s not in present_skills]
    
    target = max(len(combined_skill_set) * 0.4, 3)
    raw_ratio = len(present_skills) / target if target > 0 else 0
    p1_score = min(round(raw_ratio * weight_skills, 1), weight_skills)
    
    # DEBUG LOGGING: BUG 2 - Verify pillar 1 scoring formula
    student_name = row.get('Name', 'Unknown')
    print(f"[PILLAR 1 DEBUG] {student_name}:")
    print(f"  - combined_skill_set size: {len(combined_skill_set)}")
    print(f"  - present_skills count: {len(present_skills)} {present_skills}")
    print(f"  - target value: {target}")
    print(f"  - raw_ratio: {raw_ratio:.3f}")
    print(f"  - weight_skills: {weight_skills}")
    print(f"  - p1_score: {p1_score}")
    
    insight = ""
    if len(present_skills) == 0:
        insight = "Zero skill overlap with JD requirements detected."
    
    return p1_score, present_skills, missing_skills, insight


def calculate_pillar_2_academics(row, weight_academic: int, min_cgpa: float) -> float:
    """
    Pillar 2: Academics scoring with RELATIVE banding.
    Returns: pillar_2_score
    """
    student_cgpa = float(row.get('CGPA', 0))
    gap = student_cgpa - min_cgpa
    
    # Relative banding against JD minimum
    if gap >= 2.0:
        band_pct = 1.0
    elif gap >= 1.0:
        band_pct = 0.80
    elif gap >= 0.5:
        band_pct = 0.65
    elif gap >= 0.0:
        band_pct = 0.50
    else:
        band_pct = 0.0
    
    p2_score = round(band_pct * weight_academic, 1)
    return p2_score


def calculate_corporate_readiness(row, weight_corporate: int, jd_type: str) -> tuple:
    """
    Pillar 3: Corporate Readiness scoring (Track A framework).
    Matches student skills against corporate keywords (Agile, Git, SDLC, DevOps, Cloud, etc).
    Only active for service_based and balanced JD types.
    
    BUG FIX 2: Expanded with cloud/DevOps tools. Updated scoring: 3+/2/1/0 matches.
    
    Returns: (corporate_readiness_score, corporate_matches)
    """
    corporate_keywords = [
        # Version control
        "agile", "git", "github", "gitlab", "bitbucket",
        # Project management  
        "jira", "confluence", "scrum", "kanban", "sprint",
        # SDLC
        "sdlc", "software development life cycle",
        "version control", "ci/cd", "cicd", "jenkins",
        # DevOps & Cloud (strong corporate readiness signal)
        "devops", "docker", "kubernetes", "aws", "azure",
        "gcp", "google cloud", "azure devops",
        "terraform", "ansible",
        # Testing
        "unit testing", "integration testing", "selenium"
    ]
    
    # Only evaluate for service/balanced types
    if jd_type not in ['service_based', 'balanced']:
        return 0, []
    
    student_skills_raw = str(row.get('Technical_Skills', '')).lower()
    
    # Flexible matching: with spaces, without spaces, without slashes
    corporate_matches = [
        k for k in corporate_keywords 
        if k in student_skills_raw 
        or k.replace(" ", "") in student_skills_raw
        or k.replace("/", "") in student_skills_raw
    ]
    
    # BUG FIX 2: Updated scoring based on match count
    if len(corporate_matches) >= 3:
        p_corporate = weight_corporate
    elif len(corporate_matches) == 2:
        p_corporate = round(weight_corporate * 0.75, 1)
    elif len(corporate_matches) == 1:
        p_corporate = round(weight_corporate * 0.4, 1)
    else:
        p_corporate = 0
    
    return p_corporate, corporate_matches


def calculate_pillar_5_portfolio(row, weight_portfolio: int, present_skills: list, combined_skill_set: list) -> tuple:
    """
    Pillar 5: Portfolio scoring with skill-match gating.
    Returns: (pillar_5_score, portfolio_gate_note, portfolio_multiplier)
    """
    # Portfolio gate: multiplier based on skill match
    if len(present_skills) >= 3:
        portfolio_multiplier = 1.0
        portfolio_gate_note = ""
    elif len(present_skills) == 1 or len(present_skills) == 2:
        portfolio_multiplier = 0.5
        portfolio_gate_note = "Portfolio weighted at 50%. Partial skill match means existing projects may not be relevant to this JD."
    else:
        portfolio_multiplier = 0.0
        portfolio_gate_note = "Portfolio score zeroed. Zero skill overlap with JD means existing projects are not relevant to this role. Upskilling must come before portfolio building."
    
    # Apply portfolio gate
    has_portfolio = str(row.get('Has_Portfolio', '')).lower()
    if has_portfolio != 'yes':
        p5_score = 0
        portfolio_gate_note = "No portfolio submitted."
        portfolio_multiplier = 0.0
    else:
        p5_score = round(weight_portfolio * portfolio_multiplier, 1)
    
    return p5_score, portfolio_gate_note, portfolio_multiplier


def calculate_aptitude_pillar(row, weight_aptitude: int, jd_type: str) -> tuple:
    """
    Aptitude pillar: only active for service_based and balanced JD types.
    Returns: (aptitude_score, aptitude_bonus_applied)
    """
    aptitude_bonus_applied = False
    
    if jd_type in ['service_based', 'balanced']:
        aptitude_val = float(row.get('Aptitude_Score', 0))
        if aptitude_val >= 80:
            p_aptitude = weight_aptitude
        elif aptitude_val >= 60:
            p_aptitude = round(weight_aptitude * 0.6, 1)
        else:
            p_aptitude = round(weight_aptitude * 0.3, 1)
        aptitude_bonus_applied = True
    else:
        p_aptitude = 0
    
    return p_aptitude, aptitude_bonus_applied


async def calculate_pillar_4_ai_growth(
    llm_service: UniversalLLMService,
    row,
    combined_skill_set: list,
    jd_type: str,
    present_skills: list,
    missing_skills: list,
    working_model: str = None,
    use_ai: bool = True
) -> tuple:
    """
    Pillar 6: AI Growth scoring with combined AI insight.
    BULLETPROOF ERROR HANDLING:
    - Returns -1 (error indicator) instead of 0 on failures
    - Graceful message: "Processing delayed... retrying shortly"
    - Proper JSON key verification: looks for "growth_potential"
    Returns: (pillar_6_score, growth_reasoning, ai_insight)
    """
    # Default values
    p4_score = 0
    growth_reasoning = "Growth score unavailable"
    ai_insight = "Skills match acceptable for role."
    
    if not use_ai:
        return p4_score, growth_reasoning, ai_insight
    
    student_skills_raw = str(row.get('Technical_Skills', ''))
    student_name = row.get('Name', 'Unknown')
    
    combined_prompt = f"""You are a Senior Technical Recruiter evaluating a fresher candidate.

JD requires (top 10): {', '.join(list(combined_skill_set)[:10]) if combined_skill_set else 'N/A'}

Student Profile:
- Current Skills: {student_skills_raw if student_skills_raw else 'None listed'}
- CGPA: {row.get('CGPA', 0)}
- Has Portfolio: {row.get('Has_Portfolio', 'No')}
- Matched Skills (from JD): {', '.join(present_skills[:5]) if present_skills else 'None'}
- Missing Skills (from JD): {', '.join(missing_skills[:5]) if missing_skills else 'N/A'}

CRITICAL: Return ONLY valid JSON with no markdown formatting or extra text. Use this exact schema:
{{
  "ai_insight": "2 sentence honest verdict on candidacy and fit",
  "growth_potential": <integer from 0 to 15>,
  "growth_reasoning": "1 sentence on capacity to upskill for this role"
}}

Growth Score Guide (0-15 scale):
- 13-15: Strong technical foundation, high learning agility, ready for role
- 9-12: Good potential, some relevant skills, can bridge remaining gaps
- 5-8: Average potential, multiple skill gaps, significant training needed
- 0-4: Weak signals, domain mismatch, or lacks fundamentals

Be honest and direct. Do NOT be lenient with low-fit candidates."""

    try:
        print(f"[AI] Analyzing {student_name} with Gemini...")
        raw = await llm_service.generate_content_with_fallback(combined_prompt, model=working_model)
        raw = raw.replace('```json', '').replace('```', '').strip()
        
        # Extract JSON object from response
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start >= 0 and end > start:
            raw = raw[start:end]
        
        # Parse JSON
        data = json.loads(raw)
        
        # CRITICAL: Enforce "growth_potential" key (NEW - replacing "ai_growth_score")
        ai_insight = str(data.get('ai_insight', 'Skills match acceptable for role.'))
        
        # Try "growth_potential" first, fall back to "ai_growth_score" for compatibility
        if 'growth_potential' in data:
            p4_score = float(data.get('growth_potential', 0))
            print(f"[AI] ✓ Found 'growth_potential' key: {p4_score}")
        elif 'ai_growth_score' in data:
            p4_score = float(data.get('ai_growth_score', 0))
            print(f"[AI] ✓ Found 'ai_growth_score' key (legacy): {p4_score}")
        else:
            raise ValueError(f"Missing both 'growth_potential' and 'ai_growth_score' keys. Found: {list(data.keys())}")
        
        p4_score = max(0, min(15, p4_score))  # Clamp to 0-15 range
        growth_reasoning = str(data.get('growth_reasoning', 'Growth unavailable'))
        
        print(f"[AI] ✓ Success: {student_name} scored {p4_score}")
        
    except json.JSONDecodeError as json_err:
        print(f"[AI] JSON parse error for {student_name}: {str(json_err)}")
        # GRACEFUL ERROR: Return -1 instead of 0
        ai_insight = "Processing delayed... retrying shortly"
        growth_reasoning = "Processing delayed"
        p4_score = -1
        
    except ValueError as value_err:
        error_str = str(value_err).lower()
        print(f"[AI] Validation error for {student_name}: {str(value_err)[:80]}")
        
        # GRACEFUL ERROR: Return -1 instead of 0
        ai_insight = "Processing delayed... retrying shortly"
        growth_reasoning = "Processing delayed"
        p4_score = -1
        
    except Exception as e:
        error_str = str(e).lower()
        print(f"[AI] Error analyzing {student_name}: {str(e)[:80]}")
        
        # Handle specific error types - all return graceful error (-1)
        if '429' in error_str or 'quota' in error_str or 'resource_exhausted' in error_str:
            print(f"[AI] Rate limit hit - returning graceful error")
            ai_insight = "Processing delayed... retrying shortly"
            growth_reasoning = "Rate limited"
            p4_score = -1
        elif 'api_key' in error_str or 'invalid' in error_str or 'authentication' in error_str or 'permission' in error_str or 'unauthorized' in error_str:
            print(f"[AI] Auth error - returning graceful error")
            ai_insight = "Invalid API key. Please re-enter in sidebar."
            growth_reasoning = "Authentication failed"
            p4_score = -1
        elif '503' in error_str or 'unavailable' in error_str or 'service_unavailable' in error_str:
            print(f"[AI] Service unavailable - returning graceful error")
            ai_insight = "Processing delayed... retrying shortly"
            growth_reasoning = "Service unavailable"
            p4_score = -1
        else:
            print(f"[AI] Unexpected error - returning graceful degradation")
            ai_insight = "Processing delayed... retrying shortly"
            growth_reasoning = "Processing delayed"
            p4_score = -1
    
    return p4_score, growth_reasoning, ai_insight


def get_tier(final_score: float) -> str:
    """Determine tier based on final score."""
    if final_score >= 70:
        return "Qualified"
    elif final_score >= 50:
        return "Potential"
    else:
        return "Needs Training"


@router.post("/batch")
async def analyze_batch(request: BatchAnalysisRequest):
    """
    Analyze a batch of students from CSV against a job description.
    
    PRODUCTION-GRADE BULLETPROOFING:
    - Sequential processing (NO concurrent tasks) to avoid rate limits
    - Mandatory 5-second sleep after EVERY student
    - Graceful error handling: scores return -1 instead of 0 on errors
    - Friendly messages: "Processing delayed... retrying shortly" instead of error dumps
    - JSON key verification: strict "growth_potential" key in LLM prompts
    """
    try:
        print(f"[BATCH] Starting SEQUENTIAL batch analysis (free-tier protected)")
        
        # Validate API key
        if not request.api_key or not request.api_key.strip():
            raise HTTPException(
                status_code=401,
                detail="API key required. Please enter your Gemini API key in the sidebar."
            )
        
        api_key_clean = request.api_key.strip()
        print(f"[BATCH] API key validated: {api_key_clean[:8]}...")
        
        # Step 1: Detect working model (Gemini-only auto-detect, others use defaults)
        working_model = None
        if api_key_clean.startswith('AIza'):
            try:
                print(f"[BATCH] Detecting available Gemini model...")
                working_model = get_working_model(api_key_clean)
                print(f"[BATCH] Model auto-detected: {working_model}")
            except Exception as model_error:
                raise HTTPException(
                    status_code=400,
                    detail=f"Model detection failed: {str(model_error)}"
                )
        elif api_key_clean.startswith('gsk_'):
            working_model = "llama-3.3-70b-versatile"
            print(f"[BATCH] Groq API key detected. Model: {working_model}")
        elif api_key_clean.startswith('sk-ant'):
            working_model = "claude-3-5-sonnet-20241022"
            print(f"[BATCH] Anthropic API key detected. Model: {working_model}")
        else:
            working_model = "gpt-4o-mini"
            print(f"[BATCH] OpenAI API key detected. Model: {working_model}")
        
        # Initialize LLM service
        api_keys = {'GEMINI_API_KEY': api_key_clean}
        llm_service = UniversalLLMService(api_keys=api_keys, working_model=working_model)
        print(f"[BATCH] LLM service initialized with model: {working_model}")
        
        # Parse CSV
        csv_file = StringIO(request.csv_data)
        students_df = pd.read_csv(csv_file)
        
        # Normalize columns to prevent KeyError / crashes
        column_mapping = {}
        for col in students_df.columns:
            clean_col = str(col).strip().lower().replace(' ', '_').replace('__', '_')
            if clean_col in ['name', 'student_name', 'candidate_name']:
                column_mapping[col] = 'Name'
            elif clean_col in ['roll', 'roll_no', 'roll_number', 'rollno']:
                column_mapping[col] = 'Roll_Number'
            elif clean_col in ['cgpa', 'gpa']:
                column_mapping[col] = 'CGPA'
            elif clean_col in ['skills', 'technical_skills', 'tech_skills', 'skill_set']:
                column_mapping[col] = 'Technical_Skills'
            elif clean_col in ['backlogs', 'active_backlogs', 'backlog']:
                column_mapping[col] = 'Active_Backlogs'
            elif clean_col in ['portfolio', 'has_portfolio']:
                column_mapping[col] = 'Has_Portfolio'
            elif clean_col in ['aptitude', 'aptitude_score', 'apt_score']:
                column_mapping[col] = 'Aptitude_Score'
        
        students_df = students_df.rename(columns=column_mapping)
        for expected_col in ['Name', 'Roll_Number', 'CGPA', 'Technical_Skills', 'Active_Backlogs', 'Has_Portfolio', 'Aptitude_Score']:
            if expected_col not in students_df.columns:
                students_df[expected_col] = ''
                
        print(f"[BATCH] CSV parsed and normalized: {len(students_df)} students")
        
        # Phase 0: JD Intelligence
        print(f"[BATCH] Phase 0: Extracting JD intelligence...")
        combined_skill_set, jd_type, jd_type_description = extract_jd_intelligence(request.jd_text)
        print(f"[BATCH] JD Type: {jd_type}, Skills found: {len(combined_skill_set)}")
        
        # Get adaptive weights
        weight_dict = get_adaptive_weights(jd_type)
        total_weight = sum([weight_dict['skills'], weight_dict['academic'], weight_dict['corporate'], 
                           weight_dict['aptitude'], weight_dict['portfolio'], weight_dict['ai']])
        assert total_weight == 100, f"Weights must sum to 100, got {total_weight}"
        
        # SEQUENTIAL PROCESSING: Loop through students one-by-one (no concurrent.gather)
        print(f"[BATCH] Processing {len(students_df)} students SEQUENTIALLY (5s throttle per student)...")
        results = []
        
        for index, row in students_df.iterrows():
            student_name = row.get('Name', f'Student_{index}')
            print(f"[BATCH] Processing {index+1}/{len(students_df)}: {student_name}")
            
            try:
                # Extract weights
                weight_skills = weight_dict['skills']
                weight_academic = weight_dict['academic']
                weight_corporate = weight_dict['corporate']
                weight_aptitude = weight_dict['aptitude']
                weight_portfolio = weight_dict['portfolio']
                weight_ai = weight_dict['ai']
                
                # Phase 1: Hard gates 1 & 2
                eligible, fail_reason, min_cgpa, gate_type = check_hard_gates(row, combined_skill_set, request.jd_text)
                
                if not eligible:
                    print(f"[BATCH] {student_name} failed hard gate: {gate_type}")
                    result = StudentAnalysisResult(
                        name=row['Name'],
                        roll_number=str(row.get('Roll_Number', 'N/A')),
                        cgpa=float(row.get('CGPA', 0)),
                        eligible=False,
                        fail_reason=fail_reason,
                        gate_type=gate_type,
                        final_score=0.0,
                        tier="Needs Training",
                        jd_type=jd_type,
                        jd_type_description=jd_type_description,
                        present_skills=[],
                        missing_skills=combined_skill_set,
                        corporate_matches=[],
                        zero_skill_note="",
                        portfolio_gate_note="",
                        portfolio_multiplier=0.0,
                        aptitude_bonus_applied=False,
                        pillar_breakdown=PillarBreakdown(
                            skills=0, academics=0, corporate_readiness=0,
                            aptitude=0, portfolio=0, ai_growth=0
                        ),
                        confidence_level="High",
                        confidence_note=fail_reason,
                        ai_insight=fail_reason,
                        growth_reasoning=""
                    )
                    results.append(result)
                    continue
                
                # Phase 2: 6-Pillar Scoring
                # Pillar 1: Skills
                p1_score, present_skills, missing_skills, skill_insight = calculate_pillar_1_skills(
                    row, combined_skill_set, weight_skills
                )
                
                # Gate 3 check: Skill mismatch
                student_skills_raw = str(row.get('Technical_Skills', ''))
                gate_3_fail = False
                gate_3_fail_reason = ""
                
                if len(present_skills) == 0:
                    gate_3_fail = True
                    sample_required = ', '.join(list(combined_skill_set)[:5])
                    gate_3_fail_reason = (f"Zero skill overlap with JD. "
                                        f"Current skills ({student_skills_raw}) are "
                                        f"completely unrelated to this role. "
                                        f"Required: {sample_required}... "
                                        f"This is a domain mismatch.")
                    gate_type = "skill_mismatch"
                else:
                    gate_type = ""
                
                # Pillar 2: Academics
                p2_score = calculate_pillar_2_academics(row, weight_academic, min_cgpa)
                
                # Pillar 3: Corporate Readiness
                p3_score, corporate_matches = calculate_corporate_readiness(row, weight_corporate, jd_type)
                
                # Pillar 4: Aptitude
                p_aptitude, aptitude_bonus_applied = calculate_aptitude_pillar(row, weight_aptitude, jd_type)
                
                # Pillar 5: Portfolio
                p5_score, portfolio_gate_note, portfolio_multiplier = calculate_pillar_5_portfolio(
                    row, weight_portfolio, present_skills, combined_skill_set
                )
                
                # Pillar 6: AI Growth + AI Insight (LLM call)
                # CRITICAL: This function now has graceful error handling
                p6_score, growth_reasoning, ai_insight = await calculate_pillar_4_ai_growth(
                    llm_service, row, combined_skill_set, jd_type, 
                    present_skills, missing_skills, working_model=working_model, use_ai=True
                )
                
                # Final score with zero-skill penalty
                # CRITICAL: Handle p6_score = -1 (AI growth calculation error)
                # If p6_score is -1 (error indicator), use 0 (no bonus) instead of subtracting
                p6_score_adjusted = p6_score if p6_score >= 0 else 0
                
                if len(present_skills) == 0:
                    final_score = min(p2_score + p_aptitude, 35)
                    zero_skill_note = "Score hard-capped at 35. Zero skill overlap with this JD."
                else:
                    final_score = min(p1_score + p2_score + p3_score + p_aptitude + p5_score + p6_score_adjusted, 100)
                    zero_skill_note = ""
                
                # Phase 3: Confidence
                confidence_score = 100
                if not student_skills_raw or str(student_skills_raw).lower() in ['nan', 'none', '']:
                    confidence_score -= 40
                if len(combined_skill_set) < 3:
                    confidence_score -= 25
                if not row.get('Aptitude_Score'):
                    confidence_score -= 10
                if not row.get('Has_Portfolio'):
                    confidence_score -= 10
                
                if confidence_score >= 80:
                    confidence_level = "High"
                    confidence_note = "All data present. Score is reliable."
                elif confidence_score >= 55:
                    confidence_level = "Medium"
                    confidence_note = "Some data missing. Treat score as directional."
                else:
                    confidence_level = "Low"
                    confidence_note = "Insufficient data. Score may not reflect true potential."
                
                # Create result
                result = StudentAnalysisResult(
                    name=row['Name'],
                    roll_number=str(row.get('Roll_Number', 'N/A')),
                    cgpa=float(row.get('CGPA', 0)),
                    eligible=not gate_3_fail,
                    fail_reason=gate_3_fail_reason if gate_3_fail else "",
                    gate_type=gate_type,
                    final_score=round(final_score, 1),
                    tier=get_tier(final_score),
                    jd_type=jd_type,
                    jd_type_description=jd_type_description,
                    present_skills=[s.title() for s in present_skills],
                    missing_skills=[s.title() for s in missing_skills],
                    corporate_matches=corporate_matches,
                    zero_skill_note=zero_skill_note,
                    portfolio_gate_note=portfolio_gate_note,
                    portfolio_multiplier=portfolio_multiplier,
                    aptitude_bonus_applied=aptitude_bonus_applied,
                    pillar_breakdown=PillarBreakdown(
                        skills=round(p1_score, 1),
                        academics=round(p2_score, 1),
                        corporate_readiness=round(p3_score, 1),
                        aptitude=round(p_aptitude, 1),
                        portfolio=round(p5_score, 1),
                        ai_growth=round(p6_score, 1)
                    ),
                    confidence_level=confidence_level,
                    confidence_note=confidence_note,
                    ai_insight=ai_insight,
                    growth_reasoning=growth_reasoning
                )
                
                results.append(result)
                print(f"[BATCH] ✓ {student_name} completed with score {result.final_score}")
                
            except Exception as e:
                # GRACEFUL ERROR HANDLING: Don't crash, add a failed result
                error_str = str(e).lower()
                print(f"[BATCH] ⚠ Error processing {student_name}: {str(e)[:100]}")
                
                # Create failed result with friendly message
                failed_result = StudentAnalysisResult(
                    name=student_name,
                    roll_number=str(row.get('Roll_Number', 'N/A')),
                    cgpa=float(row.get('CGPA', 0)),
                    eligible=False,
                    fail_reason="Processing delayed due to API throttling",
                    gate_type="processing_error",
                    final_score=-1,  # Use -1 instead of 0 to indicate error
                    tier="Needs Training",
                    jd_type=jd_type,
                    jd_type_description=jd_type_description,
                    present_skills=[],
                    missing_skills=combined_skill_set,
                    corporate_matches=[],
                    zero_skill_note="",
                    portfolio_gate_note="Analysis skipped",
                    portfolio_multiplier=0.0,
                    aptitude_bonus_applied=False,
                    pillar_breakdown=PillarBreakdown(
                        skills=-1, academics=-1, corporate_readiness=-1,
                        aptitude=-1, portfolio=-1, ai_growth=-1
                    ),
                    confidence_level="Low",
                    confidence_note="Processing delayed... retrying shortly",
                    ai_insight="Processing delayed... retrying shortly",
                    growth_reasoning="Processing delayed"
                )
                results.append(failed_result)
            
            # MANDATORY 4-SECOND THROTTLE after EVERY single student
            # Free-tier Gemini: 15 RPM = 1 request per 4 seconds
            # 4s throttle ensures we comply with the limits
            print(f"[BATCH] ⏱ Throttling 4s (RPM quota protection: 15 RPM = 1 req per 4s)...")
            await asyncio.sleep(4)
        
        print(f"[BATCH] ✓ Analysis complete: {len(results)} students processed")
        
        # Get min_cgpa from JD (for response metadata)
        min_cgpa = 0.0
        cgpa_patterns = [
            r'(\d+\.\d+)\s*(?:CGPA|cgpa|GPA|gpa)',
            r'(?:CGPA|cgpa|GPA|gpa)\s*(?:of\s*)?(\d+\.\d+)',
        ]
        for pattern in cgpa_patterns:
            matches = re.findall(pattern, request.jd_text)
            for match in matches:
                val = float(match)
                if 0.0 < val <= 10.0:
                    min_cgpa = max(min_cgpa, val)
        
        return {
            "total_students": len(students_df),
            "analyzed_students": len(results),
            "jd_intelligence": {
                "combined_skill_set": combined_skill_set,
                "jd_type": jd_type,
                "jd_type_description": jd_type_description,
                "weight_profile": weight_dict,
                "min_cgpa": min_cgpa
            },
            "results": results
        }
    
    except pd.errors.ParserError as e:
        raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"[BATCH] FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Batch analysis error: {str(e)[:100]}")


@router.post("/resume")
async def analyze_resume(request: ResumeAnalysisRequest):
    """
    Analyze a single resume PDF against a job description.
    PRODUCTION-GRADE: Bulletproof JSON parsing, exponential backoff error handling,
    strict "missing" key enforcement for skill extraction.
    
    Args:
        request: ResumeAnalysisRequest with jd_text and resume_base64
    
    Returns:
        ResumeAnalysisResponse with analysis results
    """
    try:
        print(f"[RESUME] Starting single resume analysis")
        
        # Validate API key
        if not request.api_key or not request.api_key.strip():
            raise HTTPException(
                status_code=401,
                detail="API key required. Please enter your API key in the sidebar."
            )
        
        api_key_clean = request.api_key.strip()
        print(f"[RESUME] API key validated: {api_key_clean[:8]}...")
        
        # Step 1: Detect working model (Gemini-only auto-detect, others use defaults)
        working_model = None
        if api_key_clean.startswith('AIza'):
            try:
                print(f"[RESUME] Detecting available Gemini model...")
                working_model = get_working_model(api_key_clean)
                print(f"[RESUME] Model auto-detected: {working_model}")
            except Exception as model_error:
                error_str = str(model_error).lower()
                if 'api_key' in error_str or 'authentication' in error_str or 'invalid' in error_str:
                    raise HTTPException(
                        status_code=401,
                        detail="Invalid Gemini API key. Please check your key in the sidebar."
                    )
                elif '429' in error_str or 'quota' in error_str or 'resource_exhausted' in error_str:
                    raise HTTPException(
                        status_code=429,
                        detail="Rate limit reached. Wait 1 minute and retry. Daily quota may be exhausted."
                    )
                else:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Model detection failed: {str(model_error)[:80]}"
                    )
        elif api_key_clean.startswith('gsk_'):
            working_model = "llama-3.3-70b-versatile"
            print(f"[RESUME] Groq API key detected. Model: {working_model}")
        elif api_key_clean.startswith('sk-ant'):
            working_model = "claude-3-5-sonnet-20241022"
            print(f"[RESUME] Anthropic API key detected. Model: {working_model}")
        else:
            working_model = "gpt-4o-mini"
            print(f"[RESUME] OpenAI API key detected. Model: {working_model}")
        
        # Initialize LLM service
        api_keys = {'GEMINI_API_KEY': api_key_clean}
        llm_service = UniversalLLMService(api_keys=api_keys, working_model=working_model)
        print(f"[RESUME] LLM service initialized with model: {working_model}")
        
        # Analyze resume using LLM service with strict JSON
        print(f"[RESUME] Analyzing resume against JD...")
        overall_score, recommendation, strengths, gaps, feedback = await llm_service.analyze_resume(
            request.jd_text,
            request.resume_base64,
            model=working_model
        )
        
        print(f"[RESUME] ✓ Analysis complete. Score: {overall_score}, Recommendation: {recommendation}")
        
        return ResumeAnalysisResponse(
            overall_score=overall_score,
            recommendation=recommendation,
            strengths=strengths,
            gaps=gaps,
            detailed_feedback=feedback
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions (already formatted for client)
        raise
    except Exception as e:
        error_str = str(e).lower()
        print(f"[RESUME] Error: {str(e)[:100]}")
        
        # Handle specific error types
        if '429' in error_str or 'quota' in error_str or 'resource_exhausted' in error_str or 'rate_limit' in error_str:
            raise HTTPException(
                status_code=429,
                detail="Rate limit reached. Wait 1 minute and retry. Your daily API quota may be exhausted."
            )
        elif 'api_key' in error_str or 'invalid' in error_str or 'authentication' in error_str or 'permission' in error_str or 'unauthorized' in error_str:
            raise HTTPException(
                status_code=401,
                detail="Invalid API key. Please re-enter your Gemini API key in the sidebar."
            )
        elif '503' in error_str or 'unavailable' in error_str or 'service_unavailable' in error_str:
            raise HTTPException(
                status_code=503,
                detail="Gemini API temporarily unavailable. Please retry in a few moments."
            )
        elif 'pdf' in error_str or 'parse' in error_str:
            raise HTTPException(
                status_code=400,
                detail="Error parsing PDF. Please ensure the file is a valid PDF."
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Resume analysis error: {str(e)[:80]}"
            )
def offline_heuristic_engine(student_text: str, jd_text: str, student_data: dict = None) -> dict:
    """
    UNIVERSAL OFFLINE HEURISTIC ENGINE - Lightning-Fast Mathematical Framework
    
    A rigorous, deterministic scoring system that bypasses AI completely.
    Uses keyword-based classification and proven weight formulas for Track A & B.
    Returns individual pillar scores that map to the 6-pillar breakdown.
    
    Args:
        student_text: Student/resume text content (skills, branch, etc.)
        jd_text: Job description text
        student_data: Optional dict with 'cgpa' and 'active_backlogs' (Track A)
    
    Returns:
        Dict with PillarBreakdown and metadata:
            - pillar_breakdown: Dict with skills, academics, corporate_readiness, aptitude, portfolio, ai_growth
            - readiness_score: 0-100 integer (weighted sum of pillars)
            - growth_potential: 5-15 points above readiness
            - tier: "Qualified" / "Potential" / "Needs Training"
            - ai_insight: Structured evaluation string
            - missing: List of unmatched keywords
            - jd_type: "Track A (Service-Based)" or "Track B (Product-Based)"
            - track_classification: Internal flag for which formula used
    """
    
    # ========================================================================
    # STEP A: JD CLASSIFICATION (Track A vs Track B)
    # ========================================================================
    jd_lower = jd_text.lower()
    
    # Track A signals (Service-based): Aptitude, CGPA, process-oriented
    track_a_signals = [
        'fresher', 'trainee', 'entry level', 'junior', '0-2 years',
        'aptitude', 'cgpa', 'corporate', 'sdlc', 'agile', 'process',
        'support', 'maintenance', 'training', 'batch hiring', 'on-the-job'
    ]
    
    # Track B signals (Product-based): DSA, system design, innovation
    track_b_signals = [
        'dsa', 'algorithm', 'system design', 'startup', 'scale',
        'innovation', 'github', 'github repository', 'deployed',
        'complexity', 'tree', 'graph', 'microservice', 'architecture',
        'leetcode', 'competitive'
    ]
    
    track_a_count = sum(1 for sig in track_a_signals if sig in jd_lower)
    track_b_count = sum(1 for sig in track_b_signals if sig in jd_lower)
    
    is_track_a = track_a_count >= track_b_count
    track_type = "Track A (Service-Based)" if is_track_a else "Track B (Product-Based)"
    
    print(f"[OFFLINE] JD Classification: Track A signals={track_a_count}, Track B signals={track_b_count} → {track_type}")
    
    # ========================================================================
    # STEP B: KEYWORD DICTIONARIES (Predefined by Track)
    # ========================================================================
    
    # TRACK A: Service-based organizations
    # PILLAR MAPPING:
    #   - academic_aptitude keywords → academics pillar (30%)
    #   - core_programming keywords → skills pillar (30%)
    #   - communication keywords → aptitude pillar (20%)
    #   - corporate_readiness keywords → corporate_readiness pillar (20%)
    track_a_keywords = {
        'academic_aptitude': [
            'cgpa', 'gpa', 'backlogs', 'academic', 'sem', 'semester',
            'exam', 'marks', 'sgpa', 'discipline', 'punctuality'
        ],
        'core_programming': [
            'java', 'python', 'c++', 'c#', 'sql', 'database',
            'mysql', 'postgresql', 'oops', 'oop', 'coding'
        ],
        'communication': [
            'agile', 'scrum', 'sprint', 'presentation', 'communication',
            'leadership', 'team', 'collaboration', 'meeting', 'client'
        ],
        'corporate_readiness': [
            'git', 'github', 'sdlc', 'jira', 'jenkins', 'devops',
            'ci/cd', 'process', 'docker', 'aws', 'azure', 'gcp'
        ]
    }
    
    # TRACK B: Product-based/innovative organizations
    # PILLAR MAPPING:
    #   - dsa keywords → skills pillar (40%)
    #   - proof_of_work keywords → portfolio pillar (30%)
    #   - core_cs keywords → academics pillar (20%)
    #   - system_design keywords → corporate_readiness pillar (10%)
    track_b_keywords = {
        'dsa': [
            'dsa', 'algorithm', 'complexity', 'time complexity', 'space complexity',
            'tree', 'graph', 'sorting', 'search', 'dynamic programming',
            'dp', 'linked list', 'array', 'hash map', 'stack', 'queue'
        ],
        'proof_of_work': [
            'github', 'repository', 'deployed', 'production', 'live',
            'project', 'web', 'framework', 'react', 'angular',
            'django', 'flask', 'commit', 'open source', 'contribution'
        ],
        'core_cs': [
            'os', 'operating system', 'dbms', 'networks', 'tcp', 'http',
            'database', 'relational', 'normalization', 'indexing',
            'cache', 'memory', 'process', 'thread'
        ],
        'system_design': [
            'api', 'rest', 'graphql', 'architecture', 'microservice',
            'scaling', 'load balancing', 'design pattern', 'distributed',
            'sharding', 'replication', 'consistency', 'availability'
        ]
    }
    
    student_text_lower = student_text.lower()
    
    # ========================================================================
    # STEP C: CALCULATE COVERAGE FOR EACH CATEGORY
    # ========================================================================
    
    def calc_keyword_coverage(keywords_dict: dict) -> dict:
        """
        Calculate normalized coverage (0-1) for each category.
        Coverage = (matched_keywords / total_keywords_in_category)
        """
        coverage = {}
        for category, keywords in keywords_dict.items():
            matched = sum(1 for kw in keywords if kw in student_text_lower)
            total = len(keywords)
            coverage[category] = matched / total if total > 0 else 0
        return coverage
    
    keyword_dict = track_a_keywords if is_track_a else track_b_keywords
    coverage = calc_keyword_coverage(keyword_dict)
    
    # ========================================================================
    # STEP D: MAP COVERAGE TO PILLARS WITH WEIGHTS
    # ========================================================================
    
    if is_track_a:
        # TRACK A FORMULA (Service-Based): 30% skills + 30% academics + 20% corporate_readiness + 20% aptitude
        # Calculate pillar scores based on coverage (0-1 scale) × weight
        p_skills = coverage.get('core_programming', 0) * 30    
        p_academic = coverage.get('academic_aptitude', 0) * 30
        p_corporate = coverage.get('corporate_readiness', 0) * 20
        p_aptitude = coverage.get('communication', 0) * 20
        p_portfolio = 0.0  # Track A doesn't emphasize portfolio
        
        # Initial readiness score from pillars
        readiness_score = p_skills + p_academic + p_corporate + p_aptitude
        
        # CRITICAL RULE: Active backlogs > 0 → instant 25-point deduction
        if student_data and student_data.get('active_backlogs', 0) > 0:
            print(f"[OFFLINE] Backlog penalty applied: {student_data.get('active_backlogs')} backlogs found")
            readiness_score = max(0, readiness_score - 25)
        
        print(f"[OFFLINE] Track A Pillars: Skills={p_skills:.1f} + Academics={p_academic:.1f} + "
              f"Corporate={p_corporate:.1f} + Aptitude={p_aptitude:.1f} = {readiness_score:.1f}")
        
    else:
        # TRACK B FORMULA (Product-Based): 40% skills + 30% portfolio + 20% academics + 10% corporate_readiness
        # Calculate pillar scores based on coverage (0-1 scale) × weight
        p_skills = coverage.get('dsa', 0) * 40
        p_portfolio = coverage.get('proof_of_work', 0) * 30
        p_academic = coverage.get('core_cs', 0) * 20
        p_corporate = coverage.get('system_design', 0) * 10
        p_aptitude = 0.0  # Track B doesn't emphasize aptitude
        
        # Initial readiness score from pillars
        readiness_score = p_skills + p_portfolio + p_academic + p_corporate
        
        print(f"[OFFLINE] Track B Pillars: Skills={p_skills:.1f} + Portfolio={p_portfolio:.1f} + "
              f"Academics={p_academic:.1f} + Corporate={p_corporate:.1f} = {readiness_score:.1f}")
    
    # Clamp to 0-100 range
    readiness_score = float(max(0, min(100, readiness_score)))
    
    # ========================================================================
    # STEP E: GROWTH POTENTIAL AND TIER
    # ========================================================================
    
    # Convert to integer for final score
    final_score = int(round(readiness_score))
    
    # Growth Potential: 5-15 points higher than readiness (varies by track strength)
    growth_delta = min(15, max(5, int(readiness_score / 10)))  # Scales with confidence
    growth_potential = min(100, final_score + growth_delta)
    
    # Pillar ai_growth represents growth potential scaled to a 0-15 range
    pillar_ai_growth = round(float(growth_potential), 1)
    
    # Determine tier based on score
    if final_score >= 70:
        tier = "Qualified"
    elif final_score >= 50:
        tier = "Potential"
    else:
        tier = "Needs Training"
    
    # Generate structured AI insight
    if is_track_a:
        if final_score >= 70:
            verdict = "Strong fit for Track A (Service). Academic and programming foundations solid."
        elif final_score >= 50:
            verdict = "Moderate fit for Track A. Core skills present, may need communication/corporate polish."
        else:
            verdict = "Track A role challenging. Needs academic/programming upskilling or corporate training."
        ai_insight = f"Evaluated via Fast Logic (Track A - Service-Based). {verdict}"
    else:
        if final_score >= 70:
            verdict = "Strong fit for Track B (Product). DSA and proof-of-work excellent."
        elif final_score >= 50:
            verdict = "Moderate fit for Track B. Some DSA/system design gaps but core CS solid."
        else:
            verdict = "Track B role demanding. Needs significant DSA and system design preparation."
        ai_insight = f"Evaluated via Fast Logic (Track B - Product-Based). {verdict}"
    
    # Find missing keywords
    # CRITICAL: Assign to key "missing" (NOT "missing_skills") to avoid NameError in architecture
    all_keywords = []
    for category_keywords in keyword_dict.values():
        all_keywords.extend(category_keywords)
    
    missing = [kw for kw in all_keywords if kw not in student_text_lower]
    missing = list(dict.fromkeys(missing))  # Remove duplicates, preserve order
    missing = missing[:10]  # Top 10 unique missing skills
    
    # ========================================================================
    # STEP G: GENERATE PREMIUM FORMATTED GAP DESCRIPTIONS
    # ========================================================================
    
    # Map keywords to user-friendly gap descriptions (professional, pillar-aware)
    gap_descriptions = {
        # CORE PROGRAMMING (Pillar 1: Skills)
        'python': 'Missing core Python programming skills - critical for backend development',
        'java': 'Missing Java expertise - essential for enterprise backend development',
        'c++': 'Missing C++ systems programming - required for performance-critical systems',
        'c#': 'Missing C# and .NET framework experience - needed for Microsoft stack roles',
        'sql': 'Missing SQL expertise - core skill for database design and optimization',
        'javascript': 'Missing JavaScript proficiency - essential for full-stack development',
        'react': 'Missing React.js framework experience - in-demand for modern web development',
        'angular': 'Missing Angular framework skills - required for enterprise frontend roles',
        'typescript': 'Missing TypeScript proficiency - increasingly required in modern stacks',
        'node.js': 'Missing Node.js backend experience - critical for JavaScript-based services',
        'golang': 'Missing Go programming skills - needed for cloud-native and microservices',
        'rust': 'Missing Rust systems programming knowledge - required for performance optimization',
        
        # ALGORITHMS & DATA STRUCTURES (Pillar 1: Skills)
        'dsa': 'Missing core Data Structures and Algorithms knowledge - essential for technical interviews',
        'algorithm': 'Missing algorithmic problem-solving abilities - critical for product-based roles',
        'leetcode': 'Missing competitive programming experience - important for technical assessments',
        
        # ACADEMICS & FUNDAMENTALS (Pillar 2: Academics)
        'os': 'Missing Operating Systems fundamentals - core CS concept',
        'dbms': 'Missing Database Management Systems knowledge - fundamental for data handling',
        'networks': 'Missing networking concepts - essential for distributed systems',
        'tcp': 'Missing TCP/IP protocol understanding - required for network architecture',
        'http': 'Missing HTTP protocol knowledge - fundamental for web development',
        'relational': 'Missing relational database concepts - critical for data modeling',
        
        # CORPORATE READINESS (Pillar 3: Corporate Readiness)
        'git': 'Missing Git version control expertise - essential for team collaboration',
        'github': 'Missing GitHub portfolio presence - important for demonstrating project work',
        'docker': 'Missing containerization with Docker - core DevOps skill',
        'aws': 'Missing AWS cloud infrastructure knowledge - increasingly required in modern roles',
        'azure': 'Missing Microsoft Azure experience - essential for enterprise cloud deployments',
        'agile': 'Missing Agile development methodology knowledge - required for modern teams',
        'scrum': 'Missing Scrum and sprint management practices - essential for team workflows',
        'devops': 'Missing core Corporate Readiness signals like DevOps CI/CD pipeline skills',
        'ci/cd': 'Missing CI/CD automation expertise - critical for continuous integration workflows',
        'jenkins': 'Missing Jenkins CI/CD automation skills - required for build pipeline management',
        'jira': 'Missing JIRA project tracking experience - essential for agile team coordination',
        'sdlc': 'Missing Software Development Lifecycle process understanding - core corporate skill',
        
        # SYSTEM DESIGN & ARCHITECTURE (Pillar 3: Corporate Readiness)
        'system design': 'Missing scalable system architecture design knowledge - required for senior roles',
        'microservice': 'Missing microservices architecture understanding - modern system design pattern',
        'api': 'Missing API design and implementation experience',
        'rest': 'Missing RESTful API design principles - foundational for web services',
        'graphql': 'Missing GraphQL query language expertise - modern alternative to REST',
        'design pattern': 'Missing software design pattern knowledge - essential for clean architecture',
        'distributed': 'Missing distributed systems understanding - critical for scaling',
        
        # QUALITY ASSURANCE (Pillar 3: Corporate Readiness)
        'testing': 'Missing software testing and QA practices - essential for code quality',
        'selenium': 'Missing Selenium automation testing skills - required for QA roles',
        
        # PORTFOLIO & PROJECT WORK (Pillar 5: Portfolio)
        'deployed': 'Missing evidence of deployed production projects - critical for product roles',
        'production': 'Missing real-world production deployment experience - key for commercial projects',
        'github repository': 'Missing GitHub repository with substantial project contributions',
        'open source': 'Missing open source contributions - valuable for demonstrating skills',
        
        # ADVANCED CONCEPTS
        'kubernetes': 'Missing Kubernetes container orchestration expertise - required for enterprise DevOps',
        'machine learning': 'Missing machine learning implementation skills - required for ML engineer roles',
        'tensorflow': 'Missing TensorFlow deep learning framework experience',
        'spark': 'Missing Apache Spark big data processing knowledge',
        'hadoop': 'Missing Hadoop ecosystem expertise - required for big data roles',
    }
    
    # Generate formatted gaps list with premium descriptions
    gaps_list = []
    for keyword in missing[:5]:  # Top 5 missing skills
        if keyword in gap_descriptions:
            gaps_list.append(gap_descriptions[keyword])
        else:
            # Dynamic formatting for unknown keywords with professional context
            formatted = keyword.replace('_', ' ').replace('-', ' ').title()
            gaps_list.append(f'Missing core expertise in {formatted} - important for this role')
    
    # ========================================================================
    # STEP H: BUILD PILLAR BREAKDOWN
    # ========================================================================
    
    pillar_breakdown = {
        'skills': round(p_skills, 1),
        'academics': round(p_academic, 1),
        'corporate_readiness': round(p_corporate, 1),
        'aptitude': round(p_aptitude, 1),
        'portfolio': round(p_portfolio, 1),
        'ai_growth': 0.0  # Always 0 for offline
    }
    
    return {
        'pillar_breakdown': pillar_breakdown,
        'readiness_score': final_score,
        'growth_potential': growth_potential,
        'tier': tier,
        'ai_insight': ai_insight,
        'missing': missing,
        'gaps_list': gaps_list,
        'jd_type': track_type,
        'track_classification': 'Track A' if is_track_a else 'Track B'
    }


# ============================================================================
# OFFLINE ENDPOINTS - Lightning-Fast Heuristic Scoring
# ============================================================================

@router.post("/batch/offline")
async def analyze_batch_offline(request: BatchAnalysisRequest):
    """
    OFFLINE batch analysis using modular pillar functions (NO AI calls).
    
    Uses same exact pillar calculation functions as AI endpoint:
    - check_hard_gates, calculate_pillar_1_skills, calculate_pillar_2_academics
    - calculate_corporate_readiness, calculate_aptitude_pillar, calculate_pillar_5_portfolio
    
    Hardcodes ai_growth to 0 (no LLM evaluation for offline).
    
    Returns exact same StudentAnalysisResult structure as AI endpoints.
    Frontend can use responses interchangeably.
    
    CSV must have columns: Name, Roll_Number, CGPA, Technical_Skills, Active_Backlogs (optional), Has_Portfolio (optional), Aptitude_Score (optional)
    """
    try:
        print(f"[BATCH-OFFLINE] ====== Starting OFFLINE batch analysis (NO AI CALLS) ======")
        
        # Parse CSV
        try:
            csv_df = pd.read_csv(StringIO(request.csv_data))
            
            # Normalize columns to prevent KeyError / crashes
            column_mapping = {}
            for col in csv_df.columns:
                clean_col = str(col).strip().lower().replace(' ', '_').replace('__', '_')
                if clean_col in ['name', 'student_name', 'candidate_name']:
                    column_mapping[col] = 'Name'
                elif clean_col in ['roll', 'roll_no', 'roll_number', 'rollno']:
                    column_mapping[col] = 'Roll_Number'
                elif clean_col in ['cgpa', 'gpa']:
                    column_mapping[col] = 'CGPA'
                elif clean_col in ['skills', 'technical_skills', 'tech_skills', 'skill_set']:
                    column_mapping[col] = 'Technical_Skills'
                elif clean_col in ['backlogs', 'active_backlogs', 'backlog']:
                    column_mapping[col] = 'Active_Backlogs'
                elif clean_col in ['portfolio', 'has_portfolio']:
                    column_mapping[col] = 'Has_Portfolio'
                elif clean_col in ['aptitude', 'aptitude_score', 'apt_score']:
                    column_mapping[col] = 'Aptitude_Score'
            
            csv_df = csv_df.rename(columns=column_mapping)
            for expected_col in ['Name', 'Roll_Number', 'CGPA', 'Technical_Skills', 'Active_Backlogs', 'Has_Portfolio', 'Aptitude_Score']:
                if expected_col not in csv_df.columns:
                    csv_df[expected_col] = ''
            
            print(f"[BATCH-OFFLINE] CSV parsed and normalized: {len(csv_df)} students")
            print(f"[BATCH-OFFLINE] CSV columns: {list(csv_df.columns)}")
        except Exception as csv_error:
            print(f"[BATCH-OFFLINE] CSV parsing error: {str(csv_error)}")
            raise HTTPException(status_code=400, detail=f"Invalid CSV format: {str(csv_error)}")
        
        # Phase 0: Extract JD Intelligence
        print(f"[BATCH-OFFLINE] Phase 0: Extracting JD intelligence...")
        combined_skill_set, jd_type, jd_type_description = extract_jd_intelligence(request.jd_text)
        print(f"[BATCH-OFFLINE] JD Type: {jd_type}, Combined skills extracted: {len(combined_skill_set)}")
        
        # Get adaptive weights
        weight_dict = get_adaptive_weights(jd_type)
        total_weight = sum([weight_dict['skills'], weight_dict['academic'], weight_dict['corporate'], 
                           weight_dict['aptitude'], weight_dict['portfolio'], weight_dict['ai']])
        print(f"[BATCH-OFFLINE] Weight profile: Skills={weight_dict['skills']}%, Academic={weight_dict['academic']}%, "
              f"Corporate={weight_dict['corporate']}%, Aptitude={weight_dict['aptitude']}%, "
              f"Portfolio={weight_dict['portfolio']}%, AI={weight_dict['ai']}% (Total={total_weight})")
        
        # Process each student
        results = []
        
        for index, row in csv_df.iterrows():
            student_name = row.get('Name', f'Student_{index}')
            print(f"[BATCH-OFFLINE] Processing {index+1}/{len(csv_df)}: {student_name}")
            
            try:
                # Extract weights
                weight_skills = weight_dict['skills']
                weight_academic = weight_dict['academic']
                weight_corporate = weight_dict['corporate']
                weight_aptitude = weight_dict['aptitude']
                weight_portfolio = weight_dict['portfolio']
                weight_ai = weight_dict['ai']
                
                # Phase 1: Hard gates 1 & 2 (backlogs, CGPA)
                eligible, fail_reason, min_cgpa, gate_type = check_hard_gates(row, combined_skill_set, request.jd_text)
                
                if not eligible:
                    print(f"[BATCH-OFFLINE] {student_name} failed hard gate: {gate_type}")
                    result = StudentAnalysisResult(
                        name=row['Name'],
                        roll_number=str(row.get('Roll_Number', 'N/A')),
                        cgpa=float(row.get('CGPA', 0)),
                        eligible=False,
                        fail_reason=fail_reason,
                        gate_type=gate_type,
                        final_score=0.0,
                        tier="Needs Training",
                        jd_type=jd_type,
                        jd_type_description=jd_type_description,
                        present_skills=[],
                        missing_skills=combined_skill_set,
                        corporate_matches=[],
                        zero_skill_note="",
                        portfolio_gate_note="",
                        portfolio_multiplier=0.0,
                        aptitude_bonus_applied=False,
                        pillar_breakdown=PillarBreakdown(
                            skills=0, academics=0, corporate_readiness=0,
                            aptitude=0, portfolio=0, ai_growth=0
                        ),
                        confidence_level="High",
                        confidence_note=fail_reason,
                        ai_insight=fail_reason,
                        growth_reasoning=""
                    )
                    results.append(result)
                    continue
                
                # Phase 2: Calculate 6 pillars using modular functions
                # Pillar 1: Skills
                p1_score, present_skills, missing_skills, skill_insight = calculate_pillar_1_skills(
                    row, combined_skill_set, weight_skills
                )
                
                # Gate 3 check: Skill mismatch
                student_skills_raw = str(row.get('Technical_Skills', ''))
                gate_3_fail = False
                gate_3_fail_reason = ""
                
                if len(present_skills) == 0:
                    gate_3_fail = True
                    sample_required = ', '.join(list(combined_skill_set)[:5])
                    gate_3_fail_reason = (f"Zero skill overlap with JD. "
                                        f"Current skills ({student_skills_raw}) are "
                                        f"completely unrelated to this role. "
                                        f"Required: {sample_required}... "
                                        f"This is a domain mismatch.")
                    gate_type = "skill_mismatch"
                else:
                    gate_type = ""
                
                # Pillar 2: Academics
                p2_score = calculate_pillar_2_academics(row, weight_academic, min_cgpa)
                
                # Pillar 3: Corporate Readiness
                p3_score, corporate_matches = calculate_corporate_readiness(row, weight_corporate, jd_type)
                
                # Pillar 4: Aptitude
                p_aptitude, aptitude_bonus_applied = calculate_aptitude_pillar(row, weight_aptitude, jd_type)
                
                # Pillar 5: Portfolio
                p5_score, portfolio_gate_note, portfolio_multiplier = calculate_pillar_5_portfolio(
                    row, weight_portfolio, present_skills, combined_skill_set
                )
                
                # Pillar 6: AI Growth - HARDCODED TO 0 FOR OFFLINE
                p6_score = 0.0
                growth_reasoning = "Growth potential unavailable in offline mode"
                ai_insight = f"Offline analysis: No AI evaluation. Score based on skill match ({len(present_skills)}/{len(combined_skill_set)} skills matched)."
                
                # Calculate final score
                if len(present_skills) == 0:
                    final_score = min(p2_score + p_aptitude, 35)
                    zero_skill_note = "Score hard-capped at 35. Zero skill overlap with this JD."
                else:
                    final_score = min(p1_score + p2_score + p3_score + p_aptitude + p5_score + p6_score, 100)
                    zero_skill_note = ""
                
                # Phase 3: Confidence
                confidence_score = 100
                if not student_skills_raw or str(student_skills_raw).lower() in ['nan', 'none', '']:
                    confidence_score -= 40
                if len(combined_skill_set) < 3:
                    confidence_score -= 25
                if not row.get('Aptitude_Score'):
                    confidence_score -= 10
                if not row.get('Has_Portfolio'):
                    confidence_score -= 10
                
                if confidence_score >= 80:
                    confidence_level = "High"
                    confidence_note = "All data present. Score is reliable."
                elif confidence_score >= 55:
                    confidence_level = "Medium"
                    confidence_note = "Some data missing. Treat score as directional."
                else:
                    confidence_level = "Low"
                    confidence_note = "Insufficient data. Score may not reflect true potential."
                
                # Create result with all pillars properly populated
                result = StudentAnalysisResult(
                    name=row['Name'],
                    roll_number=str(row.get('Roll_Number', 'N/A')),
                    cgpa=float(row.get('CGPA', 0)),
                    eligible=not gate_3_fail,
                    fail_reason=gate_3_fail_reason if gate_3_fail else "",
                    gate_type=gate_type,
                    final_score=round(final_score, 1),
                    tier=get_tier(final_score),
                    jd_type=jd_type,
                    jd_type_description=jd_type_description,
                    present_skills=[s.title() for s in present_skills],
                    missing_skills=[s.title() for s in missing_skills],
                    corporate_matches=corporate_matches,
                    zero_skill_note=zero_skill_note,
                    portfolio_gate_note=portfolio_gate_note,
                    portfolio_multiplier=portfolio_multiplier,
                    aptitude_bonus_applied=aptitude_bonus_applied,
                    pillar_breakdown=PillarBreakdown(
                        skills=round(p1_score, 1),
                        academics=round(p2_score, 1),
                        corporate_readiness=round(p3_score, 1),
                        aptitude=round(p_aptitude, 1),
                        portfolio=round(p5_score, 1),
                        ai_growth=0.0  # OFFLINE: Always 0
                    ),
                    confidence_level=confidence_level,
                    confidence_note=confidence_note,
                    ai_insight=ai_insight,
                    growth_reasoning=growth_reasoning
                )
                
                results.append(result)
                print(f"[BATCH-OFFLINE] ✓ {student_name} completed with score {result.final_score}")
                
            except Exception as e:
                print(f"[BATCH-OFFLINE] ⚠ Error processing {student_name}: {str(e)[:100]}")
                # Create graceful error result
                failed_result = StudentAnalysisResult(
                    name=student_name,
                    roll_number=str(row.get('Roll_Number', 'N/A')),
                    cgpa=float(row.get('CGPA', 0)),
                    eligible=False,
                    fail_reason="Processing error during offline analysis",
                    gate_type="processing_error",
                    final_score=-1,
                    tier="Needs Training",
                    jd_type=jd_type,
                    jd_type_description=jd_type_description,
                    present_skills=[],
                    missing_skills=combined_skill_set,
                    corporate_matches=[],
                    zero_skill_note="",
                    portfolio_gate_note="Analysis skipped",
                    portfolio_multiplier=0.0,
                    aptitude_bonus_applied=False,
                    pillar_breakdown=PillarBreakdown(
                        skills=0, academics=0, corporate_readiness=0,
                        aptitude=0, portfolio=0, ai_growth=0
                    ),
                    confidence_level="Low",
                    confidence_note="Processing error encountered",
                    ai_insight="Unable to complete offline analysis",
                    growth_reasoning="Unable to assess"
                )
                results.append(failed_result)
        
        print(f"[BATCH-OFFLINE] ✓ Analysis complete: {len(results)} students processed")
        
        # Get min_cgpa from JD (for response metadata)
        min_cgpa = 0.0
        cgpa_patterns = [
            r'(\d+\.\d+)\s*(?:CGPA|cgpa|GPA|gpa)',
            r'(?:CGPA|cgpa|GPA|gpa)\s*(?:of\s*)?(\d+\.\d+)',
        ]
        for pattern in cgpa_patterns:
            matches = re.findall(pattern, request.jd_text)
            for match in matches:
                val = float(match)
                if 0.0 < val <= 10.0:
                    min_cgpa = max(min_cgpa, val)
        
        return {
            "total_students": len(csv_df),
            "analyzed_students": len(results),
            "jd_intelligence": {
                "combined_skill_set": combined_skill_set,
                "jd_type": jd_type,
                "jd_type_description": jd_type_description,
                "weight_profile": weight_dict,
                "min_cgpa": min_cgpa
            },
            "results": results
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"[BATCH-OFFLINE] FATAL ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Offline batch analysis failed: {str(e)[:100]}")


@router.post("/resume/offline")
async def analyze_resume_offline(request: ResumeAnalysisRequest):
    """
    Lightning-fast OFFLINE resume analysis using heuristic engine.
    NO AI calls. Pure keyword and mathematical scoring.
    
    Returns exact same ResumeAnalysisResponse structure as AI endpoints.
    Extracts text from PDF and applies Track A/B classification.
    
    Args:
        request: ResumeAnalysisRequest with jd_text and resume_base64
    
    Returns:
        ResumeAnalysisResponse with overall_score, recommendation, strengths, gaps, feedback
    """
    try:
        print(f"[RESUME-OFFLINE] ====== Starting OFFLINE resume analysis (NO AI CALLS) ======")
        
        # Decode and extract resume text from PDF
        try:
            pdf_data = base64.b64decode(request.resume_base64)
            resume_text = ""
            
            if PyPDF2:
                try:
                    pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_data))
                    print(f"[RESUME-OFFLINE] PDF has {len(pdf_reader.pages)} pages")
                    
                    for page_num, page in enumerate(pdf_reader.pages):
                        page_text = page.extract_text()
                        resume_text += page_text + " "
                    
                    if not resume_text.strip():
                        print(f"[RESUME-OFFLINE] Warning: PDF parsed but contains no extractable text")
                        resume_text = "[Resume text could not be extracted from PDF]"
                    
                except Exception as pdf_parse_error:
                    print(f"[RESUME-OFFLINE] PDF text extraction failed: {str(pdf_parse_error)}")
                    resume_text = "[Resume text could not be extracted]"
            else:
                print(f"[RESUME-OFFLINE] PyPDF2 not available - cannot extract text")
                resume_text = "[PDF parsing unavailable]"
                
        except Exception as decode_error:
            print(f"[RESUME-OFFLINE] Base64 decode error: {str(decode_error)}")
            raise HTTPException(status_code=400, detail="Invalid resume PDF format - could not decode")
        
        print(f"[RESUME-OFFLINE] Resume text length: {len(resume_text)} characters")
        
        # Run offline heuristic engine (designed for resume/text-based scoring)
        heuristic_result = offline_heuristic_engine(resume_text, request.jd_text)
        
        score = heuristic_result['readiness_score']
        
        # Map score to recommendation
        if score >= 80:
            recommendation = "Highly Recommended"
        elif score >= 65:
            recommendation = "Recommended"
        elif score >= 50:
            recommendation = "Consider"
        elif score >= 35:
            recommendation = "Marginal Fit"
        else:
            recommendation = "Not Recommended"
        
        # Build strengths and gaps
        track_type = heuristic_result['jd_type']
        
        strengths = [
            track_type,
            heuristic_result['ai_insight']
        ]
        
        gaps = heuristic_result['gaps_list']  # Premium formatted gap descriptions
        
        # Extract pillar breakdown for frontend progress bars
        pb = heuristic_result.get('pillar_breakdown', {})
        pillar_breakdown = PillarBreakdown(
            skills=float(pb.get('skills', 0)),
            academics=float(pb.get('academics', 0)),
            corporate_readiness=float(pb.get('corporate_readiness', 0)),
            aptitude=float(pb.get('aptitude', 0)),
            portfolio=float(pb.get('portfolio', 0)),
            ai_growth=float(pb.get('ai_growth', 0))
        )
        
        print(f"[RESUME-OFFLINE] ✓ Analysis complete: Score={score}, Recommendation={recommendation}")
        
        return ResumeAnalysisResponse(
            overall_score=str(score),
            recommendation=recommendation,
            strengths=strengths,
            gaps=gaps,
            detailed_feedback=heuristic_result['ai_insight'],
            pillar_breakdown=pillar_breakdown
        )
    
    except HTTPException:
        raise
    except Exception as e:
        error_str = str(e).lower()
        print(f"[RESUME-OFFLINE] Error: {str(e)[:100]}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Offline resume analysis failed: {str(e)[:80]}")

@router.post("/interview/evaluate", response_model=InterviewResponse)
async def evaluate_mock_response(request: InterviewRequest):
    """
    Fast offline evaluation of mock interview answer.
    Computes semantic similarity to question concepts and extracts sentiment.
    """
    try:
        content_score = calculate_cosine_similarity(request.answer, request.question)
        # Boost base score since comparison is to query rather than full key-answer guidelines
        content_score = min(100.0, content_score * 3.5 + 25.0)
        
        sentiment_score, tone = analyze_sentiment_valence(request.answer)
        
        feedback = (
            f"The candidate response shows a {tone.lower()} expression. "
            f"Evaluations scored {content_score:.1f}% semantic keyword alignment against prompt directives. "
            "Suggest refining specifications with structured technical definitions to boost impact."
        )
        
        return InterviewResponse(
            content_score=round(content_score, 1),
            sentiment_score=sentiment_score,
            tone=tone,
            feedback=feedback
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation execution failed: {str(e)}")
