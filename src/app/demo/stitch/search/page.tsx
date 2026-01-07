'use client';
import { SearchResults } from '@/components/stitch-v2';

export default function DemoPage() {
  return <SearchResults searchQuery="전국 뉴스" resultCount={42} />;
}
