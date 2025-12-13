import NewsGrid from '@/components/NewsGrid';
import Sidebar from '@/components/Sidebar';
import HomeHero from '@/components/home/HomeHero';

/**
 * Korea NEWS Homepage
 * ===================
 * Layout: 1400px Container (WebFrame Spec)
 * Style: Kangwon Ilbo Clone
 */

export default function Home() {
  return (
    <main className="min-h-screen bg-white font-sans">
      {/* Container - Centered 1400px (WebFrame Spec) */}
      <div className="w-full max-w-[1400px] mx-auto px-4 py-8">

        {/* ===== ZONE 1: HERO SECTION (870px Main Visual) ===== */}
        <HomeHero />

        {/* ===== ZONE 2: SECTION GRIDS (Kangwon Ilbo Style) ===== */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN: Main Content (72%) */}
          <div className="w-full lg:w-[72%] space-y-0">

            {/* 광주 Gwangju */}
            <NewsGrid
              categoryName="광주"
              categoryNameEn="Gwangju"
              categorySlug="gwangju"
              limit={4}
            />

            {/* 전남 Jeonnam */}
            <NewsGrid
              categoryName="전남"
              categoryNameEn="Jeonnam"
              categorySlug="jeonnam"
              limit={4}
            />

            {/* 나주 Naju */}
            <NewsGrid
              categoryName="나주"
              categoryNameEn="Naju"
              categorySlug="jeonnam/naju"
              regionCode="naju"
              limit={4}
            />

            {/* 광주/전남 지역 네트워크 (Special Section) */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 my-8">
              <div className="border-t-4 border-[#A6121D] pt-3 mb-5">
                <h3 className="text-xl font-serif font-black text-slate-900 flex items-baseline gap-2">
                  지역 네트워크
                  <span className="text-sm text-slate-400 font-sans font-medium">Region</span>
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NewsGrid
                  categoryName="광주"
                  categoryNameEn="Gwangju"
                  categorySlug="gwangju"
                  limit={3}
                />
                <NewsGrid
                  categoryName="전남"
                  categoryNameEn="Jeonnam"
                  categorySlug="jeonnam"
                  limit={3}
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Sidebar (28%) */}
          <div className="w-full lg:w-[28%]">
            <div className="sticky top-[120px]">
              <Sidebar />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
