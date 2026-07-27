import { generateText, gateway, stepCountIs, type ModelMessage } from "ai";
import type { Proposal } from "@kyberis/agent-os/safety";

import type { Locale } from "@/lib/i18n/locale";
import { log } from "@/lib/log";
import type { WillProposalKind } from "@/lib/safety/proposal-registry";

import {
  buildNoteTools,
  type NoteSourceLiteral,
  type RaiseProposal,
} from "./note-tools";
import { buildSystemPrompt } from "./prompts";

const DEFAULT_MODEL = process.env.AI_MODEL ?? "openai/gpt-4o-mini";

export type RunNoteAgentInput = {
  userId: string;
  locale: Locale;
  source: NoteSourceLiteral;
  messages: ModelMessage[];
  /**
   * Fired after each agent step completes, with the tool names that ran
   * during that step. Used by the Telegram webhook to edit a "status"
   * message in place ("Saving your note…", "Suggesting tags…") so the
   * user sees forward motion. Errors thrown by the callback are
   * swallowed — progress UI must never break the agent loop.
   */
  onStep?: (event: { toolNames: string[]; stepNumber: number }) => void | Promise<void>;
  /**
   * Raises a confirm-before-write proposal. Omit it and the agent simply cannot
   * offer destructive actions on this turn — it never falls back to writing.
   */
  onProposal?: RaiseProposal;
};

export type RunNoteAgentResult = {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
  /** Proposals raised during the turn, for the caller to render as cards. */
  proposals: Proposal<WillProposalKind>[];
};

/**
 * One turn of the agent loop. We allow multi-step tool calling (saveNote ->
 * proposeTags -> setReminder) within a fixed step budget so the model can
 * plan + act + speak without bouncing through us.
 *
 * Routing: when an AI Gateway token is configured (auto via Vercel OIDC, or
 * AI_GATEWAY_API_KEY in CI) the model is reached through the gateway,
 * giving us cost tracking + retries. Otherwise the SDK uses direct OpenAI.
 */
export async function runNoteAgent(input: RunNoteAgentInput): Promise<RunNoteAgentResult> {
  const proposals: Proposal<WillProposalKind>[] = [];
  const tools = buildNoteTools({
    userId: input.userId,
    defaultSource: input.source,
    onProposal: input.onProposal
      ? async (raised) => {
          const proposal = await input.onProposal!(raised);
          if (proposal) proposals.push(proposal);
          return proposal;
        }
      : undefined,
  });
  const system = buildSystemPrompt({ locale: input.locale, nowUtc: new Date() });

  try {
    const result = await generateText({
      model: gateway(DEFAULT_MODEL),
      system,
      messages: input.messages,
      tools,
      stopWhen: stepCountIs(6),
      temperature: 0.4,
      onStepFinish: input.onStep
        ? async (step) => {
            const toolNames = (step.toolCalls ?? [])
              .map((c) => c.toolName)
              .filter((name): name is string => typeof name === "string");
            try {
              await input.onStep!({
                toolNames,
                stepNumber: step.stepNumber ?? 0,
              });
            } catch (err) {
              log.warn("run_note_agent_on_step_threw", {
                error: err instanceof Error ? err.message : String(err),
              });
            }
          }
        : undefined,
    });
    return {
      text: result.text,
      inputTokens: result.usage?.inputTokens,
      outputTokens: result.usage?.outputTokens,
      proposals,
    };
  } catch (err) {
    log.error("run_note_agent_failed", {
      error: err instanceof Error ? err.message : String(err),
      userId: input.userId,
    });
    throw err;
  }
}
