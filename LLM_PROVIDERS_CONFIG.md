# Placify Multi-Provider LLM Configuration

## Overview
Placify now supports multiple AI providers with automatic fallback mechanisms. This means:
- ✅ No longer locked-in to Gemini API
- ✅ If one API fails, automatically tries another
- ✅ Always falls back to local heuristics if needed
- ✅ 75x better quota than Gemini 2.5 with Gemini 1.5-flash
- ✅ Supports OpenAI GPT, Anthropic Claude, and more

## Supported Providers (in fallback order)

### 1. **Google Gemini** (RECOMMENDED - Best Free Tier)
- **Model**: `gemini-1.5-flash`
- **Free Quota**: 1,500 requests/day (75x better than 2.5-flash)
- **Cost**: Free for 1500/day, then $0.075 per 1M input tokens
- **Setup**:
  ```bash
  export GEMINI_API_KEY="your_api_key_here"
  ```
- **Get API Key**: https://ai.google.dev/

### 2. **OpenAI** (GPT-3.5-turbo)
- **Model**: `gpt-3.5-turbo`
- **Free Quota**: None (but very cheap)
- **Cost**: ~$0.50 per 1M input tokens
- **Setup**:
  ```bash
  export OPENAI_API_KEY="sk-..."
  ```
- **Get API Key**: https://platform.openai.com/api-keys

### 3. **Anthropic Claude** (Haiku)
- **Model**: `claude-3-haiku-20240307`
- **Free Quota**: None (but competitive pricing)
- **Cost**: ~$0.25 per 1M input tokens
- **Setup**:
  ```bash
  export ANTHROPIC_API_KEY="sk-ant-..."
  ```
- **Get API Key**: https://console.anthropic.com/

### 4. **Local Fallback** (ALWAYS AVAILABLE)
- **Model**: Local heuristics (no API call)
- **Cost**: Free
- **Behavior**: Returns valid JSON responses when all APIs fail
- **Used automatically**: If all remote APIs exhausted

## Configuration Guide

### Option A: Single Provider (Simplest)
```bash
# Use Gemini only (recommended)
export GEMINI_API_KEY="your_key_here"
```

### Option B: Dual Provider (Recommended for Production)
```bash
# Primary: Gemini (high quota, free)
export GEMINI_API_KEY="your_gemini_key"

# Fallback: OpenAI (reliable backup)
export OPENAI_API_KEY="your_openai_key"
```

### Option C: Triple Provider (Maximum Resilience)
```bash
# Primary: Gemini
export GEMINI_API_KEY="your_gemini_key"

# Secondary: OpenAI
export OPENAI_API_KEY="your_openai_key"

# Tertiary: Anthropic
export ANTHROPIC_API_KEY="your_anthropic_key"
```

## Environment Setup

### Windows (PowerShell)
```powershell
$env:GEMINI_API_KEY = "your_key_here"
$env:OPENAI_API_KEY = "your_key_here"
$env:ANTHROPIC_API_KEY = "your_key_here"
```

### Linux/Mac (Bash)
```bash
export GEMINI_API_KEY="your_key_here"
export OPENAI_API_KEY="your_key_here"
export ANTHROPIC_API_KEY="your_key_here"
```

### .env File (Production)
Create `backend/.env`:
```
GEMINI_API_KEY=your_gemini_key_here
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

Then load in your app startup script.

## How It Works

### Request Flow
1. **Attempt Gemini**: If GEMINI_API_KEY configured, try first (highest free quota)
2. **Fallback to OpenAI**: If Gemini fails or rate limited, try OpenAI
3. **Fallback to Anthropic**: If OpenAI fails, try Anthropic
4. **Fallback to Local**: If all APIs fail, return local heuristic response

### Retry Logic
- Each provider gets 3 attempts
- 2-second delay between retries
- Automatic detection of rate-limit errors (429, quota, resource_exhausted)
- Non-retryable errors (auth failures) skip to next provider immediately

### Example Log Output
```
[LLM] Gemini API available (1500 requests/day)
[LLM] OpenAI API available
[LLM] Anthropic API available
[ANALYZE] LLM providers available: ['GeminiProvider', 'OpenAIProvider', 'AnthropicProvider']
[LLM] Trying GeminiProvider...
[LLM] Gemini rate limited. Trying next provider...
[LLM] Trying OpenAIProvider...
[Response successful from OpenAI]
```

## Monitoring & Health Checks

### Check Available Providers
```python
from app.services.llm_service import UniversalLLMService

service = UniversalLLMService()
status = service.get_status()
print(status)
# Output:
# {
#   "available_providers": ["GeminiProvider", "OpenAIProvider"],
#   "total_providers": 3,
#   "has_fallback": True
# }
```

### API Quotas Per Provider

| Provider | Model | Free/Day | Cost After | 
|----------|-------|----------|-----------|
| **Gemini** | gemini-1.5-flash | 1,500 ✅ | $0.075/1M tokens |
| **OpenAI** | gpt-3.5-turbo | 0 | $0.50/1M tokens |
| **Anthropic** | claude-3-haiku | 0 | $0.25/1M tokens |
| **Local** | Heuristic | Unlimited | Free |

## Cost Estimation

### Scenario: 1000 students, 1 Gemini call per student
- **Without setup**: 1000 calls = ~14 days of free quota exhausted
- **With multi-provider**: 
  - Days 1-15: Use Gemini free 1500/day
  - Day 16+: Automatic fallback to OpenAI ($0.50 per 1000 calls)

## Troubleshooting

### "All LLM providers exhausted"
- **Cause**: All configured APIs failing or rate-limited
- **Fix**: 
  1. Check API keys are valid
  2. Verify API quotas not exhausted
  3. System will fall back to local heuristics automatically
  4. Try again in 1 minute if rate-limited

### Only local fallback available
- **Cause**: No API keys configured
- **Fix**: Add at least one API key (Gemini recommended)
- **Temporary**: System still works but with heuristic responses

### "OPENAI_API_KEY not found"
- **Cause**: Environment variable not set
- **Fix**: 
  ```bash
  export OPENAI_API_KEY="sk-..."
  # Then restart backend
  ```

### Rate Limited on All Providers
- **Cause**: Quota exhausted on all configured services
- **Behavior**: Falls back to local heuristic responses
- **Fix**: Wait 1 hour and retry, or configure additional providers

## Best Practices

1. **Always** set at least Gemini API key for production
2. **Recommend** having 2+ providers configured for redundancy
3. **Monitor** logs for provider fallbacks (indicates quota approaching)
4. **Test** fallback behavior: temporarily disable Gemini to verify OpenAI works
5. **Alert** when any provider hits rate limits (indicates need for upgrade)

## Migration from Gemini-Only

If you were using Gemini-only before:

**Old Code**:
```python
from app.services.gemini_service import GeminiService
service = GeminiService(api_key)
response = service.client.models.generate_content(...)
```

**New Code** (automatic - no changes needed):
```python
# The system automatically uses multi-provider with fallbacks
# Just set environment variables and it works!
```

All existing code continues to work - the improvements are automatic!
