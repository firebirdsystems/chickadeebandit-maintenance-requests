CREATE TABLE IF NOT EXISTS requests (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
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
  PRIMARY KEY (household_id, id)
);

CREATE TABLE IF NOT EXISTS comments (
  household_id UUID NOT NULL DEFAULT current_setting('app.household_id', true)::uuid,
  id           TEXT NOT NULL,
  request_id   TEXT NOT NULL,
  author_id    TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (household_id, id)
);

CREATE INDEX IF NOT EXISTS idx_mr_requests_status
  ON requests (household_id, status);

CREATE INDEX IF NOT EXISTS idx_mr_requests_priority
  ON requests (household_id, priority);

CREATE INDEX IF NOT EXISTS idx_mr_comments_request
  ON comments (household_id, request_id)
