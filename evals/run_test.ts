import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import type { Benchmark } from "./commits.ts";
import { parseConfig, preflightCredentials, saveReport } from "./run.ts";
import { ANTHROPIC_MODELS, PROVIDER_NAMES } from "../src/adapters.ts";
import fileConfig from "./config.json" with { type: "json" };

Deno.test("shipped config covers every Shiplog API provider and uses catalogued direct Anthropic models", () => {
    const { targets } = parseConfig(fileConfig);
    assertEquals(
        [...new Set(targets.map((target) => target.provider))].sort(),
        [...PROVIDER_NAMES].sort(),
    );
    for (const target of targets.filter((target) => target.provider === "anthropic")) {
        assertEquals(ANTHROPIC_MODELS.some((model) => model === target.model), true);
    }
});

Deno.test("preflightCredentials requires every target provider before generation and does not reveal keys", () => {
    const targets = parseConfig({
        targets: [{ provider: "anthropic", model: "a" }, {
            provider: "openrouter",
            model: "a",
        }],
        repetitions: 1,
    }).targets;
    assertEquals(preflightCredentials(targets, (name) => `${name}-synthetic-secret`), [
        "ANTHROPIC_API_KEY-synthetic-secret",
        "OPENROUTER_API_KEY-synthetic-secret",
    ]);
    assertThrows(
        () => preflightCredentials(targets, () => undefined),
        Error,
        "ANTHROPIC_API_KEY is required; no requests made.",
    );
    assertThrows(
        () =>
            preflightCredentials(
                targets,
                (name) => name === "ANTHROPIC_API_KEY" ? "synthetic-secret" : undefined,
            ),
        Error,
        "OPENROUTER_API_KEY is required; no requests made.",
    );
});

Deno.test("parseConfig accepts provider/model pairs independent of Shiplog settings and rejects invalid spending plans", () => {
    const config = {
        targets: [{ provider: "anthropic", model: "synthetic-model" }],
        repetitions: 3,
    };
    assertEquals(parseConfig(config), config);
    assertThrows(() =>
        parseConfig({ ...config, targets: [{ provider: "unsupported", model: "synthetic" }] })
    );
    assertThrows(() => parseConfig({ ...config, repetitions: 0 }));
    assertThrows(() => parseConfig({ ...config, targets: [] }));
    assertThrows(() => parseConfig({ ...config, targets: [config.targets[0], config.targets[0]] }));
});

Deno.test("saveReport overwrites one HTML file with partial progress and no sidecars", async () => {
    const root = await Deno.makeTempDir();
    try {
        const path = `${root}/results.html`;
        const benchmark: Benchmark = {
            id: "offline",
            status: "running",
            targets: [{ provider: "anthropic", model: "a" }],
            repetitions: 3,
            cases: [{
                id: "fix",
                diff: "diff",
                prompt: "fixed prompt",
                commitHistory: "",
                summaryLength: 72,
                expectations: [],
                forbiddenClaims: [],
            }],
            results: [],
        };
        await saveReport(path, benchmark);
        const firstReport = await Deno.readTextFile(path);
        assertStringIncludes(firstReport, "0/3 done; 3 pending");
        assertStringIncludes(firstReport, "Not reviewed");
        await Deno.writeTextFile(
            path,
            firstReport.replace("Not reviewed", "Old candidate ranking"),
        );
        // Persistence must reset agent judgment even for another snapshot of the same run.
        await saveReport(path, benchmark);
        assertEquals((await Deno.readTextFile(path)).includes("Old candidate ranking"), false);
        await Deno.writeTextFile(
            path,
            firstReport.replace("Not reviewed", "Old candidate ranking"),
        );
        benchmark.id = "next-offline-run";
        benchmark.status = "stopped";
        benchmark.results.push({
            caseId: "fix",
            provider: "anthropic",
            model: "a",
            repetition: 1,
            startedAt: "now",
            elapsedMs: 5,
            error: "offline failure",
        });
        await saveReport(path, benchmark);
        const report = await Deno.readTextFile(path);
        assertStringIncludes(report, "Not reviewed");
        assertStringIncludes(report, 'data-run-id="next-offline-run"');
        assertEquals(report.includes("Old candidate ranking"), false);
        assertStringIncludes(report, "stopped");
        assertStringIncludes(report, "0/3 done; 1 failed; 2 pending");
        assertStringIncludes(report, "offline failure");
        assertStringIncludes(report, "fixed prompt");
        const names = [];
        for await (const entry of Deno.readDir(root)) names.push(entry.name);
        assertEquals(names, ["results.html"]);
    } finally {
        await Deno.remove(root, { recursive: true });
    }
});
