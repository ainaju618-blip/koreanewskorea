# Developer Quick Start

---

## Step 1: Read These First (In Order)

1. [README.md](README.md) - Project structure & separation rule
2. [common/README.md](common/README.md) - Shared settings (colors, fonts)
3. [plan/regional-homepage-spec.md](plan/regional-homepage-spec.md) - Full specification

---

## Step 2: Build Gwangju Template

Follow tasks in [plan/WORK_ORDER.md](plan/WORK_ORDER.md)

Start from **Task 1.1** and proceed sequentially.

---

## Step 3: Test Other Regions

After Gwangju works, no additional coding needed.

Just verify subdomain routing works for all 24 regions.

---

## Key Rules

- **DO NOT** touch `../src/` (existing homepage)
- **ALL** code goes in `common/` folder
- Region configs are in `plan/regions/*.md` (read-only reference)

---

*Questions? Check [plan/WORK_ORDER.md](plan/WORK_ORDER.md) for details.*
