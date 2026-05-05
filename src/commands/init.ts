import { Command } from "@cliffy/command";
import * as colors from "../ui/colors.ts";
import { REPO_CONFIG_NAME } from "../config/paths.ts";
import { isGitRepo } from "../git/diff.ts";

export const initCommand = new Command()
    .description("Create repo-local .shiplog.toml config")
    .action(async () => {
        if (!await isGitRepo()) {
            console.error(colors.red("Error: Not in a git repository"));
            Deno.exit(1);
        }

        try {
            await Deno.stat(REPO_CONFIG_NAME);
            console.error(colors.yellow(`${REPO_CONFIG_NAME} already exists`));
            console.error("Delete it first if you want to regenerate.");
            Deno.exit(1);
        } catch (e) {
            if (!(e instanceof Deno.errors.NotFound)) throw e;
        }

        const content = [
            `# use_lazygit = true`,
            `# commit_types = ["feat", "fix", "docs", "style", "refactor", "test", "chore", "ci", "perf", "revert"]`,
            `# issue_pattern = "(\\\\w+-\\\\d+)"`,
            `# issue_prefix = ""`,
            "",
        ].join("\n");

        await Deno.writeTextFile(REPO_CONFIG_NAME, content);
        console.log(colors.green(`Created ${REPO_CONFIG_NAME}`));
    });
