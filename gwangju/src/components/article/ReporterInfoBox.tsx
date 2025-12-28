"use client";

import Link from "next/link";
import { MapPin, Briefcase, ExternalLink } from "lucide-react";
import { getSpecialtyTitle } from "@/lib/reporter-utils";

interface ReporterInfoBoxProps {
    reporter: {
        id: string;
        name: string;
        position: string;
        region?: string;
        specialty?: string | null;
        department?: string | null;
        bio?: string | null;
        profile_image?: string | null;
        avatar_icon?: string | null;
        career_years?: number | null;
        slug?: string | null;
    };
}

/**
 * Reporter Info Box (Article Footer)
 *
 * Displays reporter information at the bottom of articles
 * for SEO/E-E-A-T optimization and reader engagement.
 *
 * Features:
 * - Profile photo or avatar
 * - Name with specialty title
 * - Region and career info
 * - Bio quote
 * - Link to full profile
 */
export default function ReporterInfoBox({ reporter }: ReporterInfoBoxProps) {
    const title = getSpecialtyTitle(reporter);
    const profileUrl = `/author/${reporter.slug || reporter.id}`;

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200 mt-12 shadow-sm">
            {/* Header */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-4 uppercase tracking-wide font-medium">
                <span className="w-8 h-px bg-gray-300"></span>
                <span>Article By</span>
                <span className="w-8 h-px bg-gray-300"></span>
            </div>

            <div className="flex items-start gap-5">
                {/* Profile Image */}
                <Link href={profileUrl} className="flex-shrink-0 group">
                    {reporter.profile_image ? (
                        <img
                            src={reporter.profile_image}
                            alt={`${reporter.name} ${title}`}
                            className="w-20 h-20 rounded-xl object-cover shadow-md group-hover:shadow-lg transition-shadow ring-2 ring-white"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-3xl shadow-md group-hover:shadow-lg transition-shadow ring-2 ring-white">
                            {reporter.avatar_icon || "👤"}
                        </div>
                    )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <Link
                        href={profileUrl}
                        className="group inline-flex items-center gap-2"
                    >
                        <h4 className="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                            {reporter.name}
                        </h4>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded border border-blue-100">
                            {title}
                        </span>
                    </Link>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm text-gray-500">
                        {reporter.region && reporter.region !== '전체' && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" />
                                {reporter.region} 담당
                            </span>
                        )}
                        {reporter.career_years && reporter.career_years > 0 && (
                            <span className="flex items-center gap-1">
                                <Briefcase className="w-3.5 h-3.5" />
                                경력 {reporter.career_years}년
                            </span>
                        )}
                    </div>

                    {/* Bio */}
                    {reporter.bio && (
                        <blockquote className="mt-3 text-gray-600 italic text-[15px] leading-relaxed line-clamp-2">
                            "{reporter.bio}"
                        </blockquote>
                    )}

                    {/* Actions */}
                    <div className="mt-4">
                        <Link
                            href={profileUrl}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            기자 프로필 보기
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
