import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**"],
  },
  {
    rules: {
      // any 타입 사용 시 경고 (점진적 마이그레이션을 위해 warn으로 시작)
      "@typescript-eslint/no-explicit-any": "warn",
      // 미사용 변수 에러 처리
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "react/no-unescaped-entities": "off",
      // const 사용 강제
      "prefer-const": "error",
      "@typescript-eslint/no-require-imports": "off",
      // 추가 규칙: 일관성 강화
      "no-console": ["warn", { "allow": ["warn", "error"] }],
      "eqeqeq": ["error", "always"],
    },
  },
];

export default eslintConfig;
