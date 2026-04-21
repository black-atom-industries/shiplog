import { assertEquals } from "@std/assert";
import { stringify as stringifyToml } from "@std/toml";
import { loadConfig } from "./loader.ts";

/** Convert camelCase to snake_case for writing TOML test files */
function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
        result[snakeKey] = value;
    }
    return result;
}

async function withTempFiles(
    files: Record<string, unknown>,
    fn: () => Promise<void>,
): Promise<void> {
    const dir = await Deno.makeTempDir();
    const origCwd = Deno.cwd();
    Deno.chdir(dir);

    for (const [name, content] of Object.entries(files)) {
        await Deno.writeTextFile(
            name,
            stringifyToml(camelToSnake(content as Record<string, unknown>)),
        );
    }

    try {
        await fn();
    } finally {
        Deno.chdir(origCwd);
        await Deno.remove(dir, { recursive: true });
    }
}

Deno.test("loadConfig - returns defaults when no config files exist", async () => {
    const dir = await Deno.makeTempDir();
    const origCwd = Deno.cwd();
    Deno.chdir(dir);

    // Override HOME so we don't read the user's actual config
    const origHome = Deno.env.get("HOME");
    Deno.env.set("HOME", dir);

    try {
        const config = await loadConfig();
        assertEquals(config.provider, "anthropic");
        assertEquals(config.model, "anthropic/claude-haiku-4-6");
        assertEquals(config.summaryLength, 72);
        assertEquals(config.historyCount, 10);
        assertEquals(config.issuePattern, undefined);
        assertEquals(config.issuePrefix, undefined);
    } finally {
        Deno.env.set("HOME", origHome ?? "");
        Deno.chdir(origCwd);
        await Deno.remove(dir, { recursive: true });
    }
});

Deno.test("loadConfig - repo config merges over global config", async () => {
    await withTempFiles(
        { ".shiplog.toml": { issuePattern: "(PROJ-\\d+)", issuePrefix: "" } },
        async () => {
            // Override HOME so we don't read the user's actual config
            const origHome = Deno.env.get("HOME");
            Deno.env.set("HOME", Deno.cwd());
            try {
                const config = await loadConfig();
                assertEquals(config.issuePattern, "(PROJ-\\d+)");
                assertEquals(config.provider, "anthropic"); // global default preserved
            } finally {
                Deno.env.set("HOME", origHome ?? "");
            }
        },
    );
});

Deno.test("loadConfig - repo config without global config uses defaults", async () => {
    await withTempFiles(
        { ".shiplog.toml": { issuePattern: "(DEV-\\d+)" } },
        async () => {
            const config = await loadConfig();
            assertEquals(config.issuePattern, "(DEV-\\d+)");
            assertEquals(config.summaryLength, 72);
        },
    );
});
