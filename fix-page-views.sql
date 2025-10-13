-- 修复 page_views 表结构
-- 如果表存在但缺少字段，就添加它们

-- 检查并添加缺少的字段
DO $$ 
BEGIN
    -- 检查 ip_address 字段是否存在，不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'page_views' 
        AND column_name = 'ip_address' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.page_views ADD COLUMN ip_address text;
    END IF;
    
    -- 检查 user_agent 字段是否存在，不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'page_views' 
        AND column_name = 'user_agent' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.page_views ADD COLUMN user_agent text;
    END IF;
    
    -- 检查 referrer 字段是否存在，不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'page_views' 
        AND column_name = 'referrer' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.page_views ADD COLUMN referrer text;
    END IF;
END $$;