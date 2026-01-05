"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, BarChart3, TrendingUp, Calendar, Filter, Loader2 } from "lucide-react";
import { PageHeader, Pagination } from "@/components/admin/shared";
import { supabaseAdmin } from "@/lib/supabase-admin";

interface GradeStats {
    grade: string;
    count: number;
    percentage: number;
}

interface TrendData {
    date: string;
    gradeA: number;
    gradeB: number;
    gradeC: number;
    gradeD: number;
    total: number;
}

interface Article {
    id: string;
    title: string;
    ai_grade: string;
    ai_rewritten: boolean;
    ai_rewritten_at: string;
    region: string;
    source: string;
    created_at: string;
    status: string;
}

export default function AIQualityDashboard() {
    const [loading, setLoading] = useState(true);
    const [gradeStats, setGradeStats] = useState<GradeStats[]>([]);
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);

    // Filters
    const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('week');
    const [regionFilter, setRegionFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 25;

    // Fetch grade distribution
    const fetchGradeStats = async () => {
        try {
            const { data, error } = await supabaseAdmin
                .from('posts')
                .select('ai_grade')
                .not('ai_grade', 'is', null);

            if (error) throw error;

            const gradeCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
            data.forEach(post => {
                if (post.ai_grade && gradeCounts.hasOwnProperty(post.ai_grade)) {
                    gradeCounts[post.ai_grade]++;
                }
            });

            const total = Object.values(gradeCounts).reduce((sum, count) => sum + count, 0);
            const stats: GradeStats[] = Object.entries(gradeCounts).map(([grade, count]) => ({
                grade,
                count,
                percentage: total > 0 ? (count / total) * 100 : 0
            }));

            setGradeStats(stats);
        } catch (err) {
            console.error('Failed to fetch grade stats:', err);
        }
    };

    // Fetch trend data
    const fetchTrendData = async () => {
        try {
            const days = dateRange === 'day' ? 7 : dateRange === 'week' ? 4 : 12;
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - (dateRange === 'day' ? days : days * 7));

            const { data, error } = await supabaseAdmin
                .from('posts')
                .select('ai_grade, ai_rewritten_at')
                .not('ai_grade', 'is', null)
                .gte('ai_rewritten_at', daysAgo.toISOString())
                .order('ai_rewritten_at', { ascending: true });

            if (error) throw error;

            // Group by date
            const grouped: Record<string, { A: number; B: number; C: number; D: number; total: number }> = {};

            data.forEach(post => {
                if (!post.ai_rewritten_at) return;

                const date = new Date(post.ai_rewritten_at);
                let key: string;

                if (dateRange === 'day') {
                    key = date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
                } else if (dateRange === 'week') {
                    const weekNum = Math.ceil(date.getDate() / 7);
                    key = `${date.getMonth() + 1}월 ${weekNum}주`;
                } else {
                    key = date.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit' });
                }

                if (!grouped[key]) {
                    grouped[key] = { A: 0, B: 0, C: 0, D: 0, total: 0 };
                }

                if (post.ai_grade && ['A', 'B', 'C', 'D'].includes(post.ai_grade)) {
                    grouped[key][post.ai_grade as 'A' | 'B' | 'C' | 'D']++;
                    grouped[key].total++;
                }
            });

            const trends: TrendData[] = Object.entries(grouped).map(([date, grades]) => ({
                date,
                gradeA: grades.A,
                gradeB: grades.B,
                gradeC: grades.C,
                gradeD: grades.D,
                total: grades.total
            }));

            setTrendData(trends);
        } catch (err) {
            console.error('Failed to fetch trend data:', err);
        }
    };

    // Fetch recent articles with AI grades
    const fetchArticles = async () => {
        try {
            let query = supabaseAdmin
                .from('posts')
                .select('id, title, ai_grade, ai_rewritten, ai_rewritten_at, region, source, created_at, status')
                .not('ai_grade', 'is', null)
                .order('ai_rewritten_at', { ascending: false });

            if (regionFilter !== 'all') {
                query = query.eq('region', regionFilter);
            }

            const { data, error } = await query;

            if (error) throw error;

            setArticles(data || []);
        } catch (err) {
            console.error('Failed to fetch articles:', err);
            setArticles([]);
        }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchGradeStats(),
                fetchTrendData(),
                fetchArticles()
            ]);
            setLoading(false);
        };
        loadData();
    }, [dateRange, regionFilter]);

    // Filter articles by search - memoized to prevent recalculation
    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const matchesSearch = searchQuery === '' ||
                article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                article.source.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
        });
    }, [articles, searchQuery]);

    // Pagination - memoized
    const totalPages = useMemo(() => Math.ceil(filteredArticles.length / ITEMS_PER_PAGE), [filteredArticles.length]);
    const paginatedArticles = useMemo(() => {
        return filteredArticles.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredArticles, currentPage]);

    // Grade color helper
    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'A': return 'text-green-400 bg-green-500/10';
            case 'B': return 'text-blue-400 bg-blue-500/10';
            case 'C': return 'text-yellow-400 bg-yellow-500/10';
            case 'D': return 'text-red-400 bg-red-500/10';
            default: return 'text-gray-400 bg-gray-500/10';
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('ko-KR', {
            timeZone: 'Asia/Seoul',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="AI Quality Dashboard"
                description="AI rewrite quality metrics and grade distribution analysis"
                icon={BarChart3}
                iconBgColor="bg-purple-500"
            />

            {/* Date Range Filter */}
            <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-[#8b949e]" />
                    <div className="flex gap-2">
                        {(['day', 'week', 'month'] as const).map(range => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                                    dateRange === range
                                        ? 'bg-[#1f6feb] text-white'
                                        : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d] hover:text-[#e6edf3]'
                                }`}
                            >
                                {range === 'day' ? 'Daily' : range === 'week' ? 'Weekly' : 'Monthly'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-[#8b949e]" />
                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-[#30363d] rounded-lg bg-[#0d1117] text-[#e6edf3] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
                    >
                        <option value="all">전체 지역</option>
                        <option value="korea">정부(korea.kr)</option>
                        <option value="seoul">서울</option>
                        <option value="busan">부산</option>
                        <option value="daegu">대구</option>
                        <option value="incheon">인천</option>
                        <option value="gwangju">광주</option>
                        <option value="daejeon">대전</option>
                        <option value="ulsan">울산</option>
                        <option value="sejong">세종</option>
                        <option value="gyeonggi">경기</option>
                        <option value="gangwon">강원</option>
                        <option value="chungbuk">충북</option>
                        <option value="chungnam">충남</option>
                        <option value="jeonbuk">전북</option>
                        <option value="jeonnam">전남</option>
                        <option value="gyeongbuk">경북</option>
                        <option value="gyeongnam">경남</option>
                        <option value="jeju">제주</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 bg-[#161b22] rounded-xl border border-[#30363d]">
                    <Loader2 className="w-8 h-8 animate-spin text-[#6e7681]" />
                </div>
            ) : (
                <>
                    {/* Grade Distribution */}
                    <div className="grid grid-cols-4 gap-4">
                        {gradeStats.map(stat => (
                            <div key={stat.grade} className="bg-[#161b22] p-6 rounded-xl border border-[#30363d]">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-2xl font-bold px-3 py-1 rounded-lg ${getGradeColor(stat.grade)}`}>
                                        {stat.grade}
                                    </span>
                                    <span className="text-2xl font-bold text-[#e6edf3]">{stat.count}</span>
                                </div>
                                <div className="w-full bg-[#21262d] rounded-full h-2 mb-2">
                                    <div
                                        className={`h-2 rounded-full ${
                                            stat.grade === 'A' ? 'bg-green-500' :
                                            stat.grade === 'B' ? 'bg-blue-500' :
                                            stat.grade === 'C' ? 'bg-yellow-500' :
                                            'bg-red-500'
                                        }`}
                                        style={{ width: `${stat.percentage}%` }}
                                    />
                                </div>
                                <p className="text-xs text-[#8b949e]">{stat.percentage.toFixed(1)}% of total</p>
                            </div>
                        ))}
                    </div>

                    {/* Trend Chart */}
                    <div className="bg-[#161b22] p-6 rounded-xl border border-[#30363d]">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="w-5 h-5 text-[#8b949e]" />
                            <h3 className="font-semibold text-[#e6edf3]">Quality Trend</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#21262d] border-b border-[#30363d]">
                                        <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">Period</th>
                                        <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase text-center">Grade A</th>
                                        <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase text-center">Grade B</th>
                                        <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase text-center">Grade C</th>
                                        <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase text-center">Grade D</th>
                                        <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase text-center">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#21262d]">
                                    {trendData.map((trend, idx) => (
                                        <tr key={idx} className="hover:bg-[#21262d] transition">
                                            <td className="py-2 px-3 text-sm text-[#e6edf3] font-medium">{trend.date}</td>
                                            <td className="py-2 px-3 text-sm text-center text-green-400">{trend.gradeA}</td>
                                            <td className="py-2 px-3 text-sm text-center text-blue-400">{trend.gradeB}</td>
                                            <td className="py-2 px-3 text-sm text-center text-yellow-400">{trend.gradeC}</td>
                                            <td className="py-2 px-3 text-sm text-center text-red-400">{trend.gradeD}</td>
                                            <td className="py-2 px-3 text-sm text-center text-[#e6edf3] font-semibold">{trend.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="bg-[#161b22] p-4 rounded-xl border border-[#30363d] flex items-center justify-between">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6e7681] w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search articles..."
                                className="w-full pl-10 pr-4 py-2 border border-[#30363d] rounded-lg text-sm bg-[#0d1117] text-[#e6edf3] placeholder-[#6e7681] focus:ring-2 focus:ring-[#1f6feb] focus:border-[#1f6feb] outline-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-[#8b949e]">
                            Total {filteredArticles.length} articles
                        </div>
                    </div>

                    {/* Articles Table */}
                    <div className="bg-[#161b22] rounded-xl border border-[#30363d] overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#21262d] border-b border-[#30363d]">
                                    <th className="py-2 px-3 w-10 text-center text-xs font-semibold text-[#8b949e]">No.</th>
                                    <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase">Title</th>
                                    <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase w-20 text-center">Grade</th>
                                    <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase w-32">Source</th>
                                    <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase w-32">Region</th>
                                    <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase w-40">Processed At</th>
                                    <th className="py-2 px-3 text-xs font-semibold text-[#8b949e] uppercase w-24 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#21262d]">
                                {paginatedArticles.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-[#8b949e]">
                                            No articles found
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedArticles.map((article, index) => (
                                        <tr key={article.id} className="hover:bg-[#21262d] transition">
                                            <td className="py-3 px-3 text-center text-xs text-[#8b949e]">
                                                {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                            </td>
                                            <td className="py-3 px-3">
                                                <p className="text-sm font-medium text-[#e6edf3] line-clamp-1">
                                                    {article.title}
                                                </p>
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${getGradeColor(article.ai_grade)}`}>
                                                    {article.ai_grade}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-xs text-[#8b949e]">
                                                {article.source || '-'}
                                            </td>
                                            <td className="py-3 px-3 text-xs text-[#8b949e]">
                                                {article.region || '-'}
                                            </td>
                                            <td className="py-3 px-3 text-xs text-[#8b949e]">
                                                {formatDate(article.ai_rewritten_at)}
                                            </td>
                                            <td className="py-3 px-3 text-center">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                    article.status === 'published'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : article.status === 'draft'
                                                        ? 'bg-gray-500/10 text-gray-400'
                                                        : 'bg-yellow-500/10 text-yellow-400'
                                                }`}>
                                                    {article.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </>
            )}
        </div>
    );
}
