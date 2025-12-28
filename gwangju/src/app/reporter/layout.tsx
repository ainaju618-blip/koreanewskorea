import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import ReporterLayoutClient from "./ReporterLayoutClient";

export default async function ReporterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 로그인 페이지는 레이아웃 체크 제외
    // 나머지 페이지는 로그인 필요

    return <ReporterLayoutClient>{children}</ReporterLayoutClient>;
}
