// Layout Editor Types

export interface StyleMap {
  [selector: string]: {
    [property: string]: string;
  };
}

export interface PageStyles {
  [pagePath: string]: StyleMap;
}

export interface LayoutEditorState {
  version: string;
  lastModified: string;
  styles: PageStyles;
}

export interface ElementInfo {
  selector: string;
  tagName: string;
  className: string;
  id: string;
  computedStyles: Record<string, string>;
  boundingRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
}

export interface PendingChange {
  selector: string;
  property: string;
  oldValue: string;
  newValue: string;
}

export interface PropertyDef {
  key: string;
  label: string;
  type: 'text' | 'select' | 'color' | 'range';
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export const EDITABLE_PROPERTIES: Record<string, PropertyDef[]> = {
  layout: [
    { key: 'width', label: '너비', type: 'text' },
    { key: 'height', label: '높이', type: 'text' },
    { key: 'padding', label: '안쪽 여백', type: 'text' },
    { key: 'paddingTop', label: '위쪽 안쪽 여백', type: 'text' },
    { key: 'paddingRight', label: '오른쪽 안쪽 여백', type: 'text' },
    { key: 'paddingBottom', label: '아래쪽 안쪽 여백', type: 'text' },
    { key: 'paddingLeft', label: '왼쪽 안쪽 여백', type: 'text' },
    { key: 'margin', label: '바깥 여백', type: 'text' },
    { key: 'marginTop', label: '위쪽 바깥 여백', type: 'text' },
    { key: 'marginRight', label: '오른쪽 바깥 여백', type: 'text' },
    { key: 'marginBottom', label: '아래쪽 바깥 여백', type: 'text' },
    { key: 'marginLeft', label: '왼쪽 바깥 여백', type: 'text' },
    { key: 'display', label: '표시 방식', type: 'select', options: ['block', 'flex', 'grid', 'inline', 'inline-block', 'none'] },
    { key: 'position', label: '위치 방식', type: 'select', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
  ],
  typography: [
    { key: 'fontSize', label: '글자 크기', type: 'text' },
    { key: 'fontWeight', label: '글자 굵기', type: 'select', options: ['100', '200', '300', '400', '500', '600', '700', '800', '900'] },
    { key: 'lineHeight', label: '줄 높이', type: 'text' },
    { key: 'letterSpacing', label: '자간', type: 'text' },
    { key: 'color', label: '글자 색상', type: 'color' },
    { key: 'textAlign', label: '정렬', type: 'select', options: ['left', 'center', 'right', 'justify'] },
  ],
  background: [
    { key: 'backgroundColor', label: '배경 색상', type: 'color' },
    { key: 'backgroundImage', label: '배경 이미지', type: 'text' },
    { key: 'opacity', label: '투명도', type: 'range', min: 0, max: 1, step: 0.1 },
  ],
  border: [
    { key: 'borderWidth', label: '테두리 두께', type: 'text' },
    { key: 'borderStyle', label: '테두리 스타일', type: 'select', options: ['none', 'solid', 'dashed', 'dotted', 'double'] },
    { key: 'borderColor', label: '테두리 색상', type: 'color' },
    { key: 'borderRadius', label: '모서리 둥글기', type: 'text' },
    { key: 'boxShadow', label: '그림자', type: 'text' },
  ],
  flexbox: [
    { key: 'flexDirection', label: '배치 방향', type: 'select', options: ['row', 'row-reverse', 'column', 'column-reverse'] },
    { key: 'justifyContent', label: '가로 정렬', type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
    { key: 'alignItems', label: '세로 정렬', type: 'select', options: ['flex-start', 'flex-end', 'center', 'stretch', 'baseline'] },
    { key: 'gap', label: '간격', type: 'text' },
    { key: 'flexWrap', label: '줄바꿈', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'] },
  ],
};

// Section labels for PropertyPanel
export const SECTION_LABELS: Record<string, string> = {
  layout: '레이아웃',
  typography: '타이포그래피',
  background: '배경',
  border: '테두리',
  flexbox: '플렉스박스',
};

export const PAGE_LIST = [
  { path: '/', name: '홈', group: '공개' },
  { path: '/news', name: '뉴스 목록', group: '공개' },
  { path: '/divination', name: '운세/점술', group: '공개' },
  { path: '/category/gwangju', name: '광주', group: '카테고리' },
  { path: '/category/jeonnam', name: '전남', group: '카테고리' },
  { path: '/admin', name: '관리자 홈', group: '관리자' },
  { path: '/admin/news', name: '기사 관리', group: '관리자' },
  { path: '/admin/bot/run', name: '봇 제어', group: '관리자' },
] as const;
