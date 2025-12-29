-- ============================================
-- Add profile_image column to reporters table
-- Date: 2025-12-17
-- Description: Store Cloudinary URL for reporter profile photos
-- ============================================

-- Add profile_image column to store Cloudinary image URL
ALTER TABLE reporters ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Add comment for documentation
COMMENT ON COLUMN reporters.profile_image IS 'Cloudinary URL for reporter profile photo';

-- Verification query (run after migration):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'reporters' AND column_name = 'profile_image';
