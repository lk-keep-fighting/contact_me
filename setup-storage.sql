-- 创建存储桶用于存储用户上传的图片
-- 在 Supabase Dashboard 中执行此脚本

-- 1. 创建公共图片存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 设置存储桶策略，允许认证用户上传图片
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- 3. 允许所有人查看公共图片
CREATE POLICY "Allow public to view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 4. 允许用户删除自己上传的图片
CREATE POLICY "Allow users to delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images' AND auth.uid() = owner);

-- 5. 允许用户更新自己上传的图片
CREATE POLICY "Allow users to update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images' AND auth.uid() = owner);
