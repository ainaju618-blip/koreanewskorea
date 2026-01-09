/**
 * 입력값 검증 유틸리티
 * API 라우트에서 요청 데이터를 검증합니다.
 */

/**
 * 문자열 검증 결과 타입
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * 이메일 검증
 */
export function validateEmail(email: unknown): ValidationResult {
  if (typeof email !== 'string') {
    return { valid: false, error: '이메일은 문자열이어야 합니다' };
  }

  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, error: '이메일을 입력해주세요' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: '올바른 이메일 형식이 아닙니다' };
  }

  if (trimmed.length > 255) {
    return { valid: false, error: '이메일이 너무 깁니다' };
  }

  return { valid: true };
}

/**
 * 비밀번호 검증
 * 최소 8자, 영문+숫자 조합
 */
export function validatePassword(password: unknown, options: {
  minLength?: number;
  requireUppercase?: boolean;
  requireNumber?: boolean;
  requireSpecial?: boolean;
} = {}): ValidationResult {
  const {
    minLength = 8,
    requireUppercase = false,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  if (typeof password !== 'string') {
    return { valid: false, error: '비밀번호는 문자열이어야 합니다' };
  }

  if (password.length < minLength) {
    return { valid: false, error: `비밀번호는 최소 ${minLength}자 이상이어야 합니다` };
  }

  if (password.length > 128) {
    return { valid: false, error: '비밀번호가 너무 깁니다' };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { valid: false, error: '비밀번호에 대문자가 포함되어야 합니다' };
  }

  if (requireNumber && !/\d/.test(password)) {
    return { valid: false, error: '비밀번호에 숫자가 포함되어야 합니다' };
  }

  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: '비밀번호에 특수문자가 포함되어야 합니다' };
  }

  return { valid: true };
}

/**
 * 강력한 비밀번호 검증 (관리자용)
 * 최소 12자, 대문자+소문자+숫자+특수문자
 */
export function validateStrongPassword(password: unknown): ValidationResult {
  return validatePassword(password, {
    minLength: 12,
    requireUppercase: true,
    requireNumber: true,
    requireSpecial: true,
  });
}

/**
 * 문자열 검증 (필수)
 */
export function validateRequiredString(value: unknown, fieldName: string, options: {
  minLength?: number;
  maxLength?: number;
} = {}): ValidationResult {
  const { minLength = 1, maxLength = 1000 } = options;

  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName}은(는) 문자열이어야 합니다` };
  }

  const trimmed = value.trim();
  if (trimmed.length < minLength) {
    return { valid: false, error: `${fieldName}을(를) 입력해주세요` };
  }

  if (trimmed.length > maxLength) {
    return { valid: false, error: `${fieldName}이(가) 너무 깁니다 (최대 ${maxLength}자)` };
  }

  return { valid: true };
}

/**
 * UUID 검증
 */
export function validateUUID(value: unknown, fieldName: string = 'ID'): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName}은(는) 문자열이어야 합니다` };
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    return { valid: false, error: `올바르지 않은 ${fieldName} 형식입니다` };
  }

  return { valid: true };
}

/**
 * 숫자 검증
 */
export function validateNumber(value: unknown, fieldName: string, options: {
  min?: number;
  max?: number;
  integer?: boolean;
} = {}): ValidationResult {
  const { min, max, integer = false } = options;

  const num = typeof value === 'string' ? Number(value) : value;

  if (typeof num !== 'number' || isNaN(num)) {
    return { valid: false, error: `${fieldName}은(는) 숫자여야 합니다` };
  }

  if (integer && !Number.isInteger(num)) {
    return { valid: false, error: `${fieldName}은(는) 정수여야 합니다` };
  }

  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName}은(는) ${min} 이상이어야 합니다` };
  }

  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName}은(는) ${max} 이하여야 합니다` };
  }

  return { valid: true };
}

/**
 * 배열 검증
 */
export function validateArray(value: unknown, fieldName: string, options: {
  minLength?: number;
  maxLength?: number;
  itemValidator?: (item: unknown) => ValidationResult;
} = {}): ValidationResult {
  const { minLength = 0, maxLength = 1000, itemValidator } = options;

  if (!Array.isArray(value)) {
    return { valid: false, error: `${fieldName}은(는) 배열이어야 합니다` };
  }

  if (value.length < minLength) {
    return { valid: false, error: `${fieldName}은(는) 최소 ${minLength}개 이상이어야 합니다` };
  }

  if (value.length > maxLength) {
    return { valid: false, error: `${fieldName}은(는) 최대 ${maxLength}개까지 허용됩니다` };
  }

  if (itemValidator) {
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i]);
      if (!result.valid) {
        return { valid: false, error: `${fieldName}[${i}]: ${result.error}` };
      }
    }
  }

  return { valid: true };
}

/**
 * URL 검증
 */
export function validateURL(value: unknown, fieldName: string = 'URL'): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName}은(는) 문자열이어야 합니다` };
  }

  if (!value.trim()) {
    return { valid: true }; // 빈 URL은 허용
  }

  try {
    new URL(value);
    return { valid: true };
  } catch {
    return { valid: false, error: `올바르지 않은 ${fieldName} 형식입니다` };
  }
}

/**
 * 열거형 검증
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  fieldName: string
): ValidationResult {
  if (typeof value !== 'string') {
    return { valid: false, error: `${fieldName}은(는) 문자열이어야 합니다` };
  }

  if (!allowedValues.includes(value as T)) {
    return {
      valid: false,
      error: `${fieldName}은(는) 다음 중 하나여야 합니다: ${allowedValues.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * HTML 새니타이징 (XSS 방지)
 * 기본적인 태그만 허용
 */
export function sanitizeHtml(html: string): string {
  // 위험한 태그 제거
  const dangerousTags = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  let sanitized = html.replace(dangerousTags, '');

  // onclick, onerror 등 이벤트 핸들러 제거
  const eventHandlers = /\s*on\w+\s*=\s*["'][^"']*["']/gi;
  sanitized = sanitized.replace(eventHandlers, '');

  // javascript: 프로토콜 제거
  const jsProtocol = /javascript\s*:/gi;
  sanitized = sanitized.replace(jsProtocol, '');

  // data: 프로토콜 제거 (이미지 제외)
  const dataProtocol = /data\s*:[^;]+(?!image)/gi;
  sanitized = sanitized.replace(dataProtocol, '');

  return sanitized;
}

/**
 * SQL Injection 방지를 위한 문자열 이스케이프
 * (Supabase는 이미 parameterized query를 사용하지만, 추가 보호)
 */
export function escapeSqlString(value: string): string {
  return value
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

/**
 * 페이지네이션 파라미터 검증
 */
export function validatePaginationParams(
  page: unknown,
  limit: unknown
): {
  valid: boolean;
  page: number;
  limit: number;
  error?: string;
} {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : (page as number) || 1;
  const limitNum = typeof limit === 'string' ? parseInt(limit, 10) : (limit as number) || 20;

  if (isNaN(pageNum) || pageNum < 1) {
    return { valid: false, page: 1, limit: 20, error: '페이지 번호가 올바르지 않습니다' };
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return { valid: false, page: pageNum, limit: 20, error: '페이지 크기는 1-100 사이여야 합니다' };
  }

  return { valid: true, page: pageNum, limit: limitNum };
}

/**
 * 검색 쿼리 검증 및 정제
 */
export function sanitizeSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return '';

  return query
    .trim()
    .slice(0, 100) // 최대 100자
    .replace(/[<>]/g, '') // HTML 태그 문자 제거
    .replace(/['"`;]/g, ''); // SQL 특수문자 제거
}
