"use client";

import { Settings, Clock, Wrench, Globe, Tag, Key, Sparkles } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const settingsLinks = [
        { href: "/admin/settings/general", label: "사이트 정보", icon: Globe, desc: "사이트 기본 정보 설정" },
        { href: "/admin/settings/categories", label: "카테고리 관리", icon: Tag, desc: "기사 카테고리 관리" },
        { href: "/admin/settings/ai", label: "AI 재가공 설정", icon: Sparkles, desc: "AI 기사 재가공 기능 설정" },
        { href: "/admin/settings/api", label: "API 키 설정", icon: Key, desc: "외부 서비스 API 키 관리" },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-[#e6edf3] flex items-center gap-3">
                    <Settings className="w-7 h-7 text-blue-400" />
                    시스템 설정 (System Settings)
                </h1>
                <p className="text-sm text-[#8b949e] mt-2">
                    Korea CMS의 전반적인 설정을 관리합니다.
                </p>
            </header>

            {/* Settings Card Grid */}
            <div className="grid grid-cols-3 gap-6">
                {settingsLinks.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group bg-[#161b22] rounded-xl border border-[#30363d] p-6 hover:border-blue-500 hover:shadow-lg transition-all"
                    >
                        <div className="w-12 h-12 bg-[#21262d] rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-900/30 transition">
                            <item.icon className="w-6 h-6 text-[#8b949e] group-hover:text-blue-400 transition" />
                        </div>
                        <h3 className="font-semibold text-[#e6edf3] mb-1">{item.label}</h3>
                        <p className="text-sm text-[#8b949e]">{item.desc}</p>
                    </Link>
                ))}
            </div>

            {/* Preparation Notice */}
            <div className="bg-amber-900/30 border border-amber-800 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <p className="text-sm text-amber-200">
                    일부 설정 기능은 <span className="font-medium">준비 중</span>입니다. 향후 업데이트에서 활성화됩니다.
                </p>
            </div>
        </div>
    );
}
