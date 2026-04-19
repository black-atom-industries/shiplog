import { z } from "zod";
import { MergedConfigSchema } from "./schema.ts";

/** Convert camelCase property names to snake_case in JSON Schema */
function convertKeysToSnakeCase(schema: Record<string, unknown>): Record<string, unknown> {
    const result = { ...schema };
    if (result.properties && typeof result.properties === "object") {
        const props = result.properties as Record<string, unknown>;
        const converted: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(props)) {
            const snakeKey = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
            converted[snakeKey] = value;
        }
        result.properties = converted;
    }
    return result;
}

export function generateJsonSchema(): string {
    const schema = z.toJSONSchema(MergedConfigSchema);
    const converted = convertKeysToSnakeCase(schema as Record<string, unknown>);

    // Remove the required array — all fields have defaults, so the config is fully optional
    delete converted.required;

    return JSON.stringify(converted, null, 2);
}
