import { assertEquals, assertThrows } from "@std/assert";
import { GlobalConfigSchema, MergedConfigSchema, RepoConfigSchema } from "./schema.ts";

Deno.test("GlobalConfigSchema - parses empty object with defaults", () => {
    const result = GlobalConfigSchema.parse({});
    assertEquals(result.provider, "anthropic");
    assertEquals(result.model, "anthropic/claude-haiku-4-6");
    assertEquals(result.models, [
        "claude-opus-4-5",
        "claude-sonnet-4-5",
        "claude-haiku-4-6",
    ]);
    assertEquals(result.summaryLength, 72);
    assertEquals(result.historyCount, 10);
});

Deno.test("GlobalConfigSchema - accepts valid overrides", () => {
    const result = GlobalConfigSchema.parse({
        model: "claude-sonnet-4-5",
        summaryLength: 50,
    });
    assertEquals(result.model, "claude-sonnet-4-5");
    assertEquals(result.summaryLength, 50);
    assertEquals(result.provider, "anthropic");
});

Deno.test("GlobalConfigSchema - rejects invalid provider", () => {
    assertThrows(() => GlobalConfigSchema.parse({ provider: "openai" }));
});

Deno.test("GlobalConfigSchema - accepts any string as model (openrouter compatibility)", () => {
    // OpenRouter uses dynamic provider/model-name strings, so model accepts any string
    const result = GlobalConfigSchema.parse({ model: "openai/gpt-5" });
    assertEquals(result.model, "openai/gpt-5");

    const result2 = GlobalConfigSchema.parse({ model: "x-ai/grok-4-fast" });
    assertEquals(result2.model, "x-ai/grok-4-fast");

    const result3 = GlobalConfigSchema.parse({ model: "google/gemma-3-27b-it" });
    assertEquals(result3.model, "google/gemma-3-27b-it");
});

Deno.test("GlobalConfigSchema - accepts any strings in models array (openrouter compatibility)", () => {
    const result = GlobalConfigSchema.parse({
        models: [
            "anthropic/claude-sonnet-4.5",
            "openai/gpt-5",
            "google/gemma-3-12b-it",
        ],
    });
    assertEquals(result.models, [
        "anthropic/claude-sonnet-4.5",
        "openai/gpt-5",
        "google/gemma-3-12b-it",
    ]);
});

Deno.test("GlobalConfigSchema - rejects non-positive summaryLength", () => {
    assertThrows(() => GlobalConfigSchema.parse({ summaryLength: 0 }));
    assertThrows(() => GlobalConfigSchema.parse({ summaryLength: -1 }));
});

Deno.test("RepoConfigSchema - parses empty object", () => {
    const result = RepoConfigSchema.parse({});
    assertEquals(result.issuePattern, undefined);
    assertEquals(result.issuePrefix, undefined);
});

Deno.test("RepoConfigSchema - parses issue config", () => {
    const result = RepoConfigSchema.parse({
        issuePattern: "(\\w+-\\d+)",
        issuePrefix: "PROJ-",
    });
    assertEquals(result.issuePattern, "(\\w+-\\d+)");
    assertEquals(result.issuePrefix, "PROJ-");
});

Deno.test("MergedConfigSchema - combines global and repo fields", () => {
    const result = MergedConfigSchema.parse({
        provider: "anthropic",
        model: "claude-haiku-4-5",
        issuePattern: "(\\w+-\\d+)",
    });
    assertEquals(result.provider, "anthropic");
    assertEquals(result.issuePattern, "(\\w+-\\d+)");
});

Deno.test("RepoConfigSchema - useLazygit defaults to true", () => {
    const result = RepoConfigSchema.parse({});
    assertEquals(result.useLazygit, true);
});

Deno.test("RepoConfigSchema - commitTypes defaults to standard set", () => {
    const result = RepoConfigSchema.parse({});
    assertEquals(result.commitTypes.includes("feat"), true);
    assertEquals(result.commitTypes.includes("fix"), true);
    assertEquals(result.commitTypes.length, 10);
});

Deno.test("RepoConfigSchema - accepts custom commitTypes", () => {
    const result = RepoConfigSchema.parse({ commitTypes: ["feat", "fix", "custom"] });
    assertEquals(result.commitTypes, ["feat", "fix", "custom"]);
});
