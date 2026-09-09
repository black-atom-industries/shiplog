import { assertEquals } from "@std/assert";
import { sanitizeBranchName, sanitizeCommitMessage } from "./sanitize.ts";
import { extractIssueId } from "../git/issue.ts";

Deno.test("sanitizeCommitMessage - passes through clean input unchanged", () => {
    const input = "feat(ui): add dark mode toggle";
    assertEquals(sanitizeCommitMessage(input), input);
});

Deno.test("sanitizeCommitMessage - strips a leading colon", () => {
    assertEquals(
        sanitizeCommitMessage(":update the default model"),
        "update the default model",
    );
});

Deno.test("sanitizeCommitMessage - preserves a ticket prefix", () => {
    assertEquals(
        sanitizeCommitMessage("[WEBSDK-123] add the missing validation"),
        "[WEBSDK-123] add the missing validation",
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

Deno.test("sanitizeCommitMessage - guarantees the detected WEBSDK regression prefix", () => {
    const issueId = extractIssueId("websdk-216-web-ui-adjust-component-defaults-the-po");
    assertEquals(
        sanitizeCommitMessage("```\nadjust component defaults\n```", issueId),
        "[WEBSDK-216] adjust component defaults",
    );
});

Deno.test("sanitizeCommitMessage - normalizes leading tickets exactly once", () => {
    for (
        const prefix of [
            "",
            "[WEBSDK-216] ",
            "[websdk-216] ",
            "[OTHER-42] ",
            "[WEBSDK-216] [websdk-216] ",
            "[OTHER-42]\t[WEBSDK-216] ",
        ]
    ) {
        assertEquals(
            sanitizeCommitMessage(`${prefix}adjust defaults`, "WEBSDK-216"),
            "[WEBSDK-216] adjust defaults",
        );
    }
});

Deno.test("sanitizeCommitMessage - preserves BREAKING and body when replacing a ticket", () => {
    assertEquals(
        sanitizeCommitMessage(
            "[OTHER-42] BREAKING: adjust defaults\n\n[OTHER-42] retain this body reference\n",
            "WEBSDK-216",
        ),
        "[WEBSDK-216] BREAKING: adjust defaults\n\n[OTHER-42] retain this body reference\n",
    );
});

Deno.test("sanitizeCommitMessage - preserves configured issue spelling and literal characters", () => {
    assertEquals(
        sanitizeCommitMessage("[custom.42] [CUSTOM.42] adjust defaults", "custom.42"),
        "[custom.42] adjust defaults",
    );
});

Deno.test("sanitizeCommitMessage - normalizes literal configured tickets containing brackets", () => {
    for (const issueId of ["custom[42", "custom]42", "custom[42]"]) {
        assertEquals(
            sanitizeCommitMessage(
                `[${issueId.toUpperCase()}] [${issueId}] adjust defaults`,
                issueId,
            ),
            `[${issueId}] adjust defaults`,
        );
    }
});

Deno.test("sanitizeCommitMessage - preserves non-ticket brackets and body whitespace", () => {
    assertEquals(
        sanitizeCommitMessage("[docs] adjust defaults\n\n  - explain why\n", "WEBSDK-216"),
        "[WEBSDK-216] [docs] adjust defaults\n\n  - explain why\n",
    );
    assertEquals(
        sanitizeCommitMessage("[OTHER-42]\n\nbody", "WEBSDK-216"),
        "[WEBSDK-216] \n\nbody",
    );
});

Deno.test("sanitizeCommitMessage - leaves ticket and body unchanged without a resolved issue", () => {
    const message = "[OTHER-42] BREAKING: adjust defaults\n\nBody";
    assertEquals(sanitizeCommitMessage(message, undefined), message);
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
