# AI Fundamental Analysis Integration Design

## 1. Goal & Context
Integrate an AI reasoning layer using Groq (`llama3-70b-8192`) and LangChain to dynamically evaluate raw stock fundamental data against the 34 strict rules defined in `ai-stock-screener-fundamental-rules-spec.md`. The AI will generate Green/Yellow/Red flags with mathematical reasoning, identify overall Pros & Cons, and output Buy/Hold/Avoid verdicts across 3 holding horizons (Short, Medium, Long-term).

## 2. Strict Prompt Engineering (Anti-Hallucination)
Because this is a financial tool (as dictated by `GEMINI.md`), hallucination must be aggressively mitigated:
- **Pydantic Guardrails:** All LLM outputs will be strictly coerced into a predefined Pydantic schema using LangChain's `with_structured_output(method="json_mode")` or tool calling.
- **Chain of Thought (CoT):** Prompts will force the LLM to output its mathematical step (e.g., "Calculation: 15 / 10 = 1.5") *before* outputting the flag.
- **Category Isolation:** By evaluating one category at a time (e.g., just Valuation), the LLM context remains small, drastically reducing confusion between unrelated metrics.
- **Explicit Rule Injection:** The exact logic from the markdown spec will be injected into the system prompt for that specific category.

## 3. Architecture: The Multi-Step Chain
The analysis will be orchestrated in the backend (`app/services/ai_analyzer.py`) via the following flow:

### Phase A: Category Evaluation (Parallel)
`asyncio.gather()` will trigger 5 simultaneous Groq API calls. Each call receives the raw data and the rules for its specific category.
- Call 1: `evaluate_valuation(data)`
- Call 2: `evaluate_quarterly(data)`
- Call 3: `evaluate_balance_sheet(data)`
- Call 4: `evaluate_cash_flow(data)`
- Call 5: `evaluate_governance(data)`

**Output Schema per Category:**
```json
{
  "flags": [
    {
      "rule_id": "VAL-01",
      "flag": "GREEN",
      "calculation_reasoning": "Price/EPS = 15. Industry is 20. 15 < 20.",
      "plain_language_reason": "The stock is trading at a discount compared to its peers."
    }
  ]
}
```

### Phase B: Synthesis
Once all 5 category evaluations return, their outputs (flags and reasons) are fed into a 6th Groq call: the **Synthesizer**.
**Output Schema for Synthesizer:**
```json
{
  "overall_pros": ["Strong cash flow consistency", "High ROCE"],
  "overall_cons": ["Rising debt levels", "Stretched P/B ratio"],
  "horizons": {
    "short_term": {"verdict": "Hold", "reason": "..."},
    "medium_term": {"verdict": "Buy", "reason": "..."},
    "long_term": {"verdict": "Buy", "reason": "..."}
  }
}
```

## 4. API Response Update
The existing `/api/stocks/analyze` endpoint will append this AI analysis directly into the returned JSON so the frontend receives everything in one payload.

## 5. Frontend Integration
- **Verdict Header:** A new UI component showing the 3 horizons, score, and the Pros/Cons lists.
- **Data Cards Update:** The existing `StockMasterData` grids will map the AI's rule flags to the visual display (e.g., coloring a cell red and showing a tooltip with the `plain_language_reason`).
