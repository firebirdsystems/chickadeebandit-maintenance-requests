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
  if (filter === "all")         return requests;
  if (filter === "in_progress") return requests.filter(r => r.status === "in_progress");
  if (filter === "resolved")    return requests.filter(r => r.status === "resolved");
  return requests.filter(r => r.status === "open");
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
