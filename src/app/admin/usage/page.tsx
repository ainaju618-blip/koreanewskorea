"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Cloud, Database, Server, HardDrive, RefreshCw, Loader2, ExternalLink } from 'lucide-react';

export default function UsagePage() {
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsage();
    }, []);

    const fetchUsage = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/usage');
            const data = await res.json();
            setUsage(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
        if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
        return `${(bytes / 1024).toFixed(2)} KB`;
    };

    const getPercent = (used: number, limit: number) => {
        return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50">
            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <header className="mb-8">
                    <Link href="/admin" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        대시보드로 돌아가기
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">서비스 사용량</h1>
                            <p className="text-sm text-slate-500 mt-1">무료 플랜 기준 사용량 현황</p>
                        </div>
                        <button
                            onClick={fetchUsage}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            새로고침
                        </button>
                    </div>
                </header>

                <div className="space-y-6">
                    {/* Cloudinary */}
                    <ServiceCard
                        icon={Cloud}
                        name="Cloudinary"
                        description="이미지 CDN 및 저장소"
                        link="https://console.cloudinary.com"
                        color="blue"
                    >
                        <UsageItem
                            label="저장 용량"
                            used={usage?.cloudinary?.storage?.used || 0}
                            limit={25 * 1024 * 1024 * 1024}
                            formatSize={formatSize}
                            getPercent={getPercent}
                        />
                        <UsageItem
                            label="월간 대역폭"
                            used={usage?.cloudinary?.bandwidth?.used || 0}
                            limit={25 * 1024 * 1024 * 1024}
                            formatSize={formatSize}
                            getPercent={getPercent}
                        />
                        <div className="pt-3 border-t border-slate-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">변환 크레딧</span>
                                <span className="font-medium">{(usage?.cloudinary?.credits?.used || 0).toFixed(2)} / 25</span>
                            </div>
                        </div>
                    </ServiceCard>

                    {/* Supabase */}
                    <ServiceCard
                        icon={Database}
                        name="Supabase"
                        description="PostgreSQL 데이터베이스"
                        link="https://supabase.com/dashboard"
                        color="emerald"
                    >
                        <UsageItem
                            label="데이터베이스 용량"
                            used={usage?.supabase?.database?.used || 0}
                            limit={500 * 1024 * 1024}
                            formatSize={formatSize}
                            getPercent={getPercent}
                        />
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">게시물 수</span>
                                <span className="font-medium">{usage?.supabase?.database?.rows?.posts?.toLocaleString() || 0}개</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">봇 로그 수</span>
                                <span className="font-medium">{usage?.supabase?.database?.rows?.logs?.toLocaleString() || 0}개</span>
                            </div>
                        </div>
                        <div className="pt-3 border-t border-slate-100">
                            <p className="text-xs text-slate-400">
                                * 용량은 추정치입니다. 정확한 수치는 Supabase 대시보드에서 확인하세요.
                            </p>
                        </div>
                    </ServiceCard>

                    {/* Vercel */}
                    <ServiceCard
                        icon={Server}
                        name="Vercel"
                        description="호스팅 및 서버리스 함수"
                        link="https://vercel.com/hobaks-projects/koreanews"
                        color="slate"
                    >
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">월간 대역폭</span>
                                <span className="font-medium">100 GB</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">서버리스 함수 실행</span>
                                <span className="font-medium">100K / 일</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">빌드 시간</span>
                                <span className="font-medium">100 시간 / 월</span>
                            </div>
                            <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                                Vercel 대시보드에서 실시간 사용량을 확인하세요.
                            </p>
                        </div>
                    </ServiceCard>

                    {/* GitHub */}
                    <ServiceCard
                        icon={HardDrive}
                        name="GitHub"
                        description="소스 코드 저장소"
                        link="https://github.com"
                        color="purple"
                    >
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">저장소 용량</span>
                                <span className="font-medium">무제한 (권장 1GB)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">LFS 저장소</span>
                                <span className="font-medium">1 GB (무료)</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Actions 시간</span>
                                <span className="font-medium">2,000분 / 월</span>
                            </div>
                        </div>
                    </ServiceCard>
                </div>

                {/* 요약 */}
                <div className="mt-8 p-4 bg-white rounded-xl border border-slate-200">
                    <h3 className="font-semibold text-slate-800 mb-3">💡 무료 플랜 한도 요약</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <p className="text-blue-600 font-bold">25 GB</p>
                            <p className="text-slate-500 text-xs">Cloudinary 저장</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <p className="text-emerald-600 font-bold">500 MB</p>
                            <p className="text-slate-500 text-xs">Supabase DB</p>
                        </div>
                        <div className="text-center p-3 bg-slate-100 rounded-lg">
                            <p className="text-slate-700 font-bold">100 GB</p>
                            <p className="text-slate-500 text-xs">Vercel 대역폭</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <p className="text-purple-600 font-bold">무제한</p>
                            <p className="text-slate-500 text-xs">GitHub 저장소</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ServiceCard({ icon: Icon, name, description, link, color, children }: any) {
    const colorClasses: Record<string, string> = {
        blue: 'text-blue-600',
        emerald: 'text-emerald-600',
        slate: 'text-slate-600',
        purple: 'text-purple-600'
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-slate-100`}>
                        <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
                    </div>
                    <div>
                        <h2 className="font-semibold text-slate-800">{name}</h2>
                        <p className="text-xs text-slate-500">{description}</p>
                    </div>
                </div>
                <a
                    href={link}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                    대시보드 <ExternalLink className="w-3 h-3" />
                </a>
            </div>
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}

function UsageItem({ label, used, limit, formatSize, getPercent }: any) {
    const percent = getPercent(used, limit);
    const barColor = percent > 80 ? 'bg-red-500' : percent > 60 ? 'bg-amber-500' : 'bg-blue-500';

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium">
                    {formatSize(used)} / {formatSize(limit)}
                    <span className={`ml-2 text-xs ${percent > 80 ? 'text-red-600' : percent > 60 ? 'text-amber-600' : 'text-slate-400'}`}>
                        ({percent.toFixed(1)}%)
                    </span>
                </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all ${barColor}`}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
