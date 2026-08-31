-- all_requests orders by created_at DESC under LIMIT 200. The existing status
-- and priority indexes serve the filtered reads; neither can serve this
-- unfiltered ordering.
CREATE INDEX IF NOT EXISTS idx_mr_requests_created
  ON app_maintenance_requests__requests(created_at);
