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
    Settings,
    HelpCircle,
    Home,
    Inbox,
    Bell,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import NotificationDropdown from "@/components/reporter/NotificationDropdown";

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
        national_chief_director: "전국총괄본부장",
        chief_director: "총괄본부장",
        editor_in_chief: "주필",
        branch_manager: "지사장",
        gwangju_branch_director: "광주지역본부장",
        editor_chief: "편집국장",
        news_chief: "취재부장",
        senior_reporter: "수석기자",
        reporter: "기자",
        intern_reporter: "수습기자",
        citizen_reporter: "시민기자",
        opinion_writer: "오피니언",
        advisor: "고문",
        consultant: "자문위원",
        ambassador: "홍보대사",
        seoul_correspondent: "서울특파원",
        foreign_correspondent: "해외특파원",
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
    icon: LucideIcon;
    badge?: number | string;
    badgeColor?: string;
}

const NAV_ITEMS: NavItem[] = [
    { href: "/reporter", label: "대시보드", icon: LayoutDashboard },
    { href: "/reporter/press-releases", label: "보도자료 수신함", icon: Inbox, badge: 3, badgeColor: "bg-purple-100 text-purple-700" },
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

    // 로딩 중 - Light Theme
    if (auth.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-slate-500 text-sm">로딩 중...</p>
                </div>
            </div>
        );
    }

    // 인증되지 않음
    if (!auth.isAuthenticated) {
        return null;
    }

    const reporter = auth.reporter!;

    return (
        <div className="reporter-layout min-h-screen bg-[#FAFAF9]">
            {/* Mobile Header - Light Theme */}
            <header className="lg:hidden bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                        <Newspaper className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold text-slate-900">Korea NEWS</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                >
                    {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </header>

            <div className="flex">
                {/* Light Theme Sidebar */}
                <aside
                    className={`
                        fixed lg:static inset-y-0 left-0 z-40
                        w-72 bg-white border-r border-slate-200
                        transform transition-transform duration-300 ease-out
                        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                        flex flex-col shadow-sm
                    `}
                >
                    {/* Logo */}
                    <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-slate-100">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Newspaper className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg text-slate-900">Korea NEWS</span>
                            <p className="text-xs text-slate-500">Reporter Portal</p>
                        </div>
                    </div>

                    {/* User Profile Section - Light */}
                    <div className="px-4 py-5 mx-3 mt-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center text-2xl overflow-hidden ring-2 ring-white shadow-md">
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
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 truncate">{reporter.name}</p>
                                <p className="text-xs text-slate-500">{reporter.region} {getPositionLabel(reporter.position)}</p>
                            </div>
                            <button className="p-1.5 hover:bg-white/80 rounded-lg transition shadow-sm bg-white">
                                <Bell className="w-4 h-4 text-slate-500" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation - Light Theme */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
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
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                        }
                                    `}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive ? "" : "text-slate-400 group-hover:text-blue-500 group-hover:scale-110 transition-all"}`} />
                                    <span className="font-medium flex-1">{item.label}</span>
                                    {item.badge && (
                                        <span className={`
                                            px-2 py-0.5 text-xs font-semibold rounded-full
                                            ${item.badgeColor || "bg-slate-100 text-slate-600"}
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

                    {/* Bottom Section - Light Theme */}
                    <div className="px-3 py-4 border-t border-slate-100">
                        <Link
                            href="/reporter/profile"
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition"
                        >
                            <Settings className="w-5 h-5 text-slate-400" />
                            <span className="font-medium">설정</span>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition"
                        >
                            <Home className="w-5 h-5 text-slate-400" />
                            <span className="font-medium">메인 사이트</span>
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center gap-3 px-4 py-2.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition"
                        >
                            <HelpCircle className="w-5 h-5 text-slate-400" />
                            <span className="font-medium">도움말</span>
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 w-full text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition mt-1"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">로그아웃</span>
                        </button>

                        {/* Version */}
                        <p className="text-center text-xs text-slate-400 mt-4">
                            Version 2.0.0
                        </p>
                    </div>
                </aside>

                {/* Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content - Light Theme */}
                <main className="flex-1 min-h-screen lg:ml-0">
                    {/* Top Bar - Light Theme */}
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
                            <NotificationDropdown />
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-slate-100 shadow-sm">
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

                    {/* Content Area - More Padding for Readability */}
                    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
