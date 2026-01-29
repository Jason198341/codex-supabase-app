-- =============================================
-- 판사님 앱 데이터베이스 스키마
-- Supabase Dashboard > SQL Editor에서 실행
-- =============================================

-- 1. 프로필 테이블
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_url text,
  nickname text,
  points integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. 사건(케이스) 테이블
create table public.cases (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  content text not null,
  category text not null, -- 연애, 직장, 가족, 돈, 기타

  -- AI 판결
  ai_verdict text, -- 유죄/무죄/애매
  ai_analysis text, -- AI 분석 내용
  ai_ratio text, -- "6:4 원고 과실" 형태

  -- 투표 집계
  guilty_count integer default 0,
  not_guilty_count integer default 0,

  -- 상태
  status text default 'open', -- open, closed, premium
  is_hot boolean default false,
  view_count integer default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 투표 테이블
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vote text not null, -- 'guilty' or 'not_guilty'
  created_at timestamptz default now(),

  unique(case_id, user_id) -- 1인 1투표
);

-- 4. 댓글 테이블
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  case_id uuid references public.cases(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  side text, -- 'guilty', 'not_guilty', null(중립)
  likes integer default 0,
  created_at timestamptz default now()
);

-- 5. 댓글 좋아요 테이블
create table public.comment_likes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),

  unique(comment_id, user_id)
);

-- =============================================
-- RLS (Row Level Security) 정책
-- =============================================

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.votes enable row level security;
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;

-- 프로필: 본인만 수정, 모두 조회 가능
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- 케이스: 모두 조회, 로그인 유저만 작성
create policy "Cases are viewable by everyone"
  on cases for select using (true);

create policy "Authenticated users can create cases"
  on cases for insert with check (auth.uid() = user_id);

create policy "Users can update own cases"
  on cases for update using (auth.uid() = user_id);

-- 투표: 모두 조회, 로그인 유저만 투표
create policy "Votes are viewable by everyone"
  on votes for select using (true);

create policy "Authenticated users can vote"
  on votes for insert with check (auth.uid() = user_id);

-- 댓글: 모두 조회, 로그인 유저만 작성
create policy "Comments are viewable by everyone"
  on comments for select using (true);

create policy "Authenticated users can comment"
  on comments for insert with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on comments for delete using (auth.uid() = user_id);

-- 댓글 좋아요
create policy "Comment likes are viewable by everyone"
  on comment_likes for select using (true);

create policy "Authenticated users can like"
  on comment_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike"
  on comment_likes for delete using (auth.uid() = user_id);

-- =============================================
-- 트리거: 투표 시 카운트 자동 업데이트
-- =============================================

create or replace function update_vote_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.vote = 'guilty' then
      update cases set guilty_count = guilty_count + 1 where id = NEW.case_id;
    else
      update cases set not_guilty_count = not_guilty_count + 1 where id = NEW.case_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.vote = 'guilty' then
      update cases set guilty_count = guilty_count - 1 where id = OLD.case_id;
    else
      update cases set not_guilty_count = not_guilty_count - 1 where id = OLD.case_id;
    end if;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_vote_change
  after insert or delete on votes
  for each row execute function update_vote_count();

-- =============================================
-- 트리거: 신규 유저 프로필 자동 생성
-- =============================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nickname)
  values (NEW.id, '판사' || substr(NEW.id::text, 1, 4));
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
