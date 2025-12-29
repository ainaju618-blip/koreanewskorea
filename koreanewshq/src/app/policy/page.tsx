import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "POLICY - KOREANEWS",
  description: "KTV government broadcasts, policy briefings, and ministry press releases",
};

export default function PolicyPage() {
  return (
    <div className="container-hq py-8">
      {/* Page Header */}
      <div className="hq-section-header mb-8">
        <h1 className="hq-section-title policy">POLICY</h1>
      </div>

      {/* KTV Section */}
      <section className="mb-10">
        <div className="hq-section-header">
          <h2 className="hq-section-title policy">KTV</h2>
          <Link href="/policy/ktv" className="hq-section-more">More +</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ktv-card">
              <div className="ktv-video-wrapper bg-slate-200">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              <div className="p-3">
                <span className="ktv-badge">KTV</span>
                <h4 className="hq-news-title mt-2">KTV Broadcast Title {i}</h4>
                <div className="hq-news-meta">2025-12-29</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Policy Briefing Section */}
      <section className="policy-section mb-10">
        <div className="container-hq">
          <div className="hq-section-header">
            <h2 className="hq-section-title policy">KOREA.KR</h2>
            <Link href="/policy/briefing" className="hq-section-more">More +</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <article key={i} className="policy-card">
                <span className="hq-category-badge policy">POLICY</span>
                <h4 className="hq-news-title">Policy Briefing Article {i}</h4>
                <p className="hq-news-summary">
                  Policy briefing summary content
                </p>
                <div className="hq-news-meta">Korea.kr / 2025-12-29</div>
              </article>
            ))}
          </div>

          {/* KOGL Credit */}
          <div className="kogl-credit mt-4">
            <span>Source: Korea Policy Briefing (www.korea.kr)</span>
            <span className="ml-auto">KOGL Type 1</span>
          </div>
        </div>
      </section>

      {/* Ministry Press Releases */}
      <section className="mb-10">
        <div className="hq-section-header">
          <h2 className="hq-section-title policy">MINISTRY</h2>
        </div>
        <div className="space-y-4">
          {[
            { ministry: "Ministry of Economy and Finance", title: "Economic Policy Announcement" },
            { ministry: "Ministry of Health and Welfare", title: "Healthcare Policy Update" },
            { ministry: "Ministry of Education", title: "Education Policy Changes" },
            { ministry: "Ministry of Environment", title: "Environmental Protection Measures" },
          ].map((item, i) => (
            <article key={i} className="hq-news-card flex gap-4 items-start">
              <span className="hq-category-badge policy flex-shrink-0">{item.ministry}</span>
              <div className="flex-1">
                <h4 className="hq-news-title">{item.title}</h4>
                <div className="hq-news-meta">2025-12-29</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
