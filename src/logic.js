// Pure, testable logic extracted from index.html.
// No DOM, no network — safe to import from Node for unit tests.

export const CATEGORIES = ["plumbing", "electrical", "hvac", "structural", "appliance", "grounds", "other"];
export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const PRIORITY_COLORS = { urgent: "#dc2626", high: "#ea580c", medium: "#ca8a04", low: "#9ca3af" };
export const STATUS_LABELS   = { open: "Open", in_progress: "In Progress", resolved: "Resolved" };
export const STATUS_COLORS   = { open: "#2563eb", in_progress: "#7c3aed", resolved: "#16a34a" };
export const CAT_LABELS = { plumbing: "Plumbing", electrical: "Electrical", hvac: "HVAC", structural: "Structural", appliance: "Appliance", grounds: "Grounds", other: "Other" };
export const CAT_ICONS  = { plumbing: "droplet", electrical: "lightbulb", hvac: "thermometer", structural: "building", appliance: "plug", grounds: "sprout", other: "wrench" };

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

// The hub's own test for an adult member (hub-sdk `isAdult`), repeated here so
// the role rules below can be unit-tested without the browser-only SDK.
function isAdultMember(member) {
  return !!member && (member.role === "adult" || member.role === "admin");
}

/**
 * Whether a member triages requests: reads everyone's, sets status and
 * assignee, deletes. Mirrors the hub's rule for the requests and comments
 * tables (owner_only with adults_bypass and member_can_update: false): any
 * adult in a household, and only the steward in a shared space. Anyone else
 * reads the requests they submitted and is refused every update, so a triage
 * queue offered to them would hold their own rows and buttons that fail.
 */
export function triagesRequests(member, { tenantKind = "household", isAdmin = false } = {}) {
  return tenantKind === "household" ? isAdultMember(member) : isAdmin === true;
}

/**
 * Who a request may be assigned to: the people who can read it. In a
 * household that is every adult; in a shared space only a steward reads
 * someone else's request (`isAdmin` on family.members). `currentId` keeps an
 * existing assignee selectable so the picker never misreports who has it.
 */
export function assignableMembers(members, { tenantKind = "household" } = {}, currentId = null) {
  return members.filter(m =>
    (tenantKind === "household" ? isAdultMember(m) : m.isAdmin === true) || (!!currentId && m.id === currentId)
  );
}

// ── Retry after a lost response (app-template guide) ─────────────────────────

/**
 * Whether a failed create's answer leaves its outcome unknown — no status, a
 * 400, or a 5xx other than 507 — so the page reads the row back by its pinned
 * id. A `UNIQUE_CONSTRAINT` answer is a 400 too: the usual retry of a create
 * that landed collides on its own pinned id. Only finding the row under that
 * id says it landed.
 */
export function outcomeUnknown(e) {
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(String(e?.message ?? ""))) return true;
  const status = Number(e?.status) || 0;
  return status === 0 || status === 400 || (status >= 500 && status !== 507);
}

/**
 * Whether a stored row differs from what the form holds now, over the form's
 * own fields only, compared as text with a missing value as empty.
 */
export function storedDiffers(row, fields) {
  return Object.keys(fields).some((k) => String(row?.[k] ?? "") !== String(fields[k] ?? ""));
}

export const SAVED_AS_FIRST = "Saved as first entered — check it and update what changed.";

/**
 * The line a failed write shows ("Refused, gone, or failed" in the app-template
 * guide): "try again" only when retrying can work. `action` and `thing` are the
 * app's own words. `found` is the caller's re-read after a write that changed
 * nothing: false = the row is gone, true = it is still there, null = the
 * re-read failed. A row still there after a plain `WHERE id = ?` write means
 * the row policy refused it; only a `guarded` write (one with a state
 * condition) can have been "changed by someone else". Decided from the error's
 * `status` / `code`, never from the hub's or the browser's text.
 */
export function failureLine(e, { action, thing, found, guarded = false } = {}) {
  if (e?.forUser) return e.message;
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(String(e?.message ?? ""))) return `That ${thing} already exists.`;
  if (e?.status === 403 || (found === true && !guarded)) return `You don’t have permission to ${action}.`;
  if (e?.status === 507) return "The household’s storage is full — free up space first.";
  if (e?.status === 429) return "Too many tries — wait a minute and try again.";
  if (found === null) return `Couldn’t ${action} — try again.`;
  if (found === false || (found === undefined && e?.status === 404)) return `This ${thing} has been removed.`;
  if (found === true || e?.status === 409) return `This ${thing} was changed by someone else — check it first.`;
  return `Couldn’t ${action} — try again.`;
}
