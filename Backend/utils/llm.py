from __future__ import annotations

import os
import re

# ─────────────────────────────────────────────────────────────────────────────
# LLM layer — all providers go through LangChain chat models now.
#
# get_llm(provider, model) returns a LangChain BaseChatModel (a Runnable), so it
# can be dropped straight into an LCEL chain:  prompt | llm | parser
#
# Provider priority: explicit argument → LLM_PROVIDER env var → 'groq'.
# ─────────────────────────────────────────────────────────────────────────────

DEFAULT_TEMPERATURE = 0.3


# ─── Model catalogs (used for validation + the UI dropdowns) ──────────────────

GROQ_MODELS = [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3-32b",
    "openai/gpt-oss-120b",
]

GEMINI_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
]

# Together AI — large catalog of open-source models, generous free tier.
TOGETHER_MODELS = [
    "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
    "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    "Qwen/Qwen2.5-7B-Instruct-Turbo",
    "Qwen/Qwen2.5-72B-Instruct-Turbo",
    "deepseek-ai/DeepSeek-V3",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "mistralai/Mixtral-8x7B-Instruct-v0.1",
]

# Mistral AI — free tier available.
MISTRAL_MODELS = [
    "mistral-small-latest",
    "mistral-medium-latest",
    "mistral-large-latest",
    "open-mistral-7b",
    "open-mixtral-8x7b",
]

# Cohere — free trial keys.
COHERE_MODELS = [
    "command-r",
    "command-r-plus",
    "command-r7b-12-2024",
]

# Hugging Face Inference — open-source models, free token.
HUGGINGFACE_MODELS = [
    "meta-llama/Llama-3.1-8B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3",
    "Qwen/Qwen2.5-7B-Instruct",
]

# Anthropic Claude — bring-your-own-key (paid).
ANTHROPIC_MODELS = [
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
    "claude-opus-4-8",
]

# OpenAI — bring-your-own-key (paid).
OPENAI_MODELS = [
    "gpt-4o-mini",
    "gpt-4o",
    "gpt-4.1-mini",
]


# ─── Provider metadata (env var + default model + catalog) ────────────────────
# Ollama has no fixed catalog — its models are whatever the user has pulled, so
# its model list is discovered live in the /providers endpoint.

PROVIDER_META: dict[str, dict] = {
    "groq":        {"env": "GROQ_API_KEY",            "default": GROQ_MODELS[0],        "models": GROQ_MODELS,        "kind": "free"},
    "gemini":      {"env": "GEMINI_API_KEY",          "default": GEMINI_MODELS[0],      "models": GEMINI_MODELS,      "kind": "free"},
    "together":    {"env": "TOGETHER_API_KEY",        "default": TOGETHER_MODELS[0],    "models": TOGETHER_MODELS,    "kind": "free"},
    "mistral":     {"env": "MISTRAL_API_KEY",         "default": MISTRAL_MODELS[0],     "models": MISTRAL_MODELS,     "kind": "free"},
    "cohere":      {"env": "COHERE_API_KEY",          "default": COHERE_MODELS[0],      "models": COHERE_MODELS,      "kind": "free"},
    "huggingface": {"env": "HUGGINGFACEHUB_API_TOKEN","default": HUGGINGFACE_MODELS[0], "models": HUGGINGFACE_MODELS, "kind": "free"},
    "anthropic":   {"env": "ANTHROPIC_API_KEY",       "default": ANTHROPIC_MODELS[0],   "models": ANTHROPIC_MODELS,   "kind": "byok"},
    "openai":      {"env": "OPENAI_API_KEY",          "default": OPENAI_MODELS[0],      "models": OPENAI_MODELS,      "kind": "byok"},
    "ollama":      {"env": None,                      "default": "llama3",              "models": [],                 "kind": "local"},
}


# ─── Helpers ──────────────────────────────────────────────────────────────────

_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL | re.IGNORECASE)


def strip_think(text: str) -> str:
    """Remove <think>...</think> reasoning blocks some models (e.g. qwen3) emit."""
    if not text:
        return text
    return _THINK_RE.sub("", text).strip()


def _require_key(provider: str) -> str:
    env = PROVIDER_META[provider]["env"]
    key = os.environ.get(env, "").strip()
    if not key:
        raise ValueError(
            f"{env} is not set. Open your .env file and add: {env}=your_key_here"
        )
    return key


# ─── Provider builders ────────────────────────────────────────────────────────

def _build_groq(model: str | None):
    from langchain_groq import ChatGroq
    return ChatGroq(model=model or PROVIDER_META["groq"]["default"],
                    api_key=_require_key("groq"), temperature=DEFAULT_TEMPERATURE)


def _build_gemini(model: str | None):
    from langchain_google_genai import ChatGoogleGenerativeAI
    return ChatGoogleGenerativeAI(model=model or PROVIDER_META["gemini"]["default"],
                                  google_api_key=_require_key("gemini"),
                                  temperature=DEFAULT_TEMPERATURE)


def _build_together(model: str | None):
    from langchain_together import ChatTogether
    return ChatTogether(model=model or PROVIDER_META["together"]["default"],
                        api_key=_require_key("together"), temperature=DEFAULT_TEMPERATURE)


def _build_mistral(model: str | None):
    from langchain_mistralai import ChatMistralAI
    return ChatMistralAI(model=model or PROVIDER_META["mistral"]["default"],
                         api_key=_require_key("mistral"), temperature=DEFAULT_TEMPERATURE)


def _build_cohere(model: str | None):
    from langchain_cohere import ChatCohere
    return ChatCohere(model=model or PROVIDER_META["cohere"]["default"],
                      cohere_api_key=_require_key("cohere"), temperature=DEFAULT_TEMPERATURE)


def _build_huggingface(model: str | None):
    from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
    endpoint = HuggingFaceEndpoint(
        repo_id=model or PROVIDER_META["huggingface"]["default"],
        huggingfacehub_api_token=_require_key("huggingface"),
        task="text-generation",
        temperature=DEFAULT_TEMPERATURE,
    )
    return ChatHuggingFace(llm=endpoint)


def _build_anthropic(model: str | None):
    from langchain_anthropic import ChatAnthropic
    return ChatAnthropic(model=model or PROVIDER_META["anthropic"]["default"],
                         api_key=_require_key("anthropic"), temperature=DEFAULT_TEMPERATURE)


def _build_openai(model: str | None):
    from langchain_openai import ChatOpenAI
    return ChatOpenAI(model=model or PROVIDER_META["openai"]["default"],
                      api_key=_require_key("openai"), temperature=DEFAULT_TEMPERATURE)


def _build_ollama(model: str | None):
    from langchain_ollama import ChatOllama
    base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    return ChatOllama(model=model or PROVIDER_META["ollama"]["default"],
                      base_url=base_url, temperature=DEFAULT_TEMPERATURE)


_BUILDERS = {
    "groq": _build_groq,
    "gemini": _build_gemini,
    "together": _build_together,
    "mistral": _build_mistral,
    "cohere": _build_cohere,
    "huggingface": _build_huggingface,
    "anthropic": _build_anthropic,
    "openai": _build_openai,
    "ollama": _build_ollama,
}


def get_llm(provider: str | None = None, model: str | None = None):
    """
    Return a LangChain chat model (a Runnable) for the requested provider/model.
    Provider priority: explicit argument → LLM_PROVIDER env var → 'groq'.
    """
    resolved = (provider or os.environ.get("LLM_PROVIDER", "groq")).lower().strip()
    builder = _BUILDERS.get(resolved)
    if builder is None:
        raise ValueError(
            f"Unknown provider '{resolved}'. Choose from: {list(_BUILDERS.keys())}"
        )
    return builder(model)
