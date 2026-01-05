/**
 * 대한민국 17개 시/도 및 시/군/구 행정구역 데이터
 * koreanewskorea.com 전국판
 */

export const regionsData = {
  version: "2.0",
  lastUpdated: "2026-01-04",
  description: "대한민국 17개 시/도 및 시/군/구 행정구역 데이터 - koreanewskorea.com 전국판",
  specialRules: {
    mokpo_sinan: {
      description: "목포시와 신안군은 통합 운영",
      merged: true,
      primaryRegion: "mokpo",
      includedRegions: ["mokpo", "sinan"]
    }
  },
  regions: [
    {
      code: "seoul",
      name: "서울특별시",
      shortName: "서울",
      type: "metropolitan" as const,
      order: 1,
      districts: [
        { code: "jongno", name: "종로구" },
        { code: "jung", name: "중구" },
        { code: "yongsan", name: "용산구" },
        { code: "seongdong", name: "성동구" },
        { code: "gwangjin", name: "광진구" },
        { code: "dongdaemun", name: "동대문구" },
        { code: "jungnang", name: "중랑구" },
        { code: "seongbuk", name: "성북구" },
        { code: "gangbuk", name: "강북구" },
        { code: "dobong", name: "도봉구" },
        { code: "nowon", name: "노원구" },
        { code: "eunpyeong", name: "은평구" },
        { code: "seodaemun", name: "서대문구" },
        { code: "mapo", name: "마포구" },
        { code: "yangcheon", name: "양천구" },
        { code: "gangseo", name: "강서구" },
        { code: "guro", name: "구로구" },
        { code: "geumcheon", name: "금천구" },
        { code: "yeongdeungpo", name: "영등포구" },
        { code: "dongjak", name: "동작구" },
        { code: "gwanak", name: "관악구" },
        { code: "seocho", name: "서초구" },
        { code: "gangnam", name: "강남구" },
        { code: "songpa", name: "송파구" },
        { code: "gangdong", name: "강동구" }
      ]
    },
    {
      code: "busan",
      name: "부산광역시",
      shortName: "부산",
      type: "metropolitan" as const,
      order: 2,
      districts: [
        { code: "jung", name: "중구" },
        { code: "seo", name: "서구" },
        { code: "dong", name: "동구" },
        { code: "yeongdo", name: "영도구" },
        { code: "busanjin", name: "부산진구" },
        { code: "dongnae", name: "동래구" },
        { code: "nam", name: "남구" },
        { code: "buk", name: "북구" },
        { code: "haeundae", name: "해운대구" },
        { code: "saha", name: "사하구" },
        { code: "geumjeong", name: "금정구" },
        { code: "gangseo", name: "강서구" },
        { code: "yeonje", name: "연제구" },
        { code: "suyeong", name: "수영구" },
        { code: "sasang", name: "사상구" },
        { code: "gijang", name: "기장군" }
      ]
    },
    {
      code: "daegu",
      name: "대구광역시",
      shortName: "대구",
      type: "metropolitan" as const,
      order: 3,
      districts: [
        { code: "jung", name: "중구" },
        { code: "dong", name: "동구" },
        { code: "seo", name: "서구" },
        { code: "nam", name: "남구" },
        { code: "buk", name: "북구" },
        { code: "suseong", name: "수성구" },
        { code: "dalseo", name: "달서구" },
        { code: "dalseong", name: "달성군" }
      ]
    },
    {
      code: "incheon",
      name: "인천광역시",
      shortName: "인천",
      type: "metropolitan" as const,
      order: 4,
      districts: [
        { code: "jung", name: "중구" },
        { code: "dong", name: "동구" },
        { code: "michuhol", name: "미추홀구" },
        { code: "yeonsu", name: "연수구" },
        { code: "namdong", name: "남동구" },
        { code: "bupyeong", name: "부평구" },
        { code: "gyeyang", name: "계양구" },
        { code: "seo", name: "서구" },
        { code: "ganghwa", name: "강화군" },
        { code: "ongjin", name: "옹진군" }
      ]
    },
    {
      code: "gwangju",
      name: "광주광역시",
      shortName: "광주",
      type: "metropolitan" as const,
      order: 5,
      districts: [
        { code: "dong", name: "동구" },
        { code: "seo", name: "서구" },
        { code: "nam", name: "남구" },
        { code: "buk", name: "북구" },
        { code: "gwangsan", name: "광산구" }
      ]
    },
    {
      code: "daejeon",
      name: "대전광역시",
      shortName: "대전",
      type: "metropolitan" as const,
      order: 6,
      districts: [
        { code: "dong", name: "동구" },
        { code: "jung", name: "중구" },
        { code: "seo", name: "서구" },
        { code: "yuseong", name: "유성구" },
        { code: "daedeok", name: "대덕구" }
      ]
    },
    {
      code: "ulsan",
      name: "울산광역시",
      shortName: "울산",
      type: "metropolitan" as const,
      order: 7,
      districts: [
        { code: "jung", name: "중구" },
        { code: "nam", name: "남구" },
        { code: "dong", name: "동구" },
        { code: "buk", name: "북구" },
        { code: "ulju", name: "울주군" }
      ]
    },
    {
      code: "sejong",
      name: "세종특별자치시",
      shortName: "세종",
      type: "special" as const,
      order: 8,
      districts: [
        { code: "sejong", name: "세종시", isSingleDistrict: true }
      ]
    },
    {
      code: "gyeonggi",
      name: "경기도",
      shortName: "경기",
      type: "province" as const,
      order: 9,
      districts: [
        { code: "suwon", name: "수원시" },
        { code: "seongnam", name: "성남시" },
        { code: "uijeongbu", name: "의정부시" },
        { code: "anyang", name: "안양시" },
        { code: "bucheon", name: "부천시" },
        { code: "gwangmyeong", name: "광명시" },
        { code: "pyeongtaek", name: "평택시" },
        { code: "dongducheon", name: "동두천시" },
        { code: "ansan", name: "안산시" },
        { code: "goyang", name: "고양시" },
        { code: "gwacheon", name: "과천시" },
        { code: "guri", name: "구리시" },
        { code: "namyangju", name: "남양주시" },
        { code: "osan", name: "오산시" },
        { code: "siheung", name: "시흥시" },
        { code: "gunpo", name: "군포시" },
        { code: "uiwang", name: "의왕시" },
        { code: "hanam", name: "하남시" },
        { code: "yongin", name: "용인시" },
        { code: "paju", name: "파주시" },
        { code: "icheon", name: "이천시" },
        { code: "anseong", name: "안성시" },
        { code: "gimpo", name: "김포시" },
        { code: "hwaseong", name: "화성시" },
        { code: "gwangju", name: "광주시" },
        { code: "yangju", name: "양주시" },
        { code: "pocheon", name: "포천시" },
        { code: "yeoju", name: "여주시" },
        { code: "yeoncheon", name: "연천군" },
        { code: "gapyeong", name: "가평군" },
        { code: "yangpyeong", name: "양평군" }
      ]
    },
    {
      code: "gangwon",
      name: "강원특별자치도",
      shortName: "강원",
      type: "special-province" as const,
      order: 10,
      districts: [
        { code: "chuncheon", name: "춘천시" },
        { code: "wonju", name: "원주시" },
        { code: "gangneung", name: "강릉시" },
        { code: "donghae", name: "동해시" },
        { code: "taebaek", name: "태백시" },
        { code: "sokcho", name: "속초시" },
        { code: "samcheok", name: "삼척시" },
        { code: "hongcheon", name: "홍천군" },
        { code: "hoengseong", name: "횡성군" },
        { code: "yeongwol", name: "영월군" },
        { code: "pyeongchang", name: "평창군" },
        { code: "jeongseon", name: "정선군" },
        { code: "cheorwon", name: "철원군" },
        { code: "hwacheon", name: "화천군" },
        { code: "yanggu", name: "양구군" },
        { code: "inje", name: "인제군" },
        { code: "goseong", name: "고성군" },
        { code: "yangyang", name: "양양군" }
      ]
    },
    {
      code: "chungbuk",
      name: "충청북도",
      shortName: "충북",
      type: "province" as const,
      order: 11,
      districts: [
        { code: "cheongju", name: "청주시" },
        { code: "chungju", name: "충주시" },
        { code: "jecheon", name: "제천시" },
        { code: "boeun", name: "보은군" },
        { code: "okcheon", name: "옥천군" },
        { code: "yeongdong", name: "영동군" },
        { code: "jeungpyeong", name: "증평군" },
        { code: "jincheon", name: "진천군" },
        { code: "goesan", name: "괴산군" },
        { code: "eumseong", name: "음성군" },
        { code: "danyang", name: "단양군" }
      ]
    },
    {
      code: "chungnam",
      name: "충청남도",
      shortName: "충남",
      type: "province" as const,
      order: 12,
      districts: [
        { code: "cheonan", name: "천안시" },
        { code: "gongju", name: "공주시" },
        { code: "boryeong", name: "보령시" },
        { code: "asan", name: "아산시" },
        { code: "seosan", name: "서산시" },
        { code: "nonsan", name: "논산시" },
        { code: "gyeryong", name: "계룡시" },
        { code: "dangjin", name: "당진시" },
        { code: "geumsan", name: "금산군" },
        { code: "buyeo", name: "부여군" },
        { code: "seocheon", name: "서천군" },
        { code: "cheongyang", name: "청양군" },
        { code: "hongseong", name: "홍성군" },
        { code: "yesan", name: "예산군" },
        { code: "taean", name: "태안군" }
      ]
    },
    {
      code: "jeonbuk",
      name: "전북특별자치도",
      shortName: "전북",
      type: "special-province" as const,
      order: 13,
      districts: [
        { code: "jeonju", name: "전주시" },
        { code: "gunsan", name: "군산시" },
        { code: "iksan", name: "익산시" },
        { code: "jeongeup", name: "정읍시" },
        { code: "namwon", name: "남원시" },
        { code: "gimje", name: "김제시" },
        { code: "wanju", name: "완주군" },
        { code: "jinan", name: "진안군" },
        { code: "muju", name: "무주군" },
        { code: "jangsu", name: "장수군" },
        { code: "imsil", name: "임실군" },
        { code: "sunchang", name: "순창군" },
        { code: "gochang", name: "고창군" },
        { code: "buan", name: "부안군" }
      ]
    },
    {
      code: "jeonnam",
      name: "전라남도",
      shortName: "전남",
      type: "province" as const,
      order: 14,
      districts: [
        { code: "mokpo", name: "목포시", mergedWith: ["sinan"], isPrimary: true },
        { code: "yeosu", name: "여수시" },
        { code: "suncheon", name: "순천시" },
        { code: "naju", name: "나주시" },
        { code: "gwangyang", name: "광양시" },
        { code: "damyang", name: "담양군" },
        { code: "gokseong", name: "곡성군" },
        { code: "gurye", name: "구례군" },
        { code: "goheung", name: "고흥군" },
        { code: "boseong", name: "보성군" },
        { code: "hwasun", name: "화순군" },
        { code: "jangheung", name: "장흥군" },
        { code: "gangjin", name: "강진군" },
        { code: "haenam", name: "해남군" },
        { code: "yeongam", name: "영암군" },
        { code: "muan", name: "무안군" },
        { code: "hampyeong", name: "함평군" },
        { code: "yeonggwang", name: "영광군" },
        { code: "jangseong", name: "장성군" },
        { code: "wando", name: "완도군" },
        { code: "jindo", name: "진도군" },
        { code: "sinan", name: "신안군", mergedWith: ["mokpo"], isPrimary: false }
      ]
    },
    {
      code: "gyeongbuk",
      name: "경상북도",
      shortName: "경북",
      type: "province" as const,
      order: 15,
      districts: [
        { code: "pohang", name: "포항시" },
        { code: "gyeongju", name: "경주시" },
        { code: "gimcheon", name: "김천시" },
        { code: "andong", name: "안동시" },
        { code: "gumi", name: "구미시" },
        { code: "yeongju", name: "영주시" },
        { code: "yeongcheon", name: "영천시" },
        { code: "sangju", name: "상주시" },
        { code: "mungyeong", name: "문경시" },
        { code: "gyeongsan", name: "경산시" },
        { code: "uiseong", name: "의성군" },
        { code: "cheongsong", name: "청송군" },
        { code: "yeongyang", name: "영양군" },
        { code: "yeongdeok", name: "영덕군" },
        { code: "cheongdo", name: "청도군" },
        { code: "goryeong", name: "고령군" },
        { code: "seongju", name: "성주군" },
        { code: "chilgok", name: "칠곡군" },
        { code: "yecheon", name: "예천군" },
        { code: "bonghwa", name: "봉화군" },
        { code: "uljin", name: "울진군" },
        { code: "ulleung", name: "울릉군" }
      ]
    },
    {
      code: "gyeongnam",
      name: "경상남도",
      shortName: "경남",
      type: "province" as const,
      order: 16,
      districts: [
        { code: "changwon", name: "창원시" },
        { code: "jinju", name: "진주시" },
        { code: "tongyeong", name: "통영시" },
        { code: "sacheon", name: "사천시" },
        { code: "gimhae", name: "김해시" },
        { code: "miryang", name: "밀양시" },
        { code: "geoje", name: "거제시" },
        { code: "yangsan", name: "양산시" },
        { code: "uiryeong", name: "의령군" },
        { code: "haman", name: "함안군" },
        { code: "changnyeong", name: "창녕군" },
        { code: "goseong", name: "고성군" },
        { code: "namhae", name: "남해군" },
        { code: "hadong", name: "하동군" },
        { code: "sancheong", name: "산청군" },
        { code: "hamyang", name: "함양군" },
        { code: "geochang", name: "거창군" },
        { code: "hapcheon", name: "합천군" }
      ]
    },
    {
      code: "jeju",
      name: "제주특별자치도",
      shortName: "제주",
      type: "special-province" as const,
      order: 17,
      districts: [
        { code: "jeju", name: "제주시" },
        { code: "seogwipo", name: "서귀포시" }
      ]
    }
  ]
};
