SELECT
  r.id,
  r.title,
  r.location,
  r.category,
  r.priority,
  r.status,
  r.submitted_by,
  r.assigned_to,
  r.resolved_at,
  r.created_at
FROM requests r
WHERE r.household_id = current_setting('app.household_id', true)::uuid
ORDER BY r.created_at DESC
LIMIT 200
