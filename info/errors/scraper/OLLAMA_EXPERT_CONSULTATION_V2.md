# Ollama LLM Expert Consultation V2 - Critical Issues

> **Date:** 2025-12-27
> **Project:** Korean Regional News Automation Platform
> **Issue:** Solar 10.7B producing mixed language output (Korean + Hanja + English + Japanese)
> **Previous Consultation:** 2025-12-26 (recommendations partially failed)

---

## 1. Hardware Environment

| Component | Specification |
|-----------|---------------|
| **GPU** | NVIDIA RTX 4070 |
| **VRAM** | 12GB |
| **Platform** | Windows 11 |
| **Ollama Version** | Latest (2025-12) |
| **CUDA** | 12.9 |

---

## 2. Current Model Configuration

```javascript
// Model: solar:10.7b (Upstage Korean Enterprise, Q4_0, 6GB)
const SOLAR_OPTIONS = {
    num_ctx: 4096,
    num_predict: 839,        // Dynamic: (inputLength * 1.2) / 2 + 200
    temperature: 0.1,        // EXPERT v1: Lowered from 0.25
    repeat_penalty: 1.1,     // EXPERT v1: Increased from 1.05
    top_p: 0.85,
    num_gpu: 35,
    gpu_layers: 35,
    mirostat: 2,             // EXPERT v1: Added
    mirostat_tau: 5.0,       // EXPERT v1: Added
    mirostat_eta: 0.1        // EXPERT v1: Added
};

// Stop sequences (EXPERT v1 recommendation - NOT WORKING)
const STOP_SEQUENCES = [
    "光", "新", "提", "陽", "薦", "明", "處", "初", "除", "業", "欣",
    "Sunset", "Sunrise", "Sunshine", "새글"
];
```

---

## 3. Critical Problem: Mixed Language Output

### 3.1 Test Input (Korean Press Release)

```
순천시, '프리미엄 딸기의 시작' 건강한 딸기묘 공급체계 완성
(1066 characters, pure Korean)
```

### 3.2 Actual Output (PROBLEMATIC)

```
순천시는 '우량' strawberry 苗의 확보를 결정하는 데 중요한  "strawberry 苗"의
안정적인 공급을 위해 고품질 育苗 生态계 조성에 본격적으로 나설 계획을 세우고 있다.

최근 선정된 지역특화작목 育成사업의 통해, 순천시가 직접 관리하는 育苗시설을
중심으로 건강한 strawberry 苗를 증식하고 이를 지역 农家에 보급할 선순환 구조를
구축할 계획이다.

◇'순천형 無病 苗 增殖 체계'로 strawberry 苗 品質 극大化

시는 전라남도 农業技術원의 優秀한 基本 苗를 活用해 순천시 直영 施設에서
1차로 증식하고, 이를 다시 거점 农家에서 한 번 더 增殖해 일반 育苗 农家에
傳達할 段階別 供給 體系를 갖출 計劃이다.

...

◇現場 密切型 支援 : 花蕊 検査부터 合わせ型 コンサルティング까지
```

### 3.3 Problems Identified

| Problem | Example | Expected |
|---------|---------|----------|
| **English words** | "strawberry" | "딸기" |
| **Hanja (Chinese)** | "苗", "育苗", "農家", "增殖" | "묘", "육묘", "농가", "증식" |
| **Japanese** | "検査", "コンサルティング" | "검사", "컨설팅" |
| **Mixed symbols** | "◇" | Should be consistent |

### 3.4 Character Analysis

```
Total output: 818 characters
- Korean (가-힣): ~40%
- Hanja (CJK Unified): ~35%
- English (a-zA-Z): ~15%
- Japanese (Hiragana/Katakana): ~5%
- Other: ~5%
```

---

## 4. Why Stop Sequences Failed

### 4.1 Technical Explanation

Stop sequences work by matching **exact token sequences** during generation. However:

1. **Character-level stops don't work well** - "光" as a stop only triggers if "光" is generated as a single token
2. **Mid-word Hanja** - In "育苗", the "育" character may be part of a multi-character token
3. **English words** - "strawberry" is generated as tokens like ["straw", "berry"], not matching any stop sequence

### 4.2 Evidence

Despite having stop sequences for "光", "新", "提", etc., the output contains:
- "育苗" (育 not in stop list)
- "農家" (農 not in stop list)
- "增殖" (增 not in stop list)

The model is using a **different set of Hanja** than what we blocked.

---

## 5. Root Cause Analysis

### 5.1 Model Behavior

Solar 10.7B appears to:
1. **Translate Korean terms to Hanja/English** when uncertain
2. **Mix character systems** within sentences
3. **Use Japanese** for some technical terms (possibly from training data)

### 5.2 Hypothesis

The model's training data likely includes:
- Chinese-Korean mixed documents
- Japanese-Korean mixed documents
- English technical documents translated to Korean

When generating Korean text, it sometimes "falls back" to these other languages.

---

## 6. Test Results Summary

| Setting | Time | Output | Ratio | Korean | Hanja | English |
|---------|------|--------|-------|--------|-------|---------|
| Default (no expert) | 72s | 2185 chars | 205% | Low | No | **100%** |
| Expert v1 settings | 222s | 818 chars | 77% | 40% | **35%** | **15%** |

**Observations:**
- Default settings: Outputs **entirely in English**
- Expert settings: Outputs **mixed Korean/Hanja/English/Japanese**
- Neither produces pure Korean output

---

## 7. Questions for Experts

### Q1: Model Selection

Is Solar 10.7B fundamentally unsuitable for pure Korean output?

**Alternative models available:**
| Model | Size | Korean Native? |
|-------|------|----------------|
| exaone3.5:7.8b | 4.7GB | Yes (LG AI) |
| benedict/linkbricks-llama3.1-korean:8b | 8.5GB | Yes |
| qwen2.5:14b | 9GB | Partial |

Should we switch to EXAONE 3.5 which is specifically trained for Korean?

### Q2: Post-Processing vs Generation Control

Given stop sequences don't work, should we:

**Option A: Post-processing (clean after generation)**
```javascript
const cleanText = text
    .replace(/[\u4E00-\u9FFF]/g, '')  // Remove all Hanja
    .replace(/[\u3040-\u309F]/g, '')  // Remove Hiragana
    .replace(/[\u30A0-\u30FF]/g, '')  // Remove Katakana
    .replace(/\bstrawberry\b/gi, '딸기')  // Replace English terms
    // ... more replacements
```

**Option B: Better prompting**
```
You MUST output ONLY in Korean Hangul (가-힣).
ABSOLUTELY NO Chinese characters (漢字).
ABSOLUTELY NO English words.
ABSOLUTELY NO Japanese characters.
```

**Option C: Different model**

Which approach is most effective?

### Q3: Mirostat Impact on Quality

With mirostat enabled:
- Processing time increased: 72s → 222s (3x slower)
- Output quality: Not improved (still mixed languages)
- Output length: Slightly better (77% vs 205%)

Should we disable mirostat and use different approach?

### Q4: Token-Level Understanding

How does Solar 10.7B tokenize Korean text?
- Does it use character-level or subword tokenization?
- Is there a way to force Korean-only token generation?
- Can we use logit_bias to penalize non-Korean tokens?

### Q5: Two-Stage Approach

Would a two-stage approach work better?

```
Stage 1: Generate with current settings
Stage 2: Use LLM to "translate" mixed output to pure Korean

Prompt for Stage 2:
"Convert all Hanja to Korean Hangul, translate all English to Korean:
Input: 순천시는 strawberry 苗의 확보를...
Output: 순천시는 딸기 묘의 확보를..."
```

---

## 8. Desired Outcome

We need a configuration that produces:
- **100% Korean Hangul** output (가-힣 only)
- **No Hanja** (Chinese characters)
- **No English** (except proper nouns if unavoidable)
- **No Japanese**
- **85-115%** of original length
- **< 120 seconds** processing time

---

## 9. Available Resources

### Models Installed
```
solar:10.7b (6GB, Q4_0) - Current
exaone3.5:7.8b (4.7GB, Q4_K_M) - Korean native
qwen2.5:14b (9GB, Q4_K_M) - Multilingual
benedict/linkbricks-llama3.1-korean:8b (8.5GB, Q8_0) - Korean fine-tuned
gemma3:12b (8GB, Q4_K_M) - Google
```

### Hardware Capacity
- RTX 4070 12GB VRAM
- Can run models up to ~10GB comfortably
- Parallel processing not possible (single GPU)

---

## 10. Logs for Reference

### Ollama API Call (Expert Settings)
```json
{
    "model": "solar:10.7b",
    "prompt": "# Role: Korean News Editor...",
    "stream": false,
    "options": {
        "num_ctx": 4096,
        "num_predict": 839,
        "temperature": 0.1,
        "repeat_penalty": 1.1,
        "mirostat": 2,
        "mirostat_tau": 5.0,
        "mirostat_eta": 0.1,
        "num_gpu": 35
    },
    "stop": ["光", "新", "提", ...]
}
```

### Response Time Breakdown
```
Model loading: ~5s
Prompt processing: ~20s
Generation: ~190s
Total: 222s
```

---

## 11. Urgency

This is blocking production deployment. We need:
1. **Immediate**: Working pure-Korean output
2. **Short-term**: Stable < 120s processing
3. **Long-term**: Scalable solution for 200+ articles/day

---

*Document prepared for expert consultation on 2025-12-27*
*Previous consultation (v1) on 2025-12-26 - Recommendations partially failed*
