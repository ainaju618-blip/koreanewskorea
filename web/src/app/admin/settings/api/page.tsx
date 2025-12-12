"use client";

import React from "react";
import { Key, ExternalLink, Database, Cloud, Github, Image, Zap, Shield } from "lucide-react";

// 외부 서비스 정보
const services = [
    {
        name: 'Supabase',
        description: '데이터베이스, 인증, 스토리지',
        icon: Database,
        color: 'bg-emerald-100 text-emerald-600',
        links: [
            { label: '대시보드', url: 'https://app.supabase.com/' },
            { label: 'SQL Editor', url: 'https://app.supabase.com/project/_/sql' },
            { label: '테이블 에디터', url: 'https://app.supabase.com/project/_/editor' },
        ],
        envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
    },
    {
        name: 'Vercel',
        description: '배포, 환경 변수, 도메인',
        icon: Cloud,
        color: 'bg-gray-900 text-white',
        links: [
            { label: '프로젝트 설정', url: 'https://vercel.com/dashboard' },
            { label: '환경 변수', url: 'https://vercel.com/dashboard' },
            { label: '배포 로그', url: 'https://vercel.com/dashboard' },
        ],
        envVars: ['VERCEL_URL']
    },
    {
        name: 'GitHub',
        description: '소스 코드, Secrets, Actions',
        icon: Github,
        color: 'bg-gray-800 text-white',
        links: [
            { label: '레포지토리', url: 'https://github.com/' },
            { label: 'Secrets 설정', url: 'https://github.com/settings/secrets/actions' },
            { label: 'Actions 로그', url: 'https://github.com/' },
        ],
        envVars: []
    },
    {
        name: 'OpenAI',
        description: 'AI 번역/리라이팅',
        icon: Zap,
        color: 'bg-teal-100 text-teal-700',
        links: [
            { label: 'API Keys', url: 'https://platform.openai.com/api-keys' },
            { label: 'Usage', url: 'https://platform.openai.com/usage' },
        ],
        envVars: ['OPENAI_API_KEY']
    },
    {
        name: 'Cloudinary',
        description: '이미지 저장 및 최적화',
        icon: Image,
        color: 'bg-blue-100 text-blue-700',
        links: [
            { label: '대시보드', url: 'https://console.cloudinary.com/' },
            { label: 'Media Library', url: 'https://console.cloudinary.com/library' },
        ],
        envVars: ['CLOUDINARY_URL', 'CLOUDINARY_CLOUD_NAME']
    },
];

export default function ApiSettingsPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Key className="w-7 h-7 text-blue-600" />
                    API 설정
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                    외부 서비스 설정 및 API 키 관리를 위한 바로가기입니다.
                </p>
            </header>

            {/* Security Notice */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                    <h4 className="font-bold text-red-800">보안 안내</h4>
                    <p className="text-sm text-red-700 mt-1">
                        API 키와 시크릿은 절대 클라이언트 코드에 노출하지 마세요.
                        모든 민감한 키는 환경 변수(`.env.local`) 또는 Vercel/GitHub Secrets에 저장하세요.
                    </p>
                </div>
            </div>

            {/* Service Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map(service => {
                    const Icon = service.icon;
                    return (
                        <div key={service.name} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div className="p-5 border-b border-gray-100 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.color}`}>
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                                    <p className="text-sm text-gray-500">{service.description}</p>
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="p-4 space-y-2">
                                {service.links.map(link => (
                                    <a
                                        key={link.label}
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
                                    >
                                        <span className="text-sm font-medium text-gray-700">{link.label}</span>
                                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                                    </a>
                                ))}
                            </div>

                            {/* Env Vars */}
                            {service.envVars.length > 0 && (
                                <div className="px-4 pb-4">
                                    <p className="text-xs text-gray-500 mb-2">필요한 환경 변수:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {service.envVars.map(v => (
                                            <code key={v} className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                                {v}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Current Environment */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-4">현재 환경 상태</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">SUPABASE</p>
                        <p className="text-lg font-bold text-green-800">연결됨 ✓</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-600 font-medium">OPENAI</p>
                        <p className="text-lg font-bold text-green-800">연결됨 ✓</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 font-medium">CLOUDINARY</p>
                        <p className="text-lg font-bold text-gray-400">미설정</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium">환경</p>
                        <p className="text-lg font-bold text-blue-800">Development</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
