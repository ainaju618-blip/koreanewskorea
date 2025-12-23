/**
 * Regional Homepage - Root Layout with Dynamic SEO
 */
import type { Metadata } from "next";
import { headers } from "next/headers";
import "@/common/styles/globals.css";
import { getRegionConfig, getDefaultRegion } from "@/common/lib/regions";

export async function generateMetadata(): Promise<Metadata> {
    const headersList = await headers();
    const regionCode = headersList.get("x-region") || "gwangju";
    const region = getRegionConfig(regionCode) || getDefaultRegion();

    const title = `코리아뉴스 ${region.nameKo}`;
    const description = `${region.nameKo} 지역 최신 뉴스 - 전남/광주 지역 뉴스 포털 코리아NEWS`;

    return {
        title: {
            template: `%s | ${title}`,
            default: title,
        },
        description,
        keywords: [region.nameKo, region.nameEn, "지역뉴스", "전남", "광주", "코리아뉴스"],
        openGraph: {
            title,
            description,
            type: "website",
            locale: "ko_KR",
            siteName: "코리아NEWS",
            url: `https://${regionCode}.koreanewskorea.com`,
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
        },
        robots: {
            index: true,
            follow: true,
        },
        alternates: {
            canonical: `https://${regionCode}.koreanewskorea.com`,
        },
    };
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <head>
                <link
                    rel="stylesheet"
                    as="style"
                    crossOrigin="anonymous"
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
