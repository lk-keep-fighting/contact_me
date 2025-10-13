-- Supabase schema for "联系我" MVP - FIXED VERSION
-- Run in Supabase SQL Editor

-- Enable extensions (if not already)
create extension if not exists pgcrypto;

-- User profiles table (for auth data)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  created_at timestamp with time zone default now()
);

-- Enable RLS for user_profiles
alter table public.user_profiles enable row level security;

-- Allow users to manage their own user profile
create policy "Users can manage own user profile" on public.user_profiles
  for all using (auth.uid() = id);

-- Profiles (public pages)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- nullable for demo data
  handle text unique not null,
  name text not null,
  title text,
  avatar_url text,
  tags text, -- comma separated, e.g. "AI,增长,SaaS"
  bio text,
  cta_url text,
  cta_label text,
  brand text,
  theme_color text default '#0ea5e9',
  is_published boolean not null default true,
  created_at timestamp with time zone default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  url text,
  share_text text,
  sort_order int default 0,
  is_published boolean not null default true,
  created_at timestamp with time zone default now()
);

-- Social links (with optional QR)
create table if not exists public.socials (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  platform text not null,          -- e.g. WeChat / Weibo / LinkedIn
  label text,                      -- display text
  icon_class text,                 -- e.g. bxl-twitter / bx-envelope
  url text,                        -- link url (optional if QR provided)
  qr_image_url text,               -- QR image (optional)
  qr_note text,
  sort_order int default 0,
  is_published boolean not null default true,
  created_at timestamp with time zone default now()
);

-- 统计表
create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.socials enable row level security;
alter table public.page_views enable row level security;

-- Public read for published content
drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Public read products" on public.products;
drop policy if exists "Public read socials" on public.socials;

-- Create new policies
create policy "Public read profiles" on public.profiles
  for select using (is_published = true);

-- 允许用户管理自己的profile
drop policy if exists "Users can manage own profiles" on public.profiles;
create policy "Users can manage own profiles" on public.profiles
  for all using (auth.uid() = user_id);

-- 允许认证用户管理demo数据（仅在开发阶段）
drop policy if exists "Authenticated users can manage demo profiles" on public.profiles;
create policy "Authenticated users can manage demo profiles" on public.profiles
  for all using (auth.role() = 'authenticated' and user_id is null);

create policy "Public read products" on public.products
  for select using (
    is_published = true and exists (
      select 1 from public.profiles p where p.id = products.profile_id and p.is_published = true
    )
  );

create policy "Public read socials" on public.socials
  for select using (
    is_published = true and exists (
      select 1 from public.profiles p where p.id = socials.profile_id and p.is_published = true
    )
  );

-- 允许匿名插入统计数据（用于收集访问统计）
drop policy if exists "Allow insert page_views" on public.page_views;
create policy "Allow insert page_views" on public.page_views
  for insert with check (true);

-- 只有profile的拥有者才能查看统计数据
drop policy if exists "Profile owner can view page_views" on public.page_views;
create policy "Profile owner can view page_views" on public.page_views
  for select using (
    exists (
      select 1 from public.profiles p 
      where p.id = page_views.profile_id 
      and (p.user_id = auth.uid() or (p.user_id is null and auth.role() = 'authenticated'))
    )
  );

-- Sample data
insert into public.profiles (handle, name, title, avatar_url, tags, bio, cta_url, cta_label, brand, is_published)
values (
  'lowcode',
  '低代码分享',
  '低代码技术专家 | 开发者',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=lowcode',
  '低代码,技术分享,开发者',
  '专注低代码技术分享，帮助开发者快速构建应用，提升开发效率。',
  'https://example.com/contact',
  '技术交流',
  '低代码分享',
  true
) on conflict (handle) do nothing;

-- Capture lowcode id for inserts
with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.products (profile_id, name, description, image_url, url, share_text, sort_order, is_published)
select id, '联系我 H5应用', '帮助创业者一键介绍自己及产品的H5应用，支持一键分享到社交媒体', null, '#', '这个联系我应用很不错，推荐给大家！', 1, true from f
on conflict do nothing;

with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.products (profile_id, name, description, image_url, url, share_text, sort_order, is_published)
select id, 'Logic-IDE', 'Java可视化编排工具，让复杂业务逻辑变得简单直观', null, 'https://aims.feishu.cn/wiki/AEzIwqBxHiHUMvkz8OVc8qCZnHh', 'Logic-IDE：Java可视化编排工具，让开发更高效！', 2, true from f
on conflict do nothing;

with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.socials (profile_id, platform, label, icon_class, url, qr_image_url, qr_note, sort_order, is_published)
select id, 'WeChat', '个人微信', 'bx-qr', null, 'https://xzzmlk.oss-cn-shanghai.aliyuncs.com/wx.jpg', '醒着做梦', 1, true from f
on conflict do nothing;

with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.socials (profile_id, platform, label, icon_class, url, qr_image_url, qr_note, sort_order, is_published)
select id, 'WeChatOfficial', '微信公众号', 'bx-qr', null, 'https://xzzmlk.oss-cn-shanghai.aliyuncs.com/lowcode-share.JPG', '低代码分享', 2, true from f
on conflict do nothing;

with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.socials (profile_id, platform, label, icon_class, url, sort_order, is_published)
select id, 'Email', '邮箱', 'bx-envelope', 'mailto:442969153@qq.com', 3, true from f
on conflict do nothing;