# Ollama AI Processing Optimization Guide

> **Version:** 1.0
> **Date:** 2025-12-26
> **Author:** Claude AI

---

## Overview

This document describes the optimization changes made to the Ollama-based AI article processing system to resolve the following issues:

1. **Short output problem** - Generated articles were too short (40-50% of original)
2. **Timeout issues** - API calls would hang indefinitely
3. **Model selection** - Using suboptimal model for the task

---

## Changes Summary

### Before vs After

| Setting | Before | After | Impact |
|---------|--------|-------|--------|
| **Model** | `benedict/linkbricks-hermes3-8b` | `qwen2.5:14b` | Better quality, 14B params |
| **num_ctx** | Not set (default 2048) | `8192` | 4x larger context window |
| **num_predict** | `2048` | `4096` | 2x more output tokens |
| **timeout** | None | `180 seconds` | Prevents hanging |
| **Prompt** | "Keep concise" | "Match original length" | Preserves content |

---

## Technical Details

### 1. Model Change: qwen2.5:14b

**Why qwen2.5:14b?**

| Model | Parameters | Speed | Quality | Korean | Recommendation |
|-------|------------|-------|---------|--------|----------------|
| hermes3-8b (Q4) | 8B | 12s | Medium | Good | Speed-focused |
| linkbricks-korean:8b | 8B | 68s | Medium | Excellent | Too slow |
| **qwen2.5:14b** | 14.8B | 44s | High | Excellent | **Balanced** |
| qwen2.5:32b | 32.8B | N/A | Highest | Excellent | VRAM exceeded |

**System Requirements:**
- GPU: RTX 4070 (12GB VRAM)
- Model size: 9GB
- Available VRAM after load: ~3GB

### 2. Context Window (num_ctx): 8192

**Problem:** Default context window is 2048 tokens (~1500 Korean characters).
Long press releases would be truncated.

**Solution:** Set `num_ctx: 8192` to handle articles up to ~6000 characters.

```typescript
options: {
    num_ctx: 8192,  // 4x increase
    // ...
}
```

### 3. Output Tokens (num_predict): 4096

**Problem:** `num_predict: 2048` limited output length.

**Solution:** Doubled to `4096` to allow longer outputs.

```typescript
options: {
    num_predict: 4096,  // 2x increase
    // ...
}
```

### 4. API Timeout: 180 seconds

**Problem:** No timeout meant infinite waiting on slow responses.

**Solution:** Added AbortController with 3-minute timeout.

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 180000);

const response = await fetch(url, {
    signal: controller.signal
});
```

### 5. Prompt Optimization

**Problem:** Original prompt said "keep concise" which caused summarization.

**Solution:** Explicit length preservation instructions.

```
#########################################################
# WARNING: YOUR OUTPUT MUST MATCH THE ORIGINAL LENGTH!  #
# DO NOT SUMMARIZE! DO NOT SHORTEN! PRESERVE ALL INFO!  #
#########################################################
- Original: ${inputLength} characters
- TARGET output: ${inputLength} characters (100% of original)
- MINIMUM output: ${minOutputLength} characters (85%+ of original)
```

---

## Configuration Files

### process-single-article/route.ts

```typescript
// Settings
const OLLAMA_MODEL = 'qwen2.5:14b';
const NUM_CTX = 8192;
const MIN_OUTPUT_TOKENS = 4096;
const API_TIMEOUT_MS = 180000;
```

### run-ai-processing/route.ts

```typescript
// Settings
const OLLAMA_MODEL = 'qwen2.5:14b';
const NUM_CTX = 8192;
const NUM_PREDICT = 4096;
const API_TIMEOUT_MS = 180000;
```

---

## Environment Variables

You can override settings via environment variables:

```bash
# .env.local
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b
```

---

## Performance Benchmarks

### Test Conditions
- GPU: RTX 4070 (12GB VRAM)
- Input: ~500 character Korean press releases
- Iterations: 35 per model

### Results (Before Optimization)

| Metric | hermes3-8b | korean:8b | qwen2.5:14b |
|--------|------------|-----------|-------------|
| Avg Time | 12.12s | 67.69s | 43.59s |
| Avg Output | 434 chars | 460 chars | 398 chars |
| Short Output Rate | 69% | 71% | 86% |
| Success Rate | 100% | 100% | 100% |

### Results (After Optimization)

See test report: `OLLAMA_TEST_REPORT_20251226.md`

---

## Troubleshooting

### Issue: Timeout errors

**Cause:** Article too long or model overloaded.

**Solution:**
1. Increase `API_TIMEOUT_MS` to 300000 (5 min)
2. Check GPU utilization with `nvidia-smi`
3. Reduce concurrent requests

### Issue: Output still too short

**Cause:** Prompt not being followed.

**Solution:**
1. Add more emphasis on length in prompt
2. Increase `MIN_LENGTH_RATIO` to 0.90
3. Use expansion function for short outputs

### Issue: VRAM out of memory

**Cause:** Model too large for GPU.

**Solution:**
1. Use smaller model (8B instead of 14B)
2. Reduce `num_ctx` to 4096
3. Close other GPU applications

---

## Related Files

| File | Purpose |
|------|---------|
| `src/app/api/bot/process-single-article/route.ts` | Main AI processing |
| `src/app/api/bot/run-ai-processing/route.ts` | Batch AI processing |
| `tools/ollama_test.js` | Stress test script |
| `info/errors/_catalog.md` | Error solutions catalog |

---

## Changelog

### v1.0 (2025-12-26)
- Changed model from hermes3-8b to qwen2.5:14b
- Added num_ctx: 8192 setting
- Increased num_predict from 2048 to 4096
- Added 180s API timeout with AbortController
- Updated prompt to emphasize length preservation
