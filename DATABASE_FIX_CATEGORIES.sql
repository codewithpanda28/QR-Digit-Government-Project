-- =====================================================
-- FIX: QR Code Categories Constraint Update
-- =====================================================
-- Problem: New categories violating check constraint
-- Solution: Update constraint to allow all 11 new categories
-- =====================================================

-- Step 1: Drop old constraint
ALTER TABLE qr_codes 
DROP CONSTRAINT IF EXISTS qr_codes_category_check;

-- Step 2: Add new constraint with all 11 categories
ALTER TABLE qr_codes 
ADD CONSTRAINT qr_codes_category_check 
CHECK (category IN (
    -- New Categories (11 total)
    'missing-child',
    'senior-citizen-lost',
    'accident-emergency',
    'women-safety',
    'vehicle-safety',
    'parcel-delivery',
    'domestic-worker-verification',
    'pet-recovery',
    'school-event-safety',
    'emergency-medical',
    'custom-category',
    
    -- Old categories (keep for backward compatibility)
    'child-safety',
    'elderly-safety',
    'school-safety',
    'tourist-safety',
    'temple-event'
));

-- Step 3: Verify constraint
-- Run this to check:
-- SELECT * FROM information_schema.check_constraints 
-- WHERE constraint_name = 'qr_codes_category_check';

-- =====================================================
-- COMPLETED!
-- =====================================================
-- Now you can create QR codes with any of these categories
-- Old QR codes will continue to work
-- New categories are fully supported
-- =====================================================
