/**
 * Full Process Test - Conversion + Verification
 * Tests the complete 2-stage Ollama processing pipeline
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'benedict/linkbricks-hermes3-llama3.1-8b-korean-advanced-q4';

// Sample articles for testing
const testArticles = [
    {
        id: 1,
        name: "Short (191 chars) - Yeongam",
        content: `영암군 명도수산(대표 조병제)이 22일 미암면 마을회관과 경로당에 400만원 상당의 곱창김을 기부하였다. 지난해에는 대장어 20kg과 쌀 100포대를 기부하였다. 조 대표는 "입맛이 떨어지는 계절에 어르신들이 김을 밑반찬으로 건강하게 겨울나시길 바란다"고 말했다.`
    },
    {
        id: 2,
        name: "Medium (595 chars) - Gangjin",
        content: `강진군 성전면 지역사회보장협의체(위원장 오명종)는 지난 20일 성전면 청년회와 성전면 명동마을 조병곤 씨로부터 이웃돕기 성금 150만 원을 기탁받았다. 이날 청년회(회장 이영수)가 50만 원, 조병곤 씨가 100만 원을 각각 기탁했다. 기탁된 성금은 사회복지공동모금회와 연계해 복지 소외층 긴급지원 및 저소득층 주거환경 개선 등 지역 내 어려운 이웃들을 돕는 데 사용될 예정이다. 청년회와 조병곤 씨는 매년 꾸준히 성금을 기탁하며 지역사회에서 나눔을 실천하고 있다. 이영수 청년회장은 "앞으로도 지역의 청년들이 함께 나눔에 동참하며 더 살기 좋은 성전면을 만들어 나가겠다"고 말했다. 조병곤 씨는 "추운 겨울 어려운 이웃들에게 조금이나마 도움이 됐으면 좋겠다"고 전했다. 오명종 성전면장은 "기탁해 주신 분들께 진심으로 감사드리며, 소외된 이웃이 없도록 세심하게 살피겠다"고 밝혔다.`
    },
    {
        id: 3,
        name: "Long (1024 chars) - Gangjin",
        content: `강진군은 한우산업의 미래를 이끌 청년농업인 30여 명을 대상으로 지난 15일부터 16일까지 1박 2일간 경남·경북 지역 한우산업 선진지 견학을 실시했다. 이번 견학은 청년 농업인들이 선진 한우 농가의 우수 경영 사례와 최신 축산 기술을 직접 체험하며 실무 역량을 강화할 수 있도록 마련됐다. 참가자들은 스마트 축사 운영 시스템, 사료 효율 극대화를 위한 사양 관리 기법 등을 배우며 최신 축산 기술 흐름을 익혔다. 강진군은 한우산업 지속 발전을 위해 청년농업인 대상으로 전문 교육비 지원, 자격증 취득비, 선진지 견학 등 다양한 프로그램을 지원하고 있다. 또한 품질 좋은 고급육 생산을 위해 우량 씨수소 정액 지원, 암소 개량 장려금 지급, 조사료 생산·이용 확대 등도 함께 추진 중이다. 이외에도 가축분뇨 퇴·액비화를 통한 친환경 축산 기반을 조성하고, 악취 저감 시설 설치 지원을 확대해 지역 환경과 조화를 이루는 지속 가능한 축산업 육성에도 힘쓰고 있다. 강진원 강진군수는 "청년농업인의 역할이 한우산업 발전에 매우 중요하다"며 "강진 한우의 미래를 이끌어 갈 핵심 인재들이 되길 바란다"고 말했다. 강진군은 청년농업인들의 현장 중심 교육과 기술 지원을 확대하고, 고급육 생산 체계를 정착시켜 '강진 한우'의 경쟁력을 높이고 농촌의 지속 가능한 발전을 이끌어 갈 계획이다.`
    }
];

async function callOllama(prompt) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt: prompt,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response || '';
}

// Stage 1: Convert
async function convertToNews(pressRelease) {
    const inputLength = pressRelease.length;
    const minOutputLength = Math.floor(inputLength * 0.7);
    let lengthGuidance = '';

    if (inputLength < 500) {
        lengthGuidance = '[짧은 보도자료] 리드 문단(핵심 팩트) -> 세부 내용';
    } else if (inputLength < 1500) {
        lengthGuidance = '[중간 보도자료] 리드 문단 -> 구조화된 정보(■) -> 인용구(있으면)';
    } else {
        lengthGuidance = '[긴 보도자료] 리드 문단 -> 소제목별 내용 -> 인용구';
    }

    const prompt = `# Role
당신은 정부·공공기관의 보도자료만을 바탕으로 문장을 다듬고 재구성하는 전문 편집자입니다.
광주광역시와 전라남도 지역 현안에 정통한 20년 경력의 지역 일간지 편집국장으로서,
보도자료 내용을 벗어나지 않는 리라이팅·형식 정리에만 한정하여 작업합니다.

---

# 절대 규칙 (위반 시 작성 중단)

## 1. 팩트 기반 원칙 (Source Truth Only)
- 제공된 보도자료에 명시된 사실(수치, 장소, 인물명, 날짜, 인용구)만 사용한다.
- 원본에 없는 숫자, 통계, 분석, 전망을 절대 추가하지 않는다.
- "~할 것으로 보인다", "~전망이다", "~기대된다" 등 추측성 표현을 사용하지 않는다.
- 출처가 불분명하거나 기억에 의존해야 하는 내용은 작성하지 않는다.

## 2. 모르면 모른다고 표시
- 보도자료에 없는 정보가 필요하면 해당 부분을 작성하지 않는다.
- 추측, 추정, 일반 상식에 근거한 보충 설명을 하지 않는다.
- 이 지침을 어겨야만 답변할 수 있는 경우, "작성 생략(할루시네이션 위험)"이라고 표시한다.

## 3. 숫자·고유명사 원문 유지
- 보도자료의 숫자·고유명사(기관명, 사업명, 날짜, 금액, 인원 등)는 원문과 완전히 동일하게 유지한다.
- 약어를 새로 만들거나 확장하지 않는다.
- 표현은 자연스럽게 다듬되, 사실 구조(누가·언제·어디서·무엇을·왜·어떻게)는 원문과 다르게 재해석하지 않는다.

## 4. 인용문 규칙
- 인용문(" ")은 보도자료에 있는 내용만 사용한다.
- 존재하지 않는 발언을 지어내지 않는다.
- 보도자료에 인용문이 없으면 인용문 없이 작성한다.

## 5. 금지 영역 (작성 금지)
- 배경 설명, 과거 이력, 다른 기관 언급 등 보도자료에 없는 맥락 추가 금지
- 정책·제도·규정의 해석 금지 (보도자료에 적힌 문장을 구조만 바꿔서 전달)
- 최신 현황이나 외부 통계 제공 금지

## 6. 길이 유지 원칙 (매우 중요!)
- 원본 길이: ${inputLength}자
- 최소 출력 길이: ${minOutputLength}자 이상 (원본의 70% 이상)
- 본문 구조: ${lengthGuidance}
- 원본의 모든 중요 정보를 포함해야 한다. 요약하지 말고 재구성하라.

---

# 출력 형식

## 부제목 (첫 줄에 반드시 작성)
[부제목: 핵심 내용 한 문장 요약]

## 본문 구조
- 리드 문단: 핵심 팩트 2~3문장
- 본문: 상세 내용 (■ 기호로 정보 구조화)
- 인용구: 원본에 있는 경우만

## 정보 구조화 예시
<p>■ 신청 기간: 2024년 12월 2일 ~ 12월 20일</p>
<p>■ 지원 대상: 만 18세 이상 39세 이하 청년</p>
<p>■ 지원 내용: 사업당 최대 500만원</p>

---

[보도자료]
${pressRelease}

[뉴스 기사]`;

    const response = await callOllama(prompt);
    const subtitleMatch = response.match(/\[부제목:\s*(.+?)\]/);
    const subtitle = subtitleMatch ? subtitleMatch[1].trim() : '';
    const content = response.replace(/\[부제목:\s*.+?\]\n*/g, '').trim();

    return { content, subtitle };
}

// Stage 2: Verify
async function verifyFacts(original, converted) {
    const originalLength = original.length;
    const convertedLength = converted.length;
    const lengthRatio = convertedLength / originalLength;
    const lengthPass = lengthRatio >= 0.7;

    const prompt = `너는 팩트체크 전문가다. 원본과 변환된 기사를 비교하여 사실관계를 검증해줘.

검증 항목:
1. 숫자(금액, 비율, 수량)가 원본과 일치하는지
2. 날짜가 원본과 일치하는지
3. 이름(사람, 기관)이 원본과 일치하는지
4. 원본에 없는 내용이 추가되었는지
5. 길이 비율: ${(lengthRatio * 100).toFixed(1)}% (최소 70% 필요) - ${lengthPass ? '충족' : '미달'}

반드시 다음 형식으로 답변해줘:
[검증결과]
- 숫자 일치: O 또는 X (불일치시 상세 내용)
- 날짜 일치: O 또는 X (불일치시 상세 내용)
- 이름 일치: O 또는 X (불일치시 상세 내용)
- 추가된 내용: 없음 또는 있음 (있으면 상세 내용)
- 길이 충족: ${lengthPass ? 'O' : 'X'} (${(lengthRatio * 100).toFixed(1)}%)
- 최종판정: 통과 또는 수정필요

[원본]
${original}

[변환된 기사]
${converted}`;

    const verification = await callOllama(prompt);

    const hasHallucination = verification.includes('수정필요') ||
                            verification.includes('추가된 내용: 있음') ||
                            verification.includes('X (') ||
                            verification.includes(': X');

    let grade = 'A';
    if (!lengthPass) {
        grade = lengthRatio < 0.5 ? 'D' : 'C';
    } else if (hasHallucination) {
        if (verification.includes('숫자 일치: X') || verification.includes('날짜 일치: X')) {
            grade = 'C';
        } else {
            grade = 'B';
        }
    }

    return { verification, hasHallucination, grade, lengthRatio };
}

async function runFullTest(articleIndex) {
    const article = testArticles[articleIndex - 1];
    if (!article) {
        console.log('Invalid article index. Use 1-3.');
        return;
    }

    console.log('======================================================================');
    console.log(`FULL TEST ${article.id}: ${article.name}`);
    console.log('======================================================================');
    console.log(`Input: ${article.content.length} chars | Min Required: ${Math.floor(article.content.length * 0.7)} chars (70%)`);
    console.log('======================================================================\n');

    // Stage 1: Convert
    console.log('[STAGE 1: CONVERSION]');
    const startConvert = Date.now();
    const { content, subtitle } = await convertToNews(article.content);
    const convertTime = ((Date.now() - startConvert) / 1000).toFixed(1);

    console.log(`Subtitle: ${subtitle}`);
    console.log(`Output: ${content.length} chars | Time: ${convertTime}s`);
    console.log('----------------------------------------------------------------------');
    console.log(content);
    console.log('----------------------------------------------------------------------\n');

    // Stage 2: Verify
    console.log('[STAGE 2: VERIFICATION]');
    const startVerify = Date.now();
    const { verification, hasHallucination, grade, lengthRatio } = await verifyFacts(article.content, content);
    const verifyTime = ((Date.now() - startVerify) / 1000).toFixed(1);

    console.log(`Time: ${verifyTime}s`);
    console.log('----------------------------------------------------------------------');
    console.log(verification);
    console.log('----------------------------------------------------------------------\n');

    // Final Result
    const ratio = (lengthRatio * 100).toFixed(1);
    const passed = grade === 'A' || grade === 'B';

    console.log('[FINAL RESULT]');
    console.log(`Length Ratio: ${ratio}% ${lengthRatio >= 0.7 ? '(OK)' : '(FAIL - below 70%)'}`);
    console.log(`Hallucination: ${hasHallucination ? 'DETECTED' : 'None'}`);
    console.log(`Grade: ${grade}`);
    console.log(`Status: ${passed ? 'PASS - Will Publish' : 'FAIL - Will NOT Publish'}`);
    console.log('======================================================================');
}

const articleIndex = parseInt(process.argv[2]) || 1;
runFullTest(articleIndex).catch(console.error);
