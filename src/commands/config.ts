import { Command } from "@cliffy/command";
import { stringify as stringifyToml } from "@std/toml";
import * as colors from "../ui/colors.ts";
import { loadConfig } from "../config/loader.ts";
import { CONFIG_DIR, GLOBAL_CONFIG_PATH } from "../config/paths.ts";
import { GlobalConfigSchema } from "../config/schema.ts";

/** Convert camelCase keys to snake_case for TOML output */
function camelToSnake(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
        result[snakeKey] = value;
    }
    return result;
}

async function initGlobalConfig(): Promise<void> {
    try {
        await Deno.stat(GLOBAL_CONFIG_PATH);
        console.error(colors.yellow(`Config already exists at ${GLOBAL_CONFIG_PATH}`));
        console.error("Delete it first if you want to regenerate.");
        Deno.exit(1);
    } catch (e) {
        if (!(e instanceof Deno.errors.NotFound)) throw e;
    }

    await Deno.mkdir(CONFIG_DIR, { recursive: true });

    const defaults = GlobalConfigSchema.parse({});
    const tomlContent = stringifyToml(camelToSnake(defaults as Record<string, unknown>));

    await Deno.writeTextFile(GLOBAL_CONFIG_PATH, tomlContent);
    console.log(colors.green(`Config written to ${GLOBAL_CONFIG_PATH}`));
}

async function showConfig(): Promise<void> {
    const config = await loadConfig();
    console.log(stringifyToml(camelToSnake(config as Record<string, unknown>)));
}

export const configCommand = new Command()
    .description("Manage global configuration")
    .option("--init", "Create default global config")
    .option("--show", "Show resolved config")
    .action(async (options) => {
        if (options.init) {
            await initGlobalConfig();
        } else if (options.show) {
            await showConfig();
        } else {
            console.error("Use --init or --show. See --help for details.");
            Deno.exit(1);
        }
    });
