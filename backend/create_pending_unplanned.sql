-- Update existing unplanned visit to pending status for testing
-- This will make it appear in Sales Manager's "Unplanned Approval" tab

UPDATE realisasi_visits 
SET 
    approval_status = 'pending',
    approved_by = NULL,
    approved_at = NULL
WHERE 
    type = 'unplanned' 
    AND (customer_name LIKE '%Iza%' OR customer_name LIKE '%iza%')
LIMIT 1;

-- Verify the update
SELECT 
    id,
    type,
    customer_name,
    customer_company,
    approval_status,
    visited_by,
    approved_by,
    approved_at,
    created_at
FROM realisasi_visits 
WHERE type = 'unplanned'
ORDER BY created_at DESC;
