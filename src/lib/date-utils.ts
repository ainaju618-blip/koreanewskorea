/**
 * 날짜 유틸리티
 * ============
 * 한국 시간대(KST) 기준 날짜/시간 포맷팅
 */

const KOREA_TIMEZONE = 'Asia/Seoul';

/**
 * 현재 한국 날짜 문자열 반환
 * @example "2024년 1월 10일 금요일"
 */
export function getCurrentKoreanDate(): string {
  return new Date().toLocaleDateString('ko-KR', {
    timeZone: KOREA_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

/**
 * 현재 한국 시간 문자열 반환
 * @example "14:30"
 */
export function getCurrentKoreanTime(): string {
  return new Date().toLocaleTimeString('ko-KR', {
    timeZone: KOREA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * ISO 문자열을 한국 시간 기준 상대 시간으로 변환
 * @example "방금 전", "5분 전", "2시간 전", "1월 10일"
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString('ko-KR', {
    timeZone: KOREA_TIMEZONE,
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ISO 문자열을 한국 시간 기준 영어 상대 시간으로 변환
 * @example "Just now", "5m ago", "2h ago", "Jan 10"
 */
export function formatRelativeTimeEn(dateString: string): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    timeZone: KOREA_TIMEZONE,
    month: 'short',
    day: 'numeric',
  });
}

/**
 * ISO 문자열을 한국 날짜 포맷으로 변환
 * @example "2024년 1월 10일"
 */
export function formatKoreanDate(dateString: string): string {
  if (!dateString) return '-';

  return new Date(dateString).toLocaleDateString('ko-KR', {
    timeZone: KOREA_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ISO 문자열을 한국 날짜시간 포맷으로 변환
 * @example "2024년 1월 10일 14:30"
 */
export function formatKoreanDateTime(dateString: string): string {
  if (!dateString) return '-';

  const date = new Date(dateString);

  const dateStr = date.toLocaleDateString('ko-KR', {
    timeZone: KOREA_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = date.toLocaleTimeString('ko-KR', {
    timeZone: KOREA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${dateStr} ${timeStr}`;
}

/**
 * ISO 문자열을 짧은 한국 날짜 포맷으로 변환
 * @example "1월 10일"
 */
export function formatShortKoreanDate(dateString: string): string {
  if (!dateString) return '-';

  return new Date(dateString).toLocaleDateString('ko-KR', {
    timeZone: KOREA_TIMEZONE,
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 오늘 날짜의 시작 시간 (KST 기준) ISO 문자열 반환
 */
export function getTodayStartISO(): string {
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const kstMs = utcMs + kstOffset * 60000;
  const kstDate = new Date(kstMs);

  kstDate.setHours(0, 0, 0, 0);

  // Convert back to UTC for ISO string
  const utcStartMs = kstDate.getTime() - kstOffset * 60000;
  return new Date(utcStartMs).toISOString();
}

/**
 * 날짜가 오늘인지 확인 (KST 기준)
 */
export function isToday(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();

  const dateKST = date.toLocaleDateString('ko-KR', { timeZone: KOREA_TIMEZONE });
  const todayKST = today.toLocaleDateString('ko-KR', { timeZone: KOREA_TIMEZONE });

  return dateKST === todayKST;
}
