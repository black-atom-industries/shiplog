import { assertEquals } from "@std/assert";
import { buildCommitPrompt } from "./commit-prompt.ts";

Deno.test("buildCommitPrompt - includes diff in output", () => {
    const prompt = buildCommitPrompt({
        diff: "diff --git a/file.ts",
        commitHistory: "",
        summaryLength: 72,
    });
    assertEquals(prompt.includes("diff --git a/file.ts"), true);
});

Deno.test("buildCommitPrompt - includes summary length requirement", () => {
    const prompt = buildCommitPrompt({
        diff: "some diff",
        commitHistory: "",
        summaryLength: 50,
    });
    assertEquals(prompt.includes("50"), true);
});

Deno.test("buildCommitPrompt - includes commit history when provided", () => {
    const prompt = buildCommitPrompt({
        diff: "some diff",
        commitHistory: "feat: previous commit",
        summaryLength: 72,
    });
    assertEquals(prompt.includes("feat: previous commit"), true);
    assertEquals(prompt.includes("Previous commits"), true);
});

Deno.test("buildCommitPrompt - excludes history section when empty", () => {
    const prompt = buildCommitPrompt({
        diff: "some diff",
        commitHistory: "",
        summaryLength: 72,
    });
    assertEquals(prompt.includes("Previous commits"), false);
});

Deno.test("buildCommitPrompt - includes issue ID when provided", () => {
    const prompt = buildCommitPrompt({
        diff: "some diff",
        commitHistory: "",
        summaryLength: 72,
        issueId: "PROJ-123",
    });
    assertEquals(prompt.includes("PROJ-123"), true);
});
