import type {
  ProposalRecord,
  ProposalStatus,
  ProposalStore,
} from "@kyberis/agent-os/safety";
import type { AgentProposalStatus } from "@prisma/client";

import { db } from "@/lib/db";

/**
 * Prisma-backed {@link ProposalStore}. The shared safety module owns the rules
 * (ownership, expiry, single application); this file only owns the rows.
 */

const TO_PRISMA: Record<ProposalStatus, AgentProposalStatus> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  cancelled: "CANCELLED",
  expired: "EXPIRED",
};

const FROM_PRISMA: Record<AgentProposalStatus, ProposalStatus> = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
};

type Row = {
  id: string;
  userId: string;
  conversationExternalId: string;
  kind: string;
  dataJson: string;
  summary: string;
  status: AgentProposalStatus;
  createdAt: Date;
  expiresAt: Date;
};

function toRecord(row: Row): ProposalRecord {
  return {
    id: row.id,
    userId: row.userId,
    conversationExternalId: row.conversationExternalId,
    kind: row.kind,
    dataJson: row.dataJson,
    summary: row.summary,
    status: FROM_PRISMA[row.status],
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}

export const proposalStore: ProposalStore = {
  async save(input) {
    const row = await db.agentProposal.create({
      data: {
        id: input.id,
        userId: input.userId,
        conversationExternalId: input.conversationExternalId,
        kind: input.kind,
        dataJson: input.dataJson,
        summary: input.summary,
        expiresAt: new Date(input.expiresAt),
      },
    });
    return toRecord(row);
  },

  async get(id) {
    const row = await db.agentProposal.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  },

  async updateStatus(id, status) {
    await db.agentProposal.update({
      where: { id },
      data: { status: TO_PRISMA[status] },
    });
  },

  async purgeExpired() {
    await db.agentProposal.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};
