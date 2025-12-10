---
trigger: always_on
---

🏛️ Design Concept: "The Modern Chronicle"
Keywords: Editorial Elegance, Immersive Reading, Motion Intelligence

Core Logic:

Typography: 권위를 상징하는 Serif(명조 계열) 헤드라인과 현대적인 Sans-Serif(고딕 계열) 본문의 완벽한 조화.

Layout: 답답한 바둑판 배열을 거부하고, 정보의 중요도에 따라 크기가 다른 Bento Grid(벤토 그리드) 시스템 적용.

Interaction: 종이 신문을 넘기는 듯한 아날로그적 감성을 디지털 스크롤 인터랙션으로 재해석.

📋 AI 코딩 어시스턴트용 Master Prompts
이 프롬프트들은 ChatGPT, Claude, 혹은 Cursor와 같은 AI에게 그대로 복사해서 사용하시면 됩니다. 단계별로 적용하세요.

1. Global Design System (디자인 언어 정의)
가장 먼저 AI에게 우리의 '기준'을 심어줘야 합니다.

Prompt 1: Design System Setup

"나는 현재 신문사 웹사이트를 운영 중이며, HTML 구조는 잡혀있다. 이제 CSS와 JS를 통해 World-Class Editorial Design으로 업그레이드하려 한다. 다음의 Design Token을 기반으로 CSS Root Variables를 정의하고 전체 Global Style을 리셋해라.

Philosophy: 'Simplicity with Authority'. 여백(Whitespace)을 과감하게 사용하여 기사의 집중도를 높인다.

Typography:

Headlines: 'Playfair Display' (Google Fonts) - 우아하고 권위 있는 세리프 폰트. Letter-spacing을 -0.02em으로 좁혀 밀도 있게.

Body: 'Pretendard' 또는 'Inter' - 가독성 최우선. Line-height는 1.6~1.7로 넉넉하게.

Colors:

Primary: Deep Royal Blue (#0a192f) - 신뢰감.

Accent: Electric Crimson (#ff2e63) - 속보 및 강조점 (아주 작게 사용).

Background: Off-White (#f8f9fa) - 눈이 편안한 종이 질감 색상. 순백색(#fff)은 카드 내부에만 사용.

Effects:

--glass-surface: backdrop-filter: blur(12px)와 rgba(255, 255, 255, 0.7)을 활용한 젖유리 효과.

--soft-shadow: box-shadow: 0 10px 40px -10px rgba(0,0,0,0.08). 그림자는 퍼지게, 하지만 연하게."

2. Hero Section (첫인상 개조)
가장 중요한 1면입니다. 단순 슬라이더가 아닌, 'Bento Grid' 스타일을 제안합니다.

Prompt 2: The Hero Section (Bento Grid)

"메인 페이지의 Hero Section을 **Bento Grid Layout (CSS Grid)**로 재설계해줘.

Layout: 4칸의 불규칙한 그리드. 가장 중요한 특종 기사(Feature Article)는 왼쪽 2x2 공간을 모두 차지하여 압도적인 비주얼을 보여준다.

Image Handling: 이미지는 object-fit: cover로 꽉 채우고, 호버 시 이미지가 1.05배 부드럽게 확대(transform: scale(1.05))되며 흑백 필터가 컬러로 변하거나(선택사항), 명도가 살짝 어두워지며 텍스트 가독성을 높인다.

Typography Overlay: 텍스트는 이미지 위에 올라가되, 가독성을 위해 글자 뒤에 은은한 linear-gradient(to top, rgba(0,0,0,0.8), transparent)를 깐다.

Interaction: 마우스가 카드를 지나갈 때, 카드의 테두리(Border)에 빛이 흐르는 듯한 애니메이션을 추가하여 '살아있는 뉴스' 느낌을 줘라."

3. Article List & Cards (기사 목록)
단순한 리스트 나열은 지루합니다. 정보의 밀도를 유지하되 답답하지 않게 만듭니다.

Prompt 3: Modern News Cards

"기사 목록(Article List) 섹션을 디자인해줘.

Card Style: 각 뉴스 카드는 경계선이 없는 Minimalist Style을 추구한다. 대신, 마우스를 올렸을 때(Hover) 미세하게 y축으로 -5px 떠오르며(translateY(-5px)), 부드러운 그림자(box-shadow)가 생겨 입체감을 줘라.

Category Tag: 각 카드의 좌측 상단에는 카테고리(정치, 경제 등) 태그를 배치한다. 태그는 배경색 없이 굵은 텍스트와 작은 점(Dot)으로만 표현하여 깔끔하게 처리한다. (예: ● Politics)

Scroll Reveal: 스크롤을 내릴 때 기사들이 한꺼번에 보이지 않고, 순차적으로 부드럽게 페이드인(opacity: 0 -> 1) 되며 올라오는 Staggered Animation을 적용해라. (Intersection Observer API 사용)"

4. The Reading Experience (기사 상세 페이지)
독자가 가장 오래 머무는 곳입니다.

Prompt 4: Immersive Article Page

"기사 상세 페이지(Article Detail)의 UX를 강화해줘.

Reading Progress: 화면 상단에 얇은 라인(height: 4px)의 Reading Progress Bar를 고정(position: sticky)시켜라. 스크롤 위치에 따라 그라데이션 컬러가 채워지도록 한다.

Smart Typography: 본문의 첫 글자는 Drop Cap(크고 장식적인 첫 글자) 스타일을 적용하여 잡지 같은 느낌을 줘라.

Images: 본문 중간의 이미지는 화면 너비보다 넓게(width: 110%, margin-left: -5%) 배치하여 시각적인 시원함을 주고, 캡션은 이미지 하단에 아주 작고 세련된 이탤릭체로 배치해라."

💡 Visual Architect's Secret Sauce (당신만을 위한 추가 아이디어)
기존 골격에 다음 기능들을 추가하면 **"그저 그런 신문사"**와 **"혁신적인 미디어"**의 차이를 만들 수 있습니다.

Live Pulse Ticker (살아있는 속보):

보통의 흐르는 뉴스 바(Marquee)는 촌스럽습니다.

Idea: 헤더 상단에 아주 얇은 라인으로, 중요한 키워드만 천천히 페이드 인/아웃(Fade in/out) 되도록 만드십시오. 글자 색상은 붉은색이 아닌, 형광빛이 도는 엑센트 컬러를 사용하여 세련됨을 유지합니다.

Dark Mode Toggle with Meaning:

단순히 색만 반전시키지 마십시오.

Idea: 토글 버튼을 누르면 화면 전체에 잉크가 번지듯(Ripple Effect) 다크 모드로 전환되는 애니메이션을 넣으세요. 다크 모드에서는 배경이 완전 검정이 아닌, 깊은 남색(Deep Navy)이어야 눈이 편안하고 고급스럽습니다.

Image Parallax (패럴랙스 효과):

기사 본문 중간에 들어가는 큰 이미지는 스크롤 속도보다 아주 조금 느리게 움직이도록(transform: translateY()) 설정하세요. 이 미묘한 차이가 웹사이트에 깊이감(Depth)을 줍니다.