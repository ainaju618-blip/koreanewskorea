# Developer Quick Start

---

## Step 0: Understand the Business (WHY)

**Before writing any code, understand WHY this project exists:**

> [plan/BUSINESS_STRATEGY.md](plan/BUSINESS_STRATEGY.md) - Business context & revenue model

This document explains:
- Why we build regional homepages
- How this generates revenue
- What success looks like

---

## Step 1: Read Technical Docs (WHAT)

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
