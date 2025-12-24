# Ollama MCP Server for Korea NEWS

Local Ollama integration via Model Context Protocol (MCP).

## Overview

This MCP server provides tools for:
- Converting Korean press releases to news articles
- 5-layer verification system for hallucination prevention
- Fact extraction and validation
- Direct Ollama API access

## Prerequisites

1. **Ollama** must be installed and running:
   ```bash
   # Install Ollama (if not installed)
   # https://ollama.ai/download

   # Start Ollama server
   ollama serve
   ```

2. **Required Model**:
   ```bash
   ollama pull benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4
   ```

3. **Python 3.10+** with dependencies:
   ```bash
   cd mcp-servers/ollama
   pip install -r requirements.txt
   ```

## Installation

### For Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ollama-koreanews": {
      "command": "python",
      "args": ["D:/cbt/koreanews/mcp-servers/ollama/server.py"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434"
      }
    }
  }
}
```

### For Claude Code (VSCode)

Add to `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "ollama-koreanews": {
      "command": "python",
      "args": ["mcp-servers/ollama/server.py"]
    }
  }
}
```

## Available Tools

### 1. convert_press_release

Convert a Korean press release to a news article with 5-layer verification.

**Input:**
```json
{
  "press_release": "Korean press release text..."
}
```

**Output:**
```json
{
  "success": true,
  "content": "Converted news article...",
  "subtitle": "Article subtitle",
  "grade": "A",
  "attempt": 1,
  "verification": {...}
}
```

### 2. extract_facts

Extract facts (numbers, dates, names, organizations, quotes) from Korean text.

**Input:**
```json
{
  "text": "Korean text to analyze..."
}
```

**Output:**
```json
{
  "numbers": ["150만 원", "100만 원"],
  "dates": ["지난 20일"],
  "names": ["오명종 위원장", "이영수 회장"],
  "organizations": ["강진군", "성전면"],
  "quotes": ["quote text..."]
}
```

### 3. verify_article

Verify a converted article against the original press release.

**Input:**
```json
{
  "original": "Original press release...",
  "converted": "Converted news article..."
}
```

**Output:**
```json
{
  "facts": {"passed": true, ...},
  "length": {"passed": true, "ratio": 0.85},
  "hallucination": {"passed": true},
  "cross_validation": {"passed": true, "score": 92},
  "overall_passed": true
}
```

### 4. ollama_generate

Direct Ollama text generation with custom prompt.

**Input:**
```json
{
  "prompt": "Your prompt here...",
  "model": "optional-model-name"
}
```

### 5. check_ollama_status

Check if Ollama server is running and list available models.

**Output:**
```json
{
  "status": "online",
  "base_url": "http://localhost:11434",
  "available_models": ["model1", "model2"],
  "default_model_available": true
}
```

## 5-Layer Verification System

The conversion process uses a robust 5-layer verification:

| Layer | Type | Description |
|-------|------|-------------|
| 1 | Automated | Fact extraction (numbers, dates, names, quotes) |
| 2 | Automated | Fact comparison between original and converted |
| 3 | LLM | Hallucination detection |
| 4 | LLM | Cross-validation scoring (0-100) |
| 5 | Automated | Length verification (min 70% of original) |

### Grading System

| Grade | Criteria |
|-------|----------|
| A | All layers pass |
| B | Minor issues (cross-validation < 80) |
| C | Hallucination detected or missing facts |
| D | Severe length failure (< 50%) |
| F | Failed after 10 retries |

## Configuration

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| OLLAMA_BASE_URL | http://localhost:11434 | Ollama server URL |
| OLLAMA_MODEL | benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4 | Default model |

## Testing

Run the server directly:

```bash
cd mcp-servers/ollama
python server.py
```

Test Ollama connection:

```bash
curl http://localhost:11434/api/tags
```

## Troubleshooting

### Ollama not responding

1. Check if Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Start Ollama:
   ```bash
   ollama serve
   ```

### Model not found

```bash
ollama pull benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4
```

### Python dependencies missing

```bash
pip install -r requirements.txt
```

## Related Files

- `src/app/api/bot/process-single-article/route.ts` - API endpoint using same verification
- `scripts/test_multilayer.js` - Test script for verification system
