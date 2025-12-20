-- ============================================
-- Add Specialty Column to Reporters Table
-- ============================================
-- Purpose: Enable professional title system for SEO/E-E-A-T optimization
-- Date: 2025-12-20
-- ============================================

-- 1. Add specialty column
ALTER TABLE reporters
ADD COLUMN IF NOT EXISTS specialty VARCHAR(50) DEFAULT NULL;

-- 2. Add comment for documentation
COMMENT ON COLUMN reporters.specialty IS 'Reporter specialty: city, education, economy, culture, environment, politics, society, sports, health, agriculture, maritime';

-- 3. Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_reporters_specialty ON reporters(specialty);

-- ============================================
-- Auto-populate specialty based on region/department
-- ============================================

-- Education reporters (based on region)
UPDATE reporters
SET specialty = 'education'
WHERE specialty IS NULL
  AND (
    region LIKE '%교육청%'
    OR region LIKE '%교육%'
    OR department LIKE '%교육%'
  );

-- City administration reporters (based on region)
UPDATE reporters
SET specialty = 'city'
WHERE specialty IS NULL
  AND (
    region IN ('광주광역시', '목포시', '여수시', '순천시', '나주시', '광양시')
    OR department LIKE '%시정%'
    OR department LIKE '%행정%'
  );

-- ============================================
-- Specialty Values Reference
-- ============================================
-- city: City administration (시정전문기자)
-- education: Education (교육전문기자)
-- economy: Economy (경제전문기자)
-- culture: Culture/Arts (문화전문기자)
-- environment: Environment (환경전문기자)
-- politics: Politics (정치전문기자)
-- society: Society (사회전문기자)
-- sports: Sports (체육전문기자)
-- health: Health/Medical (보건전문기자)
-- agriculture: Agriculture (농업전문기자)
-- maritime: Maritime/Fishery (해양전문기자)
-- ============================================

-- Verify the changes
SELECT
    id,
    name,
    region,
    department,
    specialty,
    position
FROM reporters
WHERE status = 'Active'
ORDER BY specialty NULLS LAST, name;
