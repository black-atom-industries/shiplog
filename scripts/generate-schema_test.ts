import { assertEquals } from "@std/assert";
import { generateJsonSchema, schemaMatches } from "./generate-schema.ts";

Deno.test("schemaMatches accepts the generated schema", () => {
    const schema = generateJsonSchema();

    assertEquals(schemaMatches(schema), true);
});

Deno.test("schemaMatches rejects stale schema content", () => {
    assertEquals(schemaMatches("{}"), false);
});

Deno.test("generated schema uses repository formatting", () => {
    const schema = generateJsonSchema();

    assertEquals(schema.endsWith("\n"), true);
    assertEquals(schema.includes('\n    "type"'), true);
});
