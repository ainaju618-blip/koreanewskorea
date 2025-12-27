# Ollama Optimization Compact Record

> **Date:** 2025-12-26
> **Purpose:** Model comparison, prompt tuning, parallel processing records

---

## 1. Model Comparison (105 iterations)

| Model | Params | Size | Avg Time | Avg Output | Short Rate |
|-------|--------|------|----------|------------|------------|
| hermes3-8b (Q4) | 8B | 5GB | **12.12s** | 434 chars | 69% |
| korean:8b (Q8) | 8B | 8.5GB | 67.69s | **460 chars** | 71% |
| **qwen2.5:14b (Q4)** | 14.8B | 9GB | 43.59s | 398 chars | 86% |
| qwen2.5:32b | 32.8B | 20GB | N/A | N/A | VRAM exceeded |
| gemma3:12b | 12.2B | 8GB | Not tested | - | - |

**Winner:** `qwen2.5:14b` (balanced quality/speed for RTX 4070 12GB)

---

## 2. Optimized Settings

| Setting | Before | After | Impact |
|---------|--------|-------|--------|
| **model** | hermes3-8b | qwen2.5:14b | Better quality |
| **num_ctx** | 2048 (default) | **8192** | 4x context window |
| **num_predict** | 2048 | **4096** | 2x output tokens |
| **timeout** | None | **180s** | Prevents hang |
| **temperature** | N/A | 0.3 | Consistent output |
| **top_p** | N/A | 0.9 | Focused sampling |
| **repeat_penalty** | N/A | 1.1 | Reduce repetition |

---

## 3. Prompt Tuning

### Key Changes
```
Before: "Keep concise" -> Caused summarization
After:  "MATCH original length, DO NOT SUMMARIZE"
```

### Effective Prompt Structure
```
1. Role definition (expert editor)
2. ABSOLUTE RULES section
3. LENGTH REQUIREMENT with warnings (#####)
4. Explicit character counts
5. FINAL REMINDER before output
```

### Length Preservation Formula
```
inputLength = content.length
minOutputLength = Math.floor(inputLength * 0.85)
prompt includes: "Original: ${inputLength}, TARGET: ${inputLength}, MINIMUM: ${minOutputLength}"
```

---

## 4. Test Results Summary

### Optimized Settings (5 iterations)
| Metric | Value |
|--------|-------|
| Success Rate | 100% |
| Timeouts | 0 |
| Avg Time | 36.37s |
| Avg Output | 400 chars (80.2%) |
| Length Pass | 20% (still short) |

### Real Article Test (5 articles)
| Metric | Value |
|--------|-------|
| Success Rate | 100% |
| Avg Time | **126.8s** (slower than sample) |
| Avg Output Ratio | 80.7% |
| Length Pass | 40% (2/5 >= 85%) |

---

## 5. Parallel Processing Analysis

### Memory Budget (RTX 4070 12GB)
| Component | Memory | Status |
|-----------|--------|--------|
| qwen2.5:14b model | 9GB | Loaded |
| Available VRAM | ~3GB | Limited |
| Parallel capacity | **1 only** | No room for 2nd model |

### Scheduler Resource Issues
| Process | Memory | CPU |
|---------|--------|-----|
| Playwright x5 | 1-2.5GB | MED |
| Ollama server | **2-4GB** | HIGH |
| Node.js dev | 300-500MB | MED |
| GUI loop (100ms) | LOW | **HIGH** |

**Peak Total:** 3.45-7.3GB (dangerous on 8GB systems)

### Quick Fixes Applied
1. MAX_WORKERS: 5 -> 3 (30-40% memory reduction)
2. GUI update: 100ms -> 500ms (80% CPU reduction)
3. Batch DB logging (90% fewer inserts)

---

## 6. Remaining Issues

### Output Length Problem
- **Target:** >= 85% of input
- **Actual:** ~80% average
- **Root Cause:** LLM summarization tendency

### Possible Solutions (Not Yet Tested)
1. Two-pass processing (expand after initial)
2. Chunked processing for long articles
3. Fine-tuning on Korean news corpus
4. Cloud API for batch processing

---

## 7. Files Modified

| File | Changes |
|------|---------|
| `src/app/api/bot/process-single-article/route.ts` | Model, timeout, num_ctx, prompt |
| `src/app/api/bot/run-ai-processing/route.ts` | Model, timeout, num_ctx |
| `tools/scheduled_scraper.py` | MAX_WORKERS: 5->3 |
| `info/guides/OLLAMA_OPTIMIZATION_GUIDE.md` | Documentation |

---

## 8. API Code Pattern

```typescript
// Timeout with AbortController
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 180000);

const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        model: 'qwen2.5:14b',
        prompt: prompt,
        stream: false,
        options: {
            num_ctx: 8192,
            num_predict: 4096,
            temperature: 0.3,
            top_p: 0.9,
            repeat_penalty: 1.1
        }
    }),
    signal: controller.signal
});

clearTimeout(timeoutId);
```

---

## 9. Key Learnings

1. **14B model is optimal** for 12GB VRAM (9GB + 3GB headroom)
2. **Timeout is essential** - prevents indefinite hang
3. **Prompt length emphasis** helps but doesn't fully solve summarization
4. **Real articles take 3x longer** than sample tests (127s vs 44s)
5. **Parallel processing not feasible** with 14B model on 12GB VRAM

---

*Compact record generated: 2025-12-26*
*Source files: OLLAMA_TEST_REPORT, OLLAMA_EXPERT_CONSULTATION, SCHEDULER_RESOURCE_ANALYSIS, OLLAMA_OPTIMIZATION_GUIDE*
