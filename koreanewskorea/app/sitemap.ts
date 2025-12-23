/**
 * Sitemap Generation for 24 Regional Subdomains
 * Next.js App Router sitemap convention
 */
import { MetadataRoute } from "next";
import { getAllRegions } from "@/common/lib/regions";

export default function sitemap(): MetadataRoute.Sitemap {
    const regions = getAllRegions();
    const baseUrl = "https://koreanewskorea.com";

    // Generate sitemap entries for each region
    const regionPages = regions.map((region) => ({
        url: `https://${region.code}.koreanewskorea.com`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: region.tier === 1 ? 1.0 : region.tier === 2 ? 0.8 : 0.6,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1.0,
        },
        ...regionPages,
    ];
}
