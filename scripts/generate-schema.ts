import { generateJsonSchema } from "../src/config/json-schema.ts";

export { generateJsonSchema };

export function schemaMatches(existing: string): boolean {
    return existing === generateJsonSchema();
}

if (import.meta.main) {
    if (Deno.args.includes("--check")) {
        let existing = "";
        try {
            existing = await Deno.readTextFile("schema.json");
        } catch (error) {
            if (!(error instanceof Deno.errors.NotFound)) throw error;
        }

        if (!schemaMatches(existing)) {
            console.error("schema.json is out of date; run `deno task schema`");
            Deno.exit(1);
        }

        console.log("schema.json is up to date");
    } else {
        await Deno.writeTextFile("schema.json", generateJsonSchema());
        console.log("schema.json updated");
    }
}
