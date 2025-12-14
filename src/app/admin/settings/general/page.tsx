"use client";

import React, { useState } from "react";
import { Settings, Globe, Mail, Phone, MapPin, Save, Loader2, Image, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export default function GeneralSettingsPage() {
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        siteName: 'Korea NEWS',
        siteDescription: '로컬과 세계를 잇는 AI 저널리즘',
        siteUrl: 'https://koreanewsone.com',
        logoUrl: '/logo.png',
        faviconUrl: '/favicon.ico',
        contactEmail: 'contact@koreanewsone.com',
        contactPhone: '062-123-4567',
        address: '광주광역시 서구 상무중앙로 00길 00',
        facebook: 'https://facebook.com/koreanews',
        twitter: 'https://twitter.com/koreanews',
        instagram: 'https://instagram.com/koreanews',
        youtube: ''
    });

    const handleSave = async () => {
        setSaving(true);
        // TODO: API 연동 시 실제 저장 로직 추가
        setTimeout(() => {
            setSaving(false);
            alert('설정이 저장되었습니다.');
        }, 1000);
    };

    const handleChange = (field: string, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Settings className="w-7 h-7 text-blue-600" />
                        사이트 정보
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        웹사이트 기본 정보를 설정합니다.
                    </p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? '저장 중...' : '저장'}
                </button>
            </header>

            {/* Settings Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                        <Globe className="w-5 h-5 text-blue-600" />
                        기본 정보
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사이트명</label>
                        <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => handleChange('siteName', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사이트 설명</label>
                        <input
                            type="text"
                            value={settings.siteDescription}
                            onChange={(e) => handleChange('siteDescription', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사이트 URL</label>
                        <input
                            type="url"
                            value={settings.siteUrl}
                            onChange={(e) => handleChange('siteUrl', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">로고 URL</label>
                            <input
                                type="text"
                                value={settings.logoUrl}
                                onChange={(e) => handleChange('logoUrl', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">파비콘 URL</label>
                            <input
                                type="text"
                                value={settings.faviconUrl}
                                onChange={(e) => handleChange('faviconUrl', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* 연락처 정보 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                        <Mail className="w-5 h-5 text-blue-600" />
                        연락처 정보
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">대표 이메일</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={settings.contactEmail}
                                onChange={(e) => handleChange('contactEmail', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">대표 전화</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="tel"
                                value={settings.contactPhone}
                                onChange={(e) => handleChange('contactPhone', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={settings.address}
                                onChange={(e) => handleChange('address', e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* SNS 링크 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4 lg:col-span-2">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
                        <Globe className="w-5 h-5 text-blue-600" />
                        SNS 링크
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                            <div className="relative">
                                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600" />
                                <input
                                    type="url"
                                    value={settings.facebook}
                                    onChange={(e) => handleChange('facebook', e.target.value)}
                                    placeholder="https://facebook.com/..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                            <div className="relative">
                                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-500" />
                                <input
                                    type="url"
                                    value={settings.twitter}
                                    onChange={(e) => handleChange('twitter', e.target.value)}
                                    placeholder="https://twitter.com/..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                                <input
                                    type="url"
                                    value={settings.instagram}
                                    onChange={(e) => handleChange('instagram', e.target.value)}
                                    placeholder="https://instagram.com/..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                            <div className="relative">
                                <Youtube className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-600" />
                                <input
                                    type="url"
                                    value={settings.youtube}
                                    onChange={(e) => handleChange('youtube', e.target.value)}
                                    placeholder="https://youtube.com/..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
