import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// This is a test endpoint to bypass auth for dashboard testing
// DO NOT USE IN PRODUCTION
export async function GET() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  // Create a test session by signing in with a test user
  // For testing, we'll use a demo user that auto-creates
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'demo@anyjob.com',
    password: 'Demo123!Anyjob',
  })

  if (error) {
    // If user doesn't exist, sign up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'demo@anyjob.com',
      password: 'Demo123!Anyjob',
      options: {
        data: {
          first_name: 'Demo',
          last_name: 'User',
        },
      },
    })

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Test user created! Please check your email or try logging in.',
      user: signUpData.user 
    })
  }

  return NextResponse.json({ 
    message: 'Logged in as test user',
    user: data.user 
  })
}
