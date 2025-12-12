"use client";

import React, { useState, useEffect } from "react";
import { Play, Clock, Loader2 } from "lucide-react";
import { ScraperPanel, DbManagerPanel } from "./components";

export default function BotRunPage() {
    // Scheduler State
    const [schedulerEnabled, setSchedulerEnabled] = useState(false);
    const [schedulerLoading, setSchedulerLoading] = useState(true);

    // Load Scheduler Config
    useEffect(() => {
        fetch('/api/bot/schedule')
            .then(res => res.json())
            .then(data => {
                setSchedulerEnabled(data.enabled);
                setSchedulerLoading(false);
            })
            .catch(err => {
                console.error('Failed to load schedule config', err);
                setSchedulerLoading(false);
            });
    }, []);

    const toggleScheduler = async () => {
        const newState = !schedulerEnabled;
        setSchedulerLoading(true);
        try {
            const res = await fetch('/api/bot/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled: newState,
                    cronExpression: '0 9,13,17 * * *'
                })
            });
            const data = await res.json();
            if (data.success) {
                setSchedulerEnabled(newState);
            } else {
                alert('설정 저장 실패: ' + data.message);
            }
        } catch (e) {
            alert('설정 저장 중 오류 발생');
        } finally {
            setSchedulerLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Play className="w-7 h-7 text-blue-600" />
                    스크래퍼 관리
                </h1>
                <p className="text-sm text-gray-500 mt-2">
                    왼쪽: 뉴스 수집 실행 | 오른쪽: DB 정리 (중복 방지용)
                </p>
            </header>

            {/* Scheduler Panel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        자동 수집 스케줄러
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        매일 09:00, 13:00, 17:00에 자동으로 뉴스를 수집합니다.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {schedulerLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    ) : (
                        <>
                            <span className={`text-sm font-bold ${schedulerEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                                {schedulerEnabled ? 'ON' : 'OFF'}
                            </span>
                            <button
                                onClick={toggleScheduler}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 ${schedulerEnabled ? 'bg-purple-600' : 'bg-gray-200'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedulerEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* 2단 레이아웃 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 왼쪽: 스크래퍼 실행 */}
                <div>
                    <ScraperPanel />
                </div>

                {/* 오른쪽: DB 관리 */}
                <div>
                    <DbManagerPanel />
                </div>
            </div>
        </div>
    );
}
