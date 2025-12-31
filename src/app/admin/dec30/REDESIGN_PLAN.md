# Dec30 Control Panel - Critical Analysis & Redesign Plan

> **Version:** 1.0
> **Created:** 2025-12-30
> **Author:** Claude (AI Assistant)

---

## Executive Summary

`/admin/dec30` 페이지에 대한 비판적 분석 결과, **7개 카테고리에서 총 23개의 심각한 문제**가 발견되었습니다.
이 문서는 각 문제에 대한 상세 분석과 구체적인 수정 계획을 제시합니다.

---

## Table of Contents

1. [Critical Issues (P0)](#1-critical-issues-p0)
2. [Functional Bugs (P1)](#2-functional-bugs-p1)
3. [Architecture Problems](#3-architecture-problems)
4. [UI/UX Violations](#4-uiux-violations)
5. [Code Quality Issues](#5-code-quality-issues)
6. [Performance Issues](#6-performance-issues)
7. [Missing Features](#7-missing-features)
8. [Implementation Plan](#8-implementation-plan)

---

## 1. Critical Issues (P0)

### 1.1 날짜 필터링 완전 무시 ❌

**증상:**
```
오늘 날짜만 선택했는데:
[스크래퍼] 장흥: 105건 스킵
[스크래퍼] 완도: 67건 스킵
[스크래퍼] 강진: 37건 스킵
```

**근본 원인:**
- `universal_scraper.py` Line 63: `collect_from_site(site_key, days=3)`
  - `--start-date`, `--end-date` 인자를 **완전히 무시**
  - 하드코딩된 `days=3` 사용
- 각 지역별 스크래퍼 (`*_scraper.py`)도 마찬가지

**코드 증거:**
```python
# universal_scraper.py Line 135-142
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=str, required=True)
    parser.add_argument('--days', type=int, default=3)  # ← --start-date, --end-date 없음!
    args = parser.parse_args()
    collect_from_site(args.site, args.days)
```

**수정 계획:**
```python
# 모든 스크래퍼에 날짜 필터링 추가
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--start-date', type=str, required=True)
    parser.add_argument('--end-date', type=str, required=True)
    parser.add_argument('--days', type=int, default=1)  # fallback only
    args = parser.parse_args()

    # 날짜 범위 파싱
    start = datetime.strptime(args.start_date, '%Y-%m-%d')
    end = datetime.strptime(args.end_date, '%Y-%m-%d')

    # 날짜 필터링 적용
    collect_from_site(args.site, start_date=start, end_date=end)
```

---

### 1.2 AI 처리 개수 무시 ❌

**증상:**
- UI에서 `aiLimit`을 10, 20, 50 등으로 선택해도 **전체 pending 기사 처리**

**근본 원인:**
- `dec30/page.tsx` Line 576-580:
```typescript
const res = await fetch('/api/bot/run-ai-processing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ limit: aiLimit })  // ← limit 전달
});
```

- `run-ai-processing/route.ts` Line 503-604:
```typescript
export async function POST() {  // ← body 파싱 없음!
    // ...
    // limit 파라미터를 전혀 사용하지 않음
    // 전체 pending 기사를 가져옴
}
```

**수정 계획:**
```typescript
// run-ai-processing/route.ts
export async function POST(req: NextRequest) {
    const { limit = 10 } = await req.json();  // ← limit 파싱

    // ... 중략 ...

    const { data: unprocessed } = await supabaseAdmin
        .from('posts')
        .select('id, title, content, region')
        .eq('status', 'draft')
        .or('ai_processed.is.null,ai_processed.eq.false')
        .order('created_at', { ascending: true })
        .limit(limit);  // ← limit 적용
}
```

---

### 1.3 Ollama 서버 시작 실패 ❌

**증상:** "Ollama가 실행되지 않았습니다" 반복

**근본 원인들:**

1. **코드 중복 및 불일치**
   - `run-ai-processing/route.ts` Line 36-122: `startOllama()` 함수 정의
   - `start-ollama/route.ts` Line 9-101: 동일 함수 **중복 정의**
   - 두 함수의 타임아웃 값이 다름 (30초 vs 15초)

2. **POST 호출 시 매번 재시작**
   ```typescript
   // run-ai-processing/route.ts Line 519
   const ollamaResult = await startOllama();  // ← 매번 kill & restart
   ```

3. **Windows 프로세스 관리 불안정**
   ```typescript
   // PowerShell 숨김 창으로 실행 - 프로세스 추적 불가
   spawn('powershell', ['-WindowStyle', 'Hidden', ...])
   ```

**수정 계획:**
```typescript
// 1. 공통 유틸리티로 분리
// src/lib/ollama-service.ts
export async function ensureOllamaRunning(): Promise<boolean> {
    // Step 1: 먼저 상태 확인
    const status = await checkOllamaStatus();
    if (status.online) return true;

    // Step 2: 실행 안 되어 있으면 시작
    return await startOllamaService();
}

// 2. 상태 확인 API 분리
export async function checkOllamaStatus(): Promise<{ online: boolean; model?: string }> {
    try {
        const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(3000)
        });
        return { online: res.ok };
    } catch {
        return { online: false };
    }
}

// 3. 시작 함수 (필요할 때만 호출)
export async function startOllamaService(): Promise<boolean> {
    // 이미 실행 중이면 재시작 안 함
    const status = await checkOllamaStatus();
    if (status.online) return true;

    // ... 시작 로직 ...
}
```

---

### 1.4 스크래퍼 종료 미감지 ❌

**증상:**
- 26개 스크래퍼 모두 완료되어도 종료 로그 미기록
- 진행률이 26/26이 되어도 "완료" 메시지 안 나옴

**근본 원인:**
- `dec30/page.tsx` Line 406-418:
```typescript
} else if (completed.length === activeJobIds.length) {
    setIsScraperRunning(false);
    // ... 완료 처리 ...
}
```

- **문제점:** `activeJobIds`가 업데이트되기 전에 비교가 일어남
- `currentJobs` 상태가 stale closure 문제 발생 가능

**수정 계획:**
```typescript
// 1. useRef로 최신 jobIds 추적
const activeJobIdsRef = useRef<number[]>([]);
useEffect(() => {
    activeJobIdsRef.current = activeJobIds;
}, [activeJobIds]);

// 2. 폴링 시 ref 사용
const checkJobs = async () => {
    const currentJobIds = activeJobIdsRef.current;
    if (currentJobIds.length === 0) return;

    // ...

    const allCompleted = jobs.every(j =>
        ['success', 'failed', 'stopped'].includes(j.status)
    );

    if (allCompleted && jobs.length === currentJobIds.length) {
        // 완료 처리
    }
};
```

---

## 2. Functional Bugs (P1)

### 2.1 전남 교육청 기관/학교 스크래퍼 누락

**현재 상태:**
- `bot-service.ts` ALL_REGIONS에는 포함:
  ```typescript
  "jeonnam_edu_org", "jeonnam_edu_school"
  ```
- `dec30/page.tsx` REGIONS에는 **누락**

**수정 계획:**
```typescript
// dec30/page.tsx REGIONS에 추가
const REGIONS = [
    // ... 기존 ...
    { id: 'jeonnam_edu_org', nameKo: '전남교육청 기관', group: 'agency' },
    { id: 'jeonnam_edu_school', nameKo: '전남교육청 학교', group: 'agency' },
];
```

---

### 2.2 폴링 메모리 누수

**문제:**
```typescript
// Line 440
interval = setInterval(checkJobs, 3000);

// cleanup이 제대로 안 됨
return () => {
    if (interval) clearInterval(interval);
};
```

**stale closure 문제:**
- `useEffect` 의존성 배열에 `currentJobs` 있었다가 제거됨
- 하지만 함수 내부에서 `currentJobs` 참조

**수정 계획:**
```typescript
// 1. 폴링을 별도 커스텀 훅으로 분리
function useScraperPolling(isRunning: boolean, jobIds: number[]) {
    const [jobs, setJobs] = useState<JobResult[]>([]);
    const [progress, setProgress] = useState({ total: 0, completed: 0 });

    useEffect(() => {
        if (!isRunning || jobIds.length === 0) return;

        let isCancelled = false;
        const poll = async () => {
            if (isCancelled) return;
            // ... polling logic ...
            if (!isCancelled) setTimeout(poll, 3000);
        };

        poll();
        return () => { isCancelled = true; };
    }, [isRunning, jobIds]); // 최소 의존성

    return { jobs, progress };
}
```

---

### 2.3 AI 처리 상태 폴링 문제

**문제:** `pollAiStatus`가 완료 후에도 계속 폴링

```typescript
// Line 272
setTimeout(poll, 3000);  // ← 무조건 다음 폴링 예약
```

**수정 계획:**
```typescript
// 명확한 종료 조건
if (!isActive || stats.processed >= targetCount) {
    // 완료 처리
    setIsAiRunning(false);
    return;  // ← 폴링 중단
}

// 계속 진행 중일 때만 다음 폴링
if (isActive) {
    setTimeout(poll, 3000);
}
```

---

## 3. Architecture Problems

### 3.1 거대한 단일 컴포넌트 (1024줄)

**문제:**
- 모든 로직이 한 파일에 집중
- 20개 이상의 useState
- 테스트 불가능, 재사용 불가능

**수정 계획:**
```
src/app/admin/dec30/
├── page.tsx                    # 메인 페이지 (레이아웃만)
├── components/
│   ├── ScraperControl.tsx      # 스크래퍼 제어 패널
│   ├── AiProcessingControl.tsx # AI 처리 패널
│   ├── LogViewer.tsx           # 로그 뷰어
│   ├── ResultsPanel.tsx        # 결과 표시
│   └── RegionSelector.tsx      # 지역 선택
├── hooks/
│   ├── useScraperPolling.ts    # 스크래퍼 폴링 훅
│   ├── useAiProcessing.ts      # AI 처리 훅
│   └── useOllamaStatus.ts      # Ollama 상태 훅
├── types.ts                    # 타입 정의
└── constants.ts                # 상수 (REGIONS 등)
```

---

### 3.2 API 코드 중복

**문제:**
- `run-ai-processing/route.ts`: startOllama() 122줄
- `start-ollama/route.ts`: startOllama() 101줄
- 거의 동일한 코드 중복

**수정 계획:**
```
src/lib/
├── ollama-service.ts    # Ollama 관련 공통 함수
│   ├── checkStatus()
│   ├── startService()
│   ├── stopService()
│   └── callApi()
└── bot-service.ts       # 기존 유지
```

---

### 3.3 글로벌 상태 문제

**문제:**
```typescript
// run-ai-processing/route.ts Line 9-18
let isProcessingActive = false;  // ← 글로벌 변수
let shouldStopProcessing = false;
let processingStats = { ... };
```

- Vercel Serverless에서 인스턴스 간 상태 공유 불가
- 메모리 누수 가능성

**수정 계획:**
```typescript
// Supabase에 처리 상태 저장
const { data } = await supabaseAdmin
    .from('ai_processing_status')
    .select('*')
    .single();

// 또는 Redis 사용 (권장)
import { redis } from '@/lib/redis';
await redis.set('ai_processing_active', 'true', 'EX', 3600);
```

---

## 4. UI/UX Violations

### 4.1 Admin UI Rules 위반

**admin-ui-rules.md 위반 사항:**

| Rule | 현재 상태 | 권장 |
|------|----------|------|
| Desktop First | 반응형 레이아웃 | 고정 너비 1280px+ |
| Tables over Cards | 결과를 카드 형식 | 테이블 형식 |
| Compact Layout | 패딩 24px+ | 패딩 8-12px |
| Data Density | 로그 400px 고정 | 화면 맞춤 |

**수정 계획:**
```tsx
// Before
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

// After
<div className="grid grid-cols-[1fr_1fr] gap-4 min-w-[1280px]">
```

---

### 4.2 무의미한 페이지 이름

**문제:**
- 페이지 제목: "12월30일버전"
- URL: `/admin/dec30`
- 날짜가 하드코딩됨 - 의미 없음

**수정 계획:**
```
/admin/dec30 → /admin/scraper-control
페이지 제목: "스크래퍼 컨트롤 패널" 또는 "수동 스크래핑 & AI 가공"
```

---

### 4.3 로그 뷰어 UX 문제

**문제:**
- 새 로그가 위에 추가되어 스크롤 점프
- 고정 높이 400px - 화면 공간 낭비
- 필터링/검색 기능 없음

**수정 계획:**
```tsx
// 1. 로그를 아래에 추가 (자연스러운 순서)
setLogs(prev => [...prev, entry].slice(-200));

// 2. 자동 스크롤
const logContainerRef = useRef<HTMLDivElement>(null);
useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
}, [logs]);

// 3. 레벨별 필터
const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success'>('all');
const filteredLogs = logs.filter(l => logFilter === 'all' || l.level === logFilter);
```

---

## 5. Code Quality Issues

### 5.1 타입 안전성 부족

**문제:**
```typescript
// any 타입 사용
detailedStats: any = null;  // Line 284
metadata: any = { ... };    // Line 339
```

**수정 계획:**
```typescript
interface DetailedStats {
    summary: {
        total_created: number;
        total_skipped: number;
    };
    date_breakdown: Record<string, number>;
    duration_seconds: number;
    errors: string[];
}

interface JobMetadata {
    full_log: string;
    skipped_count: number;
    detailed_stats?: DetailedStats;
}
```

---

### 5.2 에러 핸들링 미흡

**문제:**
```typescript
// 에러를 무시하고 진행
} catch {
    // Silently ignore update errors
}
```

**수정 계획:**
```typescript
} catch (error) {
    console.error('[Scraper] Log update failed:', error);
    // 에러 카운터 증가
    errorCount++;
    // 3회 이상 실패시 사용자에게 알림
    if (errorCount >= 3) {
        showError('로그 업데이트 실패 - DB 연결을 확인하세요');
    }
}
```

---

### 5.3 매직 넘버 하드코딩

**문제:**
```typescript
30 * 60 * 1000  // 30분? 무슨 용도?
500 * 1024      // 500KB? 왜?
.slice(0, 200)  // 왜 200?
```

**수정 계획:**
```typescript
// constants.ts
export const SCRAPER_CONFIG = {
    PROCESS_TIMEOUT_MS: 30 * 60 * 1000,  // 30 minutes
    MAX_BUFFER_SIZE: 500 * 1024,          // 500KB
    MAX_LOG_ENTRIES: 200,
    POLLING_INTERVAL_MS: 3000,
    OLLAMA_TIMEOUT_MS: 180000,
} as const;
```

---

## 6. Performance Issues

### 6.1 불필요한 리렌더링

**문제:**
- 20개 useState가 각각 리렌더링 유발
- `logs` 배열 업데이트마다 전체 컴포넌트 리렌더링

**수정 계획:**
```typescript
// 1. 관련 상태 그룹화
interface ScraperState {
    isRunning: boolean;
    progress: { total: number; completed: number };
    jobs: JobResult[];
    results: ScraperResult[];
}

const [scraperState, setScraperState] = useState<ScraperState>({...});

// 2. 로그 컴포넌트 분리 및 메모이제이션
const LogViewer = React.memo(({ logs }: { logs: LogEntry[] }) => {
    return (/* ... */);
});
```

---

### 6.2 과도한 폴링

**문제:**
- 스크래퍼: 3초마다 폴링
- Ollama: 30초마다 폴링
- AI 상태: 3초마다 폴링

**수정 계획:**
```typescript
// 1. 상태에 따른 동적 폴링 간격
const getPollingInterval = (progress: number) => {
    if (progress < 0.3) return 5000;   // 초반: 5초
    if (progress < 0.8) return 3000;   // 중반: 3초
    return 1000;                        // 막판: 1초
};

// 2. SSE(Server-Sent Events) 도입 고려
// API에서 실시간 푸시 → 폴링 제거
```

---

## 7. Missing Features

### 7.1 스크래퍼 개별 중지 기능

**현재:** 전체 중지만 가능

**추가 계획:**
```tsx
<button onClick={() => stopSingleJob(job.id)}>
    <XCircle className="w-4 h-4" />
</button>
```

---

### 7.2 작업 이력 조회

**현재:** 세션 종료 시 결과 사라짐

**추가 계획:**
- Supabase `bot_logs` 테이블 조회
- 최근 10회 실행 이력 표시
- 날짜별 통계

---

### 7.3 스케줄링 기능

**현재:** 수동 실행만 가능

**추가 계획:**
- 시간 지정 예약 실행
- 반복 스케줄 설정

---

## 8. Implementation Plan

### Phase 1: Critical Fixes (즉시 수행)

| # | Task | Priority | Estimate |
|:-:|------|:--------:|:--------:|
| 1 | 날짜 필터링 수정 (모든 스크래퍼) | P0 | 2h |
| 2 | AI limit 파라미터 적용 | P0 | 30m |
| 3 | Ollama 서비스 분리 및 안정화 | P0 | 1h |
| 4 | 스크래퍼 완료 감지 수정 | P0 | 1h |
| 5 | 전남교육청 기관/학교 추가 | P1 | 30m |

### Phase 2: Architecture Refactoring (1-2일)

| # | Task | Priority | Estimate |
|:-:|------|:--------:|:--------:|
| 6 | 컴포넌트 분리 | P1 | 3h |
| 7 | 커스텀 훅 추출 | P1 | 2h |
| 8 | API 코드 정리 | P1 | 2h |
| 9 | 타입 정의 강화 | P2 | 1h |

### Phase 3: UX Improvements (3-5일)

| # | Task | Priority | Estimate |
|:-:|------|:--------:|:--------:|
| 10 | Admin UI 규칙 적용 | P2 | 2h |
| 11 | 로그 뷰어 개선 | P2 | 2h |
| 12 | 페이지 이름 변경 | P2 | 30m |
| 13 | 작업 이력 추가 | P2 | 3h |

---

## File Changes Summary

### Files to Modify

| File | Changes |
|------|---------|
| `src/app/admin/dec30/page.tsx` | 컴포넌트 분리, REGIONS 추가, 폴링 수정 |
| `src/app/api/bot/run-ai-processing/route.ts` | limit 파라미터 적용, startOllama 분리 |
| `src/app/api/bot/start-ollama/route.ts` | 공통 서비스로 이전 |
| `src/lib/bot-service.ts` | 타입 강화 |
| `scrapers/universal_scraper.py` | 날짜 필터링 추가 |
| `scrapers/*_scraper.py` (전체) | 날짜 필터링 추가 |

### Files to Create

| File | Purpose |
|------|---------|
| `src/lib/ollama-service.ts` | Ollama 공통 서비스 |
| `src/app/admin/dec30/components/*.tsx` | 분리된 컴포넌트들 |
| `src/app/admin/dec30/hooks/*.ts` | 커스텀 훅들 |
| `src/app/admin/dec30/types.ts` | 타입 정의 |
| `src/app/admin/dec30/constants.ts` | 상수 정의 |

---

## Appendix: Test Cases

### 날짜 필터링 테스트
```bash
# 오늘만 선택 시
python universal_scraper.py --region jangheung --start-date 2025-12-30 --end-date 2025-12-30

# Expected: 오늘 날짜 기사만 수집, 다른 날짜 skip 없음
```

### AI 처리 limit 테스트
```bash
# 10개만 처리
curl -X POST http://localhost:3000/api/bot/run-ai-processing \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'

# Expected: 정확히 10개만 처리
```

---

*End of Redesign Plan*
