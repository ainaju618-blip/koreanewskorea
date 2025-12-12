"use client";

import { Settings, Clock, Wrench, Globe, Tag, Key } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const settingsLinks = [
        { href: "/admin/settings/general", label: "사이트 정보", icon: Globe, desc: "사이트 기본 정보 설정" },
        { href: "/admin/settings/categories", label: "카테고리 관리", icon: Tag, desc: "기사 카테고리 관리" },
        { href: "/admin/settings/api", label: "API 키 설정", icon: Key, desc: "외부 서비스 API 키 관리" },
    ];

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <header>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Settings className="w-7 h-7 text-blue-600" />
                    시스템 설정 (System Settings)
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                    Korea CMS의 전반적인 설정을 관리합니다.
                </p>
            </header>

            {/* 설정 카드 그리드 */}
            <div className="grid grid-cols-3 gap-6">
                {settingsLinks.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all"
                    >
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-50 transition">
                            <item.icon className="w-6 h-6 text-gray-500 group-hover:text-blue-600 transition" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{item.label}</h3>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                    </Link>
                ))}
            </div>

            {/* 준비 중 안내 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                    일부 설정 기능은 <span className="font-medium">준비 중</span>입니다. 향후 업데이트에서 활성화됩니다.
                </p>
            </div>
        </div>
    );
}
