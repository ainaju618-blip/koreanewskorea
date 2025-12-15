
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 헤더 값에서 유니코드를 안전하게 인코딩하는 함수
function encodeHeaderValue(value: string): string {
    // ASCII 범위(0-255) 이외의 문자가 있으면 URI 인코딩
    const hasNonAscii = /[^\x00-\xFF]/.test(value)
    return hasNonAscii ? encodeURIComponent(value) : value
}

// 커스텀 fetch: HTTP 헤더의 유니코드 문자를 인코딩하여 ByteString 에러 방지
const customFetch: typeof fetch = async (url, options = {}) => {
    const safeOptions = { ...options }

    if (options?.headers) {
        const safeHeaders: Record<string, string> = {}

        // Headers 객체, 배열, 또는 일반 객체 모두 처리
        if (options.headers instanceof Headers) {
            options.headers.forEach((value, key) => {
                safeHeaders[key] = encodeHeaderValue(value)
            })
        } else if (Array.isArray(options.headers)) {
            for (const [key, value] of options.headers) {
                safeHeaders[key] = encodeHeaderValue(value)
            }
        } else {
            for (const [key, value] of Object.entries(options.headers)) {
                safeHeaders[key] = encodeHeaderValue(value as string)
            }
        }

        safeOptions.headers = safeHeaders
    }

    return fetch(url, safeOptions)
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        fetch: customFetch
    }
})
