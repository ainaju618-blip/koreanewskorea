'use client';

import { useState, useMemo } from 'react';

interface Category {
  id: number;
  major_id: number;
  sub_name: string;
}

interface CategorySelectorProps {
  selectedMajor: number;
  selectedSub: number | null;
  onMajorChange: (majorId: number) => void;
  onSubChange: (subId: number) => void;
}

// 9개 대분류
const MAJOR_CATEGORIES = [
  { id: 1, name: '재물', emoji: '💰' },
  { id: 2, name: '직업', emoji: '💼' },
  { id: 3, name: '학업', emoji: '📚' },
  { id: 4, name: '연애', emoji: '💕' },
  { id: 5, name: '대인', emoji: '👥' },
  { id: 6, name: '건강', emoji: '🏥' },
  { id: 7, name: '취미', emoji: '🎮' },
  { id: 8, name: '운명', emoji: '✨' },
  { id: 9, name: '기타', emoji: '🔮' },
];

// 170개 소분류 (백엔드 category_seed.py와 동기화)
const SUB_CATEGORIES: Category[] = [
  // 재물 (1-20, 101-115)
  { id: 1, major_id: 1, sub_name: '주식/증권' },
  { id: 2, major_id: 1, sub_name: '코인/가상자산' },
  { id: 3, major_id: 1, sub_name: '부동산' },
  { id: 4, major_id: 1, sub_name: '대출/빚' },
  { id: 5, major_id: 1, sub_name: '저축/적금' },
  { id: 6, major_id: 1, sub_name: '사업자금' },
  { id: 7, major_id: 1, sub_name: '로또/복권' },
  { id: 8, major_id: 1, sub_name: '월급/수입' },
  { id: 9, major_id: 1, sub_name: '펀드/ETF' },
  { id: 10, major_id: 1, sub_name: '세금/절세' },
  { id: 11, major_id: 1, sub_name: '보험금' },
  { id: 12, major_id: 1, sub_name: '증여/상속' },
  { id: 13, major_id: 1, sub_name: '연금' },
  { id: 14, major_id: 1, sub_name: '창업자금' },
  { id: 15, major_id: 1, sub_name: '투자타이밍' },
  { id: 16, major_id: 1, sub_name: '재무설계' },
  { id: 17, major_id: 1, sub_name: '경매/낙찰' },
  { id: 18, major_id: 1, sub_name: '부업수입' },
  { id: 19, major_id: 1, sub_name: '주식매매타이밍' },
  { id: 20, major_id: 1, sub_name: '채권/이자' },
  { id: 101, major_id: 1, sub_name: '금/은/귀금속' },
  { id: 102, major_id: 1, sub_name: '환전/외화' },
  { id: 103, major_id: 1, sub_name: '사업확장' },
  { id: 104, major_id: 1, sub_name: '계약/거래' },
  { id: 105, major_id: 1, sub_name: '경매입찰' },
  { id: 106, major_id: 1, sub_name: '보증금/전세금' },
  { id: 107, major_id: 1, sub_name: '퇴직금' },
  { id: 108, major_id: 1, sub_name: '용돈협상' },
  { id: 109, major_id: 1, sub_name: '중고거래' },
  { id: 110, major_id: 1, sub_name: '재테크전략' },
  { id: 111, major_id: 1, sub_name: '빚독촉' },
  { id: 112, major_id: 1, sub_name: '횡재/뜻밖의돈' },
  { id: 113, major_id: 1, sub_name: '사기/피해' },
  { id: 114, major_id: 1, sub_name: '후원/기부' },
  { id: 115, major_id: 1, sub_name: '물품구매타이밍' },

  // 직업 (21-35, 116-130)
  { id: 21, major_id: 2, sub_name: '이직' },
  { id: 22, major_id: 2, sub_name: '취업/면접' },
  { id: 23, major_id: 2, sub_name: '승진' },
  { id: 24, major_id: 2, sub_name: '퇴사' },
  { id: 25, major_id: 2, sub_name: '창업' },
  { id: 26, major_id: 2, sub_name: '연봉협상' },
  { id: 27, major_id: 2, sub_name: '사업운' },
  { id: 28, major_id: 2, sub_name: '프리랜서' },
  { id: 29, major_id: 2, sub_name: '부업' },
  { id: 30, major_id: 2, sub_name: '해외취업' },
  { id: 31, major_id: 2, sub_name: '공무원시험' },
  { id: 32, major_id: 2, sub_name: '대기업취업' },
  { id: 33, major_id: 2, sub_name: '스타트업' },
  { id: 34, major_id: 2, sub_name: '직장인관계' },
  { id: 35, major_id: 2, sub_name: '워라밸' },
  { id: 116, major_id: 2, sub_name: '파견/용역' },
  { id: 117, major_id: 2, sub_name: '재택근무' },
  { id: 118, major_id: 2, sub_name: '야근/초과근무' },
  { id: 119, major_id: 2, sub_name: '육아휴직' },
  { id: 120, major_id: 2, sub_name: '정년/은퇴' },
  { id: 121, major_id: 2, sub_name: '복리후생' },
  { id: 122, major_id: 2, sub_name: '직장갑질' },
  { id: 123, major_id: 2, sub_name: '부서배치' },
  { id: 124, major_id: 2, sub_name: '평가/고과' },
  { id: 125, major_id: 2, sub_name: '자격증취득' },
  { id: 126, major_id: 2, sub_name: '노동조합' },
  { id: 127, major_id: 2, sub_name: '구인구직' },
  { id: 128, major_id: 2, sub_name: '사업정리' },
  { id: 129, major_id: 2, sub_name: '투자유치' },
  { id: 130, major_id: 2, sub_name: '특허/지재권' },

  // 학업 (36-45, 131-140)
  { id: 36, major_id: 3, sub_name: '수능/입시' },
  { id: 37, major_id: 3, sub_name: '내신/성적' },
  { id: 38, major_id: 3, sub_name: '자격시험' },
  { id: 39, major_id: 3, sub_name: '어학시험' },
  { id: 40, major_id: 3, sub_name: '유학' },
  { id: 41, major_id: 3, sub_name: '대학원' },
  { id: 42, major_id: 3, sub_name: '편입' },
  { id: 43, major_id: 3, sub_name: '공부방법' },
  { id: 44, major_id: 3, sub_name: '집중력' },
  { id: 45, major_id: 3, sub_name: '학습환경' },
  { id: 131, major_id: 3, sub_name: '논문/연구' },
  { id: 132, major_id: 3, sub_name: '장학금' },
  { id: 133, major_id: 3, sub_name: '졸업' },
  { id: 134, major_id: 3, sub_name: '학교선택' },
  { id: 135, major_id: 3, sub_name: '전공선택' },
  { id: 136, major_id: 3, sub_name: '과외/학원' },
  { id: 137, major_id: 3, sub_name: '수행평가' },
  { id: 138, major_id: 3, sub_name: '학점교류' },
  { id: 139, major_id: 3, sub_name: '재수/반수' },
  { id: 140, major_id: 3, sub_name: '입학사정관' },

  // 연애 (46-60, 141-155)
  { id: 46, major_id: 4, sub_name: '호감/썸' },
  { id: 47, major_id: 4, sub_name: '고백' },
  { id: 48, major_id: 4, sub_name: '재회' },
  { id: 49, major_id: 4, sub_name: '결혼' },
  { id: 50, major_id: 4, sub_name: '이별' },
  { id: 51, major_id: 4, sub_name: '소개팅' },
  { id: 52, major_id: 4, sub_name: '짝사랑' },
  { id: 53, major_id: 4, sub_name: '연인관계' },
  { id: 54, major_id: 4, sub_name: '권태기' },
  { id: 55, major_id: 4, sub_name: '바람/외도' },
  { id: 56, major_id: 4, sub_name: '장거리연애' },
  { id: 57, major_id: 4, sub_name: '나이차연애' },
  { id: 58, major_id: 4, sub_name: '직장연애' },
  { id: 59, major_id: 4, sub_name: '데이팅앱' },
  { id: 60, major_id: 4, sub_name: '프로포즈' },
  { id: 141, major_id: 4, sub_name: '상견례' },
  { id: 142, major_id: 4, sub_name: '예물/예단' },
  { id: 143, major_id: 4, sub_name: '신혼집' },
  { id: 144, major_id: 4, sub_name: '군입대' },
  { id: 145, major_id: 4, sub_name: '결혼정보회사' },
  { id: 146, major_id: 4, sub_name: '국제연애' },
  { id: 147, major_id: 4, sub_name: '부부싸움' },
  { id: 148, major_id: 4, sub_name: '이혼' },
  { id: 149, major_id: 4, sub_name: '돌싱/재혼' },
  { id: 150, major_id: 4, sub_name: '성격차이' },
  { id: 151, major_id: 4, sub_name: '신뢰/의심' },
  { id: 152, major_id: 4, sub_name: '만남주기' },
  { id: 153, major_id: 4, sub_name: '혼전임신' },
  { id: 154, major_id: 4, sub_name: '매너/에티켓' },
  { id: 155, major_id: 4, sub_name: '첫만남' },

  // 대인 (61-68, 156-165)
  { id: 61, major_id: 5, sub_name: '친구관계' },
  { id: 62, major_id: 5, sub_name: '직장동료' },
  { id: 63, major_id: 5, sub_name: '상사관계' },
  { id: 64, major_id: 5, sub_name: '부모관계' },
  { id: 65, major_id: 5, sub_name: '형제관계' },
  { id: 66, major_id: 5, sub_name: '이웃관계' },
  { id: 67, major_id: 5, sub_name: '모임/단체' },
  { id: 68, major_id: 5, sub_name: '갈등해결' },
  { id: 156, major_id: 5, sub_name: '상속갈등' },
  { id: 157, major_id: 5, sub_name: '친척관계' },
  { id: 158, major_id: 5, sub_name: '학교친구' },
  { id: 159, major_id: 5, sub_name: '동네/마을' },
  { id: 160, major_id: 5, sub_name: '종교모임' },
  { id: 161, major_id: 5, sub_name: '동업자' },
  { id: 162, major_id: 5, sub_name: '집단따돌림' },
  { id: 163, major_id: 5, sub_name: '오해/갈등해소' },
  { id: 164, major_id: 5, sub_name: '사과/용서' },
  { id: 165, major_id: 5, sub_name: '새친구' },

  // 건강 (69-78, 166-170)
  { id: 69, major_id: 6, sub_name: '질병/치료' },
  { id: 70, major_id: 6, sub_name: '다이어트' },
  { id: 71, major_id: 6, sub_name: '운동' },
  { id: 72, major_id: 6, sub_name: '수면' },
  { id: 73, major_id: 6, sub_name: '스트레스' },
  { id: 74, major_id: 6, sub_name: '정신건강' },
  { id: 75, major_id: 6, sub_name: '수술' },
  { id: 76, major_id: 6, sub_name: '임신/출산' },
  { id: 77, major_id: 6, sub_name: '금연/금주' },
  { id: 78, major_id: 6, sub_name: '체력관리' },
  { id: 166, major_id: 6, sub_name: '한의원/한방' },
  { id: 167, major_id: 6, sub_name: '물리치료' },
  { id: 168, major_id: 6, sub_name: '건강검진' },
  { id: 169, major_id: 6, sub_name: '수면/불면' },
  { id: 170, major_id: 6, sub_name: '식이요법' },

  // 취미 (79-88)
  { id: 79, major_id: 7, sub_name: '여행' },
  { id: 80, major_id: 7, sub_name: '게임' },
  { id: 81, major_id: 7, sub_name: '스포츠' },
  { id: 82, major_id: 7, sub_name: '독서' },
  { id: 83, major_id: 7, sub_name: '음악' },
  { id: 84, major_id: 7, sub_name: '미술/그림' },
  { id: 85, major_id: 7, sub_name: '요리' },
  { id: 86, major_id: 7, sub_name: '영화/드라마' },
  { id: 87, major_id: 7, sub_name: '사진/영상' },
  { id: 88, major_id: 7, sub_name: '글쓰기' },

  // 운명 (89-96)
  { id: 89, major_id: 8, sub_name: '이사' },
  { id: 90, major_id: 8, sub_name: '방향/풍수' },
  { id: 91, major_id: 8, sub_name: '행운의시기' },
  { id: 92, major_id: 8, sub_name: '운명의상대' },
  { id: 93, major_id: 8, sub_name: '전생/인연' },
  { id: 94, major_id: 8, sub_name: '액땜' },
  { id: 95, major_id: 8, sub_name: '별자리' },
  { id: 96, major_id: 8, sub_name: '부적/액막이' },

  // 기타 (97-100)
  { id: 97, major_id: 9, sub_name: '일반운세' },
  { id: 98, major_id: 9, sub_name: '선택고민' },
  { id: 99, major_id: 9, sub_name: '기타질문' },
  { id: 100, major_id: 9, sub_name: '미분류' },
];

export default function CategorySelector({
  selectedMajor,
  selectedSub,
  onMajorChange,
  onSubChange,
}: CategorySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // 선택된 대분류의 소분류 목록
  const filteredSubCategories = useMemo(() => {
    let subs = SUB_CATEGORIES.filter((cat) => cat.major_id === selectedMajor);

    if (searchTerm) {
      subs = subs.filter((cat) =>
        cat.sub_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return subs;
  }, [selectedMajor, searchTerm]);

  // 선택된 소분류 이름
  const selectedSubName = useMemo(() => {
    const sub = SUB_CATEGORIES.find((cat) => cat.id === selectedSub);
    return sub?.sub_name || '선택하세요';
  }, [selectedSub]);

  const selectedMajorInfo = MAJOR_CATEGORIES.find((m) => m.id === selectedMajor);

  return (
    <div className="space-y-4">
      {/* 대분류 탭 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          대분류 선택
        </label>
        <div className="flex flex-wrap gap-2">
          {MAJOR_CATEGORIES.map((major) => (
            <button
              key={major.id}
              onClick={() => {
                onMajorChange(major.id);
                setSearchTerm('');
              }}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  selectedMajor === major.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className="mr-1">{major.emoji}</span>
              {major.name}
            </button>
          ))}
        </div>
      </div>

      {/* 소분류 드롭다운 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {selectedMajorInfo?.emoji} {selectedMajorInfo?.name} 세부 카테고리
          <span className="text-xs text-gray-500 ml-2">
            ({filteredSubCategories.length}개)
          </span>
        </label>

        {/* 검색 + 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-left flex items-center justify-between hover:border-amber-400/30 transition"
          >
            <span className={selectedSub ? 'text-white' : 'text-gray-500'}>
              {selectedSubName}
            </span>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 드롭다운 목록 */}
          {isExpanded && (
            <div className="absolute z-20 w-full mt-2 bg-gray-900/95 backdrop-blur-md rounded-xl shadow-xl border border-white/10 max-h-64 overflow-hidden">
              {/* 검색 */}
              <div className="p-2 border-b border-white/10">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색..."
                  className="w-full px-3 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
                />
              </div>

              {/* 목록 */}
              <div className="overflow-y-auto max-h-48">
                {filteredSubCategories.length > 0 ? (
                  filteredSubCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSubChange(cat.id);
                        setIsExpanded(false);
                        setSearchTerm('');
                      }}
                      className={`
                        w-full px-4 py-2 text-left text-sm hover:bg-amber-500/10 transition
                        ${selectedSub === cat.id ? 'bg-amber-500/20 text-amber-300' : 'text-gray-300'}
                      `}
                    >
                      {cat.sub_name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    검색 결과가 없습니다
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
