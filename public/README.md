# Public (public/) AI Guide

> **Summary:** Static assets served directly by Next.js.

---

## Structure

| Path | Description |
|------|-------------|
| `icons/` | App icons (PWA, favicon) |
| `images/` | Region images and uploads |
| `*.svg` | SVG icons |
| `*.png` | PNG images |

---

## Key Files

| File | Description |
|------|-------------|
| `logo-koreanews.png` | Main site logo |
| `og-image.png` | Open Graph image for social sharing |
| `manifest.json` | PWA manifest |

---

## Images Folder Structure

```
images/
├── [region]/       # Region-specific images (damyang, naju, etc.)
├── uploads/        # User uploaded images
└── logo/           # Logo variations
```

---

## FAQ

| Question | Answer |
|----------|--------|
| "Site logo?" | `logo-koreanews.png` |
| "OG image?" | `og-image.png` |
| "PWA manifest?" | `manifest.json` |
| "Region images?" | `images/[region]/` |

---

## Usage in Code

```typescript
// Reference public files
<Image src="/logo-koreanews.png" alt="Logo" />
<Image src="/images/naju/image.jpg" alt="Naju" />
```

---

## Related Documents

| Document | Path |
|----------|------|
| Design System | `info/design-system.md` |
| Logo Guide | `design/logo.md` |

---

*Last updated: 2025-12-17*
