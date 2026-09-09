import { assertEquals } from "@std/assert";
import { extractIssueId } from "./issue.ts";

Deno.test("extractIssueId - detects the WEBSDK regression branch without config", () => {
    assertEquals(
        extractIssueId("websdk-216-web-ui-adjust-component-defaults-the-po"),
        "WEBSDK-216",
    );
});

Deno.test("extractIssueId - detects delimited case-insensitive Jira-style keys", () => {
    for (const branch of ["WEBSDK-216", "feature/websdk-216-fix", "fix_websdk-216", "a2-42"]) {
        assertEquals(extractIssueId(branch), branch === "a2-42" ? "A2-42" : "WEBSDK-216");
    }
});

Deno.test("extractIssueId - ignores branches without a complete delimited issue", () => {
    for (
        const branch of [
            "main",
            "feature/component-defaults",
            "216-fix",
            "123websdk-216-fix",
            "websdk-216abc",
            "websdk-216.5",
            "websdk-",
            "feature/123-fix",
        ]
    ) {
        assertEquals(extractIssueId(branch), undefined, branch);
    }
});

Deno.test("extractIssueId - explicit pattern takes precedence over automatic detection", () => {
    assertEquals(
        extractIssueId("websdk-216/task-42", {
            issuePattern: "task-(\\d+)",
            issuePrefix: "CUSTOM-",
        }),
        "CUSTOM-42",
    );
    assertEquals(extractIssueId("websdk-216", { issuePattern: "task-(\\d+)" }), undefined);
    assertEquals(extractIssueId("websdk-216", { issuePattern: "" }), undefined);
});

Deno.test("extractIssueId - preserves configured full-match and capture semantics", () => {
    assertEquals(extractIssueId("fix/task-42", { issuePattern: "task-\\d+" }), "TASK-42");
    assertEquals(
        extractIssueId("fix/task-42", { issuePattern: "task-\\d+", issuePrefix: "OTHER-" }),
        "TASK-42",
    );
    assertEquals(
        extractIssueId("fix/task-42", { issuePattern: "task-(\\d+)", issuePrefix: "custom-" }),
        "custom-42",
    );
    assertEquals(
        extractIssueId("fix/task-42", { issuePattern: "task-(\\d+)", issuePrefix: "" }),
        "TASK-42",
    );
});

Deno.test("extractIssueId - issuePrefix alone does not rewrite an automatic key", () => {
    assertEquals(extractIssueId("websdk-216", { issuePrefix: "OTHER-" }), "WEBSDK-216");
});
