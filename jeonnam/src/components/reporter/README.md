# Reporter Components (src/components/reporter) AI Guide

> **Summary:** Reporter portal components for Korea NEWS platform.

---

## Components

| Component | Description | Usage |
|-----------|-------------|-------|
| `ActivityFeed.tsx` | Reporter activity feed | Reporter dashboard |
| `ArticleHistory.tsx` | Article edit history | Article detail |
| `NotificationDropdown.tsx` | Notification dropdown menu | Reporter header |
| `types.ts` | TypeScript types for reporter | Type definitions |

---

## ActivityFeed

Shows recent activity for the reporter.

**Features:**
- Recent article submissions
- Status updates
- Review feedback

---

## ArticleHistory

Displays edit history for articles.

**Features:**
- Version comparison
- Edit timestamps
- Author tracking

---

## NotificationDropdown

Notification system for reporters.

**Features:**
- Unread count badge
- Notification list
- Mark as read

---

## FAQ

| Question | Answer |
|----------|--------|
| "Reporter activity feed?" | `ActivityFeed.tsx` |
| "Article edit history?" | `ArticleHistory.tsx` |
| "Reporter notifications?" | `NotificationDropdown.tsx` |
| "기자 활동 피드?" | `ActivityFeed.tsx` |
| "기자 최근 활동?" | `ActivityFeed.tsx` |
| "기사 수정 이력?" | `ArticleHistory.tsx` - 버전 비교, 수정 시간 |
| "기자 알림?" | `NotificationDropdown.tsx` |
| "알림 드롭다운?" | `NotificationDropdown.tsx` - 읽지 않은 수, 목록 |
| "기자 포털 컴포넌트?" | 이 폴더 (`reporter/`) |
| "기자 타입 정의?" | `types.ts` |

---

## Related Documents

| Document | Path |
|----------|------|
| Components Guide | `src/components/README.md` |
| Reporter Pages | `src/app/reporter/` |
| Reporter API | `src/app/api/reporter/` |

---

*Last updated: 2025-12-17*
