-- 创建最小化的 page_views 表（与当前代码完全匹配）
-- 只包含代码中实际使用的字段

-- 先删除现有表和策略
DROP POLICY IF EXISTS "Profile owner can view page_views" ON public.page_views;
DROP POLICY IF EXISTS "Allow insert page_views" ON public.page_views;
DROP TABLE IF EXISTS public.page_views CASCADE;

-- 创建新表（只包含必要字段）
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_agent text,
  referrer text,
  created_at timestamp with time zone DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- 允许所有人插入访问记录（匿名统计）
CREATE POLICY "Allow insert page_views" ON public.page_views
  FOR INSERT WITH CHECK (true);

-- 只有profile拥有者可以查看统计数据
CREATE POLICY "Profile owner can view page_views" ON public.page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = page_views.profile_id 
      AND p.user_id = auth.uid()
    )
  );

-- 刷新schema cache（强制PostgREST重新加载schema）
NOTIFY pgrst, 'reload schema';