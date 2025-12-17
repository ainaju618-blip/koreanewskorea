# Homepage SideArticles "Preparing..." Issue

> **Category:** Frontend / Data Fetching
> **First Occurred:** 2025-12-17
> **Resolved By:** Claude
> **Severity:** Medium (UI shows placeholder)

---

## Symptoms

- Homepage right sidebar shows "Preparing..." placeholder
- Side articles not loading
- Slider works fine, only side articles affected
- No console errors

---

## Cause

### Supabase Query Filtering Issue

Original query used `.not('id', 'in', sliderIds)` to exclude slider articles:

```typescript
// Problematic code
const { data: sideData } = await supabase
    .from('posts')
    .select('...')
    .eq('status', 'published')
    .not('id', 'in', `(${sliderIds.join(',')})`)  // Unreliable
    .limit(2);
```

**Problems:**
1. Supabase `not in` syntax is inconsistent
2. Empty sliderIds array causes query failure
3. Query returns 0 results even when posts exist

---

## Solution

### Client-Side Filtering Approach

Fetch more articles than needed, then filter in JavaScript:

```typescript
// Fetch recent articles (no exclusion in query)
const { data: sideData } = await supabase
    .from('posts')
    .select('id, title, content, summary, thumbnail_url, category, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(20);  // Fetch extra

// Filter out slider articles in JavaScript
const filteredSideData = (sideData || [])
    .filter(article => !sliderIds.includes(article.id))
    .slice(0, 2);  // Take first 2
```

### Why This Works

1. Simple query without complex filtering
2. Reliable results
3. JavaScript filtering is predictable
4. Extra limit ensures enough articles after filtering

---

## Prevention Rules

### Supabase Query Best Practices

1. **Avoid complex NOT IN queries**
   - Use client-side filtering instead
   - Simpler queries are more reliable

2. **Always fetch extra when filtering**
   - If you need 2 articles, fetch 10-20
   - Filter down after fetching

3. **Handle empty arrays**
   - Check array length before using in queries
   - Provide fallback for empty results

---

## Affected Files

- `src/components/home/HomeHero.tsx`
  - `getHeroData()` function
  - sideArticles query section

---

## Testing

After fix, verify:
1. Homepage loads without "Preparing..."
2. Side articles display correctly
3. Side articles are different from slider articles

---

*Last Updated: 2025-12-17*
