import { assertEquals } from "@std/assert";
import { buildBranchPrompt } from "./branch-prompt.ts";

Deno.test("buildBranchPrompt - includes description", () => {
    const prompt = buildBranchPrompt({ description: "fix login bug" });
    assertEquals(prompt.includes("fix login bug"), true);
});

Deno.test("buildBranchPrompt - requests lowercase hyphened format", () => {
    const prompt = buildBranchPrompt({ description: "anything" });
    assertEquals(prompt.includes("Lowercase"), true);
    assertEquals(prompt.includes("hyphens"), true);
});
