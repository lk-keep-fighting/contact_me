-- 重建 page_views 表（简化版本，只包含必要字段）
-- 如果你只想要最基本的访问统计功能

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS public.page_views CASCADE;

-- 创建简化版本的访问统计表
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_agent text,
  referrer text,
  created_at timestamp with time zone DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- 允许匿名插入统计数据（用于收集访问统计）
CREATE POLICY "Allow insert page_views" ON public.page_views
  FOR INSERT WITH CHECK (true);

-- 只有profile的拥有者才能查看统计数据
CREATE POLICY "Profile owner can view page_views" ON public.page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = page_views.profile_id 
      AND p.user_id = auth.uid()
    )
  );