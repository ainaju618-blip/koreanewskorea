export async function GET() {
  return new Response(
    JSON.stringify({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 8),
      service: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 8) + '...'
        : null,
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  )
}
