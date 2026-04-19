function getHome(): string {
    return Deno.env.get("HOME") ?? "";
}

export function getConfigDir(): string {
    return `${getHome()}/.config/black-atom/shiplog`;
}

export function getGlobalConfigPath(): string {
    return `${getConfigDir()}/config.toml`;
}

export function getRemoteSchemaUrl(): string {
    return REMOTE_SCHEMA_URL;
}

export const REPO_CONFIG_NAME = ".shiplog.toml";
export const REMOTE_SCHEMA_URL =
    "https://raw.githubusercontent.com/black-atom-industries/shiplog/main/schema.json";

// Kept for backwards compatibility (used directly by config.ts, init.ts)
export const CONFIG_DIR = getConfigDir();
export const GLOBAL_CONFIG_PATH = getGlobalConfigPath();
