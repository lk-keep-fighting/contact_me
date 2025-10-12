-- Supabase schema for "联系我" MVP
-- Run in Supabase SQL Editor

-- Enable extensions (if not already)
create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  name text not null,
  title text,
  avatar_url text,
  tags text, -- comma separated, e.g. "AI,增长,SaaS"
  bio text,
  cta_url text,
  cta_label text,
  brand text,
  published boolean not null default true,
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
  published boolean not null default true,
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
  published boolean not null default true,
  created_at timestamp with time zone default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.socials enable row level security;

-- Public read for published content
-- Drop existing policies if they exist
drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Public read products" on public.products;
drop policy if exists "Public read socials" on public.socials;

-- Create new policies
create policy "Public read profiles" on public.profiles
  for select using (published = true);

create policy "Public read products" on public.products
  for select using (
    published = true and exists (
      select 1 from public.profiles p where p.id = products.profile_id and p.published = true
    )
  );

create policy "Public read socials" on public.socials
  for select using (
    published = true and exists (
      select 1 from public.profiles p where p.id = socials.profile_id and p.published = true
    )
  );

-- Sample data
insert into public.profiles (handle, name, title, avatar_url, tags, bio, cta_url, cta_label, brand, published)
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
insert into public.products (profile_id, name, description, image_url, url, share_text, sort_order, published)
select id, '联系我 H5应用', '帮助创业者一键介绍自己及产品的H5应用，支持一键分享到社交媒体', null, '#', '这个联系我应用很不错，推荐给大家！', 1, true from f
on conflict do nothing;

with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.products (profile_id, name, description, image_url, url, share_text, sort_order, published)
select id, 'Logic-IDE', 'Java可视化编排工具，让复杂业务逻辑变得简单直观', null, 'https://aims.feishu.cn/wiki/AEzIwqBxHiHUMvkz8OVc8qCZnHh', 'Logic-IDE：Java可视化编排工具，让开发更高效！', 2, true from f
on conflict do nothing;

with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.socials (profile_id, platform, label, icon_class, url, qr_image_url, qr_note, sort_order, published)
select id, 'WeChat', '个人微信', 'bx-qr', null, 'https://xzzmlk.oss-cn-shanghai.aliyuncs.com/wx.jpg', '醒着做梦', 1, true from f
on conflict do nothing;

with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.socials (profile_id, platform, label, icon_class, url, qr_image_url, qr_note, sort_order, published)
select id, 'WeChatOfficial', '微信公众号', 'bx-qr', null, 'https://xzzmlk.oss-cn-shanghai.aliyuncs.com/lowcode-share.JPG', '低代码分享', 2, true from f
on conflict do nothing;

with f as (
  select id from public.profiles where handle = 'lowcode' limit 1
)
insert into public.socials (profile_id, platform, label, icon_class, url, sort_order, published)
select id, 'Email', '邮箱', 'bx-envelope', 'mailto:442969153@qq.com', 3, true from f
on conflict do nothing;
