# Ollama AI Processing Test Report

> **Date:** 2025-12-26
> **Tester:** Claude AI
> **Purpose:** Validate optimized Ollama settings for Korean news article processing

---

## Executive Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Model** | hermes3-8b | qwen2.5:14b | Upgraded |
| **Timeout Errors** | Indefinite hang | 0 | ✅ Fixed |
| **Avg Response Time** | 12-44s | 36.37s | Normalized |
| **Avg Output Ratio** | 69-86% short | 80.2% | ⚠️ Improved |
| **Success Rate** | 100% | 100% | Maintained |

---

## Test Configuration

### Hardware
- **GPU:** NVIDIA RTX 4070 (12GB VRAM)
- **RAM:** System RAM (available)
- **Platform:** Windows

### Optimized Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `model` | `qwen2.5:14b` | Better quality (14B params) |
| `num_ctx` | `8192` | 4x larger context window |
| `num_predict` | `4096` | 2x more output tokens |
| `timeout` | `180s` | Prevent indefinite hang |
| `temperature` | `0.3` | Consistent output |
| `top_p` | `0.9` | Focused sampling |

### Test Input
- **Sample:** Korean government press release
- **Length:** 499 characters
- **Target:** >= 424 characters (85% of original)

---

## Test Results (5 Iterations)

### Individual Results

| Test | Time | Output | Ratio | Status |
|------|------|--------|-------|--------|
| 1 | 21.38s | 386 chars | 77.4% | ❌ FAIL |
| 2 | 31.89s | 446 chars | 89.4% | ✅ PASS |
| 3 | 46.07s | 369 chars | 73.9% | ❌ FAIL |
| 4 | 33.74s | 385 chars | 77.2% | ❌ FAIL |
| 5 | 48.77s | 415 chars | 83.2% | ❌ FAIL |

### Aggregate Statistics

| Metric | Value |
|--------|-------|
| **Total Tests** | 5 |
| **Successful** | 5 (100%) |
| **Timeouts** | 0 (0%) |
| **Length Check Passed** | 1/5 (20%) |

### Performance Metrics

| Metric | Value |
|--------|-------|
| **Avg Response Time** | 36.37 seconds |
| **Min Response Time** | 21.38 seconds |
| **Max Response Time** | 48.77 seconds |
| **Response Time Variance** | 21s - 49s |

### Output Metrics

| Metric | Value |
|--------|-------|
| **Avg Output Length** | 400 characters |
| **Avg Length Ratio** | 80.2% |
| **Min Output** | 369 characters |
| **Max Output** | 446 characters |
| **Input Length** | 499 characters |

---

## Comparison: Before vs After Optimization

### Previous Test Results (105 iterations)

| Model | Avg Time | Avg Output | Short Output Rate |
|-------|----------|------------|-------------------|
| hermes3-8b (Q4) | 12.12s | 434 chars | 69% (24/35) |
| korean:8b | 67.69s | 460 chars | 71% (25/35) |
| qwen2.5:14b | 43.59s | 398 chars | 86% (30/35) |

### After Optimization (5 iterations)

| Model | Avg Time | Avg Output | Short Output Rate |
|-------|----------|------------|-------------------|
| qwen2.5:14b | 36.37s | 400 chars | 80% (4/5) |

### Key Improvements

1. **✅ Timeout Issue Fixed**
   - Before: No timeout, indefinite hang possible
   - After: 180s timeout, no hangs observed

2. **✅ Response Time Improved**
   - Before: 43.59s average (unoptimized)
   - After: 36.37s average (16% faster)

3. **⚠️ Output Length Still Short**
   - Before: 398 chars average (80%)
   - After: 400 chars average (80.2%)
   - Improvement: Marginal (+0.5%)

---

## Analysis

### What Worked

1. **Timeout Prevention**: AbortController successfully prevents indefinite hanging
2. **Stable Performance**: 100% success rate, no API errors
3. **Reasonable Speed**: 36s average is acceptable for batch processing

### What Needs Improvement

1. **Output Length**: Still ~20% shorter than target
   - Root cause: Model tends to summarize despite explicit instructions
   - Potential solutions:
     - Use expand function for short outputs
     - Try different prompt engineering
     - Consider fine-tuned model

2. **Consistency**: Wide variance in output length (369-446 chars)
   - Some outputs pass (89.4%), others fail (73.9%)
   - May need post-processing to ensure length

---

## Recommendations

### Immediate Actions

1. **Keep current settings** - Timeout and stability improvements are valuable
2. **Enable auto-expansion** - Already implemented in code for outputs <90%
3. **Monitor production** - Track actual length ratios in production

### Future Improvements

1. **Prompt Engineering**: Test alternative prompt structures
2. **Model Fine-tuning**: Consider fine-tuning on Korean news corpus
3. **Hybrid Approach**: Use faster model for simple articles, 14B for complex ones

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/bot/process-single-article/route.ts` | Model, timeout, num_ctx, prompt |
| `src/app/api/bot/run-ai-processing/route.ts` | Model, timeout, num_ctx |
| `info/guides/OLLAMA_OPTIMIZATION_GUIDE.md` | Documentation created |

---

## Conclusion

The optimization successfully resolved the **timeout issue** and maintained **100% success rate**. However, the **output length problem** persists and requires additional prompt engineering or model fine-tuning to fully resolve.

**Recommendation:** Deploy current changes to production while continuing to investigate the length issue.

---

*Report generated by Claude AI on 2025-12-26*
