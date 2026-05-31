SELECT
  r.id,
  r.title,
  r.location,
  r.category,
  r.priority,
  r.status,
  r.submitted_by,
  r.assigned_to,
  r.created_at
FROM requests r
WHERE r.household_id = current_setting('app.household_id', true)::uuid
  AND r.status IN ('open', 'in_progress')
ORDER BY
  CASE r.priority
    WHEN 'urgent' THEN 0
    WHEN 'high'   THEN 1
    WHEN 'medium' THEN 2
    ELSE 3
  END,
  r.created_at DESC
LIMIT 100
