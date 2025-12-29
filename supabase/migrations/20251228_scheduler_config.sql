-- Add schedule config to realtime_monitor table
-- This migration adds default schedule configuration for the scheduler mode

-- Update existing realtime_monitor record with default schedule config
UPDATE realtime_monitor
SET config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
    'schedule', jsonb_build_array('09:00', '12:00', '15:00', '18:00'),
    'cycles_per_run', 3
)
WHERE config IS NULL OR NOT (config ? 'schedule');

-- Add comment for documentation
COMMENT ON COLUMN realtime_monitor.config IS 'Configuration for scheduler mode. Includes: schedule (array of HH:MM times), cycles_per_run (int), force_check (bool)';
