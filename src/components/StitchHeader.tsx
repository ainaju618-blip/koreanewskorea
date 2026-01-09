'use client';

import NajuHeader from './region/NajuHeader';

/**
 * StitchHeader - 나주 전용 사이트 헤더
 * koreanewskorea는 나주 지역 전용 홈페이지이므로
 * 모든 페이지에서 NajuHeader를 사용합니다.
 */
export default function StitchHeader() {
  return <NajuHeader />;
}
