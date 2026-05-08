-- ============================================
-- SUPABASE STORAGE: PRODUCT IMAGES BUCKET
-- Stores product images with public access
-- ============================================

-- Insert storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS on storage.objects is managed by Supabase automatically
-- We only need to create policies for the bucket

-- Policy: Admins can upload, delete, and manage product images
CREATE POLICY "Admins can manage product images" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin')
  );

-- Policy: Public can view product images (read-only)
CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'product-images'
  );

-- Policy: Admins can insert (upload) product images
CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin')
  );

-- Policy: Admins can update product images
CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin')
  );

-- Policy: Admins can delete product images
CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.uid() IN (SELECT id FROM users WHERE account_type = 'admin')
  );

-- Grant permissions on bucket
GRANT USAGE ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON SCHEMA storage TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA storage TO authenticated, anon;
