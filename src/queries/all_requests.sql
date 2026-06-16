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
FROM app_maintenance_requests__requests r
ORDER BY r.created_at DESC
LIMIT 200
