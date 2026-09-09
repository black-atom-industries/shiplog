import type { MessageContext } from "./commits.ts";

export interface Fixture extends MessageContext {
    id: string;
    commitHistory: string;
    expectations: string[];
    forbiddenClaims: string[];
}

export const fixtures: Fixture[] = [
    {
        id: "small-fix",
        commitHistory: "Add pagination helpers",
        summaryLength: 72,
        expectations: ["Explain retaining the final partial page; keep this small fix concise."],
        forbiddenClaims: ["Input validation or divide-by-zero handling", "Tests were executed"],
    },
    {
        id: "refactor",
        commitHistory: "Keep author and user labels consistent",
        summaryLength: 72,
        expectations: ["Describe shared name formatting without claiming changed behavior."],
        forbiddenClaims: [
            "Performance improvement",
            "New whitespace handling",
            "Public API change",
        ],
    },
    {
        id: "dependency",
        commitHistory: "Pin standard library test dependencies",
        summaryLength: 50,
        expectations: ["Identify the @std/assert patch bump from 1.0.18 to 1.0.19; stay factual."],
        forbiddenClaims: [
            "Security fix",
            "Specific upstream fixes",
            "Runtime speedup",
            "Lockfile update",
        ],
    },
    {
        id: "breaking-api",
        commitHistory: "Expose settings file reader",
        summaryLength: 72,
        breaking: true,
        expectations: [
            "Start with BREAKING:; explain async return and callers needing await.",
            "Mention avoiding blocking file reads if adding rationale.",
        ],
        forbiddenClaims: [
            "Backward compatibility",
            "Retained synchronous API",
            "Changed settings format",
        ],
    },
    {
        id: "multi-file-feature",
        commitHistory: "List saved contacts from local storage",
        summaryLength: 72,
        expectations: [
            "Summarize CSV export for spreadsheet use.",
            "Body should cover CLI wiring, escaping, overwrite protection, and tests/docs as useful; avoid a file inventory.",
        ],
        forbiddenClaims: [
            "Streaming export",
            "CSV import",
            "Formula-injection protection",
            "Tests were executed",
            "Overwrite support",
        ],
    },
    {
        id: "issue-prefix",
        commitHistory:
            "[OLD-19] Add case-insensitive search\n[LEGACY-8] Keep search results ordered",
        summaryLength: 50,
        issueId: "SEARCH-42",
        expectations: [
            "Use [SEARCH-42] exactly once, not either history ticket, within 50 characters.",
            "Explain ignoring surrounding query whitespace; case folding already existed.",
        ],
        forbiddenClaims: [
            "New case-insensitive matching",
            "Fuzzy matching",
            "Changed result ordering",
        ],
    },
];
