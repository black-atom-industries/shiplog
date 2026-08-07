import { z } from "zod";
import { PROVIDER_NAMES } from "../adapters.ts";

const ProviderModelsSchema = z.object({
    model: z.string(),
    models: z.array(z.string()),
});

export const GlobalConfigSchema = z.object({
    provider: z.enum(PROVIDER_NAMES as unknown as ["anthropic", "openrouter"]).default(
        "openrouter",
    ),
    openrouter: ProviderModelsSchema.optional(),
    anthropic: ProviderModelsSchema.optional(),
    summaryLength: z.number().positive().default(72),
    historyCount: z.number().positive().default(10),
});

export const RepoConfigSchema = z.object({
    issuePattern: z.string().optional(),
    issuePrefix: z.string().optional(),
    useLazygit: z.boolean().default(true),
});

export const MergedConfigSchema = z.object({
    ...GlobalConfigSchema.shape,
    ...RepoConfigSchema.shape,
    model: z.string(),
    models: z.array(z.string()),
});

export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
export type RepoConfig = z.infer<typeof RepoConfigSchema>;
export type MergedConfig = z.infer<typeof MergedConfigSchema>;
