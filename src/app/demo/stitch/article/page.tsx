'use client';
import { ArticleDetail } from '@/components/stitch-v2';

const sampleArticle = {
  id: 'demo-1',
  title: '전국 폭염 특보, 내일까지 계속될 전망',
  content: `기상청은 오늘 전국 대부분 지역에 폭염 특보를 발령했습니다.

낮 최고기온이 35도 이상 오르는 곳이 많겠으며, 체감온도는 이보다 더 높을 것으로 예상됩니다.

기상청 관계자는 "야외 활동을 자제하고, 충분한 수분 섭취를 권장한다"고 당부했습니다.

## 지역별 예상 최고기온

서울은 36도, 대구는 38도까지 오를 것으로 보입니다. 광주는 35도, 부산은 33도가 예상됩니다.

특히 노약자와 어린이는 한낮 외출을 삼가고, 에어컨이나 선풍기를 활용해 실내 온도를 적정하게 유지해야 합니다.`,
  category: '사회',
  tags: ['폭염', '기상청', '여름', '건강'],
  author: '김기자',
  publishedAt: '2026년 1월 7일 14:30',
  imageUrl: 'https://picsum.photos/800/400?random=1',
  imageCaption: '서울 도심의 폭염 속 시민들 모습',
  likeCount: 42,
  commentCount: 15,
};

const sampleRelatedArticles = [
  {
    id: 'related-1',
    title: '폭염 대비 전국 쉼터 1,000곳 확대 운영',
    category: '사회',
    imageUrl: 'https://picsum.photos/200/200?random=2',
    timeAgo: '2시간 전',
  },
  {
    id: 'related-2',
    title: '기상청 "이번 주말까지 폭염 지속 전망"',
    category: '날씨',
    imageUrl: 'https://picsum.photos/200/200?random=3',
    timeAgo: '4시간 전',
  },
];

const sampleComments = [
  {
    id: 'comment-1',
    authorName: '시민A',
    authorInitials: '시A',
    content: '정말 덥네요. 다들 건강 조심하세요!',
    timeAgo: '30분 전',
    likes: 12,
    replies: 3,
  },
];

export default function DemoPage() {
  return (
    <ArticleDetail
      article={sampleArticle}
      relatedArticles={sampleRelatedArticles}
      comments={sampleComments}
    />
  );
}
