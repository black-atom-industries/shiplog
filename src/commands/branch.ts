import { Command } from "@cliffy/command";
import * as colors from "@std/fmt/colors";
import { loadConfig } from "../config/loader.ts";
import type { MergedConfig } from "../config/schema.ts";
import { switchToNewBranch } from "../git/operations.ts";
import { isGitRepo } from "../git/diff.ts";
import { generate } from "../ai/client.ts";
import { buildBranchPrompt } from "../ai/branch-prompt.ts";
import { selectBranchAction, selectModel } from "../ui/prompts.ts";

async function generateBranchName(
    description: string,
    model: MergedConfig["model"],
    config: MergedConfig,
    quiet = false,
): Promise<string> {
    const prompt = buildBranchPrompt({ description });

    if (!quiet) {
        console.error(`Generating with ${colors.cyan(model)}...`);
    }
    const name = await generate(prompt, model, config.provider);
    return name.replace(/^["']|["']$/g, "").replace(/[\n\r]/g, "");
}

function displayBranchName(name: string, model: string): void {
    console.log("");
    console.log(`Generated branch name (${colors.cyan(model)}):`);
    console.log(colors.dim("─".repeat(40)));
    console.log(colors.yellow(name));
    console.log(colors.dim("─".repeat(40)));
    console.log("");
}

export const branchCommand = new Command()
    .description("Create branches (manual or AI-powered)")
    .arguments("[description...:string]")
    .option("-s, --smart", "Use AI to generate branch name")
    .option("-y, --yes", "Auto-create branch (with -s only)")
    .option("-r, --raw", "Print raw name to stdout, no branch creation (requires -sy)")
    .action(async (options, ...descriptionParts) => {
        if (!await isGitRepo()) {
            console.error(colors.red("Error: Not in a git repository"));
            Deno.exit(1);
        }

        const description = descriptionParts.join(" ");

        if (!description) {
            console.error(colors.red("Error: No branch name or description provided"));
            console.error("Use 'shiplog branch --help' for usage information");
            Deno.exit(1);
        }

        if (options.raw) {
            if (!options.smart || !options.yes) {
                console.error(
                    colors.red("Error: --raw must be used with --smart and --yes (-syr)"),
                );
                Deno.exit(1);
            }
            const config = await loadConfig();
            const name = await generateBranchName(description, config.model, config, true);
            console.log(name);
            return;
        }

        if (!options.smart) {
            console.log(`Creating branch: ${colors.cyan(description)}`);
            await switchToNewBranch(description);
            console.log(
                colors.green(`\nBranch '${description}' created and switched successfully!`),
            );
            return;
        }

        const config = await loadConfig();
        let currentModel = config.model;
        let branchName: string;
        try {
            branchName = await generateBranchName(description, currentModel, config);
        } catch (error) {
            console.error(colors.red(`Failed to generate branch name: ${error}`));
            Deno.exit(1);
        }
        displayBranchName(branchName, currentModel);

        if (options.yes) {
            console.log("Auto-creating branch (--yes flag)...");
            await switchToNewBranch(branchName);
            console.log(
                colors.green(`\nBranch '${branchName}' created and switched successfully!`),
            );
            return;
        }

        // Interactive loop
        while (true) {
            const action = await selectBranchAction();

            switch (action) {
                case "create":
                    console.log("\nCreating branch...");
                    await switchToNewBranch(branchName);
                    console.log(
                        colors.green(`\nBranch '${branchName}' created and switched successfully!`),
                    );
                    return;

                case "regenerate": {
                    const selected = await selectModel(config.models);
                    currentModel = selected;
                    try {
                        branchName = await generateBranchName(description, currentModel, config);
                        displayBranchName(branchName, currentModel);
                    } catch (error) {
                        console.error(colors.red(`Failed to regenerate: ${error}`));
                        console.log("Using previous name.");
                    }
                    break;
                }

                case "cancel":
                    console.log("Branch creation cancelled.");
                    Deno.exit(1);
            }
        }
    });
