import * as colors from "./colors.ts";
import { Confirm } from "@cliffy/prompt";

export async function isLazygitInstalled(): Promise<boolean> {
    try {
        const cmd = new Deno.Command("which", {
            args: ["lazygit"],
            stdout: "null",
            stderr: "null",
        });
        const { success } = await cmd.output();
        return success;
    } catch {
        return false;
    }
}

export async function openLazygit(): Promise<void> {
    const command = new Deno.Command("lazygit", {
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
    });
    const process = command.spawn();
    const status = await process.status;
    if (!status.success) {
        throw new Error("lazygit exited with an error");
    }
}

export async function askUserToOpenLazygit(): Promise<boolean> {
    if (!await isLazygitInstalled()) {
        console.error(colors.red("lazygit is not installed."));
        console.error("Install with: brew install lazygit");
        return false;
    }

    const confirmed = await Confirm.prompt("Open lazygit to stage changes?");
    if (!confirmed) return false;

    await openLazygit();
    return true;
}
