import { MemoryProposalStore } from "@kyberis/agent-os/safety";
import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteNote = vi.fn();
const getNoteById = vi.fn();

vi.mock("@/lib/notes/persistence", () => ({
  deleteNote: (...args: unknown[]) => deleteNote(...args),
  getNoteById: (...args: unknown[]) => getNoteById(...args),
}));

const { buildDeletePreview, buildProposalRegistry } = await import("./proposal-registry");

describe("deleteNote proposal", () => {
  let store: MemoryProposalStore;

  beforeEach(() => {
    store = new MemoryProposalStore();
    deleteNote.mockReset();
    getNoteById.mockReset();
  });

  async function propose(raw: unknown) {
    return buildProposalRegistry("en").propose({
      store,
      userId: "u1",
      conversationExternalId: "42",
      kind: "deleteNote",
      raw,
    });
  }

  it("describes the deletion without touching the note", async () => {
    const proposal = await propose({ noteId: "n1", preview: "buy milk" });

    expect(proposal).toMatchObject({ kind: "deleteNote", destructive: true });
    expect(proposal?.rows).toEqual([{ label: "Note", value: "buy milk" }]);
    expect(deleteNote).not.toHaveBeenCalled();
  });

  it("deletes only once the confirmation arrives", async () => {
    deleteNote.mockResolvedValue(true);
    const proposal = await propose({ noteId: "n1", preview: "buy milk" });

    const outcome = await buildProposalRegistry("en").confirm({
      store,
      proposalId: proposal!.id,
      userId: "u1",
      conversationExternalId: "42",
    });

    expect(outcome).toMatchObject({ status: "applied", entityId: "n1" });
    expect(deleteNote).toHaveBeenCalledExactlyOnceWith("u1", "n1");
  });

  it("does not delete when the user cancels", async () => {
    const proposal = await propose({ noteId: "n1" });

    await buildProposalRegistry("en").cancel({
      store,
      proposalId: proposal!.id,
      userId: "u1",
    });
    const outcome = await buildProposalRegistry("en").confirm({
      store,
      proposalId: proposal!.id,
      userId: "u1",
    });

    expect(outcome.status).toBe("cancelled");
    expect(deleteNote).not.toHaveBeenCalled();
  });

  it("refuses a confirmation that arrives from another chat", async () => {
    const proposal = await propose({ noteId: "n1" });

    const outcome = await buildProposalRegistry("en").confirm({
      store,
      proposalId: proposal!.id,
      userId: "u1",
      conversationExternalId: "99",
    });

    expect(outcome.status).toBe("forbidden");
    expect(deleteNote).not.toHaveBeenCalled();
  });

  it("reports a note that vanished between proposal and confirmation", async () => {
    deleteNote.mockResolvedValue(false);
    const proposal = await propose({ noteId: "n1" });

    const outcome = await buildProposalRegistry("en").confirm({
      store,
      proposalId: proposal!.id,
      userId: "u1",
    });

    expect(outcome.status).toBe("failed");
    expect(outcome.httpStatus).toBe(404);
  });

  it("rejects a payload without a note id", async () => {
    expect(await propose({ preview: "buy milk" })).toBeNull();
  });

  it("speaks the user's language on the card", async () => {
    const proposal = await buildProposalRegistry("es").propose({
      store,
      userId: "u1",
      conversationExternalId: "42",
      kind: "deleteNote",
      raw: { noteId: "n1", preview: "leche" },
    });
    expect(proposal?.rows[0]?.label).toBe("Nota");
    expect(proposal?.summary).toBe("Una vez borrada, no hay vuelta atrás.");
  });
});

describe("buildDeletePreview", () => {
  beforeEach(() => {
    getNoteById.mockReset();
  });

  it("collapses whitespace so the card stays one line", async () => {
    getNoteById.mockResolvedValue({ id: "n1", body: "buy\n  milk\ttoday" });
    expect(await buildDeletePreview("u1", "n1")).toBe("buy milk today");
  });

  it("truncates a long body", async () => {
    getNoteById.mockResolvedValue({ id: "n1", body: "x".repeat(400) });
    const preview = await buildDeletePreview("u1", "n1");
    expect(preview).toHaveLength(158);
    expect(preview?.endsWith("…")).toBe(true);
  });

  it("returns nothing for a note the user does not own", async () => {
    getNoteById.mockResolvedValue(null);
    expect(await buildDeletePreview("u1", "n1")).toBeUndefined();
  });
});
