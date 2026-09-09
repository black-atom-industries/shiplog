import { assertEquals, assertStringIncludes, assertThrows } from "@std/assert";
import { type Benchmark, schedule } from "./commits.ts";
import { fixtures } from "./fixtures.ts";
import { parseConfig, preflightCredentials, saveReport } from "./run.ts";
import { ANTHROPIC_MODELS, PROVIDER_NAMES } from "../src/adapters.ts";
import fileConfig from "./config.json" with { type: "json" };

Deno.test("parseConfig defaults to the configured six-call quick plan", () => {
    const plan = parseConfig(fileConfig);
    const selection = fileConfig.tiers.quick;
    assertEquals(plan.tier, fileConfig.defaultTier);
    assertEquals(plan.tier, "quick");
    assertEquals(plan.repetitions, selection.repetitions);
    assertEquals(
        plan.targets,
        fileConfig.targets.filter((target) => selection.providers.includes(target.provider)),
    );
    assertEquals(plan.fixtures.map((fixture) => fixture.id), selection.caseIds);
    assertEquals(
        schedule({ ...plan, caseIds: plan.fixtures.map((fixture) => fixture.id) }).length,
        6,
    );
    assertEquals(plan.callCount, 6);
});

Deno.test("shipped config covers every Shiplog API provider and uses catalogued direct Anthropic models", () => {
    const { targets, callCount, fixtures: selectedFixtures } = parseConfig(fileConfig, "full");
    assertEquals(callCount, 72);
    assertEquals(targets, fileConfig.targets);
    assertEquals(selectedFixtures, fixtures);
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
        ...fileConfig,
        defaultTier: "full",
        targets: [{ provider: "anthropic", model: "a" }, {
            provider: "openrouter",
            model: "a",
        }],
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
        ...fileConfig,
        targets: [{ provider: fileConfig.tiers.quick.providers[0], model: "synthetic-model" }],
    };
    assertEquals(parseConfig(config).targets, config.targets);
    assertThrows(() =>
        parseConfig({ ...config, targets: [{ provider: "unsupported", model: "synthetic" }] })
    );
    assertThrows(() =>
        parseConfig({ ...config, tiers: { quick: { ...config.tiers.quick, repetitions: 0 } } })
    );
    assertThrows(() => parseConfig({ ...config, targets: [] }));
    assertThrows(() => parseConfig({ ...config, targets: [config.targets[0], config.targets[0]] }));
});

Deno.test("parseConfig rejects unknown tiers, fixtures, providers and empty or duplicate selections", () => {
    const selection = fileConfig.tiers.quick;
    const select = (changes: Partial<typeof selection>) =>
        parseConfig({
            ...fileConfig,
            tiers: { quick: { ...selection, ...changes } },
        });
    assertThrows(() => parseConfig(fileConfig, "unknown"), Error, "Unknown benchmark tier");
    assertThrows(() => parseConfig(fileConfig, "toString"), Error, "Unknown benchmark tier");
    assertThrows(() => select({ caseIds: ["unknown"] }), Error, "fixture");
    assertThrows(() => select({ providers: ["unknown"] }), Error, "provider");
    assertThrows(() => select({ caseIds: [] }), Error, "empty");
    assertThrows(() => select({ providers: [] }), Error, "empty");
    assertThrows(
        () => select({ caseIds: [selection.caseIds[0], selection.caseIds[0]] }),
        Error,
        "Duplicate",
    );
    assertThrows(
        () => select({ providers: [selection.providers[0], selection.providers[0]] }),
        Error,
        "Duplicate",
    );
    assertThrows(() => select({ repetitions: 1.5 }));
    assertThrows(
        () =>
            parseConfig({
                ...fileConfig,
                targets: fileConfig.targets.filter((target) =>
                    !selection.providers.includes(target.provider)
                ),
            }),
        Error,
        "empty",
    );
});

Deno.test("preflightCredentials quick needs only selected credentials while full requires Anthropic", () => {
    const selectedNames = fileConfig.tiers.quick.providers.map((provider) =>
        `${provider.toUpperCase()}_API_KEY`
    );
    const requestedNames: string[] = [];
    const readEnv = (name: string) => {
        requestedNames.push(name);
        return selectedNames.includes(name) ? "synthetic-secret" : undefined;
    };
    assertEquals(
        preflightCredentials(parseConfig(fileConfig).targets, readEnv),
        selectedNames.map(() => "synthetic-secret"),
    );
    assertEquals(requestedNames, selectedNames);
    assertThrows(
        () => preflightCredentials(parseConfig(fileConfig, "full").targets, readEnv),
        Error,
        "ANTHROPIC_API_KEY is required; no requests made.",
    );
});

Deno.test("parseConfig follows configured case order rather than fixture catalog order", () => {
    const caseIds = [...fileConfig.tiers.quick.caseIds].reverse();
    const plan = parseConfig({
        ...fileConfig,
        tiers: { quick: { ...fileConfig.tiers.quick, caseIds } },
    });
    assertEquals(plan.fixtures.map((fixture) => fixture.id), caseIds);
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
