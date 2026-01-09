/**
 * 날짜 포맷팅 유틸리티
 * 한국 시간대(Asia/Seoul) 기준으로 날짜를 처리합니다.
 */

/**
 * 날짜 문자열을 한국식 형식으로 변환 (YYYY-MM-DD)
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 포맷된 날짜 문자열 (예: 2025-01-09)
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    }).replace(/\. /g, '-').replace('.', '');
  } catch {
    return '';
  }
}

/**
 * 날짜를 상세 형식으로 변환 (YYYY년 MM월 DD일)
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 포맷된 날짜 문자열 (예: 2025년 01월 09일)
 */
export function formatDateLong(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Seoul'
    });
  } catch {
    return '';
  }
}

/**
 * 날짜와 시간을 함께 표시 (YYYY-MM-DD HH:MM)
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 포맷된 날짜시간 문자열 (예: 2025-01-09 14:30)
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const datePart = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Seoul'
    }).replace(/\. /g, '-').replace('.', '');

    const timePart = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Seoul'
    });

    return `${datePart} ${timePart}`;
  } catch {
    return '';
  }
}

/**
 * 상대적 시간 표시 (방금 전, 5분 전, 1시간 전 등)
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 상대적 시간 문자열
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;

    // 7일 이상이면 날짜 표시
    return formatDate(dateString);
  } catch {
    return '';
  }
}

/**
 * 날짜가 오늘인지 확인
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 오늘 여부
 */
export function isToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;

  try {
    const date = new Date(dateString);
    const today = new Date();

    return date.toDateString() === today.toDateString();
  } catch {
    return false;
  }
}

/**
 * 날짜가 이번 주인지 확인
 * @param dateString - ISO 8601 형식의 날짜 문자열
 * @returns 이번 주 여부
 */
export function isThisWeek(dateString: string | null | undefined): boolean {
  if (!dateString) return false;

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return diffDays < 7 && diffDays >= 0;
  } catch {
    return false;
  }
}
