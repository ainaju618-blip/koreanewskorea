'use client';

import NajuHeader from './region/NajuHeader';

interface StitchHeaderProps {
  children?: React.ReactNode;
}

/**
 * StitchHeader - 나주 전용 사이트 헤더
 * koreanewskorea는 나주 지역 전용 홈페이지이므로
 * 모든 페이지에서 NajuHeader를 사용합니다.
 * children prop을 통해 페이지 콘텐츠를 전달받아
 * 기자 로그인 모드에서 페이지 전환이 가능합니다.
 */
export default function StitchHeader({ children }: StitchHeaderProps) {
  return <NajuHeader>{children}</NajuHeader>;
}
