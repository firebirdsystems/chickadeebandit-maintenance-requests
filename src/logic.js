// Pure, testable logic extracted from index.html.
// No DOM, no network — safe to import from Node for unit tests.

export const CATEGORIES = ["plumbing", "electrical", "hvac", "structural", "appliance", "grounds", "other"];
export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const PRIORITY_COLORS = { urgent: "#dc2626", high: "#ea580c", medium: "#ca8a04", low: "#9ca3af" };
export const STATUS_LABELS   = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };
export const STATUS_COLORS   = { open: "#2563eb", in_progress: "#7c3aed", resolved: "#16a34a" };
export const CAT_LABELS = { plumbing: "Plumbing", electrical: "Electrical", hvac: "HVAC", structural: "Structural", appliance: "Appliance", grounds: "Grounds", other: "Other" };
export const CAT_ICONS  = { plumbing: "🪠", electrical: "⚡", hvac: "🌡️", structural: "🏗️", appliance: "🔌", grounds: "🌿", other: "🔧" };

export function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function memberName(memberMap, id) {
  return memberMap.get(id)?.name ?? "Unknown";
}

export function filterRequests(requests, filter) {
  if (filter === "all")         return sortRequests(requests);
  if (filter === "in_progress") return requests.filter(r => r.status === "in_progress");
  if (filter === "resolved")    return requests.filter(r => r.status === "resolved");
  return requests.filter(r => r.status === "open");
}

/**
 * Page size and later pages, both derived from the app's first-page statement.
 *
 * The first page has to be one literal string in index.html: the hub's
 * admission validator cannot parse `LIMIT ?` / `OFFSET ?` (it rejects the
 * manifest outright), and `manifest.preload` only answers a request whose text
 * matches the declared statement. Deriving everything else from that one
 * literal is what stops page 2 from drifting away from the page the hub
 * actually preloaded.
 */
export function pageSizeOf(firstPageSql) {
  const m = /LIMIT (\d+)/.exec(firstPageSql);
  if (!m) throw new Error("first-page SQL has no literal LIMIT");
  return Number(m[1]);
}

export function pageSqlAt(firstPageSql, offset) {
  const n = Math.max(0, Math.floor(Number(offset) || 0));
  if (n === 0) return firstPageSql;
  if (!/OFFSET 0$/.test(firstPageSql)) throw new Error("first-page SQL must end in OFFSET 0");
  return firstPageSql.replace(/OFFSET 0$/, `OFFSET ${n}`);
}

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2 };

/**
 * The list's original order: most urgent first, then newest.
 *
 * This used to come free from the single `ORDER BY` that loaded the whole
 * table. The app now reads the open queue and the resolved archive as two
 * statements — the queue by priority, the archive chronologically — so the
 * "All" tab has to re-impose the combined order on the client. `id` breaks
 * ties so the page cannot reshuffle between renders.
 */
export function sortRequests(requests) {
  const rank = r => PRIORITY_RANK[r.priority] ?? 3;
  return [...requests].sort((a, b) =>
    rank(a) - rank(b) ||
    String(b.created_at).localeCompare(String(a.created_at)) ||
    String(b.id).localeCompare(String(a.id))
  );
}

export function priorityColor(priority) {
  return PRIORITY_COLORS[priority] ?? "#9ca3af";
}

export function statusColor(status) {
  return STATUS_COLORS[status] ?? "#6b7280";
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status;
}

/**
 * Fields the in-app search matches against (see hub-sdk `searchMatch`).
 * Location and description count as well as the title — a request is
 * looked up as "the leak in the east stairwell", which is the location
 * plus the body, not the one-line title.
 */
export function searchableFields(item) {
  return [item.title, item.description, item.location, item.category, item.priority];
}
