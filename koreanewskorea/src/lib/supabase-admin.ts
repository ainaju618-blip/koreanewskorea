// src/lib/supabase-admin.ts
// ByteString 에러 방지: 모든 헤더 값을 ASCII로 제한

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 비ASCII 문자를 안전하게 인코딩하는 함수
function toAsciiSafe(str: string): string {
  if (typeof str !== 'string') return str
  // 비ASCII 문자가 있으면 인코딩
  if (/[^\x00-\xFF]/.test(str)) {
    return encodeURIComponent(str)
  }
  return str
}

// 커스텀 fetch: 모든 헤더를 ASCII로 변환
async function customFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const safeHeaders: Record<string, string> = {}

  if (init?.headers) {
    let entries: [string, string][]
    if (init.headers instanceof Headers) {
      entries = Array.from(init.headers.entries())
    } else if (Array.isArray(init.headers)) {
      entries = init.headers as [string, string][]
    } else {
      entries = Object.entries(init.headers as Record<string, string>)
    }

    for (const [key, value] of entries) {
      // 모든 헤더 값을 ASCII 안전하게 변환
      safeHeaders[key] = toAsciiSafe(value)
    }
  }

  return fetch(input, {
    ...init,
    headers: safeHeaders,
  })
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  db: { schema: 'public' },
  global: {
    fetch: customFetch,
    headers: {
      'X-Client-Info': 'supabase-js-nextjs-server',
    },
  },
})
