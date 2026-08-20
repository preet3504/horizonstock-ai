import os
import json
import asyncio
from pathlib import Path
from dotenv import load_dotenv

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.output_parsers import PydanticOutputParser

from app.schemas.ai_analysis import CategoryEvaluation, FinalAIAnalysis, RuleFlag, HorizonGroup, HorizonVerdict
from app.schemas.master import StockMasterData

load_dotenv()

# We need the GROQ_API_KEY to be set
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

class GroqAnalyzerService:
    def __init__(self):
        if not GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY is not set in environment variables.")
        
        # We use a fast and highly capable model for strict reasoning
        self.llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model="qwen/qwen3.6-27b",
            temperature=0,  # Zero temperature for deterministic financial math
            max_tokens=1500
        )
        
        # Read the rule spec to inject into the system prompt
        # Assuming the backend is in /backend and the spec is in the root
        spec_path = Path(__file__).parent.parent.parent.parent / "ai-stock-screener-fundamental-rules-spec.md"
        try:
            with open(spec_path, "r", encoding="utf-8") as f:
                self.rule_spec = f.read()
        except Exception as e:
            self.rule_spec = "Rule spec not found. Please ensure ai-stock-screener-fundamental-rules-spec.md exists in the root."

    async def evaluate_category(self, category_name: str, category_prefix: str, data: StockMasterData) -> CategoryEvaluation:
        """
        Evaluates a single category of rules against the raw data.
        """
        # Extract only the relevant rules for this category to save tokens and prevent 8k TPM limits
        relevant_rules = []
        for line in self.rule_spec.split("\n"):
            if line.startswith(f"### {category_prefix}-") or line.startswith("-") or not line.strip():
                relevant_rules.append(line)
        
        local_rule_spec = "\n".join(relevant_rules)
        
        parser = PydanticOutputParser(pydantic_object=CategoryEvaluation)
        
        system_prompt = f"""You are an expert, deterministic financial AI evaluator.
Your job is to strictly evaluate the '{category_name}' category of rules against the provided company data.

CRITICAL INSTRUCTIONS (ANTI-HALLUCINATION):
1. Only evaluate rules that begin with the prefix '{category_prefix}-'. Ignore all other rules.
2. You MUST adhere exactly to the formulas and thresholds provided in the Rule Specification below.
3. For every rule, show the EXACT mathematical calculation step before assigning the flag (e.g. 'PE = 15/2 = 7.5. 7.5 < 10.').
4. If a value is missing (null/None) or the rule doesn't apply, assign 'N/A'.
5. Do NOT guess or invent numbers. If data is missing, fail gracefully to N/A.

{parser.get_format_instructions()}

---
RULE SPECIFICATION:
{local_rule_spec}
"""
        
        user_prompt = f"""Evaluate the '{category_name}' rules for this company.
Here is the structured financial data (StockMasterData) in JSON format:

{data.model_dump_json()}
"""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            try:
                parsed_response: CategoryEvaluation = parser.invoke(response)
            except Exception as parse_err:
                print(f"Initial parse failed for {category_name}, attempting to fix JSON: {parse_err}")
                fix_prompt = f"You are a strict JSON fixer. The following JSON failed to parse. Fix the JSON so it strictly matches the schema. Output ONLY valid JSON, no markdown blocks.\n\nError: {parse_err}\n\nFailed JSON:\n{response.content}"
                fix_response = await self.llm.ainvoke([HumanMessage(content=fix_prompt)])
                parsed_response: CategoryEvaluation = parser.invoke(fix_response)
            return parsed_response
        except Exception as e:
            import traceback
            print(f"Error in evaluate_category ({category_name}):", repr(e))
            # Fallback gracefully if LLM parsing fails entirely
            return CategoryEvaluation(flags=[])

    async def generate_synthesis(self, all_flags: list[RuleFlag]) -> dict:
        """
        Takes all evaluated flags and synthesizes the overall Pros/Cons and Horizon Verdicts.
        """
        from pydantic import BaseModel
        from typing import List

        # We need a slightly different output schema for this LLM call because we need Pros/Cons + Horizons
        class SynthesisOutput(BaseModel):
            overall_pros: List[str]
            overall_cons: List[str]
            horizons: HorizonGroup
            
        parser = PydanticOutputParser(pydantic_object=SynthesisOutput)
        
        system_prompt = f"""You are an expert financial analyst synthesizer.
You have been provided with the deterministic Green/Yellow/Red evaluations of a company's fundamentals.
Your task is to:
1. Identify the Top 3-4 structural strengths (overall_pros).
2. Identify the Top 3-4 biggest risks or red flags (overall_cons).
3. Determine a clear Buy/Hold/Avoid verdict for 3 time horizons:
   - Short Term (1 week to 3 months): Driven by momentum and immediate quarterly red flags.
   - Medium Term (3 months to 1 year): Driven by earnings cycles and balance sheet.
   - Long Term (1 to 5 years): Driven by deep fundamentals (Valuation, ROCE, Cash Flow consistency).

Ensure your reasoning (reason) specifically cites the rule flags provided. Do NOT invent new metrics.

{parser.get_format_instructions()}
"""
        flags_json = json.dumps([f.model_dump() for f in all_flags], indent=2)
        user_prompt = f"""Here are the evaluated flags for the company:

{flags_json}

Synthesize this data into the final pros, cons, and horizon verdicts."""

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]

        try:
            response = await self.llm.ainvoke(messages)
            try:
                parsed_response = parser.invoke(response)
            except Exception as parse_err:
                print(f"Initial parse failed for synthesis, attempting to fix JSON: {parse_err}")
                fix_prompt = f"You are a strict JSON fixer. The following JSON failed to parse. Fix the JSON so it strictly matches the schema. Output ONLY valid JSON, no markdown blocks.\n\nError: {parse_err}\n\nFailed JSON:\n{response.content}"
                fix_response = await self.llm.ainvoke([HumanMessage(content=fix_prompt)])
                parsed_response = parser.invoke(fix_response)

            return {
                "overall_pros": parsed_response.overall_pros,
                "overall_cons": parsed_response.overall_cons,
                "horizons": parsed_response.horizons
            }
        except Exception as e:
            import traceback
            print(f"Error in generate_synthesis:", repr(e))
            return {
                "overall_pros": ["Error synthesizing data"],
                "overall_cons": ["Error synthesizing data"],
                "horizons": HorizonGroup(
                    short_term=HorizonVerdict(verdict="Hold", reason="Error"),
                    medium_term=HorizonVerdict(verdict="Hold", reason="Error"),
                    long_term=HorizonVerdict(verdict="Hold", reason="Error"),
                )
            }

    async def analyze(self, data: StockMasterData) -> FinalAIAnalysis:
        """
        Main orchestrator: Runs all categories in parallel, then synthesizes.
        """
        # Run the 5 categories sequentially. While Gemini has high rate limits, running it sequentially prevents asyncio deadlocks on Windows.
        all_flags = []
        for category_name, category_prefix in [
            ("Valuation & Return Ratios", "VAL"),
            ("Quarterly / Trailing Performance", "QTR"),
            ("Balance Sheet Strength", "BAL"),
            ("Cash Flow Quality", "CF"),
            ("Governance & Ownership Signals", "GOV")
        ]:
            result = await self.evaluate_category(category_name, category_prefix, data)
            if isinstance(result, CategoryEvaluation):
                all_flags.extend(result.flags)
        
        # Run Synthesis
        synthesis_result = await self.generate_synthesis(all_flags)
        
        return FinalAIAnalysis(
            overall_pros=synthesis_result["overall_pros"],
            overall_cons=synthesis_result["overall_cons"],
            horizons=synthesis_result["horizons"],
            category_flags=all_flags
        )
