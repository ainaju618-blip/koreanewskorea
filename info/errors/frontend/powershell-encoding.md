# PowerShell 한글 인코딩 손상 문제

> **분류:** 프론트엔드 / 인코딩
> **최초 발생:** 2025-12-17
> **해결자:** Claude
> **심각도:** High (프로덕션 UI 깨짐)

---

## 증상

- TSX/TS 파일의 한글 문자가 `?` 또는 깨진 문자로 변환됨
- 예시: `카테고리 정의` -> `카테고리 ?�???�의`
- 예시: `구독신청` -> `구독?�청`
- 예시: `코리아` -> `코리??`
- 브라우저에서 UI 텍스트가 깨져서 표시됨

---

## 원인

### PowerShell의 기본 인코딩 문제

Windows PowerShell에서 파일 편집 시 UTF-8 인코딩이 제대로 처리되지 않음:

```powershell
# 문제가 되는 명령어 예시
(Get-Content -Path "file.tsx") -replace "old", "new" | Set-Content -Path "file.tsx"
```

PowerShell의 `Get-Content`와 `Set-Content`는 기본적으로 시스템 기본 인코딩(cp949/EUC-KR)을 사용하여 UTF-8 파일의 한글이 손상됨.

### 발생 상황

1. Claude Code의 Edit 도구가 내부적으로 PowerShell 명령어를 사용할 때
2. 파일에 한글이 포함된 경우
3. 특히 주석, 문자열 리터럴, aria-label 등에서 발생

---

## 해결 방법

### 1. 즉시 복구 (Git 사용)

```bash
# 변경 사항 버리고 원래 상태로 복구
git checkout src/components/Header.tsx

# 또는 특정 커밋으로 복구
git checkout HEAD~1 -- src/components/Header.tsx
```

### 2. 수동 복구

손상된 텍스트를 올바른 한글로 교체:

| 손상된 텍스트 | 올바른 텍스트 |
|--------------|--------------|
| `?�???�의` | `정의` |
| `?�청` | `신청` |
| `로그??` | `로그인` |
| `?�스TV` | `뉴스TV` |
| `?�체메뉴` | `전체메뉴` |
| `?�기` | `열기` 또는 `닫기` |
| `코리??` | `코리아` |

### 3. 예방책 (PowerShell에서 UTF-8 강제)

```powershell
# UTF-8 인코딩 명시
$content = Get-Content -Path "file.tsx" -Encoding UTF8
$content | Set-Content -Path "file.tsx" -Encoding UTF8
```

---

## 예방 규칙

### AI Agent 규칙 (MUST)

1. **한글이 포함된 파일 편집 시 주의**
   - Edit 도구 사용 후 결과 확인
   - 한글이 깨졌는지 체크

2. **대량 편집보다 작은 단위 편집 선호**
   - 한 번에 많은 한글을 포함한 수정은 위험

3. **편집 후 즉시 검증**
   ```bash
   # 파일 내용 확인
   git diff src/components/Header.tsx
   ```

4. **문제 발생 시 즉시 복구**
   - 커밋하지 않았다면: `git checkout <file>`
   - 커밋했다면: 수동 수정 후 재커밋

### 파일 저장 시 인코딩 확인

VSCode에서:
- 우측 하단 인코딩 확인 (UTF-8이어야 함)
- "Save with Encoding" -> "UTF-8" 선택

---

## 영향받는 파일 유형

- `.tsx` - React 컴포넌트
- `.ts` - TypeScript 파일
- `.json` - 한글 포함 설정 파일
- `.md` - 마크다운 문서

---

## 관련 이슈

- Header.tsx 인코딩 손상 (2025-12-17)
  - 20개 이상의 한글 텍스트 손상
  - 커밋 325ce66에서 복구

---

## 참고

- Windows 환경에서만 발생
- macOS/Linux에서는 기본 UTF-8이라 발생하지 않음
- Node.js 기반 도구는 UTF-8 기본이라 안전

---

*최종 업데이트: 2025-12-17*
