import { assertEquals } from "@std/assert";
import { buildCommitMessage } from "./commit-builder.ts";

Deno.test("buildCommitMessage - summary without ticket", () => {
    const result = buildCommitMessage({
        ticket: "",
        breaking: false,
        subject: "keep generated configs out of commits",
        body: "",
        links: "",
    });
    assertEquals(result, "keep generated configs out of commits");
});

Deno.test("buildCommitMessage - prefixes a ticket or issue", () => {
    const result = buildCommitMessage({
        ticket: "WEBSDK-123",
        breaking: false,
        subject: "keep generated configs out of commits",
        body: "",
        links: "",
    });
    assertEquals(result, "[WEBSDK-123] keep generated configs out of commits");
});

Deno.test("buildCommitMessage - adds BREAKING after the ticket", () => {
    const result = buildCommitMessage({
        ticket: "WEBSDK-123",
        breaking: true,
        subject: "remove the v1 API",
        body: "",
        links: "",
    });
    assertEquals(result, "[WEBSDK-123] BREAKING: remove the v1 API");
});

Deno.test("buildCommitMessage - includes a bullet body and related links", () => {
    const result = buildCommitMessage({
        ticket: "WEBSDK-123",
        breaking: false,
        subject: "keep generated configs out of commits",
        body: "- Ignore generated configs, so personal state stays out of history.",
        links: "https://jira.example.com/browse/WEBSDK-123",
    });
    assertEquals(
        result,
        "[WEBSDK-123] keep generated configs out of commits\n\n" +
            "- Ignore generated configs, so personal state stays out of history.\n\n" +
            "https://jira.example.com/browse/WEBSDK-123",
    );
});
