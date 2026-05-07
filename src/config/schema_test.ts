import { assertEquals, assertThrows } from "@std/assert";
import { GlobalConfigSchema, MergedConfigSchema, RepoConfigSchema } from "./schema.ts";

Deno.test("GlobalConfigSchema - parses empty object with defaults", () => {
    const result = GlobalConfigSchema.parse({});
    assertEquals(result.provider, "openrouter");
    assertEquals(result.openrouter, undefined);
    assertEquals(result.anthropic, undefined);
    assertEquals(result.summaryLength, 72);
    assertEquals(result.historyCount, 10);
});

Deno.test("GlobalConfigSchema - accepts valid overrides", () => {
    const result = GlobalConfigSchema.parse({
        provider: "anthropic",
        anthropic: {
            model: "claude-sonnet-4-5",
            models: ["claude-sonnet-4-5", "claude-haiku-4-6"],
        },
        summaryLength: 50,
    });
    assertEquals(result.provider, "anthropic");
    assertEquals(result.anthropic?.model, "claude-sonnet-4-5");
    assertEquals(result.anthropic?.models, ["claude-sonnet-4-5", "claude-haiku-4-6"]);
    assertEquals(result.summaryLength, 50);
});

Deno.test("GlobalConfigSchema - rejects invalid provider", () => {
    assertThrows(() => GlobalConfigSchema.parse({ provider: "openai" }));
});

Deno.test("GlobalConfigSchema - accepts per-provider model configs", () => {
    const result = GlobalConfigSchema.parse({
        openrouter: {
            model: "google/gemma-4-26b-a4b-it",
            models: ["google/gemma-4-26b-a4b-it", "google/gemma-4-31b-it"],
        },
        anthropic: {
            model: "claude-haiku-4-6",
            models: ["claude-haiku-4-6", "claude-sonnet-4-5"],
        },
    });
    assertEquals(result.openrouter?.model, "google/gemma-4-26b-a4b-it");
    assertEquals(result.anthropic?.model, "claude-haiku-4-6");
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

Deno.test("MergedConfigSchema - combines global, resolved, and repo fields", () => {
    const result = MergedConfigSchema.parse({
        provider: "openrouter",
        model: "google/gemma-4-26b-a4b-it",
        models: ["google/gemma-4-26b-a4b-it", "google/gemma-4-31b-it"],
        issuePattern: "(\\w+-\\d+)",
    });
    assertEquals(result.provider, "openrouter");
    assertEquals(result.model, "google/gemma-4-26b-a4b-it");
    assertEquals(result.models, ["google/gemma-4-26b-a4b-it", "google/gemma-4-31b-it"]);
    assertEquals(result.issuePattern, "(\\w+-\\d+)");
});

Deno.test("MergedConfigSchema - requires model and models", () => {
    assertThrows(() => MergedConfigSchema.parse({ provider: "openrouter", issuePattern: "(.+)" }));
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
