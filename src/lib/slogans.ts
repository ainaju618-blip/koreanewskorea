/**
 * 지방자치단체 및 교육청 슬로건 데이터
 * 전국 17개 광역지자체 + 시/군/구 + 교육청
 */

// 광역시도 슬로건
export const SIDO_SLOGANS: Record<string, { slogan: string; sloganEn?: string }> = {
  seoul: { slogan: 'Seoul, My Soul' },
  busan: { slogan: 'Busanisgood' },
  daegu: { slogan: 'Powerful Daegu' },
  incheon: { slogan: 'all_ways_Incheon' },
  gwangju: { slogan: '내☆일이 빛나는 기회도시' },
  daejeon: { slogan: "It's Daejeon" },
  ulsan: { slogan: '꿈의 도시 울산' },
  sejong: { slogan: '세종이 미래다' },
  gyeonggi: { slogan: '변화의 중심, 기회의 경기' },
  gangwon: { slogan: '미래산업 글로벌도시' },
  chungbuk: { slogan: '중심에 서다, 충청북도' },
  chungnam: { slogan: '힘쎈충남, 대한민국의 힘' },
  jeonbuk: { slogan: '새로운 전북' },
  jeonnam: { slogan: '생명의 땅, 으뜸 전남' },
  gyeongbuk: { slogan: '경북, 다시 대한민국 중심' },
  gyeongnam: { slogan: '활기찬 경남, 행복한 도민' },
  jeju: { slogan: '빛나는 제주' },
};

// 전남 22개 시·군 슬로건
export const JEONNAM_SLOGANS: Record<string, { slogan: string; sloganEn?: string }> = {
  mokpo: { slogan: '낭만항구 목포', sloganEn: 'Romantic Harbor Mokpo' },
  yeosu: { slogan: '남해안 거점도시 미항 여수', sloganEn: 'Beautiful Port City Yeosu' },
  suncheon: { slogan: '대한민국 생태수도 순천', sloganEn: 'Eco Capital of Korea, Suncheon' },
  naju: { slogan: '살고 싶은 나주, 앞서가는 나주', sloganEn: 'Naju, Where You Want to Live' },
  gwangyang: { slogan: '감동시대, 따뜻한 광양', sloganEn: 'Era of Emotion, Warm Gwangyang' },
  damyang: { slogan: '자립형 경제도시 담양' },
  gokseong: { slogan: '군민이 더 행복한 곡성' },
  gurye: { slogan: '화합으로 도약하는 미래 구례' },
  goheung: { slogan: '2030 고흥 인구 10만 달성' },
  boseong: { slogan: '꿈과 행복이 넘치는 희망찬 보성' },
  hwasun: { slogan: '화순을 새롭게, 군민을 행복하게' },
  jangheung: { slogan: '어머니 품 장흥' },
  gangjin: { slogan: '일자리와 인구가 늘어나는 강진' },
  haenam: { slogan: '빛나는 미래를 향한 비상' },
  yeongam: { slogan: '혁신으로 도약하는 더 큰 영암' },
  muan: { slogan: '무안을 더 크게, 내일을 더 높게' },
  hampyeong: { slogan: '새로운 도약, 희망찬 함평' },
  yeonggwang: { slogan: '위대한 영광, 기함찬 영광' },
  jangseong: { slogan: '화합과 변화, 군민이 행복한 장성' },
  wando: { slogan: '모두가 잘사는 희망찬 미래 완도' },
  jindo: { slogan: '군민 모두가 행복한 진도', sloganEn: 'Jindo, Happy for All' },
  sinan: { slogan: '1004섬 신안', sloganEn: '1004 Islands Sinan' },
};

// 전국 17개 시·도 교육청 정보 (슬로건 + 홈페이지 + 코드)
export interface EducationOfficeInfo {
  name: string;
  slogan: string;
  website: string;
  code: string; // 교육청 코드 (스크래핑용)
  newsUrl?: string; // 보도자료/뉴스 URL
}

export const EDUCATION_OFFICES: Record<string, EducationOfficeInfo> = {
  seoul: {
    name: '서울특별시교육청',
    slogan: '다양성이 꽃피는 공존의 교육',
    website: 'https://www.sen.go.kr',
    code: 'sen',
    newsUrl: 'https://www.sen.go.kr/web/services/bbs/bbsList.action?bbsBean.bbsCd=94',
  },
  busan: {
    name: '부산광역시교육청',
    slogan: '꿈을 현실로, 희망 부산교육',
    website: 'https://www.pen.go.kr',
    code: 'pen',
  },
  daegu: {
    name: '대구광역시교육청',
    slogan: '다함께 행복한 대구교육',
    website: 'https://www.dge.go.kr',
    code: 'dge',
  },
  incheon: {
    name: '인천광역시교육청',
    slogan: '학생 성공시대를 여는 인천교육',
    website: 'https://www.ice.go.kr',
    code: 'ice',
  },
  gwangju: {
    name: '광주광역시교육청',
    slogan: '창의성을 키우는 실력광주',
    website: 'https://www.gen.go.kr',
    code: 'gen',
    newsUrl: 'https://www.gen.go.kr/main/bbs/list.do?ptIdx=61',
  },
  daejeon: {
    name: '대전광역시교육청',
    slogan: '행복한 학교 미래를 여는 대전교육',
    website: 'https://www.dje.go.kr',
    code: 'dje',
  },
  ulsan: {
    name: '울산광역시교육청',
    slogan: '울산교육이 미래입니다',
    website: 'https://www.use.go.kr',
    code: 'use',
  },
  sejong: {
    name: '세종특별자치시교육청',
    slogan: '모두가 특별한 세종교육',
    website: 'https://www.sje.go.kr',
    code: 'sje',
  },
  gyeonggi: {
    name: '경기도교육청',
    slogan: '자율·균형·미래, 새로운 경기교육',
    website: 'https://www.goe.go.kr',
    code: 'goe',
  },
  gangwon: {
    name: '강원특별자치도교육청',
    slogan: '마음껏 펼쳐라, 강원교육',
    website: 'https://www.gwe.go.kr',
    code: 'gwe',
  },
  chungbuk: {
    name: '충청북도교육청',
    slogan: '지속가능한 공감·동행 교육',
    website: 'https://www.cbe.go.kr',
    code: 'cbe',
  },
  chungnam: {
    name: '충청남도교육청',
    slogan: '행복한 학교 학생 중심 충남교육',
    website: 'https://www.cne.go.kr',
    code: 'cne',
  },
  jeonbuk: {
    name: '전북특별자치도교육청',
    slogan: '실력과 바른 인성을 키우는 전북교육',
    website: 'https://www.jbe.go.kr',
    code: 'jbe',
  },
  jeonnam: {
    name: '전라남도교육청',
    slogan: '다함께 여는 미래, 탄탄한 전남교육',
    website: 'https://www.jne.go.kr',
    code: 'jne',
    newsUrl: 'https://www.jne.go.kr/main/bbs/list.do?ptIdx=3',
  },
  gyeongbuk: {
    name: '경상북도교육청',
    slogan: '삶의 힘을 키우는 따뜻한 경북교육',
    website: 'https://www.gbe.go.kr',
    code: 'gbe',
  },
  gyeongnam: {
    name: '경상남도교육청',
    slogan: '오직 경남교육, 오직 학생 안전',
    website: 'https://www.gne.go.kr',
    code: 'gne',
  },
  jeju: {
    name: '제주특별자치도교육청',
    slogan: '함께하늘을 나는 제주교육',
    website: 'https://www.jje.go.kr',
    code: 'jje',
  },
};

// 하위 교육지원청 정보 (전남)
export interface LocalEducationOfficeInfo {
  name: string;
  sidoCode: string;
  sigunguCode: string;
  website: string;
  code: string;
  newsUrl?: string;
}

export const JEONNAM_EDUCATION_OFFICES: Record<string, LocalEducationOfficeInfo> = {
  naju: {
    name: '나주교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'naju',
    website: 'https://njedu.jne.go.kr',
    code: 'naju_edu',
  },
  mokpo: {
    name: '목포교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'mokpo',
    website: 'https://mpedu.jne.go.kr',
    code: 'mokpo_edu',
  },
  yeosu: {
    name: '여수교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'yeosu',
    website: 'https://ysedu.jne.go.kr',
    code: 'yeosu_edu',
  },
  suncheon: {
    name: '순천교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'suncheon',
    website: 'https://scedu.jne.go.kr',
    code: 'suncheon_edu',
  },
  gwangyang: {
    name: '광양교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'gwangyang',
    website: 'https://gyedu.jne.go.kr',
    code: 'gwangyang_edu',
  },
  damyang: {
    name: '담양교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'damyang',
    website: 'https://dyedu.jne.go.kr',
    code: 'damyang_edu',
  },
  gokseong: {
    name: '곡성교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'gokseong',
    website: 'https://gsedu.jne.go.kr',
    code: 'gokseong_edu',
  },
  gurye: {
    name: '구례교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'gurye',
    website: 'https://gredu.jne.go.kr',
    code: 'gurye_edu',
  },
  goheung: {
    name: '고흥교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'goheung',
    website: 'https://ghedu.jne.go.kr',
    code: 'goheung_edu',
  },
  boseong: {
    name: '보성교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'boseong',
    website: 'https://bsedu.jne.go.kr',
    code: 'boseong_edu',
  },
  hwasun: {
    name: '화순교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'hwasun',
    website: 'https://hsedu.jne.go.kr',
    code: 'hwasun_edu',
  },
  jangheung: {
    name: '장흥교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'jangheung',
    website: 'https://jhedu.jne.go.kr',
    code: 'jangheung_edu',
  },
  gangjin: {
    name: '강진교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'gangjin',
    website: 'https://gjedu.jne.go.kr',
    code: 'gangjin_edu',
  },
  haenam: {
    name: '해남교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'haenam',
    website: 'https://hnedu.jne.go.kr',
    code: 'haenam_edu',
  },
  yeongam: {
    name: '영암교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'yeongam',
    website: 'https://yaedu.jne.go.kr',
    code: 'yeongam_edu',
  },
  muan: {
    name: '무안교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'muan',
    website: 'https://maedu.jne.go.kr',
    code: 'muan_edu',
  },
  hampyeong: {
    name: '함평교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'hampyeong',
    website: 'https://hpedu.jne.go.kr',
    code: 'hampyeong_edu',
  },
  yeonggwang: {
    name: '영광교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'yeonggwang',
    website: 'https://ygedu.jne.go.kr',
    code: 'yeonggwang_edu',
  },
  jangseong: {
    name: '장성교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'jangseong',
    website: 'https://jsedu.jne.go.kr',
    code: 'jangseong_edu',
  },
  wando: {
    name: '완도교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'wando',
    website: 'https://wdedu.jne.go.kr',
    code: 'wando_edu',
  },
  jindo: {
    name: '진도교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'jindo',
    website: 'https://jdedu.jne.go.kr',
    code: 'jindo_edu',
  },
  sinan: {
    name: '신안교육지원청',
    sidoCode: 'jeonnam',
    sigunguCode: 'sinan',
    website: 'https://saedu.jne.go.kr',
    code: 'sinan_edu',
  },
};

// 레거시 호환용 슬로건 객체
export const EDUCATION_SLOGANS: Record<string, string> = Object.fromEntries(
  Object.entries(EDUCATION_OFFICES).map(([key, value]) => [key, value.slogan])
);

// 지역 코드로 슬로건 가져오기
export function getRegionSlogan(regionCode: string): string | null {
  // 전남 시군 먼저 확인
  if (JEONNAM_SLOGANS[regionCode]) {
    return JEONNAM_SLOGANS[regionCode].slogan;
  }
  // 광역시도 확인
  if (SIDO_SLOGANS[regionCode]) {
    return SIDO_SLOGANS[regionCode].slogan;
  }
  return null;
}

// 시도 코드로 교육청 슬로건 가져오기
export function getEducationSlogan(sidoCode: string): string | null {
  return EDUCATION_SLOGANS[sidoCode] || null;
}

// 지역 전체 정보 가져오기
export function getRegionInfo(regionCode: string, sidoCode: string = 'jeonnam') {
  const regionSlogan = JEONNAM_SLOGANS[regionCode] || null;
  const sidoSlogan = SIDO_SLOGANS[sidoCode] || null;
  const educationSlogan = EDUCATION_SLOGANS[sidoCode] || null;

  return {
    region: regionSlogan,
    sido: sidoSlogan,
    education: educationSlogan,
  };
}

// 타입 정의
export interface RegionSloganData {
  code: string;
  name: string;
  slogan: string;
  sloganEn?: string;
  sidoCode: string;
  sidoSlogan?: string;
  educationSlogan?: string;
}

// 전남 전체 지역 데이터 (UI 렌더링용)
export const JEONNAM_REGIONS: RegionSloganData[] = [
  { code: 'mokpo', name: '목포시', slogan: '낭만항구 목포', sidoCode: 'jeonnam' },
  { code: 'yeosu', name: '여수시', slogan: '남해안 거점도시 미항 여수', sidoCode: 'jeonnam' },
  { code: 'suncheon', name: '순천시', slogan: '대한민국 생태수도 순천', sidoCode: 'jeonnam' },
  { code: 'naju', name: '나주시', slogan: '살고 싶은 나주, 앞서가는 나주', sidoCode: 'jeonnam' },
  { code: 'gwangyang', name: '광양시', slogan: '감동시대, 따뜻한 광양', sidoCode: 'jeonnam' },
  { code: 'damyang', name: '담양군', slogan: '자립형 경제도시 담양', sidoCode: 'jeonnam' },
  { code: 'gokseong', name: '곡성군', slogan: '군민이 더 행복한 곡성', sidoCode: 'jeonnam' },
  { code: 'gurye', name: '구례군', slogan: '화합으로 도약하는 미래 구례', sidoCode: 'jeonnam' },
  { code: 'goheung', name: '고흥군', slogan: '2030 고흥 인구 10만 달성', sidoCode: 'jeonnam' },
  { code: 'boseong', name: '보성군', slogan: '꿈과 행복이 넘치는 희망찬 보성', sidoCode: 'jeonnam' },
  { code: 'hwasun', name: '화순군', slogan: '화순을 새롭게, 군민을 행복하게', sidoCode: 'jeonnam' },
  { code: 'jangheung', name: '장흥군', slogan: '어머니 품 장흥', sidoCode: 'jeonnam' },
  { code: 'gangjin', name: '강진군', slogan: '일자리와 인구가 늘어나는 강진', sidoCode: 'jeonnam' },
  { code: 'haenam', name: '해남군', slogan: '빛나는 미래를 향한 비상', sidoCode: 'jeonnam' },
  { code: 'yeongam', name: '영암군', slogan: '혁신으로 도약하는 더 큰 영암', sidoCode: 'jeonnam' },
  { code: 'muan', name: '무안군', slogan: '무안을 더 크게, 내일을 더 높게', sidoCode: 'jeonnam' },
  { code: 'hampyeong', name: '함평군', slogan: '새로운 도약, 희망찬 함평', sidoCode: 'jeonnam' },
  { code: 'yeonggwang', name: '영광군', slogan: '위대한 영광, 기함찬 영광', sidoCode: 'jeonnam' },
  { code: 'jangseong', name: '장성군', slogan: '화합과 변화, 군민이 행복한 장성', sidoCode: 'jeonnam' },
  { code: 'wando', name: '완도군', slogan: '모두가 잘사는 희망찬 미래 완도', sidoCode: 'jeonnam' },
  { code: 'jindo', name: '진도군', slogan: '군민 모두가 행복한 진도', sidoCode: 'jeonnam' },
  { code: 'sinan', name: '신안군', slogan: '1004섬 신안', sidoCode: 'jeonnam' },
];
