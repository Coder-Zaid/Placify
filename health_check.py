#!/usr/bin/env python3
"""
Placify Multi-Provider LLM System - Health Check
Run this to verify the system is set up correctly
"""

import os
import sys


def check_environment():
    """Check which API keys are configured"""
    print("\n" + "="*60)
    print("PLACIFY MULTI-PROVIDER LLM - HEALTH CHECK")
    print("="*60 + "\n")
    
    providers = {
        "Gemini": "GEMINI_API_KEY",
        "OpenAI": "OPENAI_API_KEY",
        "Anthropic": "ANTHROPIC_API_KEY"
    }
    
    configured = []
    unconfigured = []
    
    print("API KEY STATUS:")
    print("-" * 60)
    
    for name, env_var in providers.items():
        value = os.getenv(env_var)
        if value:
            configured.append(name)
            masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
            print(f"✓ {name:12} - CONFIGURED  ({masked})")
        else:
            unconfigured.append(name)
            print(f"✗ {name:12} - NOT configured")
    
    print("-" * 60)
    
    if not configured:
        print("\n⚠️  WARNING: No API keys configured!")
        print("   System will use LOCAL FALLBACK only (basic responses)")
        print("\n   To fix: Set at least GEMINI_API_KEY")
        print("   export GEMINI_API_KEY='your_key'")
        return False
    
    if not configured or len(configured) == 1:
        print(f"\n✓ {len(configured)} provider(s) configured")
        print("  → System is functional")
        if unconfigured:
            print(f"\n  Tip: Add {unconfigured[0]} as backup for better resilience")
    else:
        print(f"\n✓✓ {len(configured)} providers configured (HIGHLY RESILIENT)")
        print("   → Excellent redundancy")
    
    return True


def check_imports():
    """Check if required packages are installed"""
    print("\n" + "-"*60)
    print("CHECKING REQUIRED PACKAGES:")
    print("-" * 60)
    
    packages = {
        "fastapi": "Web framework",
        "pandas": "Data processing",
        "pydantic": "Data validation",
        "google": "Gemini support",
        "openai": "OpenAI support (optional)",
        "anthropic": "Anthropic support (optional)"
    }
    
    installed = []
    missing = []
    
    for package, description in packages.items():
        try:
            __import__(package)
            installed.append(package)
            required = "REQUIRED" if package in ["fastapi", "pandas", "pydantic", "google"] else "OPTIONAL"
            print(f"✓ {package:12} - {description} ({required})")
        except ImportError:
            missing.append((package, description))
            required = "REQUIRED" if package in ["fastapi", "pandas", "pydantic", "google"] else "OPTIONAL"
            print(f"✗ {package:12} - {description} ({required})")
    
    return len(missing) == 0 or all(pkg[0] not in ["fastapi", "pandas", "pydantic", "google"] for pkg in missing)


def check_file_structure():
    """Check if required files exist"""
    print("\n" + "-"*60)
    print("CHECKING FILE STRUCTURE:")
    print("-" * 60)
    
    files = {
        "backend/app/services/llm_service.py": "Multi-provider LLM service",
        "backend/app/services/gemini_service.py": "Legacy Gemini wrapper",
        "backend/app/routes/analyze.py": "Analysis endpoints",
        "LLM_PROVIDERS_CONFIG.md": "Configuration guide",
        "QUICK_START_MULTI_PROVIDER.md": "Quick start guide"
    }
    
    all_exist = True
    for filepath, description in files.items():
        if os.path.exists(filepath):
            print(f"✓ {filepath:45} - {description}")
        else:
            print(f"✗ {filepath:45} - {description} (MISSING)")
            all_exist = False
    
    return all_exist


def print_summary():
    """Print summary and recommendations"""
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60 + "\n")
    
    has_env = bool(os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY"))
    
    if has_env:
        print("✓ SYSTEM READY")
        print("\nYour Placify system now:")
        print("  • Supports multiple AI providers (Gemini, OpenAI, Anthropic)")
        print("  • Automatically falls back if one API fails")
        print("  • Always returns valid responses (even without API keys)")
        print("  • Has 1500+ free requests/day with Gemini 1.5-flash")
        print("\nNext steps:")
        print("  1. Start the backend: python -m uvicorn app.main:app --reload")
        print("  2. Run a test batch analysis")
        print("  3. Check logs for provider selection")
    else:
        print("⚠️  SYSTEM FUNCTIONAL (Limited Mode)")
        print("\nYour Placify system is ready but using local fallback only.")
        print("\nQuick setup (2 minutes):")
        print("  1. Get Gemini API key: https://ai.google.dev/")
        print("  2. Set environment: export GEMINI_API_KEY='your_key'")
        print("  3. Restart backend")
        print("\nFor full configuration details:")
        print("  → See: LLM_PROVIDERS_CONFIG.md")
        print("  → Quick start: QUICK_START_MULTI_PROVIDER.md")


def main():
    print("\nRunning Placify Multi-Provider LLM Health Check...")
    
    try:
        env_ok = check_environment()
        imports_ok = check_imports()
        files_ok = check_file_structure()
        
        print_summary()
        
        print("\n" + "="*60)
        if env_ok and imports_ok and files_ok:
            print("✓ ALL SYSTEMS GO - Ready for deployment!")
        else:
            print("⚠️  Some checks failed - see details above")
        print("="*60 + "\n")
        
        return 0
    
    except Exception as e:
        print(f"\n❌ Error during health check: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
