/**
 * 최소 테스트 페이지 - 외부 호출 없이 텍스트만 반환
 * 디버깅 목적: 서버가 정상적으로 응답하는지 확인
 */

export default function TestPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Health Check</h1>
      <p>서버가 정상적으로 응답합니다.</p>
      <p>Time: {new Date().toISOString()}</p>
      <hr />
      <ul>
        <li><a href="/">홈페이지 (/)</a></li>
        <li><a href="/sample/naju-a">샘플 A안 (/sample/naju-a)</a></li>
        <li><a href="/sample/naju-b">샘플 B안 (/sample/naju-b)</a></li>
      </ul>
    </div>
  );
}
