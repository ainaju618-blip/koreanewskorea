"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Filter,
  ChevronDown,
  Calendar,
  ArrowRight,
  FileText,
  Search,
  Loader2,
  Inbox,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface PressRelease {
  id: string;
  title: string;
  source: string;
  content_preview: string;
  region: string;
  received_at: string;
  is_read: boolean;
  status: "new" | "viewed" | "converted";
  original_link?: string;
  converted_article_id?: string;
}

// Mock data - replace with real API call
const MOCK_PRESS_RELEASES: PressRelease[] = [
  {
    id: "1",
    title: "[신규] 나주시, 2025년 예산안 발표",
    source: "나주시청 기획예산실",
    content_preview:
      "나주시는 2025년도 예산안을 1조 2천억원 규모로 편성하여 시의회에 제출했다. 이는 전년 대비 5.2% 증가한 규모로, 지역 경제 활성화와 주민 복지 증진에 중점을 두고 있다.",
    region: "나주시",
    received_at: new Date(Date.now() - 2 * 60 * 60000).toISOString(),
    is_read: false,
    status: "new",
  },
  {
    id: "2",
    title: "광주광역시, 대중교통 혁신 방안 브리핑",
    source: "광주시 대변인실",
    content_preview:
      "광주광역시는 시민들의 이동 편의성을 높이기 위해 지하철 2호선 공사 가속화 및 버스 노선 전면 개편안을 발표했다. 2026년까지 단계적으로 시행할 예정이다.",
    region: "광주광역시",
    received_at: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
    is_read: true,
    status: "viewed",
  },
  {
    id: "3",
    title: "전남도, AI 첨단 농업 단지 조성 계획",
    source: "전남도청 농업정책과",
    content_preview:
      "전라남도는 스마트팜 기술을 활용한 100만평 규모의 AI 첨단 농업 단지를 해남군 일대에 조성할 계획이라고 밝혔다. 총 사업비 3,000억원이 투입될 예정이다.",
    region: "전라남도",
    received_at: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
    is_read: true,
    status: "converted",
    converted_article_id: "article-123",
  },
  {
    id: "4",
    title: "목포시, 해양문화관광 활성화 계획 발표",
    source: "목포시 관광과",
    content_preview:
      "목포시가 2025년 해양문화관광 활성화를 위한 종합 계획을 발표했다. 구도심 재생사업과 연계한 관광 코스 개발이 핵심이다.",
    region: "목포시",
    received_at: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(),
    is_read: true,
    status: "viewed",
  },
  {
    id: "5",
    title: "[긴급] 순천시, 재난 안전 대책 회의 결과",
    source: "순천시 안전정책과",
    content_preview:
      "순천시는 최근 기상 이변에 대응하기 위한 긴급 재난 안전 대책 회의를 개최하고, 취약 지역 점검 및 대피소 운영 계획을 확정했다.",
    region: "순천시",
    received_at: new Date(Date.now() - 4 * 60 * 60000).toISOString(),
    is_read: false,
    status: "new",
  },
];

const REGION_OPTIONS = [
  { value: "all", label: "전체 지역" },
  { value: "gwangju", label: "광주광역시" },
  { value: "jeonnam", label: "전라남도" },
  { value: "naju", label: "나주시" },
  { value: "mokpo", label: "목포시" },
  { value: "yeosu", label: "여수시" },
  { value: "suncheon", label: "순천시" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "최신순" },
  { value: "oldest", label: "오래된순" },
  { value: "unread", label: "안읽은것 먼저" },
];

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function PressReleaseInboxPage() {
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Simulate API call
    const fetchReleases = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setReleases(MOCK_PRESS_RELEASES);
      setIsLoading(false);
    };
    fetchReleases();
  }, []);

  const handleMarkAsRead = (id: string) => {
    setReleases((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, is_read: true, status: r.status === "new" ? "viewed" : r.status } : r
      )
    );
  };

  // Filter and sort
  const filteredReleases = releases
    .filter((r) => {
      if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (selectedRegion !== "all" && !r.region.includes(selectedRegion)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "latest") {
        return new Date(b.received_at).getTime() - new Date(a.received_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.received_at).getTime() - new Date(b.received_at).getTime();
      }
      if (sortBy === "unread") {
        return (a.is_read ? 1 : 0) - (b.is_read ? 1 : 0);
      }
      return 0;
    });

  const unreadCount = releases.filter((r) => !r.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          <p className="text-slate-500 text-sm">보도자료를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">보도자료 수신함</h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-sm font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-slate-500 mt-1">
            담당 지역의 새 소식을 확인하고 기사로 작성하세요.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="보도자료 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium"
          >
            <Filter className="w-4 h-4" />
            필터
          </button>

          {/* Filters (Desktop always visible, Mobile toggle) */}
          <div className={`flex gap-3 ${showFilters ? "flex" : "hidden sm:flex"}`}>
            {/* Region Filter */}
            <div className="relative">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {REGION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Press Release List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* List Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <div className="col-span-7">제목 / 내용</div>
          <div className="col-span-2">출처</div>
          <div className="col-span-3 text-right">작업</div>
        </div>

        {/* Empty State */}
        {filteredReleases.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">보도자료가 없습니다</p>
            <p className="text-slate-400 text-sm mt-1">
              새 보도자료가 도착하면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredReleases.map((item) => (
              <div
                key={item.id}
                onClick={() => handleMarkAsRead(item.id)}
                className={`grid grid-cols-1 sm:grid-cols-12 gap-4 p-4 sm:p-6 hover:bg-slate-50 transition-colors cursor-pointer ${
                  !item.is_read ? "bg-blue-50/40" : ""
                }`}
              >
                {/* Content Section */}
                <div className="sm:col-span-7 flex gap-4">
                  {/* Unread Indicator */}
                  <div className="pt-1.5 flex-shrink-0">
                    {item.status === "new" ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    ) : item.status === "converted" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Status Badge & Time */}
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          item.status === "new"
                            ? "bg-blue-100 text-blue-700"
                            : item.status === "converted"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status === "new"
                          ? "NEW"
                          : item.status === "converted"
                          ? "작성 완료"
                          : "읽음"}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatRelativeTime(item.received_at)}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded sm:hidden">
                        {item.source}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-base mb-1.5 ${
                        !item.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700"
                      }`}
                    >
                      {item.title}
                    </h3>

                    {/* Preview */}
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                      {item.content_preview}
                    </p>
                  </div>
                </div>

                {/* Source Section (Desktop) */}
                <div className="hidden sm:flex sm:col-span-2 items-center">
                  <span className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg truncate">
                    {item.source}
                  </span>
                </div>

                {/* Action Section */}
                <div className="sm:col-span-3 flex items-center justify-end gap-2">
                  {item.status === "converted" ? (
                    <Link
                      href={`/reporter/edit/${item.converted_article_id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>기사 보기</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/reporter/write?press_release_id=${item.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors group"
                    >
                      <span>기사 작성</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}
                  {item.original_link && (
                    <a
                      href={item.original_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Open original"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {filteredReleases.length > 0 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
            <button className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors">
              더 불러오기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
