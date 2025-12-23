# Regional Configuration Files

> **Purpose:** Each file defines settings for one regional subdomain
> **Usage:** Developers and AI agents read these before working on specific regions

---

## File Structure

Each region file contains:
- Basic info (code, names, tier)
- Content sources (scraper mappings)
- Nearby regions for content filling
- Special configurations

---

## Region List (24 Total)

| Code | File | Tier | Subdomain |
|------|------|------|-----------|
| gwangju | [gwangju.md](gwangju.md) | 1 | gwangju.koreanewskorea.com |
| jeonnam | [jeonnam.md](jeonnam.md) | 1 | jeonnam.koreanewskorea.com |
| mokpo | [mokpo.md](mokpo.md) | 2 | mokpo.koreanewskorea.com |
| yeosu | [yeosu.md](yeosu.md) | 2 | yeosu.koreanewskorea.com |
| suncheon | [suncheon.md](suncheon.md) | 2 | suncheon.koreanewskorea.com |
| naju | [naju.md](naju.md) | 2 | naju.koreanewskorea.com |
| gwangyang | [gwangyang.md](gwangyang.md) | 2 | gwangyang.koreanewskorea.com |
| damyang | [damyang.md](damyang.md) | 3 | damyang.koreanewskorea.com |
| gokseong | [gokseong.md](gokseong.md) | 3 | gokseong.koreanewskorea.com |
| gurye | [gurye.md](gurye.md) | 3 | gurye.koreanewskorea.com |
| goheung | [goheung.md](goheung.md) | 3 | goheung.koreanewskorea.com |
| boseong | [boseong.md](boseong.md) | 3 | boseong.koreanewskorea.com |
| hwasun | [hwasun.md](hwasun.md) | 3 | hwasun.koreanewskorea.com |
| jangheung | [jangheung.md](jangheung.md) | 3 | jangheung.koreanewskorea.com |
| gangjin | [gangjin.md](gangjin.md) | 3 | gangjin.koreanewskorea.com |
| haenam | [haenam.md](haenam.md) | 3 | haenam.koreanewskorea.com |
| yeongam | [yeongam.md](yeongam.md) | 3 | yeongam.koreanewskorea.com |
| muan | [muan.md](muan.md) | 3 | muan.koreanewskorea.com |
| hampyeong | [hampyeong.md](hampyeong.md) | 3 | hampyeong.koreanewskorea.com |
| yeonggwang | [yeonggwang.md](yeonggwang.md) | 3 | yeonggwang.koreanewskorea.com |
| jangseong | [jangseong.md](jangseong.md) | 3 | jangseong.koreanewskorea.com |
| wando | [wando.md](wando.md) | 3 | wando.koreanewskorea.com |
| jindo | [jindo.md](jindo.md) | 3 | jindo.koreanewskorea.com |
| shinan | [shinan.md](shinan.md) | 3 | shinan.koreanewskorea.com |

---

## How to Add New Region

1. Copy template from existing tier file
2. Update all fields
3. Add to this README table
4. Update region_config in database

---

*Parent document: [regional-homepage-spec.md](../regional-homepage-spec.md)*
