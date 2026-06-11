import asyncio
import json
from typing import List, Optional

from services.ollama_service import generate
from services.parsing_service import split_into_chunks


CHUNK_REVIEWER_PROMPT = """\
You are a study assistant. Read the following excerpt from a study document and write a comprehensive review of this section.

Include:
- Key concepts covered
- Important terms and definitions
- Main ideas and explanations
- Any notable facts or formulas

Keep your response under 1200 tokens.

---
{chunk}
---

Write the comprehensive review now:"""

AGGREGATE_PROMPT = """\
You are a study assistant. Below are section-level reviews of parts of a larger document.
Combine them into a single, well-organized master comprehensive reviewer.

Structure it with these sections:
## Overview
## Key Concepts
## Detailed Notes
## Important Terms

Keep your response under 2000 tokens.

---
{chunk_reviews}
---

Write the master comprehensive reviewer now:"""

FLASHCARD_PROMPT = """\
You are a study assistant. Read the master reviewer below and generate flashcards.

Rules:
- Each card: FRONT (term or question) | BACK (definition or answer)
- Generate 10–20 cards covering the most important concepts
- Output ONLY a JSON array, no other text

Format:
[{{"front": "...", "back": "..."}}]

---
{reviewer}
---

JSON output:"""

MCQ_PROMPT = """\
You are a study assistant. Read the master reviewer below and generate multiple choice questions.

Rules:
- 4 options per question (A, B, C, D)
- 1 correct answer per question
- Include a brief explanation for the correct answer
- Generate 8–15 questions
- Output ONLY a JSON array, no other text

Format:
[{{
  "question": "...",
  "options": [{{"label":"A","text":"..."}},{{"label":"B","text":"..."}},{{"label":"C","text":"..."}},{{"label":"D","text":"..."}}],
  "correct_answer": "A",
  "explanation": "..."
}}]

---
{reviewer}
---

JSON output:"""

SUMMARY_PROMPT = """\
You are a study assistant. Write a concise summary of the master reviewer below.

Include:
- 3–5 sentence overview
- Key points as bullet points
- Important terms with brief definitions

Keep it under 800 words.

---
{reviewer}
---

Summary:"""


async def generate_chunk_reviewer(model: str, chunk: str) -> str:
    prompt = CHUNK_REVIEWER_PROMPT.format(chunk=chunk[:4000])
    return await generate(model, prompt, max_tokens=1200)


async def aggregate_reviewers(model: str, chunk_reviews: List[str]) -> str:
    combined = "\n\n---\n\n".join(chunk_reviews)
    prompt = AGGREGATE_PROMPT.format(chunk_reviews=combined[:6000])
    return await generate(model, prompt, max_tokens=2000)


async def generate_flashcards(model: str, reviewer: str) -> List[dict]:
    prompt = FLASHCARD_PROMPT.format(reviewer=reviewer[:5000])
    raw = await generate(model, prompt, max_tokens=1500)
    return _parse_json(raw, [])


async def generate_mcqs(model: str, reviewer: str) -> List[dict]:
    prompt = MCQ_PROMPT.format(reviewer=reviewer[:5000])
    raw = await generate(model, prompt, max_tokens=1500)
    return _parse_json(raw, [])


async def generate_summary(model: str, reviewer: str) -> str:
    prompt = SUMMARY_PROMPT.format(reviewer=reviewer[:5000])
    return await generate(model, prompt, max_tokens=1200)


def _parse_json(text: str, default):
    """Extract first JSON array or object from LLM output."""
    import re
    match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    if not match:
        return default
    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return default
