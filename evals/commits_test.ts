import { assertEquals } from "@std/assert";
import {
    type Benchmark,
    checkMessage,
    executeBenchmark,
    renderReport,
    schedule,
    type Target,
    timingStats,
} from "./commits.ts";

const targets: Target[] = [{ provider: "anthropic", model: "a" }, {
    provider: "openrouter",
    model: "b",
}, { provider: "anthropic", model: "c" }];

Deno.test("executeBenchmark completes all planned successful calls", async () => {
    const benchmark: Benchmark = {
        id: "test",
        status: "running",
        targets: [targets[0]],
        repetitions: 3,
        cases: [{
            id: "fix",
            diff: "diff",
            prompt: "prompt",
            commitHistory: "",
            summaryLength: 72,
            expectations: [],
            forbiddenClaims: [],
        }],
        results: [],
    };
    const statuses: string[] = [];
    await executeBenchmark(benchmark, {
        secrets: ["key"],
        generate: () => Promise.resolve("Fix it"),
        persist: (state) => {
            statuses.push(state.status);
            return Promise.resolve();
        },
    });
    assertEquals(benchmark.results.length, 3);
    assertEquals(statuses, ["running", "running", "running", "completed"]);
});

Deno.test("executeBenchmark persists sequential production-shaped results and stops on a redacted failure without retries", async () => {
    const benchmark: Benchmark = {
        id: "test",
        status: "running",
        targets,
        repetitions: 3,
        cases: [{
            id: "issue",
            diff: "diff",
            prompt: "exact prompt",
            commitHistory: "",
            summaryLength: 72,
            issueId: "NEW-42",
            expectations: [],
            forbiddenClaims: [],
        }],
        results: [],
    };
    const snapshots: Benchmark[] = [];
    const calls: string[] = [];
    await executeBenchmark(benchmark, {
        secrets: ["secret-value"],
        generate: (prompt, model, provider) => {
            assertEquals(prompt, "exact prompt");
            assertEquals(provider, targets.find((target) => target.model === model)?.provider);
            assertEquals(snapshots.at(-1)?.results.length, calls.length);
            calls.push(model);
            if (model === "b") return Promise.reject(new Error("Unauthorized secret-value"));
            return Promise.resolve('"[OLD-1] Fix search"');
        },
        persist: (state) => {
            snapshots.push(structuredClone(state));
            return Promise.resolve();
        },
    });
    assertEquals(calls, ["a", "b"]);
    assertEquals(benchmark.status, "stopped");
    assertEquals(snapshots.map((state) => state.results.length), [0, 1, 2]);
    const [success, failure] = benchmark.results;
    if (!("raw" in success) || !("error" in failure)) {
        throw new Error("Expected success then failure");
    }
    assertEquals(success.raw, '"[OLD-1] Fix search"');
    assertEquals(success.sanitized, "[NEW-42] Fix search");
    assertEquals(success.rawChecks.violations.includes("ticket-prefix"), true);
    assertEquals(success.sanitizedChecks.violations, []);
    assertEquals(failure.error, "Unauthorized [REDACTED]");
    assertEquals(success.elapsedMs >= 0, true);
});

Deno.test("renderReport retains each unchanged response and its exact prompt only once", () => {
    const output = "\nKeep <names> & 'quotes'\n\n- Preserve spacing  \r\n";
    const report = renderReport({
        id: "compact",
        status: "completed",
        targets: [targets[0]],
        repetitions: 1,
        cases: [{
            id: "fix",
            diff: "unique diff",
            commitHistory: "unique history",
            prompt: "Original instructions\nunique history\nunique diff",
            summaryLength: 72,
            expectations: [],
            forbiddenClaims: [],
        }],
        results: [{
            ...targets[0],
            caseId: "fix",
            repetition: 1,
            startedAt: "exact-start",
            elapsedMs: 12.34567,
            raw: output,
            sanitized: output,
            rawChecks: checkMessage(output, { summaryLength: 72 }),
            sanitizedChecks: checkMessage(output, { summaryLength: 72 }),
        }],
    });
    assertEquals(report.split("Keep &lt;names&gt;").length, 2);
    assertEquals(report.split("unique diff").length, 2);
    assertEquals(report.split("unique history").length, 2);
    assertEquals(
        report.includes(
            "\nKeep &lt;names&gt; &amp; &#39;quotes&#39;\n\n- Preserve spacing  &#13;\n",
        ),
        true,
    );
    assertEquals(report.includes("12.34567 ms"), true);
    assertEquals(report.includes("exact-start"), true);
    assertEquals(report.includes("repeat 1"), true);
    assertEquals(report.includes("summaryLength"), false);
});

Deno.test("renderReport keeps outputs literal, failures separate from success timings, and missing runs visible", () => {
    const report = renderReport({
        id: "test-run",
        status: "stopped",
        provenance: ["Git HEAD: synthetic-revision"],
        targets: [targets[0]],
        repetitions: 3,
        cases: [{
            id: "fix",
            diff: "diff",
            prompt: "prompt",
            commitHistory: "",
            summaryLength: 72,
            expectations: ["Keep rationale factual"],
            forbiddenClaims: ["Security fixes"],
        }],
        results: [
            {
                caseId: "fix",
                ...targets[0],
                repetition: 1,
                startedAt: "now",
                elapsedMs: 10,
                raw: "```\nFix <it>\n```",
                sanitized: "Fix <it>",
                rawChecks: { summaryLength: 3, violations: ["wrapper"] },
                sanitizedChecks: { summaryLength: 8, violations: [] },
            },
            {
                caseId: "fix",
                ...targets[0],
                repetition: 2,
                startedAt: "now",
                elapsedMs: 500,
                error: "Unavailable <model>",
            },
        ],
    });
    for (
        const text of [
            "0.01s",
            "1 failed",
            "1 pending",
            "1/3 done",
            "Keep rationale factual",
            "Security fixes",
            "Fix &lt;it&gt;",
            "Unavailable &lt;model&gt;",
            "wrapper",
            "stopped",
            "not factual correctness",
            "synthetic-revision",
            "Repeats per case/model: 3",
            "anthropic / a",
        ]
    ) {
        assertEquals(report.includes(text), true, text);
    }
    assertEquals(report.includes("0.26s"), false);
    assertEquals(report.includes("<code>```\nFix &lt;it&gt;\n```</code>"), true);
    assertEquals(report.includes("<code>Fix &lt;it&gt;</code>"), true);
    assertEquals(report.split("Fix &lt;it&gt;").length, 3);
    assertEquals(report.includes("After cleanup"), true);
    assertEquals(report.includes("500 ms"), true);
});

Deno.test("renderReport resets a unique top review before all run evidence", () => {
    for (const status of ["running", "completed", "stopped"] as const) {
        const report = renderReport({
            id: "fresh-run",
            status,
            targets: [targets[0]],
            repetitions: 3,
            cases: [{
                id: "review-boundary",
                diff: "Captured <diff>",
                prompt: "Captured prompt\nCaptured <diff>\nCaptured history",
                commitHistory: "Captured history",
                summaryLength: 72,
                expectations: ["Captured criteria"],
                forbiddenClaims: [],
            }],
            results: [{
                ...targets[0],
                caseId: "review-boundary",
                repetition: 1,
                startedAt: "now",
                elapsedMs: 12,
                raw: "Captured output",
                sanitized: "Captured output",
                rawChecks: { summaryLength: 15, violations: [] },
                sanitizedChecks: { summaryLength: 15, violations: [] },
            }],
        });
        const start = "<!-- benchmark-review:start -->";
        const end = "<!-- benchmark-review:end -->";
        assertEquals(report.split(start).length, 2);
        assertEquals(report.split(end).length, 2);
        assertEquals(report.split('id="benchmark-review"').length, 2);
        const review = report.slice(report.indexOf(start), report.indexOf(end));
        assertEquals(review.includes("Not reviewed"), true);
        assertEquals(review.includes('data-run-id="fresh-run"'), true);
        assertEquals(report.indexOf(end) < report.indexOf("Repeats per case/model:"), true);
        assertEquals(report.indexOf(end) < report.indexOf("<nav>"), true);
        assertEquals(review.split(/\s+/).length < 30, true);
        // Exercise the skill's slice-replacement contract on real rendered evidence.
        const prefix = report.slice(0, report.indexOf(start) + start.length);
        const suffix = report.slice(report.indexOf(end));
        const content = '\n<section id="benchmark-review">Provisional ranking</section>\n';
        const reviewed = prefix + content + suffix;
        assertEquals(reviewed.slice(0, prefix.length), prefix);
        assertEquals(reviewed.slice(-suffix.length), suffix);
        assertEquals(
            reviewed.slice(0, reviewed.indexOf(start) + start.length) + content +
                reviewed.slice(reviewed.indexOf(end)),
            reviewed,
        );
        for (
            const evidence of [
                'id="summary"',
                'id="cases"',
                "Captured &lt;diff&gt;",
                "Captured prompt",
                "Captured history",
                "Captured criteria",
                "Captured output",
                "12 ms",
            ]
        ) {
            assertEquals(suffix.includes(evidence), true, evidence);
            assertEquals(review.includes(evidence), false, evidence);
        }
    }
});

Deno.test("renderReport escapes review run identity and captured marker-like text", () => {
    const attack = `\"><script>&'<!-- benchmark-review:end -->`;
    const report = renderReport({
        id: attack,
        status: "running",
        targets: [],
        repetitions: 1,
        cases: [],
        results: [],
    });
    assertEquals(report.includes(attack), false);
    assertEquals(
        report.includes(
            'data-run-id="&quot;&gt;&lt;script&gt;&amp;&#39;&lt;!-- benchmark-review:end --&gt;"',
        ),
        true,
    );
    assertEquals(report.split("<!-- benchmark-review:end -->").length, 2);
});

Deno.test("checkMessage checks objective constraints including full ticket length and breaking marker", () => {
    const context = { summaryLength: 30, issueId: "NEW-42", breaking: true };
    assertEquals(checkMessage("[NEW-42] BREAKING: Remove sync", context).violations, []);
    assertEquals(checkMessage("[OLD-1] fix: Keep sync", context).violations, [
        "ticket-prefix",
        "type-prefix",
        "breaking-prefix",
    ]);
    assertEquals(checkMessage("[NEW-42] [NEW-42] BREAKING: Remove sync", context).violations, [
        "summary-length",
        "ticket-prefix",
        "breaking-prefix",
    ]);
    assertEquals(checkMessage("[OLD-1] Fix it", { summaryLength: 72 }).violations, [
        "unexpected-brackets",
    ]);
    assertEquals(checkMessage('"Fix it"', { summaryLength: 72 }).violations, ["wrapper"]);
    assertEquals(checkMessage("Fix it\n\n- " + "x".repeat(71), { summaryLength: 72 }).violations, [
        "body-line-length",
    ]);
    assertEquals(checkMessage("Fix it\nExplanation", { summaryLength: 72 }).violations, [
        "body-separator",
        "body-bullets",
    ]);
    assertEquals(checkMessage("", { summaryLength: 72 }).violations, ["empty-summary"]);
    assertEquals(
        checkMessage("```\nFix it\n```", { summaryLength: 72 }).violations.includes("wrapper"),
        true,
    );
});

Deno.test("timingStats reports median and range without mutating samples or inventing empty timings", () => {
    const samples = [9, 1, 3];
    assertEquals(timingStats(samples), { count: 3, medianMs: 3, minMs: 1, maxMs: 9 });
    assertEquals(samples, [9, 1, 3]);
    assertEquals(timingStats([8, 2]), { count: 2, medianMs: 5, minMs: 2, maxMs: 8 });
    assertEquals(timingStats([]), null);
});

Deno.test("schedule rotates model order and covers every case/model three times", () => {
    const runs = schedule({
        caseIds: ["fix", "refactor"],
        targets,
        repetitions: 3,
    });
    assertEquals(runs.length, 18);
    assertEquals(runs.slice(0, 3).map(({ provider, model }) => ({ provider, model })), targets);
    assertEquals(runs.slice(0, 6).map((run) => run.model), ["a", "b", "c", "b", "c", "a"]);
    for (const caseId of ["fix", "refactor"]) {
        for (const model of ["a", "b", "c"]) {
            assertEquals(
                runs.filter((run) => run.caseId === caseId && run.model === model).map((run) =>
                    run.repetition
                ),
                [1, 2, 3],
            );
        }
    }
});

Deno.test("renderReport escapes every dynamic text surface and separates identical model names by provider", () => {
    const attack = `<script>alert("x" & 'y')</script>`;
    const escaped = "&lt;script&gt;alert(&quot;x&quot; &amp; &#39;y&#39;)&lt;/script&gt;";
    const report = renderReport({
        id: attack,
        status: "stopped",
        provenance: [attack],
        repetitions: 1,
        targets: [{ provider: "anthropic", model: attack }, {
            provider: "openrouter",
            model: attack,
        }],
        cases: [{
            id: attack,
            diff: attack,
            prompt: attack,
            commitHistory: attack,
            summaryLength: 72,
            issueId: attack,
            expectations: [attack],
            forbiddenClaims: [attack],
        }],
        results: [
            {
                provider: "anthropic",
                model: attack,
                caseId: attack,
                repetition: 1,
                startedAt: attack,
                elapsedMs: 10,
                raw: attack,
                sanitized: attack,
                rawChecks: { summaryLength: 1, violations: [attack] },
                sanitizedChecks: { summaryLength: 1, violations: [] },
            },
            {
                provider: "openrouter",
                model: attack,
                caseId: attack,
                repetition: 1,
                startedAt: attack,
                elapsedMs: 100,
                error: attack,
            },
        ],
    });
    assertEquals(report.includes(attack), false);
    assertEquals(report.includes(escaped), true);
    assertEquals(report.includes("<script"), false);
    assertEquals(report.includes('scope="col"'), true);
    assertEquals(report.includes("<details>"), true);
    assertEquals(report.includes("0.06s"), false);
    assertEquals(report.includes("0.01s"), true);
    assertEquals(report.includes("1/1"), true);
});
