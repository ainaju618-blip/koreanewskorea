# Ollama LLM Expert Consultation - Lightweight Mode Model Selection

> Date: 2025-12-27
> Project: Korea NEWS - Regional News Automation Platform
> Contact: Korea NEWS Development Team

---

## 1. Current Situation

### 1.1 System Overview
We operate a local news automation platform that:
- Collects press releases from 27 regional government agencies (Jeonnam/Gwangju area)
- Processes them with AI to generate news articles
- Publishes automatically to our news website

### 1.2 Processing Mode: "Lightweight Mode" (NEW)
We recently switched to a **Lightweight Mode** that:
- **KEEPS original body content 100% intact** (no AI modification)
- **Only generates**: Title (10-25 chars), Subtitle (20-40 chars), Summary (50-100 chars)
- **Goal**: Minimize hallucination risk by not letting AI touch the body

```
Input:  Original press release (500-2000 Korean characters)
Output: Title + Subtitle + Summary ONLY (total ~200 characters max)
        Body = UNCHANGED from database
```

### 1.3 Current Model
- **Model**: `benedict/linkbricks-llama3.1-korean:8b`
- **Token Limit**: 256 tokens (for metadata only)
- **Processing Time**: ~4.6 seconds per article
- **Success Rate**: 100% (24/24 articles)

---

## 2. Technical Requirements

### 2.1 Output Requirements
| Field | Length | Language | Notes |
|-------|--------|----------|-------|
| Title | 10-25 chars | Korean only | No Hanja, No English |
| Subtitle | 20-40 chars | Korean only | No Hanja, No English |
| Summary | 50-100 chars | Korean only | No Hanja, No English |

### 2.2 Constraints
- **Absolutely NO body content generation** (only metadata)
- **Pure Korean output** (Hangul + Arabic numerals only)
- **No hallucination** - all facts must come from input
- **Fast processing** - target <5 seconds per article
- **Low token usage** - max 256 tokens output

### 2.3 Current Prompt Structure
```
# Role
Press release title/subtitle/summary editor

# Forbidden
- No body output! (Only title/subtitle/summary)
- No Hanja (Chinese characters)
- No English words

# Reference Info
- Organization: {extracted orgs}
- People: {extracted names}

# Source Summary
{first 500 chars of press release}...

# Output (ONLY this!)
[Title]
10-25 chars

[Subtitle]
20-40 chars

[Summary]
50-100 chars

Do NOT output body!
```

---

## 3. Questions for Expert

### Q1. Optimal Model Recommendation
**For this specific use case (Korean metadata generation only, ~200 chars output), which model would you recommend?**

Considerations:
- Must excel at Korean language
- Must be good at summarization/title generation
- Must follow strict output format
- Should be fast (we process 50+ articles daily)
- Available on Ollama

### Q2. Model Size Trade-off
**Given our limited output requirement (256 tokens max), would a smaller model (3B-7B) perform equally well as larger models (8B+)?**

Our hypothesis: Since we only need ~200 chars of structured output (not free-form text), a smaller model might be sufficient and faster.

### Q3. Alternative Models to Consider
**Are there any specialized models for:**
- Korean title generation
- Korean summarization
- Korean headline writing
- Short-form Korean text generation

### Q4. Parameter Optimization
**For short, structured Korean output, what parameters would you recommend?**

Current settings:
```python
options = {
    "num_ctx": 4096,
    "temperature": 0.1,       # Low for consistency
    "repeat_penalty": 1.1,
    "top_p": 0.8,
    "num_predict": 256,       # Max tokens
    "num_gpu": 35
}
```

### Q5. Prompt Engineering
**Is our current prompt structure optimal for this task?**

Specifically:
- Should we provide full press release or just first 500 chars?
- Are the length constraints clear enough?
- Any prompt techniques to better enforce "no body output"?

---

## 4. Current Performance Metrics

| Metric | Value |
|--------|-------|
| Model | benedict/linkbricks-llama3.1-korean:8b |
| Avg Processing Time | 4.6s |
| Success Rate | 100% |
| Pure Korean Output | 100% |
| Token Usage | ~150-200 tokens |
| GPU Memory | ~8GB |

---

## 5. Models We've Tested

| Model | Korean Quality | Speed | Hanja Issue | Notes |
|-------|---------------|-------|-------------|-------|
| solar:10.7b | Good | Slow | Yes (frequent) | Mixed language output |
| exaone3.5:7.8b | Good | Medium | Occasional | LG's Korean-native model |
| llama3.1-korean:8b | Excellent | Fast | Rare | Currently using |
| gemma2:9b | Poor | Fast | N/A | Not good at Korean |

---

## 6. Expected Response

Please provide:
1. **Top 3 model recommendations** with reasoning
2. **Optimal parameter settings** for each
3. **Any prompt improvements** you'd suggest
4. **Expected performance** (speed, quality, accuracy)

---

## 7. Contact

For questions or clarifications:
- GitHub: [korea-news/koreanewsone]
- Project: Korea NEWS (koreanewsone.com)

Thank you for your expertise!
