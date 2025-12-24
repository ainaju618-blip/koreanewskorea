#!/usr/bin/env python3
"""
Ollama MCP Server for Korea NEWS
================================
FastMCP-based MCP server for Ollama integration.

Features:
- 5-Layer news article verification
- Korean press release to news conversion
- Hallucination detection
- Fact extraction and validation

Usage:
    python server.py

Or via MCP:
    Add to Claude settings as MCP server
"""

import asyncio
import json
import re
from typing import Any
import httpx
from mcp.server import Server
from mcp.types import Tool, TextContent
from mcp.server.stdio import stdio_server

# Configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4"
MAX_RETRIES = 10
MIN_LENGTH_RATIO = 0.7
TIMEOUT = 300  # 5 minutes

# Initialize MCP Server
server = Server("ollama-koreanews")


async def call_ollama(prompt: str, model: str = OLLAMA_MODEL) -> str:
    """Call Ollama API with given prompt."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        response = await client.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False
            }
        )
        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.status_code}")
        return response.json().get("response", "")


def extract_facts(text: str) -> dict:
    """
    Layer 1: Extract facts from text using regex patterns.
    No LLM call - pure automated extraction.
    """
    # Numbers with units
    numbers = re.findall(r'\d+(?:,\d{3})*(?:\.\d+)?(?:만|억|천|백)?(?:원|명|개|kg|포대|일|월|년)?', text)

    # Dates
    dates = re.findall(r'(?:지난\s*)?\d{1,2}일', text)
    dates.extend(re.findall(r'\d{1,2}월\s*\d{1,2}일', text))

    # Names with titles
    names = re.findall(r'[가-힣]{2,4}(?:\s+)?(?:씨|대표|회장|면장|위원장|군수|시장|도지사|교육감|청장)', text)

    # Organizations
    orgs = re.findall(r'[가-힣]+(?:군|시|도|면|읍|동|리|청년회|협의체|교육청|교육지원청)', text)

    # Quotes
    quotes = re.findall(r'"([^"]+)"', text)

    return {
        "numbers": list(set(numbers)),
        "dates": list(set(dates)),
        "names": list(set(names)),
        "organizations": list(set(orgs)),
        "quotes": quotes
    }


def compare_facts(original: dict, converted: dict, converted_text: str) -> dict:
    """
    Layer 2: Compare extracted facts between original and converted.
    Returns missing facts and pass/fail status.
    """
    missing = {
        "numbers": [],
        "dates": [],
        "names": [],
        "organizations": []
    }

    converted_no_space = converted_text.replace(" ", "").replace("\n", "")

    # Check numbers
    for num in original["numbers"]:
        num_clean = num.replace(" ", "")
        if num_clean not in converted_no_space:
            missing["numbers"].append(num)

    # Check dates (flexible matching)
    for date in original["dates"]:
        date_clean = date.replace(" ", "")
        # Also check for just the number+day part
        date_num_match = re.search(r'\d+일', date)
        date_num = date_num_match.group(0) if date_num_match else ""

        found = (date_clean in converted_no_space or
                (date_num and date_num in converted_text))
        if not found:
            missing["dates"].append(date)

    # Check names
    for name in original["names"]:
        name_clean = name.replace(" ", "")
        if name_clean not in converted_no_space:
            missing["names"].append(name)

    # Calculate pass/fail
    total_missing = sum(len(v) for v in missing.values())
    passed = total_missing == 0

    return {
        "passed": passed,
        "missing": missing,
        "total_missing": total_missing,
        "details": "OK" if passed else f"Missing: {json.dumps(missing, ensure_ascii=False)}"
    }


async def verify_hallucination(original: str, converted: str) -> dict:
    """
    Layer 3: LLM-based hallucination detection.
    Checks if converted text contains fabricated content.
    """
    prompt = f"""[TASK] Find ANY fabricated content in the converted article that does NOT exist in the original.

IMPORTANT: Only report content that is completely NEW and FABRICATED - not just rephrased.

RESPOND with exactly one of:
- "Fabricated: NO" if all content comes from the original
- "Fabricated: YES - [specific fabrication]" if you find fabricated content

[Original Press Release]
{original}

[Converted News Article]
{converted}

[Your Analysis]"""

    response = await call_ollama(prompt)

    has_hallucination = "fabricated: yes" in response.lower()

    return {
        "passed": not has_hallucination,
        "has_hallucination": has_hallucination,
        "details": response[:500]
    }


async def verify_cross_validation(original: str, converted: str) -> dict:
    """
    Layer 4: LLM-based cross-validation with scoring.
    Independent quality assessment.
    """
    prompt = f"""[TASK] Score this news article conversion from 0-100.

Scoring Criteria:
- Accuracy (40 points): All facts match exactly (numbers, dates, names)
- Completeness (30 points): No important information is missing
- No Additions (30 points): No invented or fabricated content

RESPOND with exactly: "SCORE: X/100" followed by brief explanation.

[Original Press Release]
{original[:1000]}

[Converted News Article]
{converted[:1000]}

[Your Score]"""

    response = await call_ollama(prompt)

    # Extract score
    score_match = re.search(r'SCORE:\s*(\d+)', response, re.IGNORECASE)
    score = int(score_match.group(1)) if score_match else 50

    return {
        "passed": score >= 80,
        "score": score,
        "details": response[:300]
    }


def verify_length(original: str, converted: str) -> dict:
    """
    Layer 5: Length verification.
    Ensures converted text is at least 70% of original length.
    """
    original_len = len(original)
    converted_len = len(converted)
    ratio = converted_len / original_len if original_len > 0 else 0

    return {
        "passed": ratio >= MIN_LENGTH_RATIO,
        "ratio": ratio,
        "original_length": original_len,
        "converted_length": converted_len,
        "details": f"{ratio*100:.1f}% ({converted_len}/{original_len} chars)"
    }


async def convert_to_news(press_release: str, attempt: int = 1, feedback: str = "") -> dict:
    """
    Convert press release to news article format.
    Includes feedback from previous failed attempts.
    """
    input_length = len(press_release)
    min_output = int(input_length * MIN_LENGTH_RATIO)

    # Length guidance based on input size
    if input_length < 500:
        length_guidance = "[Short] Lead paragraph -> Details"
    elif input_length < 1500:
        length_guidance = "[Medium] Lead -> Structured info -> Quote (if exists)"
    else:
        length_guidance = "[Long] Lead -> Subheadings -> Quotes"

    feedback_section = ""
    if feedback:
        feedback_section = f"""
# PREVIOUS ATTEMPT FAILED!
{feedback}
YOU MUST FIX THESE ISSUES IN THIS ATTEMPT!
"""

    prompt = f"""# Role
You are a professional news editor. Your job is to restructure press releases into news articles.
You must ONLY use facts from the press release. NEVER add new information.

---
{feedback_section}
# Absolute Rules (Violation = Rejection)

## 1. Source Truth Only
- Use ONLY facts from the press release (numbers, places, names, dates, quotes)
- NEVER add statistics, analysis, or predictions
- NEVER use speculative expressions like "expected to", "likely to"

## 2. Preserve All Facts
- Keep ALL numbers, dates, and names EXACTLY as written
- Do not abbreviate or expand organization names
- Preserve quote content exactly

## 3. Length Requirement (CRITICAL!)
- Input length: {input_length} characters
- Minimum output: {min_output} characters (70% of input)
- Structure: {length_guidance}
- Include ALL important information. DO NOT summarize.

---

# Output Format

## Subtitle (First Line)
[Subtitle: One sentence summary of key point]

## Body Structure
- Lead paragraph: 2-3 sentences with core facts
- Body: Detailed information (use markers like - or numbers)
- Quotes: Only if present in original

---

[Press Release]
{press_release}

[News Article]"""

    response = await call_ollama(prompt)

    # Extract subtitle
    subtitle_match = re.search(r'\[(?:부제목|Subtitle):\s*(.+?)\]', response)
    subtitle = subtitle_match.group(1).strip() if subtitle_match else ""

    # Clean content
    content = re.sub(r'\[(?:부제목|Subtitle):\s*.+?\]\n*', '', response).strip()

    return {
        "content": content,
        "subtitle": subtitle,
        "attempt": attempt
    }


async def process_article_with_verification(press_release: str) -> dict:
    """
    Main processing function with 5-layer verification and retry loop.
    """
    original_facts = extract_facts(press_release)
    all_warnings = []
    last_details = None

    for attempt in range(1, MAX_RETRIES + 1):
        # Generate feedback from previous attempt
        feedback = ""
        if attempt > 1 and last_details:
            if not last_details.get("length", {}).get("passed"):
                feedback += f"LENGTH TOO SHORT: {last_details['length']['details']}\n"
            if not last_details.get("facts", {}).get("passed"):
                feedback += f"MISSING FACTS: {last_details['facts']['details']}\n"
            if not last_details.get("hallucination", {}).get("passed"):
                feedback += "HALLUCINATION DETECTED - Use ONLY original content!\n"

        # Convert
        result = await convert_to_news(press_release, attempt, feedback)
        content = result["content"]
        subtitle = result["subtitle"]

        # Layer 1-2: Fact extraction and comparison
        converted_facts = extract_facts(content)
        fact_check = compare_facts(original_facts, converted_facts, content)

        # Layer 5: Length check (early exit if fail)
        length_check = verify_length(press_release, content)

        if not length_check["passed"]:
            last_details = {
                "facts": fact_check,
                "length": length_check,
                "hallucination": {"passed": False},
                "cross_validation": {"passed": False, "score": 0}
            }
            all_warnings.append(f"Attempt {attempt}: Length fail ({length_check['details']})")
            continue

        # Layer 3-4: Parallel LLM verification
        hallucination_task = verify_hallucination(press_release, content)
        cross_val_task = verify_cross_validation(press_release, content)

        hallucination, cross_val = await asyncio.gather(
            hallucination_task,
            cross_val_task
        )

        last_details = {
            "facts": fact_check,
            "length": length_check,
            "hallucination": hallucination,
            "cross_validation": cross_val
        }

        # Determine grade
        all_passed = (fact_check["passed"] and
                     length_check["passed"] and
                     hallucination["passed"] and
                     cross_val["passed"])

        if not length_check["passed"]:
            grade = "D" if length_check["ratio"] < 0.5 else "C"
        elif not hallucination["passed"] or not fact_check["passed"]:
            grade = "C"
        elif not cross_val["passed"]:
            grade = "B"
        else:
            grade = "A"

        # Success conditions: Grade A or B
        if all_passed or grade in ["A", "B"]:
            return {
                "success": True,
                "content": content,
                "subtitle": subtitle,
                "grade": grade,
                "attempt": attempt,
                "verification": last_details,
                "warnings": all_warnings
            }

        all_warnings.append(f"Attempt {attempt}: Grade {grade}")

    # Failed after all retries
    return {
        "success": False,
        "content": content if 'content' in dir() else "",
        "subtitle": subtitle if 'subtitle' in dir() else "",
        "grade": "F",
        "attempt": MAX_RETRIES,
        "verification": last_details,
        "warnings": all_warnings,
        "error": f"Failed after {MAX_RETRIES} attempts"
    }


# MCP Tool Definitions
@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available MCP tools."""
    return [
        Tool(
            name="convert_press_release",
            description="Convert a Korean press release to a news article with 5-layer verification",
            inputSchema={
                "type": "object",
                "properties": {
                    "press_release": {
                        "type": "string",
                        "description": "The press release text to convert"
                    }
                },
                "required": ["press_release"]
            }
        ),
        Tool(
            name="extract_facts",
            description="Extract facts (numbers, dates, names, organizations, quotes) from Korean text",
            inputSchema={
                "type": "object",
                "properties": {
                    "text": {
                        "type": "string",
                        "description": "The text to extract facts from"
                    }
                },
                "required": ["text"]
            }
        ),
        Tool(
            name="verify_article",
            description="Verify a converted article against original press release",
            inputSchema={
                "type": "object",
                "properties": {
                    "original": {
                        "type": "string",
                        "description": "Original press release"
                    },
                    "converted": {
                        "type": "string",
                        "description": "Converted news article"
                    }
                },
                "required": ["original", "converted"]
            }
        ),
        Tool(
            name="ollama_generate",
            description="Direct Ollama text generation with custom prompt",
            inputSchema={
                "type": "object",
                "properties": {
                    "prompt": {
                        "type": "string",
                        "description": "The prompt to send to Ollama"
                    },
                    "model": {
                        "type": "string",
                        "description": "Model to use (default: benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4)"
                    }
                },
                "required": ["prompt"]
            }
        ),
        Tool(
            name="check_ollama_status",
            description="Check if Ollama server is running and available models",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    """Handle MCP tool calls."""

    if name == "convert_press_release":
        result = await process_article_with_verification(arguments["press_release"])
        return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

    elif name == "extract_facts":
        facts = extract_facts(arguments["text"])
        return [TextContent(type="text", text=json.dumps(facts, ensure_ascii=False, indent=2))]

    elif name == "verify_article":
        original = arguments["original"]
        converted = arguments["converted"]

        # Run all verifications
        original_facts = extract_facts(original)
        converted_facts = extract_facts(converted)
        fact_check = compare_facts(original_facts, converted_facts, converted)
        length_check = verify_length(original, converted)

        # Parallel LLM verification
        hallucination, cross_val = await asyncio.gather(
            verify_hallucination(original, converted),
            verify_cross_validation(original, converted)
        )

        result = {
            "facts": fact_check,
            "length": length_check,
            "hallucination": hallucination,
            "cross_validation": cross_val,
            "overall_passed": all([
                fact_check["passed"],
                length_check["passed"],
                hallucination["passed"],
                cross_val["passed"]
            ])
        }
        return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

    elif name == "ollama_generate":
        model = arguments.get("model", OLLAMA_MODEL)
        response = await call_ollama(arguments["prompt"], model)
        return [TextContent(type="text", text=response)]

    elif name == "check_ollama_status":
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                # Check server status
                response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                if response.status_code == 200:
                    models = response.json().get("models", [])
                    model_names = [m.get("name", "") for m in models]
                    result = {
                        "status": "online",
                        "base_url": OLLAMA_BASE_URL,
                        "available_models": model_names,
                        "default_model": OLLAMA_MODEL,
                        "default_model_available": any(OLLAMA_MODEL in m for m in model_names)
                    }
                else:
                    result = {"status": "error", "code": response.status_code}
        except Exception as e:
            result = {"status": "offline", "error": str(e)}

        return [TextContent(type="text", text=json.dumps(result, ensure_ascii=False, indent=2))]

    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the MCP server."""
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
