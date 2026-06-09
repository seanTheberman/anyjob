import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const roleParam = searchParams.get("role");
    const nextParam = searchParams.get("next");
    const nextPath = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

    if (code) {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // Check if profile exists, if not create one
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data: existingProfile } = await supabase
                    .from("eloo_profiles")
                    .select("id, role")
                    .eq("id", user.id)
                    .single();

                if (!existingProfile) {
                    const userRole = roleParam || user.user_metadata?.role || "client";
                    await supabase.from("eloo_profiles").insert({
                        id: user.id,
                        role: userRole,
                        first_name: user.user_metadata?.full_name?.split(" ")[0] || user.user_metadata?.first_name || "User",
                        last_name: user.user_metadata?.full_name?.split(" ").slice(1).join(" ") || user.user_metadata?.last_name || "",
                        avatar_url: user.user_metadata?.avatar_url || null,
                    });
                }

                return NextResponse.redirect(`${origin}${nextPath}`);
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
