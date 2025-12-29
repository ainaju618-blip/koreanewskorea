import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TOUR - KOREANEWS",
  description: "Nationwide tourist spots, festivals, food, and accommodation information from Korea Tourism Organization API",
};

export default function TourPage() {
  const regions = [
    "ALL", "SEOUL", "BUSAN", "DAEGU", "INCHEON", "GWANGJU", "DAEJEON", "ULSAN",
    "GYEONGGI", "GANGWON", "CHUNGBUK", "CHUNGNAM", "JEONBUK", "JEONNAM", "GYEONGBUK", "GYEONGNAM", "JEJU"
  ];

  const tourTypes = [
    { type: "spot", label: "SPOT", color: "" },
    { type: "festival", label: "FESTIVAL", color: "festival" },
    { type: "food", label: "FOOD", color: "food" },
    { type: "accommodation", label: "STAY", color: "accommodation" },
  ];

  return (
    <div className="container-hq py-8">
      {/* Page Header */}
      <div className="hq-section-header mb-8">
        <h1 className="hq-section-title tour">TOUR</h1>
      </div>

      {/* Region Filter */}
      <section className="mb-8">
        <div className="tour-filter flex-wrap">
          {regions.map((region) => (
            <button
              key={region}
              className={`tour-filter-btn ${region === "ALL" ? "active" : ""}`}
            >
              {region}
            </button>
          ))}
        </div>
      </section>

      {/* Tour Type Tabs */}
      <section className="mb-8">
        <div className="hq-tabs">
          {tourTypes.map((t) => (
            <button
              key={t.type}
              className={`hq-tab ${t.type === "spot" ? "active" : ""}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {/* Tour Spots Section */}
      <section className="tour-section mb-10">
        <div className="container-hq">
          <div className="hq-section-header">
            <h2 className="hq-section-title tour">SPOTS</h2>
          </div>
          <div className="tour-grid">
            {Array.from({ length: 8 }, (_, i) => (
              <article key={i} className="tour-card">
                <div className="tour-card-image bg-slate-100"></div>
                <div className="tour-card-content">
                  <span className="tour-badge">SPOT</span>
                  <h4 className="tour-title">Tourist Spot {i + 1}</h4>
                  <div className="tour-location">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Region Name
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Festivals Section */}
      <section className="mb-10">
        <div className="hq-section-header">
          <h2 className="hq-section-title tour">FESTIVAL</h2>
          <Link href="/tour/festival" className="hq-section-more">More +</Link>
        </div>
        <div className="tour-grid">
          {Array.from({ length: 4 }, (_, i) => (
            <article key={i} className="tour-card">
              <div className="tour-card-image bg-amber-50"></div>
              <div className="tour-card-content">
                <span className="tour-badge festival">FESTIVAL</span>
                <h4 className="tour-title">Festival Name {i + 1}</h4>
                <div className="tour-location">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Region Name
                </div>
                <div className="text-xs text-slate-500 mt-1">2025.01.01 ~ 2025.01.15</div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Food Section */}
      <section className="mb-10">
        <div className="hq-section-header">
          <h2 className="hq-section-title tour">FOOD</h2>
          <Link href="/tour/food" className="hq-section-more">More +</Link>
        </div>
        <div className="tour-grid">
          {Array.from({ length: 4 }, (_, i) => (
            <article key={i} className="tour-card">
              <div className="tour-card-image bg-red-50"></div>
              <div className="tour-card-content">
                <span className="tour-badge food">FOOD</span>
                <h4 className="tour-title">Restaurant Name {i + 1}</h4>
                <div className="tour-location">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Region Name
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Accommodation Section */}
      <section className="mb-10">
        <div className="hq-section-header">
          <h2 className="hq-section-title tour">STAY</h2>
          <Link href="/tour/accommodation" className="hq-section-more">More +</Link>
        </div>
        <div className="tour-grid">
          {Array.from({ length: 4 }, (_, i) => (
            <article key={i} className="tour-card">
              <div className="tour-card-image bg-purple-50"></div>
              <div className="tour-card-content">
                <span className="tour-badge accommodation">STAY</span>
                <h4 className="tour-title">Accommodation Name {i + 1}</h4>
                <div className="tour-location">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                  Region Name
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Tour API Credit */}
      <div className="kogl-credit">
        <span>Source: Korea Tourism Organization TourAPI (api.visitkorea.or.kr)</span>
      </div>
    </div>
  );
}
