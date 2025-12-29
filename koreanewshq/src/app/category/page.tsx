import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CATEGORY - KOREANEWS",
  description: "News categories: Politics, Economy, Society, Culture",
};

const categories = [
  {
    name: "POLITICS",
    href: "/category/politics",
    description: "Government policy, legislation, and political news",
    count: 245
  },
  {
    name: "ECONOMY",
    href: "/category/economy",
    description: "Economic policy, industry, and financial news",
    count: 189
  },
  {
    name: "SOCIETY",
    href: "/category/society",
    description: "Social issues, welfare, and community news",
    count: 312
  },
  {
    name: "CULTURE",
    href: "/category/culture",
    description: "Culture, arts, sports, and lifestyle news",
    count: 156
  },
];

export default function CategoryPage() {
  return (
    <div className="container-hq py-8">
      {/* Page Header */}
      <div className="hq-section-header mb-8">
        <h1 className="hq-section-title">CATEGORY</h1>
      </div>

      {/* Category Grid */}
      <section className="mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="border border-slate-200 p-8 hover:border-blue-800 transition-colors group"
            >
              <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-800">{cat.name}</h2>
              <p className="text-slate-600 mb-4">{cat.description}</p>
              <span className="text-sm text-slate-500">{cat.count} articles</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent by Category */}
      {categories.map((cat) => (
        <section key={cat.name} className="mb-10">
          <div className="hq-section-header">
            <h2 className="hq-section-title">{cat.name}</h2>
            <Link href={cat.href} className="hq-section-more">More +</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <article key={i} className="hq-news-card">
                <span className="hq-category-badge">{cat.name}</span>
                <h4 className="hq-news-title">
                  {cat.name} News {i}
                </h4>
                <div className="hq-news-meta">2025-12-29</div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
