# Placify Multi-Provider LLM - Quick Start Guide

## What Changed?
Your Placify system no longer depends on a single API. It now:
- ✅ Supports **Gemini, OpenAI, Anthropic Claude** and local fallback
- ✅ Works even if one API is down
- ✅ Automatically switches providers if quota exhausted
- ✅ Always returns valid responses (worst case: local heuristics)

## 5-Minute Setup

### Step 1: Get Gemini API Key (Recommended - Best Free Tier)
1. Go to https://ai.google.dev/
2. Click "Get API Key" → Create new project → Copy key
3. Very fast, no credit card needed for free tier (1500 requests/day)

### Step 2: Set Environment Variable (Windows PowerShell)
```powershell
$env:GEMINI_API_KEY = "YOUR_KEY_HERE"
```

Or create `backend/.env`:
```
GEMINI_API_KEY=YOUR_KEY_HERE
```

### Step 3: Restart Backend and Test
```bash
cd backend
python -m uvicorn app.main:app --reload
```

In logs, you should see:
```
[LLM] Gemini API available (1500 requests/day)
```

Done! ✅

## Optional: Add Backup Provider

For maximum reliability, also add OpenAI or Anthropic:

### Add OpenAI (Optional)
```
OPENAI_API_KEY=sk-YOUR_KEY_HERE
```
Then restart. You'll see:
```
[LLM] Gemini API available (1500 requests/day)
[LLM] OpenAI API available
```

## Configuration Examples

### Configuration A: Gemini Only (Simplest)
```env
GEMINI_API_KEY=your_key
```
- Free: 1500 requests/day
- Perfect for small deployments

### Configuration B: Gemini + OpenAI (Recommended)
```env
GEMINI_API_KEY=your_key
OPENAI_API_KEY=sk-...
```
- Free: 1500/day (Gemini)
- Paid backup: ~$0.50/1000 calls (OpenAI)
- Perfect for production

### Configuration C: All Three (Maximum Resilience)
```env
GEMINI_API_KEY=your_key
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```
- Three independent providers
- If one is down, two backups available
- Enterprise-grade reliability

## What Happens When?

### Normal Operation
```
Request → Try Gemini → Success → Return response
```

### Gemini Rate Limited
```
Request → Try Gemini (rate limit!) → Try OpenAI → Success
[Log: Gemini API rate limited. Trying next provider...]
```

### All APIs Exhausted
```
Request → Try Gemini (fail) → Try OpenAI (fail) → Try Anthropic (fail) 
         → Use Local Fallback → Return valid response
[Log: All LLM providers exhausted. Using local fallback.]
```

## Testing

### Test with Gemini Only
Start with just Gemini to verify setup:
```bash
export GEMINI_API_KEY="your_key"
# Run batch analysis - should work
```

### Test Fallback Mechanism (Optional)
Temporarily disable Gemini to test fallback:
```bash
unset GEMINI_API_KEY
# Run batch analysis - should still work, using OpenAI or local
```

## Monitoring

Check which providers are active:
```bash
python -c "
from app.services.llm_service import UniversalLLMService
service = UniversalLLMService()
print(service.get_status())
"
```

Output:
```
{
  'available_providers': ['GeminiProvider', 'OpenAIProvider'],
  'total_providers': 3,
  'has_fallback': True
}
```

## Troubleshooting

### "All LLM providers exhausted"
- ❌ No API keys configured
- ✅ Solution: Add at least GEMINI_API_KEY
- ℹ️ System still works using local fallback, but with basic responses

### System slow after first request
- This is normal - first request initializes all providers
- Subsequent requests will be fast (cached provider instances)

### Need to switch providers?
Just update the environment variable:
```bash
unset GEMINI_API_KEY
export OPENAI_API_KEY="sk-..."
# Restart backend
```

## Production Checklist

- [ ] Set GEMINI_API_KEY in production environment
- [ ] Optionally add OPENAI_API_KEY as backup
- [ ] Test with sample batch before going live
- [ ] Monitor logs for provider fallbacks
- [ ] Set up alerts if fallback is happening frequently

## API Quotas Reference

| Provider | Model | Free/Day | Cost |
|----------|-------|----------|------|
| Gemini | gemini-1.5-flash | **1,500** ✅ | $0.075/1M |
| OpenAI | gpt-3.5-turbo | 0 | $0.50/1M |
| Anthropic | claude-3-haiku | 0 | $0.25/1M |
| Local | Heuristic | ∞ | Free |

## Migration from Old System

If you had Gemini-only before:
- No code changes needed!
- Just set GEMINI_API_KEY
- All existing code works with new multi-provider system
- Automatic improvements with zero effort

## Support

More details in: [LLM_PROVIDERS_CONFIG.md](./LLM_PROVIDERS_CONFIG.md)
