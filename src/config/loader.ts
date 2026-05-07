import { parse as parseToml } from "@std/toml";
import {
    GlobalConfigSchema,
    type MergedConfig,
    MergedConfigSchema,
    RepoConfigSchema,
} from "./schema.ts";
import { getGlobalConfigPath, REPO_CONFIG_NAME } from "./paths.ts";

/** Convert snake_case keys to camelCase (single level, no recursion needed for flat config) */
function snakeToCamel(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
        result[camelKey] = value;
    }
    return result;
}

async function readTomlFile(path: string): Promise<Record<string, unknown> | null> {
    try {
        const content = await Deno.readTextFile(path);
        const parsed = parseToml(content);
        return snakeToCamel(parsed as Record<string, unknown>);
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) return null;
        throw e;
    }
}

const DEFAULT_PROVIDER_MODELS: Record<string, { model: string; models: string[] }> = {
    openrouter: {
        model: "google/gemma-4-26b-a4b-it",
        models: [
            "google/gemma-4-26b-a4b-it",
            "google/gemma-4-31b-it",
            "claude-haiku-4-6",
        ],
    },
    anthropic: {
        model: "claude-haiku-4-6",
        models: ["claude-haiku-4-6", "claude-sonnet-4-5"],
    },
};

export async function loadConfig(): Promise<MergedConfig> {
    const globalRaw = await readTomlFile(getGlobalConfigPath());
    const globalConfig = GlobalConfigSchema.parse(globalRaw ?? {});

    const providerKey = globalConfig.provider;
    const providerConfig = providerKey === "openrouter"
        ? globalConfig.openrouter
        : globalConfig.anthropic;
    const defaults = DEFAULT_PROVIDER_MODELS[providerKey];

    const resolved = {
        model: providerConfig?.model ?? defaults.model,
        models: providerConfig?.models ?? defaults.models,
    };

    const repoRaw = await readTomlFile(REPO_CONFIG_NAME);
    const repoConfig = repoRaw ? RepoConfigSchema.parse(repoRaw) : {};

    return MergedConfigSchema.parse({ ...globalConfig, ...resolved, ...repoConfig });
}
