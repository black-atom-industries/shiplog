import { assertEquals } from "@std/assert";
import { CONFIG_DIR, GLOBAL_CONFIG_PATH, REMOTE_SCHEMA_URL, REPO_CONFIG_NAME } from "./paths.ts";

Deno.test("CONFIG_DIR points to ~/.config/black-atom/shiplog", () => {
    const home = Deno.env.get("HOME");
    assertEquals(CONFIG_DIR, `${home}/.config/black-atom/shiplog`);
});

Deno.test("GLOBAL_CONFIG_PATH is config.toml inside CONFIG_DIR", () => {
    assertEquals(GLOBAL_CONFIG_PATH, `${CONFIG_DIR}/config.toml`);
});

Deno.test("REMOTE_SCHEMA_URL points to GitHub raw", () => {
    assertEquals(
        REMOTE_SCHEMA_URL,
        "https://raw.githubusercontent.com/black-atom-industries/shiplog/main/schema.json",
    );
});

Deno.test("REPO_CONFIG_NAME is .shiplog.toml", () => {
    assertEquals(REPO_CONFIG_NAME, ".shiplog.toml");
});
