import { Confirm, Select } from "@cliffy/prompt";

export async function selectCommitAction(): Promise<"commit" | "regenerate" | "edit" | "cancel"> {
    return await Select.prompt({
        message: "What would you like to do?",
        options: [
            { name: "Commit", value: "commit" },
            { name: "Regenerate", value: "regenerate" },
            { name: "Edit", value: "edit" },
            { name: "Cancel", value: "cancel" },
        ],
    }) as "commit" | "regenerate" | "edit" | "cancel";
}

export async function selectBranchAction(): Promise<"create" | "regenerate" | "cancel"> {
    return await Select.prompt({
        message: "What would you like to do?",
        options: [
            { name: "Create Branch", value: "create" },
            { name: "Regenerate", value: "regenerate" },
            { name: "Cancel", value: "cancel" },
        ],
    }) as "create" | "regenerate" | "cancel";
}

export async function selectModel<T extends string>(models: T[]): Promise<T> {
    return await Select.prompt({
        message: "Select model for regeneration:",
        options: models.map((m) => ({ name: m, value: m })),
    }) as T;
}

export async function confirmForcePush(): Promise<boolean> {
    return await Confirm.prompt("Force push with --force-with-lease?");
}

export async function openInEditor(content: string): Promise<string | null> {
    const tmpFile = await Deno.makeTempFile({ suffix: ".txt" });
    await Deno.writeTextFile(tmpFile, content);

    const editor = Deno.env.get("EDITOR") ?? "nvim";
    const command = new Deno.Command(editor, {
        args: [tmpFile],
        stdin: "inherit",
        stdout: "inherit",
        stderr: "inherit",
    });

    const process = command.spawn();
    const status = await process.status;

    if (!status.success) {
        await Deno.remove(tmpFile).catch(() => {});
        return null;
    }

    try {
        const result = (await Deno.readTextFile(tmpFile)).trim();
        return result || null;
    } finally {
        await Deno.remove(tmpFile).catch(() => {});
    }
}

export function editMessage(message: string): Promise<string | null> {
    return openInEditor(message);
}
