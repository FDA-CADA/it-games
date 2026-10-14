-- Chạy một lần trong Supabase Studio > SQL Editor (hoặc: psql). An toàn để chạy lại.
create table if not exists public.progress (
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  game_id    text not null,
  levels     jsonb not null default '{}'::jsonb,   -- { "0": điểm, "1": điểm, ... }
  total      int,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists progress_touch on public.progress;
create trigger progress_touch before update on public.progress
  for each row execute function public.touch_updated_at();

alter table public.progress enable row level security;

drop policy if exists "own rows" on public.progress;
create policy "own rows" on public.progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.progress to authenticated;

-- Giảng viên xem kết quả lớp: dùng Studio / SQL bằng tài khoản quản trị (bỏ qua RLS), ví dụ:
--   select u.email, p.game_id, p.levels, p.updated_at
--   from public.progress p join auth.users u on u.id = p.user_id order by p.updated_at desc;
