from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Dict

class RuleFlag(BaseModel):
    rule_id: str = Field(description="The ID of the rule being evaluated (e.g., 'VAL-01', 'QTR-03')")
    flag: Literal["GREEN", "YELLOW", "RED", "N/A"] = Field(description="The evaluated flag according to the strict rule logic")
    calculation_reasoning: str = Field(description="The exact mathematical calculation step (e.g. 'PE = 15/2 = 7.5. 7.5 < 10.')")
    plain_language_reason: str = Field(description="A short, user-friendly explanation of why this flag was assigned")

class CategoryEvaluation(BaseModel):
    flags: List[RuleFlag] = Field(description="The evaluated flags for the rules in this category")

class HorizonVerdict(BaseModel):
    verdict: Literal["Buy", "Hold", "Avoid"] = Field(description="The overall verdict for this specific time horizon")
    reason: str = Field(description="The reasoning for this verdict, citing specific rule strengths or weaknesses")

class HorizonGroup(BaseModel):
    short_term: HorizonVerdict = Field(description="1 week to 3 months (momentum/trade view)")
    medium_term: HorizonVerdict = Field(description="3 months to 1 year (earnings-cycle view)")
    long_term: HorizonVerdict = Field(description="1 to 5 years (fundamentals view)")

class FinalAIAnalysis(BaseModel):
    overall_pros: List[str] = Field(description="Top 3-4 structural strengths of the company")
    overall_cons: List[str] = Field(description="Top 3-4 biggest risks or red flags")
    horizons: HorizonGroup = Field(description="The Buy/Hold/Avoid verdicts for the 3 time horizons")
    category_flags: List[RuleFlag] = Field(description="The merged list of all evaluated rule flags across all categories")
