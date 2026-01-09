import { redirect, notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface PageProps {
    searchParams: Promise<{ name?: string }>;
}

export default async function AuthorSearchPage({ searchParams }: PageProps) {
    const { name } = await searchParams;

    if (!name) {
        notFound();
    }

    // 기자 이름으로 검색
    const { data: reporter } = await supabaseAdmin
        .from("reporters")
        .select("id, name")
        .eq("name", name)
        .eq("status", "Active")
        .single();

    if (reporter) {
        // 기자 페이지로 리다이렉트 (이름 기반 URL)
        redirect(`/author/${encodeURIComponent(reporter.name)}`);
    }

    // 기자를 찾지 못한 경우
    notFound();
}
