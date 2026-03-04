#!/usr/bin/env python3
"""
Agentica P20: Multi-Model Multi-Provider Simulacrum
===================================================
Extends P15 by allowing agents to use DIFFERENT LLM providers.
Security Auditor on Gemini, Backend Specialist on Claude, etc.

Secretary Bird: eats diverse models for breakfast. 🦅
"""

import json
import os
import sys
import time
import uuid
import urllib.request
import urllib.error
import io
from datetime import datetime
from pathlib import Path

if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

class LLMProvider:
    """Base class for diverse model providers."""
    def call(self, system_prompt: str, user_message: str) -> str:
        raise NotImplementedError

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

    def call(self, system_prompt: str, user_message: str) -> str:
        payload = json.dumps({
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_message}]}],
            "generationConfig": {"maxOutputTokens": 300, "temperature": 0.7}
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{self.url}?key={self.api_key}",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception as e:
            return f"[Gemini Error]: {str(e)}"

class OpenAIProvider(LLMProvider):
    """Stub for OpenAI support (ready for key injection)."""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://api.openai.com/v1/chat/completions"

    def call(self, system_prompt: str, user_message: str) -> str:
        # Placeholder for real API call
        return f"[OpenAI Mock]: Processing '{user_message[:30]}...' with system rules."

class AnthropicProvider(LLMProvider):
    """Stub for Anthropic support (ready for key injection)."""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.url = "https://api.anthropic.com/v1/messages"

    def call(self, system_prompt: str, user_message: str) -> str:
        # Placeholder for real API call
        return f"[Anthropic Mock]: Reasoning about '{user_message[:30]}...' analytically."

AGENT_SYSTEM_PROMPTS = {
    "backend-specialist": "Expert backend engineer. Focus on scale and performance.",
    "security-auditor": "Paranoid security auditor. Focus on vulnerability and threat models.",
    "frontend-specialist": "UX-obsessed frontend developer. Focus on state and DX."
}

# ── Dynamic Agent ───────────────────────────────────────────────

class DiversifiedAgent:
    def __init__(self, name: str, provider: LLMProvider):
        self.name = name
        self.provider = provider
        self.system_prompt = AGENT_SYSTEM_PROMPTS.get(name, "Senior Software Engineer.")

    def speak(self, topic: str, context: str = "") -> str:
        msg = f"Debating: {topic}\nContext: {context}"
        return self.provider.call(self.system_prompt, msg)

def main():
    print(f"\n{BOLD}{CYAN}🦅 Agentica P20: Multi-Model Simulacrum starting...{RESET}")

    # Setup providers
    gemini_key = os.environ.get("GEMINI_API_KEY") or Path(".Agentica/gemini.key").read_text().strip() if Path(".Agentica/gemini.key").exists() else None

    if not gemini_key:
        print(f"{RED}[!] No API keys found. Running in Persona/Mock mode.{RESET}")

    # Assign DIFFERENT providers to DIFFERENT agents
    providers = {
        "backend-specialist": GeminiProvider(gemini_key) if gemini_key else OpenAIProvider("mock"),
        "security-auditor":   AnthropicProvider("mock"),  # Paranoid agents love Anthropic
        "frontend-specialist": OpenAIProvider("mock")     # Fast iterations for UI
    }

    topic = "Should we implement local-first vector storage for ReasoningBank?"
    print(f"{BOLD}Topic:{RESET} {topic}\n")

    for name, provider in providers.items():
        agent = DiversifiedAgent(name, provider)
        response = agent.speak(topic)
        print(f"[{BOLD}{name}{RESET}] via {BOLD}{provider.__class__.__name__}{RESET}:")
        print(f"  {response}\n")

if __name__ == "__main__":
    main()
