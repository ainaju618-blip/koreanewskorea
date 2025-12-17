# Types (src/types) AI Guide

> **Summary:** TypeScript type definitions for Korea NEWS platform.

---

## Type Files

| File | Description |
|------|-------------|
| `news.ts` | News article types (Post, Category, etc.) |
| `blog.ts` | Blog system types (BlogPost, BlogCategory, etc.) |

---

## Subfolders

| Folder | Description |
|--------|-------------|
| `admin/` | Admin-specific types (currently empty) |

---

## Key Types (news.ts)

```typescript
// Post - News article
interface Post {
  id: string;
  title: string;
  content: string;
  category_id: string;
  // ...
}
```

---

## Key Types (blog.ts)

```typescript
// BlogPost - Blog article
interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  // ...
}
```

---

## FAQ

| Question | Answer |
|----------|--------|
| "News article type?" | `news.ts` - Post interface |
| "Blog post type?" | `blog.ts` - BlogPost interface |
| "Admin types?" | `admin/` folder (currently empty) |
| "기사 타입 정의?" | `news.ts` - Post 인터페이스 |
| "뉴스 타입?" | `news.ts` |
| "블로그 타입?" | `blog.ts` - BlogPost 인터페이스 |
| "타입 어디서 정의해?" | 이 폴더 (`src/types/`) |
| "관리자 타입?" | `admin/` 폴더 |
| "TypeScript 타입 파일?" | 이 폴더 - `.ts` 파일들 |

---

## Type Naming Convention

- **PascalCase** for interface/type names: `Post`, `BlogPost`
- **Descriptive names**: `CategoryWithChildren`, `PostWithAuthor`
- Group related types in same file

---

## Related Documents

| Document | Path |
|----------|------|
| Frontend Guide | `info/frontend.md` |
| Database Schema | `info/database.md` |

---

*Last updated: 2025-12-17*
