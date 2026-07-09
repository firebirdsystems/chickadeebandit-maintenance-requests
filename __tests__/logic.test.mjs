import { describe, it, expect } from "vitest";
import {
  CATEGORIES, PRIORITIES, STATUS_LABELS,
  fmtDate, memberName, filterRequests, priorityColor, statusColor, statusLabel,
} from "../src/logic.js";

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
