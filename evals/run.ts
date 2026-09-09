import { generate } from "../src/ai/client.ts";
import { buildCommitPrompt } from "../src/ai/commit-prompt.ts";
import { type Benchmark, executeBenchmark, renderReport, type Target } from "./commits.ts";
import { PROVIDER_NAMES } from "../src/adapters.ts";
import { fixtures } from "./fixtures.ts";
import fileConfig from "./config.json" with { type: "json" };

interface EvalConfig {
    targets: typeof fileConfig.targets;
    defaultTier: string;
    tiers: Record<string, (typeof fileConfig.tiers)[keyof typeof fileConfig.tiers]>;
}

export function parseConfig(config: EvalConfig, tier = config.defaultTier) {
    if (!Object.hasOwn(config.tiers, tier)) throw new Error(`Unknown benchmark tier: ${tier}`);
    const selection = config.tiers[tier];
    if (
        !Number.isInteger(selection.repetitions) || selection.repetitions < 1 ||
        !config.targets.length
    ) {
        throw new Error("Benchmark needs targets and a positive integer repetition count.");
    }
    const targets = config.targets.map((target) => {
        const provider = PROVIDER_NAMES.find((name) => name === target.provider);
        if (!provider || !target.model.trim()) {
            throw new Error("Invalid benchmark provider/model pair.");
        }
        return { provider, model: target.model };
    });
    if (new Set(targets.map((target) => JSON.stringify(target))).size !== targets.length) {
        throw new Error("Duplicate benchmark provider/model pair.");
    }
    for (const provider of selection.providers) {
        if (!PROVIDER_NAMES.some((name) => name === provider)) {
            throw new Error(`Unknown benchmark provider: ${provider}`);
        }
    }
    if (
        new Set(selection.providers).size !== selection.providers.length ||
        new Set(selection.caseIds).size !== selection.caseIds.length
    ) throw new Error("Duplicate benchmark provider or fixture selection.");
    const selectedTargets = targets.filter((target) =>
        selection.providers.includes(target.provider)
    );
    const selectedFixtures = selection.caseIds.map((id) => {
        const fixture = fixtures.find((fixture) => fixture.id === id);
        if (!fixture) throw new Error(`Unknown benchmark fixture: ${id}`);
        return fixture;
    });
    if (!selectedTargets.length || !selectedFixtures.length) {
        throw new Error("Benchmark plan is empty; select targets and fixtures.");
    }
    return {
        tier,
        targets: selectedTargets,
        repetitions: selection.repetitions,
        fixtures: selectedFixtures,
        callCount: selectedTargets.length * selectedFixtures.length * selection.repetitions,
    };
}

export function preflightCredentials(targets: readonly Target[], readEnv = Deno.env.get): string[] {
    return [...new Set(targets.map((target) => target.provider))].map((provider) => {
        const name = `${provider.toUpperCase()}_API_KEY`;
        const secret = readEnv(name);
        if (!secret) throw new Error(`${name} is required; no requests made.`);
        return secret;
    });
}

export async function saveReport(path: string | URL, benchmark: Benchmark): Promise<void> {
    await Deno.writeTextFile(path, renderReport(benchmark));
}

async function main(): Promise<void> {
    if (Deno.args.length > 1) throw new Error("Expected at most one benchmark tier argument.");
    const { tier, targets, repetitions, fixtures: selectedFixtures, callCount } = parseConfig(
        fileConfig,
        Deno.args[0],
    );
    console.log(`Tier: ${tier}; ${callCount} generation calls planned.`);
    const secrets = preflightCredentials(targets);
    const cases = await Promise.all(selectedFixtures.map(async (fixture) => {
        const diff = await Deno.readTextFile(
            new URL(`./fixtures/${fixture.id}.diff`, import.meta.url),
        );
        return { ...fixture, diff, prompt: buildCommitPrompt({ ...fixture, diff }) };
    }));
    const lock = await Deno.readFile(new URL("../deno.lock", import.meta.url));
    const lockHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", lock)))
        .map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const head = await new Deno.Command("git", {
        args: ["rev-parse", "HEAD"],
        stdout: "piped",
        stderr: "piped",
    }).output();
    if (!head.success) throw new Error("Cannot record repository HEAD; no requests made.");
    const path = new URL("./results.html", import.meta.url);
    const benchmark: Benchmark = {
        id: new Date().toISOString(),
        status: "running",
        targets,
        repetitions,
        cases,
        results: [],
        provenance: [
            `Config: evals/config.json; Shiplog global/repo settings are not read.`,
            `Tier: ${tier}; ${callCount} planned calls; ${cases.length}/${fixtures.length} fixtures: ${
                cases.map((fixture) => fixture.id).join(", ")
            }; ${targets.length}/${fileConfig.targets.length} configured targets; ${repetitions} repetition(s).`,
            `Git HEAD: ${
                new TextDecoder().decode(head.stdout).trim()
            } (worktree may contain uncommitted benchmark changes).`,
            `Deno: ${Deno.version.deno}; V8: ${Deno.version.v8}; TypeScript: ${Deno.version.typescript}.`,
            `Dependency lock SHA-256: ${lockHash}.`,
        ],
    };
    console.log(`Overwriting benchmark report at ${path.pathname}`);
    await executeBenchmark(benchmark, {
        generate,
        secrets,
        persist: async () => {
            await saveReport(path, benchmark);
            console.log(
                `${benchmark.results.length}/${callCount} attempts; ${benchmark.status}`,
            );
        },
    });
    if (benchmark.status === "stopped") {
        console.error(
            "Stopped after a generation failure. Inspect the local report before authorizing more requests.",
        );
        Deno.exitCode = 1;
    }
}

if (import.meta.main) await main();
