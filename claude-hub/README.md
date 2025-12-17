# Claude Hub (claude-hub/) AI Guide

> **Summary:** Standalone Claude Hub knowledge management application.

---

## Overview

Claude Hub is a separate Python application for AI knowledge management.
It has its own codebase within the Korea NEWS project.

---

## Structure

| Path | Description |
|------|-------------|
| `app/` | Python application code |
| `frontend/` | Frontend static files |
| `knowledge/` | Knowledge storage |
| `data/` | Data files |
| `scripts/` | Utility scripts |

---

## Key Files

| File | Description |
|------|-------------|
| `main.py` | Application entry point |
| `gui.py` | GUI application |
| `CLAUDE.md` | Claude Hub specific instructions |
| `run.bat` | Windows launcher |
| `requirements.txt` | Python dependencies |

---

## Running

```bash
# Install dependencies
pip install -r requirements.txt

# Run application
python main.py
# or
run.bat
```

---

## FAQ

| Question | Answer |
|----------|--------|
| "Claude Hub entry point?" | `main.py` |
| "GUI application?" | `gui.py` |
| "Dependencies?" | `requirements.txt` |

---

## Related Documents

| Document | Path |
|----------|------|
| Claude Hub in Web | `src/app/admin/claude-hub/` |
| Claude Hub API | `src/app/api/claude-hub/` |

---

*Last updated: 2025-12-17*
