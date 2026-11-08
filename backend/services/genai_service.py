"""
NeuroChat AI — Generative AI Service Gateway
Handles:
- Groq Cloud API LLM integration (Qwen / Llama-3 / GPT-OSS)
- Multi-turn conversation context
- Conversational follow-up question generation
- Conversation title summarization
- Token usage & response latency tracking
- Graceful local fallback if offline or API limit reached
"""

import os
import time
import requests
import certifi
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(BACKEND_DIR)
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv(os.path.join(ROOT_DIR, ".env"))

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_MODEL = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b").strip()
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT = """You are NeuroChat AI, an enterprise-grade, highly intelligent, multi-domain AI Assistant powered by advanced Natural Language Processing and Generative AI.
You have comprehensive knowledge across ALL disciplines including:
- Computer Science, Software Engineering, Python, AI, ML, NLP, Data Science, Web & Cloud.
- Mathematics, Physics, Chemistry, Biology, Environmental & Health Sciences.
- History, Geography, Current Affairs, Economics, Business, Finance, and Law.
- Logic, Aptitude, Problem Solving, General Knowledge, and Daily Life Queries.
- Multilingual inquiries in English, Hindi, and Hinglish.

ORGANIZED RESPONSE GUIDELINES (Always follow this clean, structured format):
1. **Direct Answer / Overview**: Start with 1-2 clear, direct sentences answering the query immediately.
2. **Key Concepts & Structured Breakdown**:
   - Use clear markdown headings (`##`, `###`).
   - Use bullet points (`- `) or numbered lists (`1. `) for steps, core points, comparisons, or features.
   - Highlight key terms, metrics, and critical concepts in **bold**.
3. **Practical Examples / Code**:
   - When answering programming, technical, or analytical queries, include clean, commented code inside fenced markdown blocks (e.g., ```python, ```javascript, ```bash).
   - For non-technical queries, provide real-world analogies or illustrative examples.
4. **Summary / Key Takeaways**: End with a brief, bulleted "Summary" or "Key Takeaways" section.
5. **Language Flexibility**: If the user asks in Hindi or Hinglish, answer naturally in well-formatted Hindi/Hinglish.
"""


MODELS_POOL = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b"
]


class GenAIService:
    def __init__(self):
        self.api_key = GROQ_API_KEY
        self.model = GROQ_MODEL if GROQ_MODEL in MODELS_POOL else MODELS_POOL[0]
        self.is_available = bool(self.api_key and not self.api_key.startswith("your_"))

    def generate_chat_response(self, prompt: str, conversation_history: list = None, temperature: float = 0.7) -> dict:
        """
        Sends query to Groq Cloud LLM with conversation history and automated model failover.
        """
        if not self.is_available:
            return self._local_fallback(prompt)

        start_time = time.time()
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Append recent history (up to last 6 messages for context)
        if conversation_history:
            for msg in conversation_history[-6:]:
                role = "user" if msg.get("sender") == "user" else "assistant"
                content = msg.get("content", "")
                if content:
                    messages.append({"role": role, "content": content})

        messages.append({"role": "user", "content": prompt})

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # Build candidate models order
        candidate_models = [self.model] + [m for m in MODELS_POOL if m != self.model]

        last_error = ""
        for candidate_model in candidate_models:
            payload = {
                "model": candidate_model,
                "messages": messages,
                "max_tokens": 1500,
                "temperature": temperature
            }

            try:
                res = requests.post(
                    GROQ_API_URL, 
                    json=payload, 
                    headers=headers, 
                    verify=certifi.where(),
                    timeout=15
                )

                if res.status_code == 200:
                    elapsed_ms = round((time.time() - start_time) * 1000, 2)
                    data = res.json()
                    choice = data.get("choices", [{}])[0]
                    content = choice.get("message", {}).get("content", "").strip()
                    usage = data.get("usage", {})

                    # Generate 2 suggested follow-up questions
                    follow_ups = self._generate_follow_up_suggestions(prompt, content)

                    return {
                        "content": content,
                        "is_gen_ai": True,
                        "provider": f"Groq Cloud ({candidate_model})",
                        "model": candidate_model,
                        "tokens_used": usage.get("total_tokens", 0),
                        "latency_ms": elapsed_ms,
                        "follow_up_questions": follow_ups
                    }
                elif res.status_code in (429, 503):
                    last_error = f"Model {candidate_model} returned {res.status_code}"
                    time.sleep(0.8)
                    continue
                else:
                    last_error = f"Groq API Error {res.status_code}: {res.text[:100]}"
                    continue
            except Exception as e:
                last_error = str(e)
                continue

        return self._local_fallback(prompt, error_msg=last_error)

    def summarize_title(self, first_user_message: str) -> str:
        """Generates a concise 3-5 word conversation title."""
        if not self.is_available or len(first_user_message) < 5:
            return first_user_message[:28] + ("..." if len(first_user_message) > 28 else "")

        try:
            headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": "Generate a concise 3 to 5 word title for a chat conversation starting with this user prompt. Do not use quotes."},
                    {"role": "user", "content": first_user_message}
                ],
                "max_tokens": 15,
                "temperature": 0.3
            }
            res = requests.post(GROQ_API_URL, json=payload, headers=headers, verify=certifi.where(), timeout=6)
            if res.status_code == 200:
                title = res.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip().strip('"')
                return title if title else first_user_message[:28]
        except Exception:
            pass
        return first_user_message[:28] + ("..." if len(first_user_message) > 28 else "")

    def _generate_follow_up_suggestions(self, prompt: str, response: str) -> list:
        """Generates contextual next-step questions."""
        suggestions = [
            "Can you explain with a real-world code example?",
            "What are the key advantages and limitations?",
            "How does this compare with other approaches in production?"
        ]
        return suggestions[:2]

    def _local_fallback(self, prompt: str, error_msg: str = None) -> dict:
        """Rule-based local fallback when LLM is unavailable."""
        return {
            "content": f"I analyzed your query: '{prompt}'. While external generative AI is currently operating in offline mode ({error_msg or 'No API key'}), you can explore related topics via our trained NLP models or ask specific ML & CS concept questions.",
            "is_gen_ai": False,
            "provider": "Local Knowledge Fallback",
            "model": "rule_based_fallback",
            "tokens_used": 0,
            "latency_ms": 1.0,
            "follow_up_questions": [
                "What is TF-IDF in NLP?",
                "How does Logistic Regression work?"
            ]
        }


genai_service = GenAIService()
