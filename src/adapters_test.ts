import { assertEquals, assertThrows } from "@std/assert";
import {
    ANTHROPIC_MODELS,
    createAdapter,
    OPENROUTER_DEFAULT_MODELS,
    PROVIDER_NAMES,
} from "./adapters.ts";

Deno.test("PROVIDER_NAMES includes anthropic", () => {
    assertEquals(PROVIDER_NAMES.includes("anthropic"), true);
});

Deno.test("PROVIDER_NAMES includes openrouter", () => {
    assertEquals(PROVIDER_NAMES.includes("openrouter"), true);
});

Deno.test("ANTHROPIC_MODELS is a non-empty array of strings", () => {
    assertEquals(Array.isArray(ANTHROPIC_MODELS), true);
    assertEquals(ANTHROPIC_MODELS.length > 0, true);
    for (const model of ANTHROPIC_MODELS) {
        assertEquals(typeof model, "string");
    }
});

Deno.test("OPENROUTER_DEFAULT_MODELS is a non-empty array of strings", () => {
    assertEquals(Array.isArray(OPENROUTER_DEFAULT_MODELS), true);
    assertEquals(OPENROUTER_DEFAULT_MODELS.length > 0, true);
    for (const model of OPENROUTER_DEFAULT_MODELS) {
        assertEquals(typeof model, "string");
    }
});

Deno.test("createAdapter returns an adapter for anthropic provider/model", () => {
    const adapter = createAdapter("anthropic", "claude-haiku-4-5");
    assertEquals(typeof adapter, "object");
    assertEquals(adapter !== null, true);
});

Deno.test("createAdapter returns an adapter for openrouter provider/model", () => {
    const adapter = createAdapter("openrouter", "google/gemma-3-27b-it");
    assertEquals(typeof adapter, "object");
    assertEquals(adapter !== null, true);
});

Deno.test("createAdapter throws for invalid provider", () => {
    assertThrows(
        // deno-lint-ignore no-explicit-any
        () => createAdapter("openai" as any, "gpt-4" as any),
        Error,
        "Unknown provider",
    );
});
