# HorizonStock AI - Project Context & Rules

This file (`GEMINI.md`) defines the core context, state, and strict rules for the HorizonStock AI project. It will automatically be loaded by Antigravity on every new chat session to ensure alignment with the project goals.

## 1. Project Idea & Overview
**HorizonStock AI** is an AI-powered stock analysis and recommendation web application.
- **The Problem:** Retail investors lack a unified platform that combines rule-based fundamental screening, technical signal detection, and AI-assisted qualitative judgment into a simple, plain-language recommendation.
- **The Solution:** A user simply searches for a stock. The backend automatically fetches 5+ years of fundamental data, annual report text, and price history. It processes this data through strict Rule Engines (Fundamental and Technical).
- **The Output:** The frontend displays a composite verdict (Buy/Hold/Avoid) for three distinct holding horizons (Short-term, Medium-term, Long-term), alongside AI-generated explanations and interactive charts.

## 2. Current State of the Project
- **Phase:** Early Proof of Concept (PoC) / MVP Definition.
- **Existing Assets:**
  - Project specification and idea outlined in `stock-ai-project-idea.txt`.
  - Comprehensive Fundamental Rule Engine specification (`ai-stock-screener-fundamental-rules-spec.md`) featuring 34 rules.
- **Target Tech Stack:** Python/FastAPI backend, React/Next.js frontend, PostgreSQL & Redis, LangChain + LLMs for qualitative analysis.

## 3. Strict Rules & Engineering Guidelines
When working on this project, adhere strictly to the following rules:

1. **Zero Manual Data Entry:** 
   The platform must be 100% automated. Under no circumstances should the system require manual data entry or manual PDF uploads from the end-user.
2. **No Black-Box AI for Quant Data:** 
   Every numeric flag, warning, or score MUST trace back to an exact, defined rule and an exact number from the data pipeline. Do not use the LLM to guess or formulate mathematical scores. LLMs (via LangChain) are strictly reserved for extracting qualitative signals (e.g., auditor remarks, governance flags) and generating plain-language summaries of the structured data.
3. **Always Include Disclaimers:** 
   The tool is an analytical decision-support system. Any user-facing output or frontend component must clearly state that this is *not investment advice* and the final decision rests with the user.
4. **Data Validation:** 
   Rigorously validate all structured data from APIs using Pydantic schemas that mirror our data specifications.
5. **Premium Frontend Aesthetics:** 
   When developing frontend code, it must not look like a basic prototype. Utilize modern design principles, vibrant/harmonious color palettes, smooth charts (Recharts/Chart.js), and micro-animations to create a premium, engaging user experience.
