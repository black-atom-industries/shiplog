import { assertEquals } from "jsr:@std/assert";
import { sanitizeBranchName, sanitizeCommitMessage } from "./sanitize.ts";

Deno.test("sanitizeCommitMessage - passes through clean input unchanged", () => {
    const input = "feat(ui): add dark mode toggle";
    assertEquals(sanitizeCommitMessage(input), input);
});

Deno.test("sanitizeCommitMessage - strips leading colon (gemma-style prefix)", () => {
    assertEquals(
        sanitizeCommitMessage(":chore(shiplog): update default model"),
        "chore(shiplog): update default model",
    );
});

Deno.test("sanitizeCommitMessage - strips leading whitespace and punctuation", () => {
    assertEquals(
        sanitizeCommitMessage("  - fix(api): bad cast"),
        "fix(api): bad cast",
    );
});

Deno.test("sanitizeCommitMessage - strips triple-backtick fences", () => {
    const input = "```\nfeat: add X\n```";
    assertEquals(sanitizeCommitMessage(input), "feat: add X");
});

Deno.test("sanitizeCommitMessage - strips single backticks at boundaries", () => {
    assertEquals(sanitizeCommitMessage("`feat: add X`"), "feat: add X");
});

Deno.test("sanitizeCommitMessage - strips wrapping quotes", () => {
    assertEquals(sanitizeCommitMessage(`"feat: add X"`), "feat: add X");
    assertEquals(sanitizeCommitMessage(`'feat: add X'`), "feat: add X");
});

Deno.test("sanitizeCommitMessage - preserves newlines in body", () => {
    const input = "feat: add X\n\nDetails here\nMore detail";
    assertEquals(sanitizeCommitMessage(input), input);
});

Deno.test("sanitizeCommitMessage - strips carriage returns", () => {
    assertEquals(
        sanitizeCommitMessage("feat: add X\r\nbody\r\n"),
        "feat: add X\nbody\n",
    );
});

Deno.test("sanitizeBranchName - passes through clean input unchanged", () => {
    assertEquals(sanitizeBranchName("feat/add-dark-mode"), "feat/add-dark-mode");
});

Deno.test("sanitizeBranchName - strips leading punctuation", () => {
    assertEquals(sanitizeBranchName("- feat/foo"), "feat/foo");
    assertEquals(sanitizeBranchName(":feat/foo"), "feat/foo");
});

Deno.test("sanitizeBranchName - collapses newlines (single-line output)", () => {
    assertEquals(sanitizeBranchName("feat/foo\n"), "feat/foo");
    assertEquals(sanitizeBranchName("feat/foo\r\nbar"), "feat/foobar");
});

Deno.test("sanitizeBranchName - strips triple-backtick fences", () => {
    assertEquals(sanitizeBranchName("```\nfeat/foo\n```"), "feat/foo");
});

Deno.test("sanitizeBranchName - strips wrapping quotes", () => {
    assertEquals(sanitizeBranchName(`"feat/foo"`), "feat/foo");
});
