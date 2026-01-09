/**
 * Rate Limiting 유틸리티
 * API 요청 속도 제한을 위한 인메모리 기반 구현입니다.
 * 프로덕션에서는 Redis 사용을 권장합니다.
 */

import { NextRequest, NextResponse } from 'next/server';

// Rate limit 저장소 (인메모리)
// 프로덕션에서는 Redis로 교체 권장
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// 정리 인터벌 (5분마다 만료된 항목 정리)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// 주기적으로 만료된 항목 정리
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitStore.entries()) {
      if (now > value.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

/**
 * Rate Limit 설정 타입
 */
export interface RateLimitConfig {
  /** 최대 요청 수 */
  maxRequests: number;
  /** 시간 윈도우 (밀리초) */
  windowMs: number;
  /** 식별자 추출 함수 (기본: IP) */
  keyGenerator?: (request: NextRequest) => string;
  /** 제한 초과 시 메시지 */
  message?: string;
}

/**
 * 기본 Rate Limit 설정
 */
export const defaultRateLimitConfig: RateLimitConfig = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1분
  message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
};

/**
 * 사전 정의된 Rate Limit 설정들
 */
export const RateLimitPresets = {
  /** 일반 API: 분당 100회 */
  standard: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },
  /** 인증 API: 분당 5회 (Brute force 방지) */
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000,
    message: '로그인 시도가 너무 많습니다. 1분 후 다시 시도해주세요.',
  },
  /** 엄격한 제한: 분당 10회 */
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
  /** 느슨한 제한: 분당 200회 */
  relaxed: {
    maxRequests: 200,
    windowMs: 60 * 1000,
  },
  /** 파일 업로드: 분당 20회 */
  upload: {
    maxRequests: 20,
    windowMs: 60 * 1000,
    message: '파일 업로드가 너무 많습니다. 잠시 후 다시 시도해주세요.',
  },
} as const;

/**
 * 클라이언트 IP 추출
 */
export function getClientIp(request: NextRequest): string {
  // Vercel/Cloudflare 등의 프록시 헤더 확인
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // 기본값 (로컬 개발)
  return '127.0.0.1';
}

/**
 * Rate Limit 체크
 * @returns true면 요청 허용, false면 제한 초과
 */
export function checkRateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const { maxRequests, windowMs, keyGenerator } = {
    ...defaultRateLimitConfig,
    ...config,
  };

  // 식별자 생성 (기본: IP + 경로)
  const key = keyGenerator
    ? keyGenerator(request)
    : `${getClientIp(request)}:${new URL(request.url).pathname}`;

  const now = Date.now();
  const record = rateLimitStore.get(key);

  // 새 윈도우 시작 또는 기존 윈도우 만료
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // 기존 윈도우 내 요청
  record.count++;

  if (record.count > maxRequests) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter,
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * Rate Limit 응답 생성
 */
export function rateLimitResponse(
  message: string = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  retryAfter?: number
): NextResponse {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (retryAfter) {
    headers['Retry-After'] = String(retryAfter);
  }

  return NextResponse.json(
    {
      success: false,
      code: 'TOO_MANY_REQUESTS',
      message,
      retryAfter,
      timestamp: new Date().toISOString(),
    },
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Rate Limit 미들웨어 래퍼
 * 사용 예:
 * export const POST = withRateLimit(
 *   async (request) => { ... },
 *   RateLimitPresets.auth
 * );
 */
export function withRateLimit<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>,
  config: Partial<RateLimitConfig> = {}
) {
  return async (request: NextRequest): Promise<NextResponse<T | { success: false; code: string; message: string; retryAfter?: number; timestamp: string }>> => {
    const result = checkRateLimit(request, config);

    if (!result.allowed) {
      const message = config.message || defaultRateLimitConfig.message;
      return rateLimitResponse(message, result.retryAfter) as NextResponse<{ success: false; code: string; message: string; retryAfter?: number; timestamp: string }>;
    }

    // Rate limit 헤더 추가
    const response = await handler(request);

    // 응답 헤더에 Rate Limit 정보 추가
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests || defaultRateLimitConfig.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(result.remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetTime / 1000)));

    return response;
  };
}

/**
 * 특정 키의 Rate Limit 리셋 (관리용)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * 모든 Rate Limit 리셋 (관리용)
 */
export function resetAllRateLimits(): void {
  rateLimitStore.clear();
}
