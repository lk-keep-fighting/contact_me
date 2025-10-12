-- SaaS 平台数据库架构 - 修复版本
-- 分步执行，避免错误

-- 1. 删除可能存在的表（CASCADE会自动删除相关策略）
drop table if exists public.subscriptions cascade;
drop table if exists public.templates cascade;
drop table if exists public.shares cascade;
drop table if exists public.page_views cascade;
drop table if exists public.socials cascade;
drop table if exists public.products cascade;
drop table if exists public.profiles cascade;
drop table if exists public.user_profiles cascade;

-- 2. 创建用户资料表
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text unique,
  name text not null,
  avatar_url text,
  subscription_plan text default 'free',
  subscription_status text default 'active',
  subscription_expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. 创建用户资料页面表
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  handle text unique not null,
  name text not null,
  title text,
  avatar_url text,
  tags text,
  bio text,
  cta_url text,
  cta_label text,
  brand text,
  theme_color text default '#0ea5e9',
  custom_domain text,
  is_published boolean default true,
  view_count int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. 创建产品表
create table public.products (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  url text,
  share_text text,
  sort_order int default 0,
  is_published boolean default true,
  created_at timestamp with time zone default now()
);

-- 5. 创建社交媒体链接表
create table public.socials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  label text,
  icon_class text,
  url text,
  qr_image_url text,
  qr_note text,
  sort_order int default 0,
  is_published boolean default true,
  created_at timestamp with time zone default now()
);

-- 6. 创建页面访问统计表
create table public.page_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_ip text,
  user_agent text,
  referrer text,
  country text,
  city text,
  created_at timestamp with time zone default now()
);

-- 7. 创建分享统计表
create table public.shares (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,
  share_type text not null,
  target_id uuid,
  created_at timestamp with time zone default now()
);

-- 8. 创建模板表
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text,
  preview_image text,
  config jsonb,
  is_premium boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 9. 创建用户订阅表
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null,
  status text not null,
  stripe_subscription_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 10. 启用RLS
alter table public.user_profiles enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.socials enable row level security;
alter table public.page_views enable row level security;
alter table public.shares enable row level security;
alter table public.templates enable row level security;
alter table public.subscriptions enable row level security;

-- 11. 创建RLS策略
create policy "Users can view own profile" on public.user_profiles
  for all using (auth.uid() = id);

create policy "Users can view own profiles" on public.profiles
  for all using (auth.uid() = user_id);

create policy "Users can view own products" on public.products
  for all using (
    exists (
      select 1 from public.profiles p 
      where p.id = products.profile_id and p.user_id = auth.uid()
    )
  );

create policy "Users can view own socials" on public.socials
  for all using (
    exists (
      select 1 from public.profiles p 
      where p.id = socials.profile_id and p.user_id = auth.uid()
    )
  );

create policy "Users can view own subscriptions" on public.subscriptions
  for all using (auth.uid() = user_id);

create policy "Public can view published profiles" on public.profiles
  for select using (is_published = true);

create policy "Public can view published products" on public.products
  for select using (
    is_published = true and exists (
      select 1 from public.profiles p 
      where p.id = products.profile_id and p.is_published = true
    )
  );

create policy "Public can view published socials" on public.socials
  for select using (
    is_published = true and exists (
      select 1 from public.profiles p 
      where p.id = socials.profile_id and p.is_published = true
    )
  );

create policy "Public can view active templates" on public.templates
  for select using (is_active = true);

create policy "Users can view own analytics" on public.page_views
  for select using (
    exists (
      select 1 from public.profiles p 
      where p.id = page_views.profile_id and p.user_id = auth.uid()
    )
  );

create policy "Users can view own shares" on public.shares
  for select using (
    exists (
      select 1 from public.profiles p 
      where p.id = shares.profile_id and p.user_id = auth.uid()
    )
  );

create policy "Anyone can insert page views" on public.page_views
  for insert with check (true);

create policy "Anyone can insert shares" on public.shares
  for insert with check (true);

-- 12. 创建索引
create index if not exists idx_user_profiles_id on public.user_profiles(id);
create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_handle on public.profiles(handle);
create index if not exists idx_profiles_custom_domain on public.profiles(custom_domain);
create index if not exists idx_products_profile_id on public.products(profile_id);
create index if not exists idx_socials_profile_id on public.socials(profile_id);
create index if not exists idx_page_views_profile_id on public.page_views(profile_id);
create index if not exists idx_page_views_created_at on public.page_views(created_at);
create index if not exists idx_shares_profile_id on public.shares(profile_id);
create index if not exists idx_templates_category on public.templates(category);
create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);

-- 13. 插入默认模板
insert into public.templates (name, description, category, config, is_premium) values
('简约商务', '适合商务人士和创业者的简约风格', 'business', '{"theme": "minimal", "colors": {"primary": "#0ea5e9", "secondary": "#64748b"}}', false),
('科技感', '适合技术开发者和科技公司的现代风格', 'tech', '{"theme": "modern", "colors": {"primary": "#8b5cf6", "secondary": "#1e293b"}}', false),
('创意设计', '适合设计师和创意工作者的艺术风格', 'creative', '{"theme": "artistic", "colors": {"primary": "#f59e0b", "secondary": "#374151"}}', true),
('金融投资', '适合金融从业者和投资人的专业风格', 'finance', '{"theme": "professional", "colors": {"primary": "#059669", "secondary": "#1f2937"}}', true)
on conflict do nothing;
