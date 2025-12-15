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
    ChevronRight,
    Bell,
    Settings,
    HelpCircle,
} from "lucide-react";

interface Reporter {
    id: string;
    name: string;
    position: string;
    region: string;
    avatar_icon: string;
    access_level: number;
    profile_image?: string;
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
        intern_reporter: "수습기자",
        citizen_reporter: "시민기자",
    };
    return positions[position] || position;
}

interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    reporter: Reporter | null;
}

interface NavItem {
    href: string;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
    { href: "/reporter", label: "대시보드", icon: LayoutDashboard },
    { href: "/reporter/articles", label: "기사 관리", icon: FileText },
    { href: "/reporter/write", label: "새 기사 작성", icon: PenSquare },
    { href: "/reporter/drafts", label: "임시저장", icon: StickyNote },
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
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // 인증되지 않음
    if (!auth.isAuthenticated) {
        return null;
    }

    const reporter = auth.reporter!;

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Mobile Header */}
            <header className="lg:hidden bg-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <Newspaper className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-white">Korea NEWS</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-300"
                >
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            <div className="flex">
                {/* Premium Dark Sidebar */}
                <aside
                    className={`
                        fixed lg:static inset-y-0 left-0 z-40
                        w-72 bg-gradient-to-b from-slate-800 to-slate-900
                        transform transition-transform duration-300 ease-out
                        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                        flex flex-col
                    `}
                >
                    {/* Logo */}
                    <div className="hidden lg:flex items-center gap-3 px-6 py-5">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Newspaper className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg text-white">Korea NEWS</span>
                            <p className="text-xs text-slate-400">Reporter Portal</p>
                        </div>
                    </div>

                    {/* User Profile Section */}
                    <div className="px-4 py-5 mx-3 mt-2 bg-slate-700/30 rounded-xl backdrop-blur">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-2xl overflow-hidden ring-2 ring-slate-600">
                                    {reporter.profile_image ? (
                                        <img
                                            src={reporter.profile_image}
                                            alt={reporter.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        reporter.avatar_icon || "👤"
                                    )}
                                </div>
                                {/* Online Status */}
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-800" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-white truncate">{reporter.name}</p>
                                <p className="text-xs text-slate-400">{reporter.region} {getPositionLabel(reporter.position)}</p>
                            </div>
                            <button className="p-1.5 hover:bg-slate-600/50 rounded-lg transition">
                                <Bell className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            메뉴
                        </p>
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href ||
                                (item.href !== "/reporter" && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                        group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                                        ${isActive
                                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                            : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? "" : "group-hover:scale-110 transition-transform"}`} />
                                    <span className="font-medium flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className={`
                                            px-2 py-0.5 text-xs font-semibold rounded-full
                                            ${item.badgeColor || "bg-slate-600 text-slate-300"}
                                        `}>
                                            {item.badge}
                                        </span>
                                    )}
                                    {isActive && (
                                        <ChevronRight className="w-4 h-4" />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom Section */}
                    <div className="px-3 py-4 border-t border-slate-700/50">
                        <Link
                            href="/reporter/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="font-medium">설정</span>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-400 hover:bg-slate-700/50 hover:text-white rounded-xl transition"
                        >
                            <HelpCircle className="w-5 h-5" />
                            <span className="font-medium">고객센터</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition mt-1"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">로그아웃</span>
                        </button>

                        {/* Version */}
                        <p className="text-center text-xs text-slate-600 mt-4">
                            Version 1.0.0
                        </p>
                    </div>
                </aside>

                {/* Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main className="flex-1 min-h-screen lg:ml-0">
                    {/* Top Bar */}
                    <div className="hidden lg:flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200">
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">
                                {NAV_ITEMS.find(item => pathname === item.href ||
                                    (item.href !== "/reporter" && pathname.startsWith(item.href)))?.label || "대시보드"}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {new Date().toLocaleDateString("ko-KR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    weekday: "long"
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="relative p-2 hover:bg-slate-100 rounded-lg transition">
                                <Bell className="w-5 h-5 text-slate-600" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                            </button>
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center overflow-hidden">
                                {reporter.profile_image ? (
                                    <img
                                        src={reporter.profile_image}
                                        alt={reporter.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-lg">{reporter.avatar_icon || "👤"}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
