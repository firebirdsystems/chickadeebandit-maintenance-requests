CREATE TABLE IF NOT EXISTS app_maintenance_requests__requests (
  id           TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  location     TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'other',
  priority     TEXT NOT NULL DEFAULT 'medium',
  status       TEXT NOT NULL DEFAULT 'open',
  submitted_by TEXT NOT NULL,
  assigned_to  TEXT,
  resolved_at  TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS app_maintenance_requests__comments (
  id           TEXT NOT NULL,
  request_id   TEXT NOT NULL,
  author_id    TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_mr_requests_status
  ON app_maintenance_requests__requests (status);

CREATE INDEX IF NOT EXISTS idx_mr_requests_priority
  ON app_maintenance_requests__requests (priority);

CREATE INDEX IF NOT EXISTS idx_mr_comments_request
  ON app_maintenance_requests__comments (request_id);
