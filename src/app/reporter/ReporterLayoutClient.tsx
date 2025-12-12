"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    Newspaper,
    LayoutDashboard,
    FileText,
    PenSquare,
    User,
    LogOut,
    Menu,
    X,
    Loader2,
    StickyNote,
} from "lucide-react";

interface Reporter {
    id: string;
    name: string;
    position: string;
    region: string;
    avatar_icon: string;
    access_level: number;
}

// 직위 코드를 한글 라벨로 변환
function getPositionLabel(position: string): string {
    const positions: Record<string, string> = {
        editor_in_chief: "주필",
        branch_manager: "지사장",
        editor_chief: "편집국장",
        news_chief: "보도국장",
        senior_reporter: "선임기자",
        reporter: "기자",
    };
    return positions[position] || position;
}

interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    reporter: Reporter | null;
}

const NAV_ITEMS = [
    { href: "/reporter", label: "대시보드", icon: LayoutDashboard },
    { href: "/reporter/articles", label: "기사 관리", icon: FileText },
    { href: "/reporter/write", label: "기사 작성", icon: PenSquare },
    { href: "/reporter/drafts", label: "기사 초안", icon: StickyNote },
    { href: "/reporter/profile", label: "내 정보", icon: User },
];

export default function ReporterLayoutClient({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [auth, setAuth] = useState<AuthState>({
        isLoading: true,
        isAuthenticated: false,
        reporter: null,
    });

    // 로그인 페이지인 경우 레이아웃 없이 렌더링
    const isLoginPage = pathname === "/reporter/login";

    useEffect(() => {
        if (isLoginPage) {
            setAuth({ isLoading: false, isAuthenticated: false, reporter: null });
            return;
        }

        // 인증 상태 확인
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (res.ok) {
                    const data = await res.json();
                    setAuth({
                        isLoading: false,
                        isAuthenticated: true,
                        reporter: data.reporter,
                    });
                } else {
                    router.push("/reporter/login");
                }
            } catch {
                router.push("/reporter/login");
            }
        };

        checkAuth();
    }, [pathname, router, isLoginPage]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/reporter/login");
            router.refresh();
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    // 로그인 페이지는 레이아웃 없이
    if (isLoginPage) {
        return <>{children}</>;
    }

    // 로딩 중
    if (auth.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // 인증되지 않음
    if (!auth.isAuthenticated) {
        return null;
    }

    const reporter = auth.reporter!;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Header */}
            <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Newspaper className="w-6 h-6 text-blue-600" />
                    <span className="font-bold text-gray-900">Korea NEWS</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                >
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside
                    className={`
                        fixed lg:static inset-y-0 left-0 z-40
                        w-64 bg-white border-r border-gray-200
                        transform transition-transform duration-200
                        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                    `}
                >
                    {/* Logo */}
                    <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-gray-100">
                        <Newspaper className="w-7 h-7 text-blue-600" />
                        <span className="font-bold text-lg text-gray-900">Korea NEWS</span>
                    </div>

                    {/* User Info */}
                    <div className="px-4 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
                                {reporter.avatar_icon || "👤"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{reporter.name}</p>
                                <p className="text-xs text-gray-500">{reporter.region} {getPositionLabel(reporter.position)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="p-4 space-y-1">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-4 py-2.5 rounded-lg transition
                                        ${isActive
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-50"
                                        }
                                    `}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-600 hover:bg-gray-50 rounded-lg transition"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">로그아웃</span>
                        </button>
                    </div>
                </aside>

                {/* Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/30 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8 min-h-screen">
                    {children}
                </main>
            </div>
        </div>
    );
}
