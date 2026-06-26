# Contributing to AI Copilot

First off, thank you for considering contributing to AI Copilot! This guide will help you get your development environment set up and explain how to add new features like LLM providers or OCR engines.

## 🛠️ Local Development Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/sudeepsinghal/AI-copilot.git
   cd AI-copilot
   ```

2. **Backend Setup**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # Copy env template and add your API keys
   cp .env.example .env
   
   # Run the API
   uvicorn Backend.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Copy env template
   cp .env.example .env
   
   # Run the dev server
   npm run dev
   ```

---

## 🧩 Adding a New LLM Provider

The application is built on LangChain, so adding a new provider is straightforward:

1. **Update `Backend/utils/llm.py`:**
   - Define a list of models for the UI (e.g., `NEWPROVIDER_MODELS = [...]`).
   - Add the provider to the `PROVIDER_META` dictionary with its environment variable and type.
   - Create a builder function `_build_newprovider(model: str | None)`.
   - Map it in the `_BUILDERS` dictionary.

2. **Update Environment Files:**
   - Add the required API key to `.env.example`.

3. **Frontend Verification:**
   - The frontend dynamically fetches the provider list from the backend `/providers` endpoint, so no frontend changes are strictly required!

---

## 📄 Adding a New OCR Engine

To add a new OCR engine for the `/upload` pipeline:

1. **Update `Backend/utils/ocr_providers.py`:**
   - Add the name to `SUPPORTED_OCR_PROVIDERS`.
   - Add status checks in `_build_provider_status()` (checking for required python packages, binaries, or model weights).
   - Write a `_run_newengine(file_bytes: bytes) -> list[str]` function that handles the conversion.
   - Register it in the `run_ocr` function dictionary.

2. **Asset Management:**
   - If your engine requires heavy model weights, place them in `Backend/ocr_assets/<engine_name>`.
   - Document how to download those weights in the `notes` field of your `ProviderStatus`.

---

## 🧑‍💻 Code Style

- **Python**: Use type hints (`from __future__ import annotations`), keep line lengths reasonable, and follow PEP 8 where practical.
- **React**: Use functional components, React Hooks, and Tailwind CSS for styling. Ensure responsive design for new UI components.

## 📥 Submitting Changes

1. Fork the repository.
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`).
3. Make your changes and write descriptive commit messages.
4. Push to your branch and open a Pull Request against the `main` branch.
