import { Command } from "@cliffy/command";
import * as colors from "@std/fmt/colors";
import { loadConfig } from "../config/loader.ts";
import type { MergedConfig } from "../config/schema.ts";
import { getCommitHistory, getCurrentBranch, getStagedDiff, isGitRepo } from "../git/diff.ts";
import { commit, forcePush, push } from "../git/operations.ts";
import { generate } from "../ai/client.ts";
import { buildCommitPrompt } from "../ai/commit-prompt.ts";
import { confirmForcePush, editMessage, selectCommitAction, selectModel } from "../ui/prompts.ts";
import { askUserToOpenLazygit } from "../ui/lazygit.ts";
import { runGuidedCommit } from "../ui/commit-builder.ts";

function extractIssueId(branch: string, pattern?: string, prefix?: string): string | undefined {
    if (!pattern) return undefined;
    const match = branch.match(new RegExp(pattern, "i"));
    if (!match) return undefined;

    if (prefix && match[1]) {
        return `${prefix}${match[1]}`;
    }
    return match[0].toUpperCase();
}

async function ensureStagedChanges(useLazygit: boolean): Promise<void> {
    const diff = await getStagedDiff();
    if (diff) return;

    console.error(colors.yellow("No staged changes found."));

    if (useLazygit) {
        const opened = await askUserToOpenLazygit();
        if (opened) {
            const diffAfterStaging = await getStagedDiff();
            if (!diffAfterStaging) {
                console.log("No changes staged. Aborting.");
                Deno.exit(1);
            }
            return;
        }
    }

    console.error("Please stage your changes first.");
    Deno.exit(1);
}

async function generateCommitMessage(
    model: MergedConfig["model"],
    config: MergedConfig,
    quiet = false,
): Promise<string> {
    const [diff, branch, history] = await Promise.all([
        getStagedDiff(),
        getCurrentBranch(),
        getCommitHistory(config.historyCount),
    ]);

    const issueId = extractIssueId(branch, config.issuePattern, config.issuePrefix);

    const prompt = buildCommitPrompt({
        diff,
        commitHistory: history,
        summaryLength: config.summaryLength,
        issueId,
    });

    if (!quiet) {
        console.error(`Generating with ${colors.cyan(model)}...`);
    }
    const message = await generate(prompt, model, config.provider);
    return message.replace(/^["']|["']$/g, "").replace(/\r/g, "");
}

function displayMessage(message: string, model: string): void {
    console.log("");
    console.log(`Generated commit message (${colors.cyan(model)}):`);
    console.log(colors.dim("─".repeat(40)));
    console.log(colors.yellow(message));
    console.log(colors.dim("─".repeat(40)));
    console.log("");
}

async function handlePush(pushFlag: boolean, forceFlag: boolean): Promise<void> {
    if (!pushFlag) return;

    console.log("");
    console.log("Pushing to remote...");

    if (forceFlag) {
        await forcePush();
        console.log(colors.green("\nAll done! Changes committed and force pushed successfully!\n"));
        return;
    }

    const result = await push();
    if (result.success) {
        console.log(colors.green("\nAll done! Changes committed and pushed successfully!\n"));
        return;
    }

    console.log("");
    console.error(colors.red("Push failed:"));
    console.error(result.output);
    console.log("");

    if (await confirmForcePush()) {
        await forcePush();
        console.log(colors.green("\nAll done! Changes committed and force pushed successfully!\n"));
    } else {
        console.log("Push cancelled.");
        Deno.exit(1);
    }
}

export const commitCommand = new Command()
    .description("Commit changes (manual or AI-powered)")
    .option("-s, --smart", "Use AI to generate commit message")
    .option("-y, --yes", "Auto-confirm (with -s only)")
    .option("-r, --raw", "Print raw message to stdout, no commit (requires -sy)")
    .option("-p, --push", "Push after commit")
    .option("-f, --force", "Force push with --force-with-lease")
    .action(async (options) => {
        if (!await isGitRepo()) {
            console.error(colors.red("Error: Not in a git repository"));
            Deno.exit(1);
        }

        const config = await loadConfig();

        if (options.raw) {
            if (!options.smart || !options.yes) {
                console.error(
                    colors.red("Error: --raw must be used with --smart and --yes (-syr)"),
                );
                Deno.exit(1);
            }
            await ensureStagedChanges(config.useLazygit);
            const message = await generateCommitMessage(config.model, config, true);
            console.log(message);
            return;
        }

        if (!options.smart) {
            await ensureStagedChanges(config.useLazygit);
            await runGuidedCommit(config);
            await handlePush(!!options.push, !!options.force);
            return;
        }

        let currentModel = config.model;
        await ensureStagedChanges(config.useLazygit);
        let commitMessage: string;
        try {
            commitMessage = await generateCommitMessage(currentModel, config);
        } catch (error) {
            console.error(colors.red(`Failed to generate commit message: ${error}`));
            Deno.exit(1);
        }
        displayMessage(commitMessage, currentModel);

        if (options.yes) {
            console.log("Auto-committing (--yes flag)...");
            await commit(commitMessage);
            console.log(colors.green("\nChanges committed successfully!"));
            await handlePush(!!options.push, !!options.force);
            return;
        }

        // Interactive loop
        while (true) {
            const action = await selectCommitAction();

            switch (action) {
                case "commit":
                    console.log("\nCommitting changes...");
                    await commit(commitMessage);
                    console.log(colors.green("\nChanges committed successfully!"));
                    await handlePush(!!options.push, !!options.force);
                    return;

                case "edit": {
                    const edited = await editMessage(commitMessage);
                    if (edited) {
                        console.log("\nCommitting with edited message...");
                        await commit(edited);
                        console.log(colors.green("\nChanges committed successfully!"));
                        await handlePush(!!options.push, !!options.force);
                    } else {
                        console.log("Commit cancelled (empty message).");
                        Deno.exit(1);
                    }
                    return;
                }

                case "regenerate": {
                    const selected = await selectModel(config.models);
                    currentModel = selected;
                    try {
                        commitMessage = await generateCommitMessage(currentModel, config);
                        displayMessage(commitMessage, currentModel);
                    } catch (error) {
                        console.error(colors.red(`Failed to regenerate: ${error}`));
                        console.log("Using previous message.");
                    }
                    break;
                }

                case "cancel":
                    console.log("Commit cancelled.");
                    Deno.exit(1);
            }
        }
    });
