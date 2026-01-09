# Stitch 프롬프트 - 데스크탑 버전

> 작성일: 2026-01-07
> 프로젝트: 코리아뉴스 전국판 (koreanewskorea.com)
> 용도: Google Stitch AI 디자인 요청용 프롬프트 (데스크탑/와이드스크린)

---

## 공통 디자인 시스템 (Desktop)

모든 프롬프트에 적용되는 공통 스타일:

```
Design System:
- Max width: 1280px (container), full-width header/footer
- Layout: Main content (72%) + Sidebar (28%)
- Primary color: #3c83f6 (blue)
- Font: Public Sans for headings, Noto Sans KR for body
- Icons: Material Symbols Outlined
- Background: #f8f9fa (light gray)
- Card style: white bg, rounded-xl, subtle shadow
- Dark mode support: #101722 background, #1e293b surface
```

---

## 📺 프롬프트 1: 전국판 메인 홈페이지 (Desktop)

```
Design a desktop Korean news portal homepage for wide screens (1280px).

Layout (top to bottom):
1. TOP UTILITY BAR (28px height):
   - Left: date "2026년 1월 7일 화요일", weather icon "서울 -3°C"
   - Right: login, register, mypage links

2. HEADER (55px height):
   - Left: Logo "KOREA NEWS 코리아뉴스" with Korean flag icon
   - Center: Search bar with icon (min-width 400px)
   - Right: notification bell, user avatar

3. GNB NAVIGATION (55px height):
   - Horizontal menu: 정치·경제 | 사회·복지 | 교육·문화 | AI·과학 | 지역 | 오피니언
   - Active tab: blue underline
   - Hover effect: blue text

4. BREAKING NEWS TICKER (40px):
   - Red "속보" badge
   - Scrolling news text
   - Full width

5. REGION CHIP BAR (44px):
   - Horizontal scrollable chips: 전국, 서울, 경기, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주
   - Selected chip: blue bg, white text
   - Others: gray bg, dark text

6. HERO SECTION (8:4 ratio, ~400px height):
   - Main area (8 columns): Large featured news image with gradient overlay
     - Category badge "정치"
     - Large headline (28px bold)
     - Summary text (16px)
     - Source and time "청와대 · 30분 전"
   - Side area (4 columns): 4 news items vertical list
     - Each: small thumbnail + title (2 lines max)

7. MAIN + SIDEBAR LAYOUT:
   LEFT MAIN (72%):
   - Category tabs: 정치·경제 | 사회·복지 | AI·과학 | 지역
   - News grid (3 columns): 6 news cards
     - Each card: image, category badge, title, summary, source, time
   - "더보기" button
   - NATIVE AD SLOT #1 (labeled "광고")
   - More news grid (3 columns): 6 cards
   - NATIVE AD SLOT #2
   - Travel section "🏖️ 여행 추천"
     - Horizontal scroll cards with destination images

   RIGHT SIDEBAR (28%, sticky):
   - Mini Korea map widget (200px height)
     - Clickable regions
     - Hover tooltips
   - "🔥 인기 뉴스" section
     - Numbered list 1-10
     - Title only, no images
   - Weather widget
     - Current temp, icon
     - 3-day forecast
   - STICKY AD SLOT (remains visible on scroll)

8. FOOTER:
   - Wide brand banner
   - 4-column links: 회사소개, 이용약관, 개인정보처리방침, 광고문의
   - Copyright text
   - Social media icons

Style:
- Clean, professional newspaper aesthetic
- Generous whitespace
- Clear visual hierarchy
- Smooth hover transitions
- Korean text throughout
```

---

## 📺 프롬프트 2: 광역시도 홈페이지 (Desktop)

```
Design a desktop metropolitan/province news homepage (1280px).
Example: Gwangju Metropolitan City (광주광역시)

Layout:
1. HEADER:
   - Logo: "KOREA NEWS 광주판" with Gwangju accent color (#00A651 green)
   - Subtitle: "Gwangju Edition"
   - Search, notifications, user menu

2. GNB: Same as national, but with regional categories
   - 종합 | 정치 | 경제 | 사회 | 문화 | 구·군

3. HERO (8:4 ratio):
   - Main: Top regional news with large image
   - Side: 4 sub-news from the region
   - Badge: "광주시청" or "광주시의회" source labels

4. DISTRICT QUICK ACCESS (distinctive section):
   - Title: "📍 광주광역시 5개 구"
   - Grid of district cards (5 items):
     - 동구, 서구, 남구, 북구, 광산구
     - Each card: district name, news count badge "12건"
     - Hover: slight lift effect

5. MAIN + SIDEBAR:
   LEFT (72%):
   - News by source tabs: 시청 | 시의회 | 경제 | 문화 | 사회
   - News grid (3 columns)
   - Ad slots between sections

   RIGHT SIDEBAR (28%):
   - Regional stats widget:
     - 인구: 145만명
     - 날씨: 🌤 12°C
     - 미세먼지: 좋음 😊
   - Popular news in region
   - Local events calendar
   - Sticky ad

6. FOOTER with regional office info

Accent color: #00A651 (Gwangju green) for highlights
Make it reusable for other 16 regions by changing:
- Region name and accent color
- District list
- Regional stats
```

---

## 📺 프롬프트 3: 시·군 페이지 (Desktop)

```
Design a desktop city/county local news page (1280px).
Example: 나주시 (Naju City, Jeollanam-do)

Layout:
1. HEADER:
   - Logo: "KOREA NEWS 나주"
   - Breadcrumb: 전남 > 나주시
   - Accent color: regional color

2. HERO BANNER:
   - Full-width image of local landmark (e.g., 나주 배밭)
   - Overlay: City name, slogan "천년의 빛, 나주"
   - Weather and air quality inline

3. QUICK MENU (horizontal icons):
   - 시청소식 | 의회소식 | 생활정보 | 관광 | 맛집

4. MAIN + SIDEBAR:
   LEFT (72%):
   - Tab navigation: 뉴스 | 행사 | 관광 | 맛집

   NEWS TAB:
   - Source filter chips: 나주시청, 나주시의회, 전남도청
   - News list (card style, 2 columns)

   EVENTS TAB:
   - Calendar view or card grid
   - Event cards: image, title, date, location

   TOURISM TAB:
   - Featured spots grid (3 columns)
   - Each: image, name, rating, distance

   FOOD TAB:
   - Restaurant cards (2 columns)
   - Each: photo, name, category, rating

   RIGHT SIDEBAR (28%):
   - Local weather detail
   - Bus/train schedule widget
   - Emergency contacts
   - Local government links
   - Ad slot

5. FOOTER with local government contact info

Style:
- Warm, community-focused feel
- Local imagery
- Easy access to civic services
```

---

## 📺 프롬프트 4: 뉴스 상세 페이지 (Desktop)

```
Design a desktop news article page (max 800px content, centered).

Layout:
1. HEADER: Same as main site

2. BREADCRUMB: 홈 > 정치·경제 > 정치

3. ARTICLE HEADER:
   - Category badge "정치"
   - Headline (32px, bold, serif font)
   - Subheadline (18px, gray)
   - Meta row: Author avatar + name, date, read time
   - Share buttons: 카카오톡, 페이스북, 트위터, 링크복사

4. FEATURED IMAGE:
   - Full content width (800px)
   - Caption below
   - Photo credit

5. ARTICLE BODY:
   - Paragraphs with comfortable line-height (1.8)
   - Pull quotes (large, centered, blue border-left)
   - Inline images with captions
   - Subheadings (h2, h3)
   - Related article links (inline)

6. ARTICLE FOOTER:
   - Tags: #대통령, #정책, #2026
   - Reporter info card (photo, name, email, articles count)
   - Social share bar (sticky on scroll)

7. RELATED NEWS:
   - "관련 뉴스" section
   - 4 cards in horizontal grid

8. COMMENTS SECTION:
   - Comment count
   - Sort options: 최신순 | 공감순
   - Comment input (requires login)
   - Comment list with replies
   - Load more button

9. SIDEBAR (right, 280px):
   - Sticky position
   - "이 기사를 본 사람들이 본 뉴스"
   - Popular articles list
   - Ad slot
   - Newsletter signup

Style:
- Focus on readability
- Serif font for body text
- Generous margins
- Clean typography
```

---

## 📺 프롬프트 5: 카테고리/섹션 페이지 (Desktop)

```
Design a desktop news category page (1280px).
Example: "정치·경제" section

Layout:
1. HEADER: Standard site header

2. CATEGORY HEADER:
   - Large title: "정치·경제"
   - Subcategory tabs: 전체 | 정치 | 경제 | 국회 | 청와대 | 기업
   - Active tab: blue underline

3. FEATURED AREA (full width):
   - Large hero article (left 60%)
   - 2 sub-articles stacked (right 40%)

4. MAIN + SIDEBAR:
   LEFT (72%):
   - Filter/sort bar:
     - Sort: 최신순 | 조회순 | 댓글순
     - Period: 오늘 | 이번주 | 이번달
   - News grid (3 columns)
   - Infinite scroll or pagination
   - Ad slots every 9 articles

   RIGHT SIDEBAR (28%):
   - "이 섹션 인기기사" top 5
   - Related tags cloud
   - Newsletter signup
   - Ad slot (sticky)

5. FOOTER

Style:
- Clear section identity
- Easy filtering
- Consistent card design
```

---

## 📺 프롬프트 6: 검색 결과 페이지 (Desktop)

```
Design a desktop search results page (1280px).

Layout:
1. HEADER with search bar prominently displayed
   - Search query shown in input
   - "다시 검색" functionality

2. SEARCH RESULTS HEADER:
   - Query: "대통령" 검색 결과
   - Result count: "총 1,234건"
   - Search time: "(0.23초)"

3. FILTER SIDEBAR (left, 240px):
   - Date range picker
   - Category checkboxes
   - Region checkboxes
   - Source checkboxes
   - "필터 적용" button
   - "초기화" link

4. RESULTS AREA (right, remaining width):
   - Sort tabs: 관련도순 | 최신순 | 조회순

   - Result cards (list style):
     - Thumbnail (left)
     - Content (right):
       - Title with keyword highlighted
       - Snippet with keyword highlighted
       - Source · Date · Category
       - "관련기사 3건" expandable

   - Pagination: 1 2 3 4 5 ... 10 다음

5. NO RESULTS STATE (if applicable):
   - "검색 결과가 없습니다" message
   - Search tips
   - Popular searches suggestions

6. FOOTER

Style:
- Fast, functional design
- Clear keyword highlighting
- Easy filter access
```

---

## 📺 프롬프트 7: 로그인/회원가입 (Desktop)

```
Design desktop login and signup pages (centered, max 480px form).

LOGIN PAGE:
1. Centered card on gray background
2. Logo at top
3. Title: "로그인"
4. Form fields:
   - Email input with icon
   - Password input with show/hide toggle
   - "로그인 상태 유지" checkbox
5. "로그인" primary button (full width, blue)
6. Divider: "또는"
7. Social login buttons:
   - 카카오로 시작하기 (yellow)
   - 네이버로 시작하기 (green)
   - 구글로 시작하기 (white)
8. Links: "아이디 찾기 | 비밀번호 찾기"
9. "계정이 없으신가요? 회원가입" link

SIGNUP PAGE:
1. Same centered card style
2. Title: "회원가입"
3. Progress steps: 1.정보입력 → 2.인증 → 3.완료
4. Form fields:
   - Name input
   - Email input with "중복확인" button
   - Password input with strength indicator
   - Password confirm input
   - Phone input with "인증요청" button
   - Terms checkboxes:
     - 전체동의
     - [필수] 이용약관
     - [필수] 개인정보처리방침
     - [선택] 마케팅 수신동의
5. "가입하기" button
6. "이미 계정이 있으신가요? 로그인" link

Style:
- Clean, trustworthy
- Clear validation states
- Accessible form labels
```

---

## 📺 프롬프트 8: 마이페이지 (Desktop)

```
Design a desktop user mypage/dashboard (1280px).

Layout:
1. HEADER: Standard with user logged in

2. LEFT SIDEBAR (240px):
   - User profile card:
     - Avatar (large)
     - Name
     - Email
     - Member since date
     - "프로필 수정" button
   - Navigation menu:
     - 📰 내 활동
       - 스크랩한 기사
       - 댓글 단 기사
       - 좋아요한 기사
     - ⚙️ 설정
       - 알림 설정
       - 관심 지역 설정
       - 관심 카테고리
     - 📱 계정
       - 비밀번호 변경
       - 연동된 계정
       - 회원 탈퇴

3. MAIN CONTENT AREA (remaining width):

   DEFAULT VIEW (Dashboard):
   - Welcome message
   - Quick stats cards:
     - 스크랩 기사 42건
     - 작성 댓글 128개
     - 가입일로부터 365일
   - Recent activity timeline
   - Recommended news based on interests

   SCRAPPED ARTICLES VIEW:
   - Grid of saved article cards
   - Filter by date, category
   - Remove from scrap button

   SETTINGS VIEW:
   - Form sections with save buttons
   - Toggle switches for notifications
   - Region/category multi-select

4. FOOTER

Style:
- Personal, organized feel
- Clear navigation
- Action-oriented layout
```

---

## 📺 프롬프트 9: 404 에러 페이지 (Desktop)

```
Design a desktop 404 error page (centered content).

Layout:
1. HEADER: Standard site header (so user can navigate away)

2. CENTERED ERROR CONTENT:
   - Large "404" text (120px, bold, light gray)
   - Illustration (optional): confused newspaper or magnifying glass
   - Headline: "페이지를 찾을 수 없습니다"
   - Description: "요청하신 페이지가 삭제되었거나 주소가 변경되었을 수 있습니다."

3. ACTION BUTTONS:
   - "홈으로 가기" primary button (blue)
   - "이전 페이지로" secondary button (outline)

4. HELPFUL LINKS:
   - "혹시 이런 페이지를 찾으셨나요?"
   - 3 popular page links

5. SEARCH BAR:
   - "원하시는 내용을 검색해보세요"
   - Search input with button

6. FOOTER

Style:
- Friendly, not frustrating
- Clear path to recovery
- Maintains brand identity
```

---

## 🧩 프롬프트 10: 모달/팝업 시스템 (Desktop)

```
Design desktop modal and popup components.

MODAL TYPES:

1. CONFIRM MODAL (small, 400px):
   - Title: "정말 삭제하시겠습니까?"
   - Description text
   - Two buttons: "취소" (gray) | "삭제" (red)
   - X close button top-right

2. INFO MODAL (medium, 560px):
   - Title with icon
   - Content area (scrollable if long)
   - Single "확인" button

3. FORM MODAL (large, 640px):
   - Title: "기사 제보하기"
   - Form fields
   - "취소" and "제출" buttons
   - Loading state for submit

4. IMAGE LIGHTBOX (full viewport):
   - Dark overlay
   - Centered image (max 90vw, 90vh)
   - Caption below
   - Close button
   - Prev/Next arrows if gallery

5. SHARE MODAL (small, 360px):
   - Title: "공유하기"
   - Social media buttons grid
   - URL copy input with button
   - "링크 복사됨!" success state

COMMON STYLES:
- Semi-transparent dark backdrop
- White modal with rounded corners
- Smooth open/close animation
- Focus trap for accessibility
- ESC key to close
```

---

## 🧩 프롬프트 11: 토스트 알림 시스템 (Desktop)

```
Design desktop toast notification components.

TOAST VARIANTS:

1. SUCCESS TOAST:
   - Green left border or icon
   - Checkmark icon
   - "저장되었습니다" message
   - Auto-dismiss after 3s

2. ERROR TOAST:
   - Red left border or icon
   - X icon
   - "오류가 발생했습니다" message
   - Optional "다시 시도" action button

3. WARNING TOAST:
   - Yellow/orange left border
   - Warning triangle icon
   - Message text
   - Optional action

4. INFO TOAST:
   - Blue left border
   - Info icon
   - Message text

5. LOADING TOAST:
   - Spinner icon
   - "저장 중..." message
   - No auto-dismiss

POSITIONING:
- Bottom-right corner (default)
- Stack multiple toasts vertically
- Slide-in animation from right
- Slide-out on dismiss

FEATURES:
- Close X button
- Progress bar for auto-dismiss
- Hover pauses auto-dismiss
- Click action if provided
```

---

## 🧩 프롬프트 12: 로딩/스켈레톤 시스템 (Desktop)

```
Design desktop loading states and skeleton screens.

SKELETON TYPES:

1. NEWS CARD SKELETON (desktop 3-column):
   - Image placeholder (16:9 ratio, gray shimmer)
   - Category badge placeholder (small rect)
   - Title placeholder (2 lines)
   - Meta placeholder (1 line)
   - Shimmer animation left-to-right

2. ARTICLE PAGE SKELETON:
   - Header skeleton
   - Large image placeholder
   - Title lines (2)
   - Meta line
   - Body paragraph lines (multiple)
   - Related news skeleton grid

3. SIDEBAR SKELETON:
   - Section title placeholder
   - List items (5-10 lines)
   - Widget placeholders

4. HERO SKELETON:
   - Large main image placeholder (8 columns)
   - Side list placeholders (4 columns)

LOADING SPINNERS:

1. INLINE SPINNER:
   - Small circular spinner
   - Blue color
   - Use for buttons, inline actions

2. PAGE SPINNER:
   - Centered large spinner
   - Logo above (optional)
   - "로딩 중..." text below

3. OVERLAY SPINNER:
   - Semi-transparent white backdrop
   - Centered spinner
   - Prevents interaction

ANIMATION:
- Skeleton: gradient shimmer animation
- Spinner: 360° rotation
- Smooth transitions
```

---

## 📝 사용 팁

### 데스크탑 특화 요소
1. **사이드바**: 모바일에는 없는 영구 사이드바 (28%)
2. **멀티 컬럼**: 3열 그리드 뉴스 카드
3. **Sticky 요소**: 사이드바 광고, 공유 버튼
4. **호버 효과**: 마우스 인터랙션 강조
5. **넓은 여백**: 가독성을 위한 충분한 whitespace

### 반응형 연결
- 모바일 프롬프트(STITCH_PROMPTS.md)와 함께 사용
- 동일한 컴포넌트의 두 가지 뷰로 구현
- Tailwind breakpoint로 전환: `md:`, `lg:`, `xl:`

### 추천 요청 순서 (데스크탑)
1. 전국판 메인 (가장 복잡, 기준 확립)
2. 뉴스 상세 (콘텐츠 집중)
3. 카테고리 페이지 (리스트 패턴)
4. 광역시도 홈페이지 (지역 특화)
5. 나머지 순차적으로

---

## 📋 체크리스트

- [ ] 모바일 프롬프트와 짝으로 요청
- [ ] HTML 파일 다운로드
- [ ] `d:\cbt\koreanewskorea\a\desktop\` 폴더에 저장
- [ ] Claude에게 반응형 컴포넌트 변환 요청

---

**작성자:** Claude Code (AI Assistant)
**버전:** 1.0
**관련 문서:** STITCH_PROMPTS.md (모바일 버전)
