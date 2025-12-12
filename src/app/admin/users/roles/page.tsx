"use client";

import React from "react";
import { Shield, ShieldCheck, User, Eye, Edit, Trash2, Check, X, Settings, FileText, Bot, Users } from "lucide-react";

// 권한 매트릭스 데이터
const permissions = [
    {
        category: "기사 관리",
        icon: FileText,
        items: [
            { name: "기사 목록 조회", admin: true, reporter: true, subscriber: false },
            { name: "기사 작성", admin: true, reporter: true, subscriber: false },
            { name: "자신의 기사 수정", admin: true, reporter: true, subscriber: false },
            { name: "타인의 기사 수정", admin: true, reporter: false, subscriber: false },
            { name: "기사 삭제", admin: true, reporter: false, subscriber: false },
            { name: "기사 승인/발행", admin: true, reporter: false, subscriber: false },
        ]
    },
    {
        category: "봇 관리",
        icon: Bot,
        items: [
            { name: "수집 로그 조회", admin: true, reporter: true, subscriber: false },
            { name: "수동 수집 실행", admin: true, reporter: false, subscriber: false },
            { name: "스케줄러 설정", admin: true, reporter: false, subscriber: false },
            { name: "소스 관리", admin: true, reporter: false, subscriber: false },
        ]
    },
    {
        category: "사용자 관리",
        icon: Users,
        items: [
            { name: "회원 목록 조회", admin: true, reporter: false, subscriber: false },
            { name: "회원 등록/수정", admin: true, reporter: false, subscriber: false },
            { name: "역할 변경", admin: true, reporter: false, subscriber: false },
        ]
    },
    {
        category: "시스템 설정",
        icon: Settings,
        items: [
            { name: "사이트 정보 수정", admin: true, reporter: false, subscriber: false },
            { name: "카테고리 관리", admin: true, reporter: false, subscriber: false },
            { name: "API 설정 접근", admin: true, reporter: false, subscriber: false },
        ]
    },
];

// 역할 정의
const roles = [
    {
        id: 'admin',
        name: '관리자',
        description: '시스템의 모든 기능에 접근 가능합니다. 사용자 관리, 시스템 설정, 기사 승인 등 최고 권한을 가집니다.',
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: ShieldCheck,
        iconColor: 'text-purple-600'
    },
    {
        id: 'reporter',
        name: '기자',
        description: '기사 작성 및 자신의 기사를 수정할 수 있습니다. 타인의 기사나 시스템 설정에는 접근할 수 없습니다.',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: User,
        iconColor: 'text-blue-600'
    },
    {
        id: 'subscriber',
        name: '구독자',
        description: '프론트엔드에서 댓글 작성만 가능합니다. Admin CMS에는 접근할 수 없습니다.',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: User,
        iconColor: 'text-gray-600'
    }
];

export default function RolesPage() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Shield className="w-7 h-7 text-blue-600" />
                    권한 설정
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                    사용자 역할별 권한을 확인하고 관리합니다.
                </p>
            </header>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {roles.map(role => {
                    const Icon = role.icon;
                    return (
                        <div key={role.id} className={`p-6 rounded-xl border-2 ${role.color}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm`}>
                                    <Icon className={`w-5 h-5 ${role.iconColor}`} />
                                </div>
                                <h3 className="font-bold text-lg">{role.name}</h3>
                            </div>
                            <p className="text-sm opacity-80">{role.description}</p>
                        </div>
                    );
                })}
            </div>

            {/* Permission Matrix */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-900">권한 매트릭스</h3>
                    <p className="text-sm text-gray-500 mt-1">각 역할별로 접근 가능한 기능을 확인합니다.</p>
                </div>

                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase w-1/3">기능</th>
                            <th className="p-4 text-center text-xs font-semibold text-purple-600 uppercase">관리자</th>
                            <th className="p-4 text-center text-xs font-semibold text-blue-600 uppercase">기자</th>
                            <th className="p-4 text-center text-xs font-semibold text-gray-500 uppercase">구독자</th>
                        </tr>
                    </thead>
                    <tbody>
                        {permissions.map((category, catIdx) => {
                            const CatIcon = category.icon;
                            return (
                                <React.Fragment key={category.category}>
                                    {/* Category Header */}
                                    <tr className="bg-gray-50/50">
                                        <td colSpan={4} className="p-3">
                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                <CatIcon className="w-4 h-4" />
                                                {category.category}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Permission Items */}
                                    {category.items.map((item, itemIdx) => (
                                        <tr key={item.name} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="p-4 pl-8 text-sm text-gray-600">{item.name}</td>
                                            <td className="p-4 text-center">
                                                {item.admin ? (
                                                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.reporter ? (
                                                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {item.subscriber ? (
                                                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-gray-300 mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h4 className="font-bold text-blue-900 mb-2">💡 권한 정책 안내</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• <strong>관리자</strong>: 발행인(Publisher)에게만 부여되는 최고 권한</li>
                    <li>• <strong>기자</strong>: 기사 작성 권한이 있으나, 승인 권한 없음 (관리자 검토 필요)</li>
                    <li>• <strong>구독자</strong>: 프론트엔드 댓글 기능만 이용 가능 (Admin CMS 접근 불가)</li>
                    <li className="text-blue-600">• 역할 변경은 "회원 관리" 페이지에서 가능합니다.</li>
                </ul>
            </div>
        </div>
    );
}
