import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 생성 (Server Component용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// post 타입 정의
interface Post {
  id: string;
  title: string;
  created_at: string;
}

// posts 테이블에서 최신 기사 목록 가져오기
async function getPosts(): Promise<Post[]> {
  try {
    // 환경 변수가 설정되지 않은 경우 빈 배열 반환
    if (!supabaseUrl || supabaseUrl.includes('[')) {
      console.log('Supabase 환경 변수가 설정되지 않았습니다.');
      return [];
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase
      .from('posts')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('게시물 조회 에러:', error.message);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('데이터베이스 연결 에러:', error);
    return [];
  }
}

// 메인 페이지 컴포넌트
export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 2단 레이아웃: Grid 사용 (70% / 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">

        {/* 왼쪽: 최신 기사 목록 (70%) */}
        <section className="lg:col-span-7">
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#003366' }}>
            최신 뉴스
          </h2>

          {posts.length > 0 ? (
            <ul className="space-y-4">
              {posts.map((post) => (
                <li
                  key={post.id}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-700 cursor-pointer">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500">
                아직 게시된 기사가 없습니다.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Supabase 연동 후 posts 테이블에 데이터를 추가해 주세요.
              </p>
            </div>
          )}
        </section>

        {/* 오른쪽: 사이드바 - 인기 뉴스 (30%) */}
        <aside className="lg:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#003366' }}>
              인기 뉴스
            </h2>
            <ul className="space-y-3">
              <li className="text-gray-500 text-sm">
                인기 뉴스가 표시됩니다.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
