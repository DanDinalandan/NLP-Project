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
- Generate exactly {count} cards covering the most important concepts
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
- Generate exactly {count} questions
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
{keywords_section}
Keep it under 800 words.

---
{reviewer}
---

Summary:"""

SUMMARY_KEYWORDS_SECTION = "- Keyword Glossary: list the 10–15 most important terms with one-line definitions\n"


async def generate_chunk_reviewer(model: str, chunk: str) -> str:
    prompt = CHUNK_REVIEWER_PROMPT.format(chunk=chunk[:4000])
    return await generate(model, prompt, max_tokens=1200)


async def aggregate_reviewers(model: str, chunk_reviews: List[str]) -> str:
    combined = "\n\n---\n\n".join(chunk_reviews)
    prompt = AGGREGATE_PROMPT.format(chunk_reviews=combined[:6000])
    return await generate(model, prompt, max_tokens=2000)


# Safe per-call limits — keeps JSON responses under the LLM's output token cap.
# If the user requests more, we batch multiple calls and deduplicate.
_FC_BATCH  = 15
_MCQ_BATCH = 10


async def generate_flashcards(model: str, reviewer: str, count: int = 15) -> List[dict]:
    results, seen = [], set()
    remaining = count
    while remaining > 0:
        batch  = min(_FC_BATCH, remaining)
        prompt = FLASHCARD_PROMPT.format(reviewer=reviewer[:5000], count=batch)
        raw    = await generate(model, prompt, max_tokens=1400)
        cards  = _parse_json(raw, [])
        added  = 0
        for c in cards:
            key = c.get("front", "").strip().lower()
            if key and key not in seen:
                seen.add(key)
                results.append(c)
                added += 1
        remaining -= batch
        if not cards:  # LLM returned nothing — stop early
            break
    return results


async def generate_mcqs(model: str, reviewer: str, count: int = 10) -> List[dict]:
    results, seen = [], set()
    remaining = count
    while remaining > 0:
        batch  = min(_MCQ_BATCH, remaining)
        prompt = MCQ_PROMPT.format(reviewer=reviewer[:5000], count=batch)
        raw    = await generate(model, prompt, max_tokens=1800)
        qs     = _parse_json(raw, [])
        for q in qs:
            key = q.get("question", "").strip().lower()
            if key and key not in seen:
                seen.add(key)
                results.append(q)
        remaining -= batch
        if not qs:
            break
    return results


async def generate_summary(model: str, reviewer: str, keywords: bool = True) -> str:
    kw_section = SUMMARY_KEYWORDS_SECTION if keywords else ""
    prompt = SUMMARY_PROMPT.format(reviewer=reviewer[:5000], keywords_section=kw_section)
    return await generate(model, prompt, max_tokens=1200)


FIB_PROMPT = """\
You are a study assistant. Create exactly {count} fill-in-the-blank questions from the content below.
Each question should test one important fact, term, or concept.

Return ONLY a JSON array with objects having these exact fields:
- "before": sentence text before the blank (string)
- "after": sentence text after the blank — can be empty string (string)
- "answer": the word or phrase that belongs in the blank (string, 1-5 words)
- "hint": a one-sentence clue to help without giving the answer away (string)

Example:
[{{"before":"The process of converting light into glucose is called","after":"","answer":"photosynthesis","hint":"Plants do this using sunlight and chlorophyll"}}]

Content:
{reviewer}

JSON array:"""


async def generate_fib(model: str, reviewer: str, count: int = 7) -> list:
    prompt = FIB_PROMPT.format(reviewer=reviewer[:5000], count=max(1, count))
    raw = await generate(model, prompt, max_tokens=max(1000, count * 80))
    return _parse_json(raw, [])


TITLE_PROMPT = """\
Based on the content below, write a topic title of 3 to 10 words.
Return ONLY the title — no quotes, no punctuation at the end, nothing else.

Content:
{content}

Title:"""

async def generate_title(model: str, master_reviewer: str) -> str:
    prompt = TITLE_PROMPT.format(content=master_reviewer[:600])
    raw = await generate(model, prompt, max_tokens=25)
    # Take first line only, strip surrounding quotes/punctuation
    title = raw.strip().split('\n')[0].strip().strip('"\'')
    words = title.split()
    return ' '.join(words[:10]) if words else "Untitled"


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
