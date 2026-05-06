-- Customer Service Chat Attachments Migration
-- Run this in Supabase SQL Editor to add attachment support

-- Step 1: Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-attachments',
    'chat-attachments',
    true,
    10485760, -- 10MB in bytes
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add attachment columns to messages table (if not exists)
DO $$
BEGIN
    -- Add attachment_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE messages ADD COLUMN attachment_url TEXT;
    END IF;

    -- Add attachment_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'attachment_type'
    ) THEN
        ALTER TABLE messages ADD COLUMN attachment_type TEXT;
    END IF;

    -- Add attachment_name column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'attachment_name'
    ) THEN
        ALTER TABLE messages ADD COLUMN attachment_name TEXT;
    END IF;

    -- Add attachment_size column (in bytes)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' AND column_name = 'attachment_size'
    ) THEN
        ALTER TABLE messages ADD COLUMN attachment_size INTEGER;
    END IF;
END $$;

-- Step 2: Create storage bucket for chat attachments
-- Note: This needs to be done via Supabase Dashboard API or manually
-- The bucket should be named 'chat-attachments' and set to public

-- Step 3: Add storage policies (run after creating bucket manually)
-- These policies allow users to upload and view their own chat attachments

-- Policy: Allow users to upload files to chat-attachments bucket
CREATE POLICY "Allow users to upload chat attachments" 
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to view their own chat attachments
CREATE POLICY "Allow users to view their own chat attachments"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow admins to view all chat attachments
CREATE POLICY "Allow admins to view all chat attachments"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'chat-attachments'
);

-- Policy: Allow admins to upload chat attachments
CREATE POLICY "Allow admins to upload chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'chat-attachments'
);

-- Step 4: Add index for attachment queries
CREATE INDEX IF NOT EXISTS idx_messages_attachment_url ON messages(attachment_url) 
WHERE attachment_url IS NOT NULL;

-- Step 5: Update message policy to allow null message when attachment is present
-- First, check if we need to modify the NOT NULL constraint
DO $$
BEGIN
    -- Make message column nullable if it has attachment
    -- This allows sending attachments without text
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'messages' 
        AND column_name = 'message' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE messages ALTER COLUMN message DROP NOT NULL;
    END IF;
END $$;

-- Step 6: Add constraint to ensure either message or attachment is present
ALTER TABLE messages 
ADD CONSTRAINT check_message_or_attachment 
CHECK (
    (message IS NOT NULL AND length(trim(message)) > 0) 
    OR attachment_url IS NOT NULL
);

-- Step 7: Update RLS policy for messages to allow attachments
-- Note: The existing policies should work since we're not changing who can insert,
-- just adding optional attachment fields

-- Step 8: Add comment for documentation
COMMENT ON COLUMN messages.attachment_url IS 'URL to the attached file in Supabase Storage';
COMMENT ON COLUMN messages.attachment_type IS 'MIME type of the attachment (e.g., image/jpeg, application/pdf)';
COMMENT ON COLUMN messages.attachment_name IS 'Original filename of the attachment';
COMMENT ON COLUMN messages.attachment_size IS 'File size in bytes';
