import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const isAdminRoute = pathname.startsWith('/admin')

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    if (!isAdminRoute && process.env.ROUTE_GUARDS_ENABLED !== 'true') {
        return response
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Define protected routes and their required roles
    const protectedRoutes = {
        '/dashboard': 'client',
        '/pro': 'provider',
        '/admin': 'admin',
    }

    let isProtected = false
    let requiredRole: string | null = null

    // Check if the path matches any protected route
    for (const [route, role] of Object.entries(protectedRoutes)) {
        if (pathname.startsWith(route)) {
            isProtected = true
            requiredRole = role
            break
        }
    }

    const loginUrl = isAdminRoute ? '/admin-login' : '/login'

    // If route is protected and no session, redirect to the correct login surface.
    if (isProtected && !user) {
        return NextResponse.redirect(new URL(loginUrl, request.url))
    }

    // If session exists, check user role
    if (user && isProtected && requiredRole) {
        let userRole: string | null = null

        const adminSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY
            ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
                auth: { autoRefreshToken: false, persistSession: false },
            }) as never as {
                from(table: string): {
                    select(columns: string): {
                        eq(column: string, value: string): {
                            maybeSingle(): Promise<{ data: { status?: string } | null; error: unknown }>
                        }
                    }
                }
            }
            : null

        const [{ data: authProfile }, { data: buyerProfile }, { data: adminFlag }] = await Promise.all([
            supabase
                .from('user_profiles')
                .select('role,is_active')
                .eq('id', user.id)
                .maybeSingle(),
            supabase
                .from('buyers')
                .select('is_active')
                .eq('id', user.id)
                .maybeSingle(),
            adminSupabase
                ? adminSupabase
                    .from('admin_user_flags')
                    .select('status')
                    .eq('user_id', user.id)
                    .maybeSingle()
                : Promise.resolve({ data: null, error: null }),
        ])

        if (authProfile?.is_active === false || buyerProfile?.is_active === false || adminFlag?.status === 'blocked') {
            const suspendedUrl = new URL(loginUrl, request.url)
            suspendedUrl.searchParams.set('error', 'account_suspended')
            return NextResponse.redirect(suspendedUrl)
        }

        // Check eloo_profiles first
        const { data: profile } = await supabase
            .from('eloo_profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role) {
            userRole = profile.role.toLowerCase()
        } else if (authProfile?.role) {
            const profileRole = String(authProfile.role).toLowerCase()
            userRole = profileRole === 'buyer' ? 'client' : profileRole === 'seller' ? 'provider' : profileRole
        } else {
            // Check if user is a seller (treat as provider for /pro routes)
            const { data: seller } = await supabase
                .from('sellers')
                .select('id')
                .eq('id', user.id)
                .single()

            if (seller) {
                userRole = 'provider'
            }
        }

        const effectiveRole = userRole
        const allowedRoles = requiredRole === 'provider' ? ['provider', 'seller'] : [requiredRole]

        if (!effectiveRole || !allowedRoles.includes(effectiveRole)) {
            if (effectiveRole === 'client') {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            } else if (effectiveRole === 'provider' || effectiveRole === 'seller') {
                return NextResponse.redirect(new URL('/pro', request.url))
            } else if (effectiveRole === 'admin') {
                return NextResponse.redirect(new URL('/admin', request.url))
            } else {
                return NextResponse.redirect(new URL(loginUrl, request.url))
            }
        }
    }

    return response
}

export const config = {
    matcher: ['/dashboard/:path*', '/pro/:path*', '/admin/:path*'],
}
