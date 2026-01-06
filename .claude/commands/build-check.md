# 빌드 체크 커맨드

코드 변경 후 타입 체크와 빌드를 한번에 실행합니다.

## 실행 순서

### 1단계: 타입 체크
```bash
cd d:\cbt\koreanewskorea
npx tsc --noEmit
```

**예상 결과:** 에러 없이 완료

### 2단계: 빌드 테스트
```bash
npm run build
```

**예상 결과:**
- `✓ Compiled successfully`
- `.next` 폴더 생성

## 에러 발생 시

### 타입 에러
```
error TS2304: Cannot find name 'xxx'
```
→ 해당 파일에서 타입 정의 확인/수정

### 빌드 에러
```
Error: Build failed
```
→ 에러 메시지 확인 후 해당 파일 수정

## 성공 기준

- ✅ `npx tsc --noEmit` 에러 없음
- ✅ `npm run build` 성공
- ✅ 경고(warning)는 허용, 에러(error)만 수정

## 배포 전 필수

이 커맨드가 성공해야만 Git 커밋 및 Vercel 배포 진행!
