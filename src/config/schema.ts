import { z } from "zod";
import { PROVIDER_NAMES } from "../adapters.ts";

export const GlobalConfigSchema = z.object({
    provider: z.enum(PROVIDER_NAMES as unknown as ["anthropic", "openrouter"]).default("anthropic"),
    model: z.string().default("anthropic/claude-haiku-4-6"),
    models: z.array(z.string()).default([
        "claude-opus-4-5",
        "claude-sonnet-4-5",
        "claude-haiku-4-6",
    ]),
    summaryLength: z.number().positive().default(72),
    historyCount: z.number().positive().default(10),
});

export const DEFAULT_SCOPES = [
    "ui",
    "api",
    "config",
    "auth",
    "ci",
    "build",
    "docs",
    "test",
] as const;

export const DEFAULT_COMMIT_TYPES = [
    "feat",
    "fix",
    "docs",
    "style",
    "refactor",
    "test",
    "chore",
    "ci",
    "perf",
    "revert",
] as const;

export const RepoConfigSchema = z.object({
    issuePattern: z.string().optional(),
    issuePrefix: z.string().optional(),
    useLazygit: z.boolean().default(true),
    commitTypes: z.array(z.string()).default([...DEFAULT_COMMIT_TYPES]),
    scopes: z.array(z.string()).default([...DEFAULT_SCOPES]),
});

export const MergedConfigSchema = z.object({
    ...GlobalConfigSchema.shape,
    ...RepoConfigSchema.shape,
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type MergedConfig = z.infer<typeof MergedConfigSchema>;
