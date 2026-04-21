import { assertEquals } from "@std/assert";
import { generateJsonSchema } from "./json-schema.ts";

Deno.test("generateJsonSchema - returns valid JSON", () => {
    const output = generateJsonSchema();
    const schema = JSON.parse(output);
    assertEquals(typeof schema, "object");
    assertEquals(schema.type, "object");
});

Deno.test("generateJsonSchema - includes provider enum with openrouter", () => {
    const schema = JSON.parse(generateJsonSchema());
    const providerEnum = schema.properties.provider.enum;
    assertEquals(Array.isArray(providerEnum), true);
    assertEquals(providerEnum.includes("anthropic"), true);
    assertEquals(providerEnum.includes("openrouter"), true);
});

Deno.test("generateJsonSchema - model is a string type (openrouter compatibility)", () => {
    const schema = JSON.parse(generateJsonSchema());
    // model is now z.string() to support openrouter's dynamic provider/model-name format
    assertEquals(schema.properties.model.type, "string");
    // No enum — any string is valid for openrouter models
    assertEquals(schema.properties.model.enum, undefined);
});

Deno.test("generateJsonSchema - includes defaults", () => {
    const schema = JSON.parse(generateJsonSchema());
    assertEquals(schema.properties.provider.default, "anthropic");
    assertEquals(schema.properties.model.default, "anthropic/claude-haiku-4-6");
    assertEquals(schema.properties.summary_length.default, 72);
    assertEquals(schema.properties.history_count.default, 10);
});
