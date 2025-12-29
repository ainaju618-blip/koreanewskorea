import Link from "next/link";

export default function Home() {
  return (
    <div className="container-hq py-8">
      {/* Breaking News Bar */}
      <div className="hq-breaking mb-6">
        <div className="container-hq">
          <span className="hq-breaking-label">NEWS</span>
          <span>Latest government news and policy announcements</span>
        </div>
      </div>

      {/* Main News Section */}
      <section className="mb-10">
        <div className="hq-section-header">
          <h2 className="hq-section-title">HEADLINE</h2>
          <Link href="/news" className="hq-section-more">More +</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Featured */}
          <div className="md:col-span-2">
            <article className="hq-news-card">
              <div className="hq-news-thumbnail aspect-video mb-4 bg-slate-100"></div>
              <span className="hq-category-badge">Politics</span>
              <h3 className="hq-news-title text-xl">
                Latest Government News Title
              </h3>
              <p className="hq-news-summary">
                Government news summary text. Korea NEWS provides the latest national news and policy briefings.
              </p>
              <div className="hq-news-meta">2025-12-29</div>
            </article>
          </div>

          {/* Side News */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <article key={i} className="hq-news-card">
                <span className="hq-category-badge">ECONOMY</span>
                <h4 className="hq-news-title">
                  News article title {i}
                </h4>
                <div className="hq-news-meta">2025-12-29</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Policy Section Preview */}
      <section className="policy-section mb-10">
        <div className="container-hq">
          <div className="hq-section-header">
            <h2 className="hq-section-title policy">POLICY (KTV/Korea.kr)</h2>
            <Link href="/policy" className="hq-section-more">More +</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KTV Video */}
            <div className="md:col-span-1">
              <div className="ktv-card">
                <div className="ktv-video-wrapper bg-slate-200">
                  {/* YouTube iframe placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="p-3">
                  <span className="ktv-badge">KTV</span>
                  <h4 className="hq-news-title mt-2">KTV Government Broadcast</h4>
                </div>
              </div>
            </div>

            {/* Policy News */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <article key={i} className="policy-card">
                  <span className="hq-category-badge policy">POLICY</span>
                  <h4 className="hq-news-title">Policy Article {i}</h4>
                  <div className="hq-news-meta">Ministry / Korea.kr</div>
                </article>
              ))}
            </div>
          </div>

          {/* KOGL Credit */}
          <div className="kogl-credit mt-4">
            <span>Source: Korea Policy Briefing (www.korea.kr)</span>
            <span className="ml-auto">KOGL Type 1</span>
          </div>
        </div>
      </section>

      {/* Tour Section Preview */}
      <section className="tour-section mb-10">
        <div className="container-hq">
          <div className="hq-section-header">
            <h2 className="hq-section-title tour">TOUR</h2>
            <Link href="/tour" className="hq-section-more">More +</Link>
          </div>

          {/* Tour Filter */}
          <div className="tour-filter">
            <button className="tour-filter-btn active">ALL</button>
            <button className="tour-filter-btn">SEOUL</button>
            <button className="tour-filter-btn">BUSAN</button>
            <button className="tour-filter-btn">JEJU</button>
            <button className="tour-filter-btn">GWANGJU</button>
            <button className="tour-filter-btn">JEONNAM</button>
          </div>

          {/* Tour Grid */}
          <div className="tour-grid">
            {[
              { title: "SAMPLE SPOT 1", type: "SPOT", location: "SEOUL" },
              { title: "SAMPLE FEST 1", type: "FEST", location: "BUSAN" },
              { title: "SAMPLE FOOD 1", type: "FOOD", location: "JEJU" },
              { title: "SAMPLE STAY 1", type: "STAY", location: "GWANGJU" },
            ].map((item, i) => (
              <article key={i} className="tour-card">
                <div className="tour-card-image bg-slate-100"></div>
                <div className="tour-card-content">
                  <span className={`tour-badge ${
                    item.type === "FEST" ? "festival" :
                    item.type === "FOOD" ? "food" :
                    item.type === "STAY" ? "accommodation" : ""
                  }`}>
                    {item.type === "SPOT" ? "SPOT" :
                     item.type === "FEST" ? "FESTIVAL" :
                     item.type === "FOOD" ? "FOOD" : "ACCOMMODATION"}
                  </span>
                  <h4 className="tour-title">{item.title}</h4>
                  <div className="tour-location">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    {item.location}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Tour API Credit */}
          <div className="kogl-credit mt-4">
            <span>Source: Korea Tourism Organization TourAPI</span>
          </div>
        </div>
      </section>

      {/* Category Section */}
      <section className="mb-10">
        <div className="hq-section-header">
          <h2 className="hq-section-title">CATEGORY</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "POLITICS", href: "/category/politics" },
            { name: "ECONOMY", href: "/category/economy" },
            { name: "SOCIETY", href: "/category/society" },
            { name: "CULTURE", href: "/category/culture" },
          ].map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="border border-slate-200 p-6 text-center hover:border-blue-800 hover:text-blue-800 transition-colors"
            >
              <span className="text-lg font-semibold">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
