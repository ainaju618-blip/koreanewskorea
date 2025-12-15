
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 커스텀 fetch: HTTP 헤더의 유니코드 문자를 인코딩하여 ByteString 에러 방지
const customFetch: typeof fetch = (url, options = {}) => {
    const headers = new Headers(options.headers || {})
    const safeHeaders = new Headers()

    headers.forEach((value, key) => {
        // 유니코드 문자(>255)가 포함된 헤더 값을 Base64로 인코딩
        try {
            // ASCII 문자만 포함된 경우 그대로 사용
            const hasNonAscii = /[^\x00-\xFF]/.test(value)
            if (hasNonAscii) {
                // 유니코드가 포함된 경우 URI 인코딩
                safeHeaders.set(key, encodeURIComponent(value))
            } else {
                safeHeaders.set(key, value)
            }
        } catch {
            // 인코딩 실패 시 URI 인코딩 사용
            safeHeaders.set(key, encodeURIComponent(value))
        }
    })

    return fetch(url, { ...options, headers: safeHeaders })
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
