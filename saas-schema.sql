-- SaaS 平台数据库架构
-- 支持多用户、订阅、分析等功能

-- 用户表 (使用Supabase auth.users的扩展)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text unique,
  name text not null,
  avatar_url text,
  subscription_plan text default 'free', -- free, pro, enterprise
  subscription_status text default 'active', -- active, cancelled, expired
  subscription_expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 用户资料表 (每个用户可以创建多个页面)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  handle text unique not null, -- 页面URL标识
  name text not null,
  title text,
  avatar_url text,
  tags text, -- 标签，逗号分隔
  bio text,
  cta_url text,
  cta_label text,
  brand text,
  theme_color text default '#0ea5e9', -- 主题色
  custom_domain text, -- 自定义域名
  is_published boolean default true,
  view_count int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 产品/服务表
create table if not exists public.products (
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

-- 社交媒体链接表
create table if not exists public.socials (
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

-- 页面访问统计表
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  visitor_ip text,
  user_agent text,
  referrer text,
  country text,
  city text,
  created_at timestamp with time zone default now()
);

-- 分享统计表
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null, -- wechat, weibo, linkedin, etc.
  share_type text not null, -- page, product, social
  target_id uuid, -- 关联的产品或社交链接ID
  created_at timestamp with time zone default now()
);

-- 模板表
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  category text, -- tech, business, creative, etc.
  preview_image text,
  config jsonb, -- 模板配置数据
  is_premium boolean default false,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 用户订阅表
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null, -- free, pro, enterprise
  status text not null, -- active, cancelled, expired
  stripe_subscription_id text,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 启用RLS
alter table public.user_profiles enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.socials enable row level security;
alter table public.page_views enable row level security;
alter table public.shares enable row level security;
alter table public.templates enable row level security;
alter table public.subscriptions enable row level security;

-- RLS 策略

-- 用户只能访问自己的数据
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

-- 公开访问已发布的页面
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

-- 模板公开访问
create policy "Public can view active templates" on public.templates
  for select using (is_active = true);

-- 统计数据的访问策略
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

-- 插入统计数据的策略（允许匿名用户插入）
create policy "Anyone can insert page views" on public.page_views
  for insert with check (true);

create policy "Anyone can insert shares" on public.shares
  for insert with check (true);

-- 创建索引
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

-- 插入默认模板
insert into public.templates (name, description, category, config, is_premium) values
('简约商务', '适合商务人士和创业者的简约风格', 'business', '{"theme": "minimal", "colors": {"primary": "#0ea5e9", "secondary": "#64748b"}}', false),
('科技感', '适合技术开发者和科技公司的现代风格', 'tech', '{"theme": "modern", "colors": {"primary": "#8b5cf6", "secondary": "#1e293b"}}', false),
('创意设计', '适合设计师和创意工作者的艺术风格', 'creative', '{"theme": "artistic", "colors": {"primary": "#f59e0b", "secondary": "#374151"}}', true),
('金融投资', '适合金融从业者和投资人的专业风格', 'finance', '{"theme": "professional", "colors": {"primary": "#059669", "secondary": "#1f2937"}}', true)
on conflict do nothing;
