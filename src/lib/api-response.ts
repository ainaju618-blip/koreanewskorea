/**
 * API 응답 표준화 유틸리티
 * 모든 API 라우트에서 일관된 응답 형식을 제공합니다.
 */

import { NextResponse } from 'next/server';

/**
 * 표준 API 응답 타입
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

/**
 * 에러 코드 상수
 */
export const ErrorCodes = {
  OK: 'OK',
  CREATED: 'CREATED',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * 성공 응답 생성
 */
export function successResponse<T>(
  data: T,
  message: string = '성공',
  meta?: ApiResponse['meta']
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    code: ErrorCodes.OK,
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  });
}

/**
 * 생성 성공 응답 (201)
 */
export function createdResponse<T>(
  data: T,
  message: string = '생성 완료'
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      code: ErrorCodes.CREATED,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = 500
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      code,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * 400 Bad Request
 */
export function badRequestResponse(
  message: string = '잘못된 요청입니다'
): NextResponse<ApiResponse<null>> {
  return errorResponse(ErrorCodes.BAD_REQUEST, message, 400);
}

/**
 * 401 Unauthorized
 */
export function unauthorizedResponse(
  message: string = '인증이 필요합니다'
): NextResponse<ApiResponse<null>> {
  return errorResponse(ErrorCodes.UNAUTHORIZED, message, 401);
}

/**
 * 403 Forbidden
 */
export function forbiddenResponse(
  message: string = '접근 권한이 없습니다'
): NextResponse<ApiResponse<null>> {
  return errorResponse(ErrorCodes.FORBIDDEN, message, 403);
}

/**
 * 404 Not Found
 */
export function notFoundResponse(
  message: string = '요청한 리소스를 찾을 수 없습니다'
): NextResponse<ApiResponse<null>> {
  return errorResponse(ErrorCodes.NOT_FOUND, message, 404);
}

/**
 * 409 Conflict
 */
export function conflictResponse(
  message: string = '리소스 충돌이 발생했습니다'
): NextResponse<ApiResponse<null>> {
  return errorResponse(ErrorCodes.CONFLICT, message, 409);
}

/**
 * 422 Validation Error
 */
export function validationErrorResponse(
  message: string = '입력값 검증에 실패했습니다'
): NextResponse<ApiResponse<null>> {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, 422);
}

/**
 * 500 Internal Server Error
 */
export function internalErrorResponse(
  message: string = '서버 오류가 발생했습니다'
): NextResponse<ApiResponse<null>> {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, message, 500);
}

/**
 * 페이지네이션 메타 정보 생성
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): ApiResponse['meta'] {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * API 에러 핸들러 (try-catch에서 사용)
 * @example
 * try {
 *   // API 로직
 * } catch (error) {
 *   return handleApiError(error, '기사 조회');
 * }
 */
export function handleApiError(
  error: unknown,
  context: string = 'API 처리'
): NextResponse<ApiResponse<null>> {
  // 에러 로깅 (Stack trace는 서버에서만)
  console.error(`[API Error] ${context}:`, error);

  // 클라이언트에게는 일반적인 메시지만 전달
  const message = process.env.NODE_ENV === 'development'
    ? `${context} 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    : `${context} 중 오류가 발생했습니다`;

  return internalErrorResponse(message);
}
