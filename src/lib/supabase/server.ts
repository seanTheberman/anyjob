import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createServerSupabaseClient() {
    const cookieStore = await cookies()
    const headerStore = await headers()
    const authorization = headerStore.get('authorization')
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: authorization ? { headers: { Authorization: authorization } } : undefined,
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing user sessions.
                    }
                },
            },
        }
    )
}
