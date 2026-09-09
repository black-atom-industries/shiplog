import { assertEquals } from "@std/assert";
import { buildCommitPrompt } from "./commit-prompt.ts";

Deno.test("buildCommitPrompt - asks for plain changes and only supported purposes", () => {
    const prompt = buildCommitPrompt({ diff: "some diff", commitHistory: "", summaryLength: 72 });
    for (
        const guidance of [
            "Use imperative mood to state the actual change plainly",
            "Use short, direct sentences and familiar words; keep meaningful technical names",
            "Explain purpose only when the supplied diff or context supports it",
            "Do not invent benefits or reasons",
            "Only add a body when the reader needs an explanation",
            "Bodies use bullets, one per moving part; ground any reasons in the supplied diff or context",
            "Return ONLY the commit message",
            "Wrap body lines at 72 characters",
        ]
    ) assertEquals(prompt.includes(guidance), true, guidance);
    assertEquals(prompt.includes("explain why, not just what changed"), false);
    assertEquals(prompt.includes("stating what changed and why"), false);
});

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

Deno.test("buildCommitPrompt - omits ticket brackets when no ticket is provided", () => {
    const prompt = buildCommitPrompt({
        diff: "some diff",
        commitHistory: "",
        summaryLength: 72,
    });
    assertEquals(prompt.includes("Previous commits"), false);
    assertEquals(prompt.includes("Omit brackets when no ticket or issue is provided"), true);
});

Deno.test("buildCommitPrompt - uses the ticket-prefixed format", () => {
    const prompt = buildCommitPrompt({
        diff: "some diff",
        commitHistory: "",
        summaryLength: 72,
        issueId: "PROJ-123",
    });
    assertEquals(prompt.includes("[PROJ-123]"), true);
    assertEquals(prompt.includes("Start breaking changes with BREAKING:"), true);
    assertEquals(prompt.includes("type(scope):"), true);
    assertEquals(prompt.includes("conventional commit"), false);
});

Deno.test("buildCommitPrompt - counts the prefix in the limit and rejects history tickets", () => {
    const prompt = buildCommitPrompt({
        diff: "some diff",
        commitHistory: "[OTHER-42] previous change",
        summaryLength: 72,
        issueId: "WEBSDK-216",
    });
    assertEquals(
        prompt.includes("72-character limit includes this prefix and the following space"),
        true,
    );
    assertEquals(prompt.includes("Use this key, not tickets from previous commits"), true);
    assertEquals(prompt.includes("[WEBSDK-216]"), true);
});
