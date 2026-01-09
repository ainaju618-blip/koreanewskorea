# Stitch 프롬프트 모음 (코리아뉴스 전국판)

> 작성일: 2026-01-07
> 프로젝트: koreanewskorea.com
>
> ⚠️ **중요**: 한 번에 하나씩 요청하세요. 여러 개 한꺼번에 요청하면 품질 저하!

---

## 🎨 공통 디자인 시스템 (모든 프롬프트에 포함)

```
공통 설정:
- 모바일 퍼스트 (max-width: 448px, 중앙 정렬)
- 언어: 한국어
- Primary 컬러: #3c83f6 (파란색)
- 배경: #f5f7f8 (밝은 회색)
- 폰트: Public Sans + Noto Sans KR
- 아이콘: Material Symbols Outlined
- 카드: 흰색 배경, 둥근 모서리 (rounded-xl), 그림자
- 다크모드 지원
```

---

## 📱 프롬프트 1: 전국판 메인 홈페이지

```
Design a mobile-first Korean news portal homepage.

Layout (top to bottom):
1. Utility bar: date (2026.01.07), breaking news ticker with red pulse icon
2. Sticky header: hamburger menu, logo "KOREA NEWS" (blue #3c83f6), subtitle "National Edition", search/notification/profile icons
3. Category tabs: horizontal scroll - 종합, 정치/행정, 경제/농업, 교육/복지, 여행/축제, 오피니언
4. Hero section: "TOP NEWS" badge (red), large 16:9 image, headline, summary, meta (source, region, comments)
5. News list: 3-4 items with thumbnail (72x72), title, category badge, time ago
6. Region selection: section title with globe icon, 3x4 grid of region buttons (서울, 경기, 부산, etc.), current location indicator
7. Lifestyle widgets: 4 icons grid - 귀농지원, 관광지도, 고시공고, 부동산
8. Newsletter CTA: dark background, email input, subscribe button
9. Bottom navigation: fixed - 홈(active), 내 지역, + button (floating), 스크랩, 전체

Style:
- Mobile width: 448px max, centered
- Primary color: #3c83f6
- Background: #f5f7f8
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined
- Cards: white, rounded-xl, shadow-sm
- Dark mode support

Language: Korean (한국어)
```

---

## 📱 프롬프트 2: 광역시도 홈페이지 (서울/부산/광주 등)

```
Design a mobile-first Korean regional news homepage for metropolitan cities.

Example region: 광주광역시 (Gwangju Metropolitan City)

Layout (top to bottom):
1. Sticky header: hamburger menu, center title "코리아뉴스 광주판", subtitle "광주광역시", profile icon
2. Hero section: blue (#3c83f6) background with gradient, badge "행정/생활 정보의 중심", headline "광주, 빛과 예술의 도시", search bar with search button
3. Quick menu: 4 icons grid - 공지사항, 민원/행정, 부동산/일자리, 관광/지도
4. Divider: thin gray bar
5. Category chips: horizontal scroll - 전체(active/black), 시청, 의회, 교육, 복지, 문화
6. Section title: "실시간 주요 뉴스"
7. News list: 4 items with category badge (시청/의회/교육/생활), date, title, summary, thumbnail (96x96)
8. Bottom navigation: fixed - 홈(active), 지도, 소통, MY

Style:
- Mobile width: 448px max, centered
- Primary color: #3c83f6
- Accent for Gwangju: #00A651 (green, optional)
- Background: white
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined
- Dark mode support

Language: Korean (한국어)
```

---

## 📱 프롬프트 3: 시·군 지역페이지 (나주/목포 등)

```
Design a mobile-first Korean local news page for cities/counties.

Example region: 나주시 (Naju City), 전라남도

Layout (top to bottom):
1. Sticky header: hamburger menu, center title "코리아뉴스 나주판", location badge "전라남도 나주시", profile icon
2. Hero section: blue (#3c83f6) gradient background, badge "행정/생활 정보의 중심", headline "나주, 역사와 미래가 공존하는 도시", search bar
3. Quick menu: 4 icons - 공지사항(campaign), 민원/행정(gavel), 부동산/일자리(apartment), 관광/지도(map)
4. Category chips: sticky below header - 전체(active), 시청, 의회, 교육, 복지
5. News list section: title "실시간 주요 뉴스"
6. News items: category badge with color (시청=blue, 의회=red, 교육=green, 생활=orange), date, bold title, summary text, square thumbnail
7. Bottom navigation: 홈(active), 지도, 소통, MY

Style:
- Mobile width: 448px max
- Primary: #3c83f6
- Category badges: blue/red/green/orange backgrounds with matching text
- Cards: hover effect with gray background
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 📱 프롬프트 4: 뉴스 상세 페이지

```
Design a mobile-first Korean news article detail page.

Layout (top to bottom):
1. Sticky header: back arrow, center title "전국판 뉴스", bookmark icon, share icon
2. Category chips: "행정/정책" (blue primary), "귀농귀촌" (gray)
3. Headline: large bold text, 26-28px
4. Meta info: author name, date/time, "기사 듣기" button, "글자 크기" button
5. Lead image: 16:9 aspect ratio, rounded corners, caption below
6. Article body:
   - Paragraphs with 17px font, 1.8 line height
   - Quote block: left blue border, blue-50 background, italic text, author attribution
   - Subheading (h3)
   - Native ad slot: "AD" label, sponsor content with image and text
7. Tags: horizontal chips - #귀농귀촌, #지원금, #부동산정책
8. Reaction bar: "이 기사가 도움이 되었나요?", heart button with count
9. Divider
10. Related news: section title, 3 horizontal cards with thumbnail, category, title, time
11. Comments preview: count badge, single comment with avatar, username, text, like/reply counts
12. "댓글 전체보기" button
13. Fixed bottom bar: comment input field, send button, heart icon with count, comment icon with count

Style:
- Mobile width: 448px max
- Primary: #3c83f6
- Article text: gray-800, 17px
- Quote: blue left border, blue-50 background
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 📱 프롬프트 5: 카테고리 페이지 (정치/경제/사회 등)

```
Design a mobile-first Korean news category listing page.

Example category: 정치/행정 (Politics)

Layout (top to bottom):
1. Sticky header: back arrow, center title "정치/행정", search icon, filter icon
2. Filter chips: horizontal scroll - 전체(active), 국회, 청와대, 정당, 지방정치, 선거
3. Sort dropdown: "최신순" with chevron down
4. Featured article: large card with 16:9 image, category badge, headline, summary, source, time
5. News list:
   - Standard cards: thumbnail left (80x80), category badge, title (2 lines max), summary (2 lines), source, time
   - Every 5th item: native ad slot
6. "더보기" button or infinite scroll indicator
7. Bottom navigation: 홈, 내 지역, +, 스크랩, 전체(active)

Style:
- Mobile width: 448px max
- Primary: #3c83f6
- Filter chips: active=black text, inactive=gray
- Cards: white background, rounded-lg, subtle shadow
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 📱 프롬프트 6: 검색 결과 페이지

```
Design a mobile-first Korean news search results page.

Layout (top to bottom):
1. Sticky header: back arrow, search input field (pre-filled with query), clear X button
2. Search summary: "검색어" 결과 N건
3. Filter tabs: 전체, 뉴스, 지역, 태그
4. Sort: "관련도순" dropdown
5. Search results list:
   - Result card: category badge, title with highlighted search term (bold/yellow), summary with highlighted term, source, date, thumbnail (optional)
   - Divider between items
6. No results state (alternate): sad face icon, "검색 결과가 없습니다", suggestion text
7. Recent searches section (when input focused): clock icon, recent search terms, X to delete
8. Bottom navigation: standard 5 items

Style:
- Mobile width: 448px max
- Primary: #3c83f6
- Highlighted search term: bold or yellow background
- Empty state: centered, gray icon, helpful text
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 📱 프롬프트 7: 로그인/회원가입 페이지

```
Design a mobile-first Korean news app login and signup page.

Screen 1 - Login:
1. Header: back arrow, title "로그인"
2. Logo: "KOREA NEWS" centered, blue
3. Form:
   - Email input with mail icon
   - Password input with lock icon, show/hide toggle
   - "로그인 상태 유지" checkbox
   - "로그인" primary button (full width, blue)
4. Divider: "또는"
5. Social login: Google, Kakao, Naver buttons (icons + text)
6. Links: "비밀번호 찾기" | "회원가입"

Screen 2 - Signup:
1. Header: back arrow, title "회원가입"
2. Form:
   - Email input with validation
   - Password input with requirements hint
   - Password confirm input
   - Nickname input
   - "이용약관 동의" checkbox with link
   - "개인정보처리방침 동의" checkbox with link
   - "회원가입" primary button
3. Already have account: "이미 계정이 있으신가요? 로그인"

Style:
- Mobile width: 448px max
- Primary: #3c83f6
- Input fields: rounded-lg, gray border, focus=blue border
- Buttons: rounded-lg, full width
- Social buttons: Kakao=yellow, Naver=green, Google=white
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 📱 프롬프트 8: 마이페이지

```
Design a mobile-first Korean news app my page / profile page.

Layout (top to bottom):
1. Header: hamburger menu, title "MY", settings gear icon
2. Profile section:
   - Avatar circle (or default icon)
   - Username
   - Email (masked: ko***@gmail.com)
   - "프로필 수정" button
3. Stats row: 스크랩 N건, 댓글 N건, 좋아요 N건
4. Menu list with icons:
   - 📑 내 스크랩
   - 💬 내 댓글
   - ❤️ 좋아요한 기사
   - 🔔 알림 설정
   - 📍 관심 지역 설정
   - 🏷️ 관심 카테고리
   - ⚙️ 앱 설정
   - ❓ 고객센터
   - 📄 이용약관
5. Logout button (red text)
6. App version: "v1.0.0" gray text
7. Bottom navigation: standard, MY active

Style:
- Mobile width: 448px max
- Primary: #3c83f6
- Menu items: white background, chevron right arrow
- Dividers between menu groups
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 📱 프롬프트 9: 404 에러 페이지

```
Design a mobile-first Korean 404 error page for a news app.

Layout (centered vertically):
1. Large illustration or icon: confused newspaper or broken link icon
2. Error code: "404" large gray text
3. Title: "페이지를 찾을 수 없습니다" bold
4. Description: "요청하신 페이지가 존재하지 않거나 이동되었습니다."
5. Buttons:
   - "홈으로 가기" primary button (blue)
   - "이전 페이지" secondary button (outline)
6. Search suggestion: "찾으시는 내용을 검색해보세요" with search input

Style:
- Mobile width: 448px max
- Centered content
- Primary: #3c83f6
- Error text: gray-400
- Friendly, not scary tone
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 🧩 프롬프트 10: 모달/팝업 컴포넌트

```
Design mobile modal and popup components for a Korean news app.

Components to include:

1. Share modal:
   - Header: "공유하기" with X close button
   - Share options grid: 카카오톡, 페이스북, 트위터, 링크복사
   - URL preview bar with copy button

2. Confirm modal:
   - Icon (warning/question)
   - Title: "정말 삭제하시겠습니까?"
   - Description text
   - Two buttons: "취소" (gray), "삭제" (red)

3. Alert modal:
   - Icon (success checkmark or error X)
   - Title: "저장되었습니다" or "오류가 발생했습니다"
   - Single "확인" button

4. Bottom sheet:
   - Drag handle bar at top
   - Title with close X
   - List of options with icons
   - Cancel button at bottom

Style:
- Overlay: black 50% opacity
- Modal: white, rounded-2xl, centered or bottom sheet
- Primary: #3c83f6
- Danger: red-500
- Max width: 320px for center modals
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 🧩 프롬프트 11: 토스트 알림 컴포넌트

```
Design toast notification components for a Korean news app.

Toast types:

1. Success toast:
   - Green left border or background
   - Checkmark icon
   - Message: "스크랩되었습니다"
   - Optional: "보기" action link
   - Auto dismiss after 3s

2. Error toast:
   - Red left border or background
   - X or warning icon
   - Message: "오류가 발생했습니다"
   - Optional: "다시 시도" action

3. Info toast:
   - Blue left border or background
   - Info icon
   - Message: "새로운 뉴스가 있습니다"
   - Optional: "새로고침" action

4. Warning toast:
   - Orange/yellow left border or background
   - Warning triangle icon
   - Message: "네트워크 연결이 불안정합니다"

Position: bottom of screen, above bottom nav (with safe area)
Animation: slide up, fade out

Style:
- Rounded-lg
- Shadow-lg
- Max width: 90% of screen
- Font: Public Sans, Noto Sans KR
- Icons: Material Symbols Outlined

Language: Korean (한국어)
```

---

## 🧩 프롬프트 12: 로딩/스켈레톤 컴포넌트

```
Design loading and skeleton UI components for a Korean news app.

Components:

1. Full page loader:
   - Centered spinner or pulsing logo
   - "로딩 중..." text below
   - Light gray background

2. News card skeleton:
   - Gray placeholder for thumbnail (animated pulse)
   - Gray bars for title (2 lines, different widths)
   - Shorter gray bar for meta info
   - Subtle animation: pulse or shimmer

3. News list skeleton:
   - 4-5 card skeletons stacked
   - Consistent spacing

4. Article skeleton:
   - Large rectangle for hero image
   - Long bar for headline
   - Short bars for meta
   - Multiple paragraph bars with varying widths

5. Profile skeleton:
   - Circle for avatar
   - Bars for name and email
   - Rectangles for menu items

6. Pull to refresh:
   - Spinner at top when pulling down
   - "당겨서 새로고침" text

Animation: subtle pulse (opacity 50% to 100%)

Style:
- Skeleton color: gray-200
- Animation: pulse or shimmer effect
- Matches actual component dimensions
- Font: Public Sans, Noto Sans KR

Language: Korean (한국어)
```

---

## 📋 요청 순서 권장

품질을 위해 다음 순서로 **하나씩** 요청하세요:

| 순서 | 프롬프트 | 우선순위 |
|------|----------|----------|
| 1 | 전국판 메인 | 🔴 필수 |
| 2 | 광역시도 홈페이지 | 🔴 필수 |
| 3 | 시·군 지역페이지 | 🔴 필수 |
| 4 | 뉴스 상세 | 🔴 필수 |
| 5 | 카테고리 페이지 | 🔴 필수 |
| 6 | 검색 결과 | 🟡 중요 |
| 7 | 로그인/회원가입 | 🟡 중요 |
| 8 | 마이페이지 | 🟡 중요 |
| 9 | 404 에러 | 🟢 선택 |
| 10 | 모달/팝업 | 🟢 선택 |
| 11 | 토스트 알림 | 🟢 선택 |
| 12 | 로딩/스켈레톤 | 🟢 선택 |

---

## 💡 Stitch 사용 팁

1. **Experimental 모드 사용** - 품질이 더 좋음
2. **영어 프롬프트** - 한국어보다 인식률 높음
3. **구체적인 색상 코드** - #3c83f6 같이 명시
4. **레이아웃 순서대로** - top to bottom으로 설명
5. **예시 텍스트 포함** - 실제 사용할 한국어 텍스트 명시
6. **하나씩 요청** - 여러 개 한꺼번에 X

---

**Sources:**
- [Google Developers Blog - Stitch](https://developers.googleblog.com/en/stitch-a-new-way-to-design-uis/)
- [Codecademy - Stitch Tutorial](https://www.codecademy.com/article/google-stitch-tutorial-ai-powered-ui-design-tool)
