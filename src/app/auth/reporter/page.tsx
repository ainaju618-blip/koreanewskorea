"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, Newspaper, User, Mail, MapPin, Briefcase } from "lucide-react";

interface DuplicateReporter {
    id: string;
    name: string;
    email: string;
    position: string;
    region: string;
}

export default function ReporterLoginPage() {
    const router = useRouter();
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // 동명이인 선택 모드
    const [duplicates, setDuplicates] = useState<DuplicateReporter[]>([]);
    const [showDuplicates, setShowDuplicates] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await res.json();

            // 동명이인인 경우
            if (res.status === 300 && data.duplicates) {
                setDuplicates(data.duplicates);
                setShowDuplicates(true);
                setIsLoading(false);
                return;
            }

            if (!res.ok) {
                setError(data.message || "로그인에 실패했습니다.");
                return;
            }

            // 로그인 성공 - 대시보드로 이동
            router.push("/reporter");
            router.refresh();

        } catch (err) {
            setError("서버 연결에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 동명이인 선택 시 이메일로 로그인 재시도
    const handleSelectDuplicate = async (email: string) => {
        setShowDuplicates(false);
        setIdentifier(email);
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier: email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "로그인에 실패했습니다.");
                return;
            }

            router.push("/reporter");
            router.refresh();

        } catch (err) {
            setError("서버 연결에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    // 동명이인 선택 취소
    const handleCancelDuplicate = () => {
        setShowDuplicates(false);
        setDuplicates([]);
        setPassword("");
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <Newspaper className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Korea NEWS</h1>
                    <p className="text-gray-500 mt-1">기자 전용 로그인</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* 동명이인 선택 UI */}
                    {showDuplicates ? (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                                    <User className="w-6 h-6 text-yellow-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">동명이인 선택</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    같은 이름의 기자가 여러 명 있습니다.<br />
                                    본인의 계정을 선택해주세요.
                                </p>
                            </div>

                            <div className="space-y-2">
                                {duplicates.map((reporter) => (
                                    <button
                                        key={reporter.id}
                                        onClick={() => handleSelectDuplicate(reporter.email)}
                                        disabled={isLoading}
                                        className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition disabled:opacity-50"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                                                👤
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900">{reporter.name}</div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="w-3 h-3" />
                                                        {reporter.position}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        {reporter.region}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                                    <Mail className="w-3 h-3" />
                                                    {reporter.email}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleCancelDuplicate}
                                className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
                            >
                                취소하고 다시 입력
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    이름 또는 이메일
                                </label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="홍길동"
                                    required
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    이름으로 로그인 가능합니다. 동명이인이 있으면 선택 화면이 나타납니다.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    비밀번호
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <LogIn className="w-5 h-5" />
                                        로그인
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {!showDuplicates && (
                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500">
                                계정이 없으신가요?{" "}
                                <span className="text-blue-600">관리자에게 문의하세요</span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    © 2025 Korea NEWS. All rights reserved.
                </p>
            </div>
        </div>
    );
}
