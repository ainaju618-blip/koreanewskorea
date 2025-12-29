import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEWS - KOREANEWS",
  description: "Government press releases and official announcements from Korea",
};

export default function NewsPage() {
  return (
    <div className="container-hq py-8">
      {/* Page Header */}
      <div className="hq-section-header mb-8">
        <h1 className="hq-section-title">NEWS</h1>
      </div>

      {/* Category Tabs */}
      <section className="mb-8">
        <div className="hq-tabs">
          <button className="hq-tab active">ALL</button>
          <button className="hq-tab">POLITICS</button>
          <button className="hq-tab">ECONOMY</button>
          <button className="hq-tab">SOCIETY</button>
          <button className="hq-tab">CULTURE</button>
        </div>
      </section>

      {/* News List */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured */}
          <div className="md:col-span-2">
            <article className="hq-news-card">
              <div className="hq-news-thumbnail aspect-video mb-4 bg-slate-100"></div>
              <span className="hq-category-badge">POLITICS</span>
              <h2 className="hq-news-title text-xl">
                Featured News Title
              </h2>
              <p className="hq-news-summary">
                Featured news summary content. Government official announcements and press releases.
              </p>
              <div className="hq-news-meta">2025-12-29 | Ministry Name</div>
            </article>
          </div>

          {/* Side News */}
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <article key={i} className="hq-news-card">
                <span className="hq-category-badge">CATEGORY</span>
                <h4 className="hq-news-title">
                  News Article Title {i}
                </h4>
                <div className="hq-news-meta">2025-12-29</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* News Grid */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }, (_, i) => (
            <article key={i} className="hq-news-card">
              <div className="hq-news-thumbnail aspect-video mb-3 bg-slate-100"></div>
              <span className="hq-category-badge">CATEGORY</span>
              <h4 className="hq-news-title">
                News Article Title {i + 1}
              </h4>
              <p className="hq-news-summary">
                News summary text
              </p>
              <div className="hq-news-meta">2025-12-29</div>
            </article>
          ))}
        </div>
      </section>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-10">
        <button className="px-4 py-2 border border-slate-300 text-slate-600">Prev</button>
        <button className="px-4 py-2 bg-blue-800 text-white">1</button>
        <button className="px-4 py-2 border border-slate-300 text-slate-600">2</button>
        <button className="px-4 py-2 border border-slate-300 text-slate-600">3</button>
        <button className="px-4 py-2 border border-slate-300 text-slate-600">Next</button>
      </div>
    </div>
  );
}
