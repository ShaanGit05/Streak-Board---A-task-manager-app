-- ==============================================================================
-- StreakBoard Database Schema (Supabase / PostgreSQL)
-- ==============================================================================

-- 1. Create tables

-- User Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User Settings (target goal, rest day limit)
create table if not exists public.user_settings (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  target_completion_pct integer not null default 70 check (target_completion_pct between 1 and 100),
  max_rest_days_per_week integer not null default 2 check (max_rest_days_per_week between 0 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Recurring Task Rules
create table if not exists public.recurring_rules (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null check (category in ('Study', 'Work', 'Health', 'Personal', 'Other')),
  priority text not null check (priority in ('Low', 'Med', 'High')),
  difficulty integer not null check (difficulty between 1 and 5),
  repeat_type text not null check (repeat_type in ('none', 'daily', 'weekdays', 'weekly')),
  repeat_days integer[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_date date not null,
  title text not null,
  description text,
  category text not null check (category in ('Study', 'Work', 'Health', 'Personal', 'Other')),
  priority text not null check (priority in ('Low', 'Med', 'High')),
  difficulty integer not null check (difficulty between 1 and 5),
  is_completed boolean not null default false,
  recurring_rule_id uuid references public.recurring_rules(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Daily Scores
create table if not exists public.daily_scores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  score_date date not null,
  points_earned numeric(6, 1) not null default 0,
  points_total numeric(6, 1) not null default 0,
  completion_pct integer not null default 0,
  tasks_completed integer not null default 0,
  tasks_total integer not null default 0,
  is_rest_day boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unique_user_score_date unique (user_id, score_date)
);

-- Task Templates
create table if not exists public.task_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

-- Template Items
create table if not exists public.template_items (
  id uuid default gen_random_uuid() primary key,
  template_id uuid references public.task_templates(id) on delete cascade not null,
  title text not null,
  description text,
  category text not null check (category in ('Study', 'Work', 'Health', 'Personal', 'Other')),
  priority text not null check (priority in ('Low', 'Med', 'High')),
  difficulty integer not null check (difficulty between 1 and 5)
);

-- Indexes for fast queries
create index if not exists idx_tasks_user_date on public.tasks (user_id, task_date);
create index if not exists idx_daily_scores_user_date on public.daily_scores (user_id, score_date);
create index if not exists idx_recurring_rules_user on public.recurring_rules (user_id);
create index if not exists idx_task_templates_user on public.task_templates (user_id);

-- 2. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.tasks enable row level security;
alter table public.daily_scores enable row level security;
alter table public.task_templates enable row level security;
alter table public.template_items enable row level security;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- User settings policies
create policy "Users can manage own settings" on public.user_settings
  for all using (auth.uid() = user_id);

-- Recurring rules policies
create policy "Users can manage own recurring rules" on public.recurring_rules
  for all using (auth.uid() = user_id);

-- Tasks policies
create policy "Users can manage own tasks" on public.tasks
  for all using (auth.uid() = user_id);

-- Daily scores policies
create policy "Users can manage own daily scores" on public.daily_scores
  for all using (auth.uid() = user_id);

-- Task templates policies
create policy "Users can manage own task templates" on public.task_templates
  for all using (auth.uid() = user_id);

-- Template items policies
create policy "Users can manage template items" on public.template_items
  for all using (
    exists (
      select 1 from public.task_templates t
      where t.id = template_items.template_id and t.user_id = auth.uid()
    )
  );

-- 3. Automation Triggers

-- Automatically create profile and user_settings upon auth.users signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );

  insert into public.user_settings (user_id, target_completion_pct, max_rest_days_per_week)
  values (new.id, 70, 2);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to re-compute daily_scores on task modification
create or replace function public.sync_daily_score_from_tasks()
returns trigger as $$
declare
  t_user_id uuid;
  t_date date;
  v_points_earned numeric(6, 1) := 0;
  v_points_total numeric(6, 1) := 0;
  v_tasks_completed integer := 0;
  v_tasks_total integer := 0;
  v_pct integer := 0;
  v_weight numeric;
begin
  if (TG_OP = 'DELETE') then
    t_user_id := OLD.user_id;
    t_date := OLD.task_date;
  else
    t_user_id := NEW.user_id;
    t_date := NEW.task_date;
  end if;

  select
    count(*),
    count(*) filter (where is_completed = true),
    coalesce(sum(difficulty * (case priority when 'Low' then 1.0 when 'Med' then 1.5 when 'High' then 2.0 else 1.0 end)), 0),
    coalesce(sum(case when is_completed then difficulty * (case priority when 'Low' then 1.0 when 'Med' then 1.5 when 'High' then 2.0 else 1.0 end) else 0 end), 0)
  into v_tasks_total, v_tasks_completed, v_points_total, v_points_earned
  from public.tasks
  where user_id = t_user_id and task_date = t_date;

  if v_points_total > 0 then
    v_pct := round((v_points_earned / v_points_total) * 100);
  else
    v_pct := 0;
  end if;

  insert into public.daily_scores (
    user_id, score_date, points_earned, points_total,
    completion_pct, tasks_completed, tasks_total
  )
  values (
    t_user_id, t_date, v_points_earned, v_points_total,
    v_pct, v_tasks_completed, v_tasks_total
  )
  on conflict (user_id, score_date)
  do update set
    points_earned = excluded.points_earned,
    points_total = excluded.points_total,
    completion_pct = excluded.completion_pct,
    tasks_completed = excluded.tasks_completed,
    tasks_total = excluded.tasks_total,
    updated_at = now();

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_task_changed on public.tasks;
create trigger on_task_changed
  after insert or update or delete on public.tasks
  for each row execute procedure public.sync_daily_score_from_tasks();
