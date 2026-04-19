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

export async function loadConfig(): Promise<MergedConfig> {
    const globalRaw = await readTomlFile(getGlobalConfigPath());
    const globalConfig = GlobalConfigSchema.parse(globalRaw ?? {});

    const repoRaw = await readTomlFile(REPO_CONFIG_NAME);
    const repoConfig = repoRaw ? RepoConfigSchema.parse(repoRaw) : {};

    return MergedConfigSchema.parse({ ...globalConfig, ...repoConfig });
}
