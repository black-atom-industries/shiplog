import { assertEquals } from "@std/assert";
import { buildCommitMessage } from "./commit-builder.ts";

Deno.test("buildCommitMessage - type and subject only", () => {
    const result = buildCommitMessage({
        type: "feat",
        scope: "",
        breaking: false,
        subject: "add login page",
        body: "",
        footer: "",
    });
    assertEquals(result, "feat: add login page");
});

Deno.test("buildCommitMessage - with scope", () => {
    const result = buildCommitMessage({
        type: "fix",
        scope: "auth",
        breaking: false,
        subject: "handle expired tokens",
        body: "",
        footer: "",
    });
    assertEquals(result, "fix(auth): handle expired tokens");
});

Deno.test("buildCommitMessage - breaking change appends !", () => {
    const result = buildCommitMessage({
        type: "feat",
        scope: "api",
        breaking: true,
        subject: "remove v1 endpoints",
        body: "",
        footer: "",
    });
    assertEquals(result, "feat(api)!: remove v1 endpoints");
});

Deno.test("buildCommitMessage - with body", () => {
    const result = buildCommitMessage({
        type: "refactor",
        scope: "",
        breaking: false,
        subject: "simplify auth flow",
        body: "Reduces complexity by removing the intermediate layer.",
        footer: "",
    });
    assertEquals(
        result,
        "refactor: simplify auth flow\n\nReduces complexity by removing the intermediate layer.",
    );
});

Deno.test("buildCommitMessage - with footer", () => {
    const result = buildCommitMessage({
        type: "fix",
        scope: "",
        breaking: false,
        subject: "resolve crash on startup",
        body: "",
        footer: "Closes #42",
    });
    assertEquals(result, "fix: resolve crash on startup\n\nCloses #42");
});

Deno.test("buildCommitMessage - full message", () => {
    const result = buildCommitMessage({
        type: "feat",
        scope: "ui",
        breaking: true,
        subject: "redesign nav",
        body: "Complete overhaul of the navigation component.",
        footer: "BREAKING CHANGE: nav prop renamed to navigation\nCloses #99",
    });
    assertEquals(
        result,
        "feat(ui)!: redesign nav\n\nComplete overhaul of the navigation component.\n\nBREAKING CHANGE: nav prop renamed to navigation\nCloses #99",
    );
});
