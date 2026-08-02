-- Automation support for the `file_request` action.
--
-- `source_event_id` records which app event produced the row. The dispatcher's
-- dedupe guard matches on it (SELECT 1 FROM ... WHERE source_event_id = ?
-- LIMIT 1), so a redelivered event cannot file the same request twice — which
-- matters more here than elsewhere, since duplicates reach a real work queue.
--
-- Nullable on purpose: requests submitted by a person have no source event, and
-- the guard only ever looks for a specific non-null id.
ALTER TABLE app_maintenance_requests__requests ADD COLUMN source_event_id TEXT;

CREATE INDEX IF NOT EXISTS app_maintenance_requests__idx_requests_source_event_id
  ON app_maintenance_requests__requests(source_event_id);
