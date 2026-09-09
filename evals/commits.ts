import type { ProviderName } from "../src/adapters.ts";
import { sanitizeCommitMessage } from "../src/ai/sanitize.ts";

export interface Target {
    provider: ProviderName;
    model: string;
}

export interface ScheduledRun extends Target {
    caseId: string;
    repetition: number;
}

export function schedule(
    options: { caseIds: string[]; targets: readonly Target[]; repetitions: number },
): ScheduledRun[] {
    const runs: ScheduledRun[] = [];
    for (let repetition = 1; repetition <= options.repetitions; repetition++) {
        for (const [caseIndex, caseId] of options.caseIds.entries()) {
            for (let position = 0; position < options.targets.length; position++) {
                runs.push({
                    caseId,
                    ...options
                        .targets[
                            (caseIndex + repetition - 1 + position) % options.targets.length
                        ],
                    repetition,
                });
            }
        }
    }
    return runs;
}

export function timingStats(samples: number[]) {
    if (!samples.length) return null;
    const sorted = [...samples].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return {
        count: sorted.length,
        medianMs: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
        minMs: sorted[0],
        maxMs: sorted[sorted.length - 1],
    };
}

export interface MessageContext {
    summaryLength: number;
    issueId?: string;
    breaking?: boolean;
}

export function checkMessage(message: string, context: MessageContext) {
    const [summary, ...body] = message.split(/\r?\n/);
    const violations: string[] = [];
    const summaryLength = [...summary].length;
    if (!summary.trim()) violations.push("empty-summary");
    if (summaryLength > context.summaryLength) violations.push("summary-length");
    if (context.issueId) {
        const prefix = `[${context.issueId}] `;
        if (!summary.startsWith(prefix) || /[\[\]]/.test(summary.slice(prefix.length))) {
            violations.push("ticket-prefix");
        }
    } else if (/[\[\]]/.test(summary)) violations.push("unexpected-brackets");
    const unprefixed = summary.replace(/^\[[^\]]+\] /, "");
    if (/^(?!BREAKING:)[a-z]+(?:\([^)]*\))?!?:/i.test(unprefixed)) violations.push("type-prefix");
    if (context.breaking && !unprefixed.startsWith("BREAKING: ")) {
        violations.push("breaking-prefix");
    }
    if (/```|^\s*[`"']|[`"']\s*$/.test(message)) violations.push("wrapper");
    if (body.some((line) => [...line].length > 72)) violations.push("body-line-length");
    if (body.some((line) => line.trim())) {
        if (body[0] !== "") violations.push("body-separator");
        if (body.some((line) => line.trim() && !/^(?:[-*] | {2,}\S)/.test(line))) {
            violations.push("body-bullets");
        }
    }
    return { summaryLength, violations };
}

export interface PreparedCase extends MessageContext {
    id: string;
    diff: string;
    prompt: string;
    commitHistory: string;
    expectations: string[];
    forbiddenClaims: string[];
}

export type RunResult =
    & ScheduledRun
    & { startedAt: string; elapsedMs: number }
    & (
        | {
            raw: string;
            sanitized: string;
            rawChecks: ReturnType<typeof checkMessage>;
            sanitizedChecks: ReturnType<typeof checkMessage>;
        }
        | { error: string }
    );

export interface Benchmark {
    id: string;
    provenance?: string[];
    status: "running" | "completed" | "stopped";
    targets: readonly Target[];
    repetitions: number;
    cases: PreparedCase[];
    results: RunResult[];
}

function escapeHtml(text: string): string {
    return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function literal(text: string): string {
    // The code element preserves leading newlines; character references preserve CRs in HTML.
    return `<pre><code>${escapeHtml(text).replaceAll("\r", "&#13;")}</code></pre>`;
}

function table(headers: string[], rows: string[][]): string {
    return `<div class="table-scroll"><table><thead><tr>${
        headers.map((header) => `<th scope="col">${escapeHtml(header)}</th>`).join("")
    }</tr></thead><tbody>${
        rows.map((row) =>
            `<tr>${
                row.map((cell, index) =>
                    index === 0
                        ? `<th scope="row">${escapeHtml(cell)}</th>`
                        : `<td>${escapeHtml(cell)}</td>`
                ).join("")
            }</tr>`
        ).join("")
    }</tbody></table></div>`;
}

function coverage(attempts: RunResult[], planned: number): string {
    const successes = attempts.filter((run) => "raw" in run);
    const failures = attempts.length - successes.length;
    const pending = planned - attempts.length;
    return `${successes.length}/${planned} done` +
        (failures ? `; ${failures} failed` : "") + (pending ? `; ${pending} pending` : "");
}

export function renderReport(benchmark: Benchmark): string {
    const targetNumber = (target: Target) =>
        benchmark.targets.findIndex((candidate) =>
            candidate.provider === target.provider && candidate.model === target.model
        ) + 1;
    const attemptsFor = (target: Target) =>
        benchmark.results.filter((run) =>
            run.provider === target.provider && run.model === target.model
        );
    const typicalTime = (attempts: RunResult[]) => {
        const stats = timingStats(
            attempts.filter((run) => "raw" in run).map((run) => run.elapsedMs),
        );
        return stats ? `${(stats.medianMs / 1000).toFixed(2)}s` : "—";
    };
    const caseRows = benchmark.cases.map((fixture) => [
        fixture.id,
        ...benchmark.targets.map((target) => {
            const attempts = attemptsFor(target).filter((run) => run.caseId === fixture.id);
            return `${typicalTime(attempts)} · ${coverage(attempts, benchmark.repetitions)}`;
        }),
    ]);
    const lines = [
        "<!-- deno-fmt-ignore-file -->",
        '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>Commit benchmark: ${escapeHtml(benchmark.id)}</title>`,
        `<style>
:root { color-scheme: light dark; font: 16px/1.5 system-ui, sans-serif; }
body { max-width: 960px; margin: auto; padding: 1rem; overflow-wrap: anywhere; }
h1, h2 { line-height: 1.2; } h1 { font-size: 1.4rem; } h2 { font-size: 1.2rem; }
a { color: light-dark(#006a70, #75dce0); }
.table-scroll { overflow-x: auto; }
table { border-collapse: collapse; text-align: left; width: 100%; }
th, td { padding: .4rem; border-bottom: 1px solid #8886; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; padding: .7rem; background: #8881; }
code { font: .85rem/1.4 ui-monospace, monospace; }
details { margin: .8rem 0; } summary { cursor: pointer; font-weight: 600; }
.note { border-left: .2rem solid #888; padding-left: 1rem; }
li { margin: .5rem 0; } small { font-size: .85rem; }
</style></head><body><main>`,
        "<h1>Commit-message benchmark</h1>",
        "<!-- benchmark-review:start -->",
        `<section id="benchmark-review" class="note" aria-labelledby="benchmark-review-title" data-run-id="${
            escapeHtml(benchmark.id)
        }">`,
        '<h2 id="benchmark-review-title">TL;DR</h2>',
        "<p><strong>Not reviewed.</strong> Use /skill:benchmark for a recommendation.</p>",
        "</section>",
        "<!-- benchmark-review:end -->",
        '<nav><a href="#summary">Run details</a> · <a href="#cases">Times</a> · <a href="#outputs">Responses</a></nav>',
        '<details id="summary"><summary>Run details &amp; model IDs</summary>',
        `<p>Run: ${escapeHtml(benchmark.id)} · ${escapeHtml(benchmark.status)} · ${
            coverage(
                benchmark.results,
                benchmark.cases.length * benchmark.targets.length * benchmark.repetitions,
            )
        }. Repeats per case/model: ${benchmark.repetitions}.</p>`,
        `<ul>${
            benchmark.targets.map((target, index) =>
                `<li id="model-${index + 1}">M${index + 1}: ${escapeHtml(target.provider)} / ${
                    escapeHtml(target.model)
                } · Typical time: ${typicalTime(attemptsFor(target))}</li>`
            ).join("")
        }</ul>`,
        `<ul>${
            (benchmark.provenance ?? []).map((text) => `<li>${escapeHtml(text)}</li>`).join("")
        }</ul>`,
        "<p>Times cover adapter setup and the full response, not time to first token; exclude prompt building, cleanup and file writes. Sequential calls rotate model order per case/repeat; no retries or request overrides. Raw text is generate()’s trimmed return; failures have no partial text.</p>",
        "</details>",
        '<h2 id="cases">Typical time</h2><p><small>Median of successful calls: per case below, across cases in run details. Failures excluded; — means no successes. Small synthetic test, not a speed guarantee.</small></p>',
        table(["Case", ...benchmark.targets.map((_, index) => `M${index + 1}`)], caseRows),
        '<h2 id="outputs">All responses</h2><p><small>Model IDs are in <a href="#summary">run details</a>. Each response appears once unless cleanup changed it. Issues flag format checks, not factual correctness; unlisted checks passed. Exact prompts include the original diff and history.</small></p>',
    ];
    for (const [caseIndex, fixture] of benchmark.cases.entries()) {
        lines.push(
            `<details id="case-${caseIndex + 1}"><summary>${escapeHtml(fixture.id)}</summary>`,
            `<p><small>Summary limit: ${fixture.summaryLength}; ticket: ${
                escapeHtml(fixture.issueId ?? "none")
            }; breaking prefix required: ${fixture.breaking ? "yes" : "no"}.</small></p>`,
            `<p>Expect: ${escapeHtml(fixture.expectations.join(" "))}<br>Avoid: ${
                escapeHtml(fixture.forbiddenClaims.join("; "))
            }</p>`,
            `<details><summary>Original prompt</summary>${literal(fixture.prompt)}</details>`,
        );
        for (const result of benchmark.results.filter((run) => run.caseId === fixture.id)) {
            lines.push(
                `<p id="case-${caseIndex + 1}-m${targetNumber(result)}-r${result.repetition}">M${
                    targetNumber(result)
                } · repeat ${result.repetition} · ${result.elapsedMs} ms · ${
                    escapeHtml(result.startedAt)
                }</p>`,
            );
            if ("error" in result) lines.push(`<p>Failed</p>${literal(result.error)}`);
            else {
                const issues = (checks: typeof result.rawChecks) =>
                    checks.violations.length
                        ? `<p><small>Issues: ${escapeHtml(checks.violations.join(", "))}${
                            checks.violations.includes("summary-length")
                                ? ` (${checks.summaryLength} summary characters)`
                                : ""
                        }.</small></p>`
                        : "";
                if (result.raw === result.sanitized) {
                    lines.push(literal(result.raw), issues(result.rawChecks));
                } else {
                    lines.push(
                        `<p>Raw</p>${literal(result.raw)}${issues(result.rawChecks)}`,
                        `<p>After cleanup</p>${literal(result.sanitized)}${
                            issues(result.sanitizedChecks)
                        }`,
                    );
                }
            }
        }
        lines.push("</details>");
    }
    lines.push("</main></body></html>");
    return lines.join("\n") + "\n";
}

export async function executeBenchmark(benchmark: Benchmark, dependencies: {
    generate: typeof import("../src/ai/client.ts").generate;
    persist: (benchmark: Benchmark) => Promise<void>;
    secrets: string[];
}): Promise<void> {
    await dependencies.persist(benchmark);
    for (
        const run of schedule({
            caseIds: benchmark.cases.map((fixture) => fixture.id),
            targets: benchmark.targets,
            repetitions: benchmark.repetitions,
        })
    ) {
        const fixture = benchmark.cases.find((fixture) => fixture.id === run.caseId)!;
        const startedAt = new Date().toISOString();
        const start = performance.now();
        const generation = await dependencies.generate(fixture.prompt, run.model, run.provider)
            .then(
                (raw) => ({ raw, elapsedMs: performance.now() - start }),
                (error: unknown) => {
                    const elapsedMs = performance.now() - start;
                    return {
                        error: dependencies.secrets.reduce(
                            (message, secret) => message.replaceAll(secret, "[REDACTED]"),
                            error instanceof Error ? error.message : String(error),
                        ),
                        elapsedMs,
                    };
                },
            );
        if ("error" in generation) {
            benchmark.results.push({ ...run, startedAt, ...generation });
            benchmark.status = "stopped";
        } else {
            const sanitized = sanitizeCommitMessage(generation.raw, fixture.issueId);
            benchmark.results.push({
                ...run,
                startedAt,
                ...generation,
                sanitized,
                rawChecks: checkMessage(generation.raw, fixture),
                sanitizedChecks: checkMessage(sanitized, fixture),
            });
        }
        if (
            benchmark.results.length ===
                benchmark.cases.length * benchmark.targets.length * benchmark.repetitions &&
            benchmark.status !== "stopped"
        ) benchmark.status = "completed";
        await dependencies.persist(benchmark);
        // Conservative stop: inspect any failure before spending on further requests.
        if (benchmark.status === "stopped") break;
    }
}
