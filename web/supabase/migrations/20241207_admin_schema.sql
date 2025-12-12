-- 1. PROFILES 테이블 생성 (사용자 권한 관리)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  role text check (role in ('admin', 'editor', 'reporter')) default 'reporter',
  full_name text,
  department text, -- 소속 부서 (예: 나주팀, 사회부)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles 테이블에 RLS(행 수준 보안) 활성화
alter table public.profiles enable row level security;

-- Profiles 보안 정책 (Policies)
create policy "프로필은 누구나 조회 가능" on public.profiles
  for select using (true);

create policy "사용자는 자신의 프로필을 생성 가능" on public.profiles
  for insert with check (auth.uid() = id);

create policy "사용자는 자신의 프로필만 수정 가능" on public.profiles
  for update using (auth.uid() = id);

-- 2. POSTS 테이블 업데이트 (관리자용 컬럼 추가)
alter table public.posts add column if not exists author_id uuid references public.profiles(id);
alter table public.posts add column if not exists reporter_name text; -- 기명 기사 표시용
alter table public.posts add column if not exists rejected_reason text; -- 반려 사유
alter table public.posts add column if not exists view_count integer default 0; -- 조회수
alter table public.posts add column if not exists is_notice boolean default false; -- 긴급 공지 여부

-- 상태(Status) 제약 조건 업데이트 ('review', 'rejected' 추가)
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check 
  check (status in ('draft', 'review', 'published', 'rejected', 'archived'));

-- 3. POSTS 테이블 RLS 정책 설정
alter table public.posts enable row level security;

-- 정책 1: 발행된(published) 기사는 누구나 볼 수 있음
create policy "발행된 기사는 누구나 조회 가능" on public.posts
  for select using (status = 'published');

-- 정책 2: 기자는 자신이 쓴 기사를 볼 수 있음 (모든 상태)
create policy "기자는 자신의 기사를 조회 가능" on public.posts
  for select using (auth.uid() = author_id);

-- 정책 3: 관리자/편집자는 모든 기사를 볼 수 있음 (검수용)
create policy "관리자는 모든 기사를 조회 가능" on public.posts
  for select using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- 정책 4: 기자는 기사를 작성(insert)할 수 있음
create policy "기자는 기사를 작성 가능" on public.posts
  for insert with check (auth.uid() = author_id);

-- 정책 5: 기자는 자신의 '임시저장' 또는 '반려' 상태인 기사만 수정 가능
create policy "기자는 임시저장 및 반려된 글만 수정 가능" on public.posts
  for update using (
    auth.uid() = author_id and status in ('draft', 'rejected')
  );

-- 정책 6: 관리자/편집자는 모든 기사를 수정 가능 (승인, 반려, 발행)
create policy "관리자는 모든 기사를 수정 가능" on public.posts
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- 4. 봇 권한 설정 (선택사항)
-- insert into public.profiles (id, role, full_name) values ('BOT_UUID_HERE', 'editor', 'News Bot');
