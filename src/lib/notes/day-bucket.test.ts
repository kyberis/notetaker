import { describe, expect, it } from "vitest";

import { bucketByDay } from "./day-bucket";

describe("bucketByDay", () => {
  it("groups notes per UTC day in descending order with localised labels", () => {
    const now = new Date("2026-05-03T12:00:00Z");
    const notes = [
      { id: "a", occurredAt: new Date("2026-05-03T10:00:00Z") },
      { id: "b", occurredAt: new Date("2026-05-03T08:00:00Z") },
      { id: "c", occurredAt: new Date("2026-05-02T20:00:00Z") },
      { id: "d", occurredAt: new Date("2026-05-01T07:00:00Z") },
    ];
    const buckets = bucketByDay(notes, "en", now);
    expect(buckets).toHaveLength(3);
    expect(buckets[0].label).toBe("Today");
    expect(buckets[0].notes).toHaveLength(2);
    expect(buckets[1].label).toBe("Yesterday");
    expect(buckets[2].notes[0].id).toBe("d");
  });

  it("respects locale labels", () => {
    const now = new Date("2026-05-03T12:00:00Z");
    const notes = [{ id: "a", occurredAt: new Date("2026-05-03T10:00:00Z") }];
    expect(bucketByDay(notes, "es", now)[0].label).toBe("Hoy");
    expect(bucketByDay(notes, "pt", now)[0].label).toBe("Hoje");
    expect(bucketByDay(notes, "ar", now)[0].label).toBe("اليوم");
  });
});
