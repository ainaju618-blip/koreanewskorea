-- Add 'trash' to allowed status values in posts table
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'posts_status_check' AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_status_check;
    END IF;

    -- Add new check constraint with 'trash' included
    ALTER TABLE posts ADD CONSTRAINT posts_status_check 
    CHECK (status IN ('draft', 'published', 'rejected', 'trash'));

END $$;
