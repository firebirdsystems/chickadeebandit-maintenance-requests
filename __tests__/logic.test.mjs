import { describe, it, expect } from "vitest";
import {
  CATEGORIES, PRIORITIES, STATUS_LABELS,
  fmtDate, memberName, filterRequests, priorityColor, statusColor, statusLabel, searchableFields,
  sortRequests, pageSizeOf, pageSqlAt,
} from "../src/logic.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

describe("constants", () => {
  it("expose category and priority lists", () => {
    expect(CATEGORIES).toContain("plumbing");
    expect(PRIORITIES).toEqual(["low", "medium", "high", "urgent"]);
  });
});

describe("fmtDate", () => {
  it("returns empty for falsy", () => expect(fmtDate("")).toBe(""));
  it("formats an ISO date", () => expect(fmtDate("2026-07-08T12:00:00Z")).toBe("Jul 8, 2026"));
});

describe("memberName", () => {
  const map = new Map([["m1", { name: "Alex" }]]);
  it("resolves via the map", () => expect(memberName(map, "m1")).toBe("Alex"));
  it("defaults to Unknown", () => expect(memberName(map, "zz")).toBe("Unknown"));
});

describe("filterRequests", () => {
  const reqs = [
    { id: "1", status: "open" },
    { id: "2", status: "in_progress" },
    { id: "3", status: "resolved" },
    { id: "4", status: "open" },
  ];
  it("all returns everything", () => expect(filterRequests(reqs, "all")).toHaveLength(4));
  it("filters by in_progress/resolved", () => {
    expect(filterRequests(reqs, "in_progress").map(r => r.id)).toEqual(["2"]);
    expect(filterRequests(reqs, "resolved").map(r => r.id)).toEqual(["3"]);
  });
  it("defaults to open", () => {
    expect(filterRequests(reqs, "open").map(r => r.id)).toEqual(["1", "4"]);
    expect(filterRequests(reqs, "whatever").map(r => r.id)).toEqual(["1", "4"]);
  });
});

describe("color/label accessors", () => {
  it("priorityColor falls back", () => {
    expect(priorityColor("urgent")).toBe("#dc2626");
    expect(priorityColor("???")).toBe("#9ca3af");
  });
  it("statusColor falls back", () => {
    expect(statusColor("open")).toBe("#2563eb");
    expect(statusColor("???")).toBe("#6b7280");
  });
  it("statusLabel falls back to the raw value", () => {
    expect(statusLabel("in_progress")).toBe("In Progress");
    expect(statusLabel("custom")).toBe("custom");
    expect(STATUS_LABELS.resolved).toBe("Resolved");
  });
});

describe("searchableFields", () => {
  it("matches on location and description, not just the title", () => {
    const fields = searchableFields({
      title: "Leak", description: "water pooling under the radiator",
      location: "east stairwell", category: "plumbing", priority: "high",
    });
    expect(fields).toContain("east stairwell");
    expect(fields).toContain("water pooling under the radiator");
  });
});

// The archive read is paged, and the first page is ALSO the preloaded one, so
// these two facts have to stay true together: page 1 is exactly the statement
// the manifest declares, and later pages are that same statement with only the
// offset moved. Drift between them is silent — the preload just stops
// answering, or a page repeats/skips rows.
describe("resolved-archive paging", () => {
  const FIRST = "SELECT * FROM app_maintenance_requests__requests WHERE status = 'resolved' ORDER BY created_at DESC, id DESC LIMIT 25 OFFSET 0";

  it("takes the page size from the statement itself", () => {
    expect(pageSizeOf(FIRST)).toBe(25);
    expect(() => pageSizeOf("SELECT 1")).toThrow(/literal LIMIT/);
  });

  it("returns page one unchanged, so it still matches the preload", () => {
    expect(pageSqlAt(FIRST, 0)).toBe(FIRST);
  });

  it("moves only the offset for later pages", () => {
    expect(pageSqlAt(FIRST, 25)).toBe(FIRST.replace("OFFSET 0", "OFFSET 25"));
    expect(pageSqlAt(FIRST, 50)).toBe(FIRST.replace("OFFSET 0", "OFFSET 50"));
  });

  it("never interpolates anything but a non-negative integer", () => {
    for (const bad of ["1; DROP TABLE x", -5, 2.7, NaN, undefined, null]) {
      expect(pageSqlAt(FIRST, bad)).toMatch(/OFFSET \d+$/);
    }
    expect(pageSqlAt(FIRST, 2.7)).toBe(FIRST.replace("OFFSET 0", "OFFSET 2"));
    expect(pageSqlAt(FIRST, -5)).toBe(FIRST);
  });

  it("is the statement the manifest declares as the preloaded first page", () => {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const manifest = JSON.parse(readFileSync(join(__dirname, "../manifest.json"), "utf-8"));
    expect(manifest.preload.resolved_page.sql).toBe(FIRST);
    // A parameterised LIMIT/OFFSET is rejected by the hub's admission
    // validator ("could not be parsed as SQL"), so the integers must be inline.
    expect(manifest.preload.resolved_page.sql).not.toMatch(/LIMIT \?|OFFSET \?/);
  });
});

describe("sortRequests", () => {
  const mk = (id, priority, created_at) => ({ id, priority, created_at, status: "open" });

  it("orders by priority, then newest, then id", () => {
    const out = sortRequests([
      mk("c", "low", "2026-08-01"), mk("a", "urgent", "2026-01-01"),
      mk("b", "high", "2026-08-30"), mk("d", "urgent", "2026-08-30"),
    ]);
    expect(out.map(r => r.id)).toEqual(["d", "a", "b", "c"]);
  });

  it("breaks exact ties by id so the page cannot reshuffle", () => {
    const rows = [mk("b", "high", "2026-08-30"), mk("a", "high", "2026-08-30")];
    expect(sortRequests(rows).map(r => r.id)).toEqual(["b", "a"]);
    expect(sortRequests([...rows].reverse()).map(r => r.id)).toEqual(["b", "a"]);
  });

  it("treats an unknown priority as lowest, and does not mutate its input", () => {
    const rows = [mk("x", "mystery", "2026-08-30"), mk("y", "low", "2026-08-30")];
    expect(sortRequests(rows).map(r => r.id)).toEqual(["y", "x"]);
    expect(rows.map(r => r.id)).toEqual(["x", "y"]);
  });
});
