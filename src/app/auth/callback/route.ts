import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const roleParam = searchParams.get("role");

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

                // Get user role for redirection
                const userRole = existingProfile?.role?.toLowerCase() || "client";

                // Redirect based on user role
                let redirectUrl = "/dashboard"; // default
                if (userRole === "provider") {
                    redirectUrl = "/pro";
                } else if (userRole === "admin") {
                    redirectUrl = "/admin";
                }

                return NextResponse.redirect(`${origin}${redirectUrl}`);
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
