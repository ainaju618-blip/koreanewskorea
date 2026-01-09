import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ReporterLayoutClient from "./ReporterLayoutClient";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function ReporterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    console.log('[ReporterLayout] Auth check:', { userId: user?.id, error: error?.message });

    // 로그인하지 않은 경우 로그인 페이지로 리다이렉트
    if (!user) {
        console.log('[ReporterLayout] No user, redirecting to login...');
        redirect("/auth/reporter");
    }

    // 기자 정보 확인 (기자가 아닌 경우 접근 불가)
    const { data: reporter } = await supabaseAdmin
        .from("reporters")
        .select("id")
        .eq("user_id", user.id)
        .single();

    if (!reporter) {
        redirect("/auth/reporter?error=not_reporter");
    }

    return <ReporterLayoutClient>{children}</ReporterLayoutClient>;
}
