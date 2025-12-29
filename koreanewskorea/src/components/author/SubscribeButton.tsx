"use client";

import { useState, useOptimistic, useTransition } from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface SubscribeButtonProps {
    reporterId: string;
    initialIsSubscribed: boolean;
    initialSubscriberCount: number;
    isLoggedIn?: boolean;
}

interface SubscribeState {
    isSubscribed: boolean;
    subscriberCount: number;
}

/**
 * 구독 버튼 (React 19 useOptimistic 버전)
 * =========================================
 * - useOptimistic: 서버 응답 전 즉시 UI 업데이트
 * - useTransition: 자연스러운 pending 상태 관리
 */
export default function SubscribeButton({
    reporterId,
    initialIsSubscribed,
    initialSubscriberCount,
    isLoggedIn = false,
}: SubscribeButtonProps) {
    // 실제 서버 상태
    const [actualState, setActualState] = useState<SubscribeState>({
        isSubscribed: initialIsSubscribed,
        subscriberCount: initialSubscriberCount,
    });

    // React 19 useOptimistic: 낙관적 UI 업데이트
    const [optimisticState, addOptimistic] = useOptimistic(
        actualState,
        (current, optimisticValue: SubscribeState) => optimisticValue
    );

    const [isPending, startTransition] = useTransition();
    const { showSuccess, showError, showInfo } = useToast();
    const router = useRouter();

    const handleSubscribe = async () => {
        if (!isLoggedIn) {
            showInfo("구독하려면 로그인이 필요합니다.");
            router.push("/login?redirect_to=" + window.location.pathname);
            return;
        }

        // 낙관적 상태 계산
        const newIsSubscribed = !actualState.isSubscribed;
        const newCount = actualState.subscriberCount + (newIsSubscribed ? 1 : -1);
        const optimisticNewState = {
            isSubscribed: newIsSubscribed,
            subscriberCount: newCount,
        };

        startTransition(async () => {
            // 즉시 UI 업데이트 (React 19 useOptimistic)
            addOptimistic(optimisticNewState);

            try {
                const res = await fetch("/api/author/subscribe", {
                    method: actualState.isSubscribed ? "DELETE" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reporterId }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "요청 실패");
                }

                const data = await res.json();

                // 서버 응답으로 실제 상태 업데이트
                setActualState({
                    isSubscribed: data.isSubscribed,
                    subscriberCount: data.subscriberCount ?? newCount,
                });

                if (data.isSubscribed) {
                    showSuccess("기자를 구독했습니다.\n새로운 소식을 알려드릴게요!");
                } else {
                    showInfo("구독이 취소되었습니다.");
                }
            } catch (error: any) {
                // 실패 시 원래 상태 유지 (useOptimistic이 자동으로 롤백)
                showError(error.message || "오류가 발생했습니다.");
            }
        });
    };

    const { isSubscribed, subscriberCount } = optimisticState;

    return (
        <button
            onClick={handleSubscribe}
            disabled={isPending}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all
                ${isSubscribed
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
                }
            `}
        >
            {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSubscribed ? (
                <>
                    <Check className="w-4 h-4" />
                    <span>구독중</span>
                </>
            ) : (
                <>
                    <Bell className="w-4 h-4" />
                    <span>구독하기</span>
                </>
            )}

            {/* 구분선 및 카운트 */}
            <span className={`w-px h-3 mx-1 ${isSubscribed ? "bg-gray-300" : "bg-blue-400"}`} />
            <span className="text-sm">
                {subscriberCount.toLocaleString()}
            </span>
        </button>
    );
}
