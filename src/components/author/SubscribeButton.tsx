"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

interface SubscribeButtonProps {
    reporterId: string;
    initialIsSubscribed: boolean;
    initialSubscriberCount: number;
    isLoggedIn?: boolean; // 로그인 여부를 prop으로 받거나 내부에서 체크
}

export default function SubscribeButton({
    reporterId,
    initialIsSubscribed,
    initialSubscriberCount,
    isLoggedIn = false,
}: SubscribeButtonProps) {
    const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
    const [subscriberCount, setSubscriberCount] = useState(initialSubscriberCount);
    const [isLoading, setIsLoading] = useState(false);

    const { showSuccess, showError, showInfo } = useToast();
    const router = useRouter();

    const handleSubscribe = async () => {
        if (!isLoggedIn) {
            showInfo("구독하려면 로그인이 필요합니다.");
            router.push("/login?redirect_to=" + window.location.pathname);
            return;
        }

        if (isLoading) return;

        // Optimistic Update
        const previousState = isSubscribed;
        const previousCount = subscriberCount;

        setIsSubscribed(!isSubscribed);
        setSubscriberCount((prev) => (isSubscribed ? prev - 1 : prev + 1));
        setIsLoading(true);

        try {
            const endpoint = "/api/author/subscribe";
            const method = isSubscribed ? "DELETE" : "POST"; // 현재 상태의 반대(취소 or 구독)

            const res = await fetch(endpoint, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reporterId }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "요청 실패");
            }

            const data = await res.json();

            // 성공 메시지
            if (data.isSubscribed) {
                showSuccess("기자를 구독했습니다.\n새로운 소식을 알려드릴게요!");
            } else {
                showInfo("구독이 취소되었습니다.");
            }

        } catch (error: any) {
            // 롤백
            setIsSubscribed(previousState);
            setSubscriberCount(previousCount);
            showError(error.message || "오류가 발생했습니다.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={`
                flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all
                ${isSubscribed
                    ? "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
                }
            `}
        >
            {isLoading ? (
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
