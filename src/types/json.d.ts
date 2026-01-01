// JSON module type declarations
declare module '*.json' {
  const value: unknown;
  export default value;
}

// Specific type for yao-384.json
declare module '@/data/yao-384.json' {
  interface YaoDataItem {
    hex: number;
    yao: number;
    name: string;
    text_hanja: string;
    text_kr: string;
    interpretation: string;
    fortune_score: number;
    fortune_category: string;
    keywords: string[];
  }
  const value: YaoDataItem[];
  export default value;
}
