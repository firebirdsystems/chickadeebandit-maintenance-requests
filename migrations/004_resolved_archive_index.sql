-- Serves the resolved archive's paged read:
--
--   WHERE status = 'resolved' ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?
--
-- The app used to load every request in one unbounded statement and sort the
-- lot by priority. It now reads the open queue and the resolved archive
-- separately, because only the queue belongs on the first screen; the archive
-- is paged behind "Show older resolved requests" and pulled in full only when
-- someone searches. That split is what makes this statement indexable at all —
-- the old one asked for the whole table by construction.
--
-- Leading with status turns the archive into a seek instead of a scan, and
-- carrying created_at and id inside the index means each page is served
-- straight from it, in order, with no sort step per page. 003's plain
-- (created_at) index cannot do this: it leads with the wrong column, so every
-- page would filter the entire table on status first.
CREATE INDEX IF NOT EXISTS idx_mr_requests_status_created
  ON app_maintenance_requests__requests (status, created_at DESC, id DESC);
