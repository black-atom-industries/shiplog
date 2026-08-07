import { Confirm, Input } from "@cliffy/prompt";
import * as colors from "./colors.ts";
import { openInEditor } from "./prompts.ts";
import { commit } from "../git/operations.ts";

export interface CommitParts {
    ticket: string;
    breaking: boolean;
    subject: string;
    body: string;
    links: string;
}

export function buildCommitMessage(parts: CommitParts): string {
    const { ticket, breaking, subject, body, links } = parts;
    const prefixedSubject = breaking ? `BREAKING: ${subject}` : subject;
    let message = ticket ? `[${ticket}] ${prefixedSubject}` : prefixedSubject;

    if (body) message += `\n\n${body}`;
    if (links) message += `\n\n${links}`;

    return message;
}

async function promptWithEditorEscape(message: string, initial = ""): Promise<string> {
    const value = await Input.prompt({
        message: `${message} (enter :e to open in $EDITOR)`,
        default: initial,
    });

    if (value === "\x07" || value.trim() === ":e") {
        const edited = await openInEditor(initial);
        return edited ?? initial;
    }

    return value;
}

export async function runGuidedCommit(issueId?: string): Promise<void> {
    try {
        await _runGuidedCommit(issueId);
    } catch (e) {
        if (e instanceof Error && e.message.includes("Interrupted")) {
            console.log("\nCommit cancelled.");
            Deno.exit(1);
        }
        throw e;
    }
}

async function _runGuidedCommit(issueId?: string) {
    const ticket = await promptWithEditorEscape("Ticket or issue (optional)", issueId);

    let subject = "";
    while (!subject.trim()) {
        subject = await promptWithEditorEscape("Summary (imperative, why first)");
        if (!subject.trim()) {
            console.error(colors.red("Summary cannot be empty."));
        }
    }

    const breaking = await Confirm.prompt({ message: "Breaking change?", default: false });
    const body = await promptWithEditorEscape("Bullet body (optional)");
    const links = await promptWithEditorEscape("Related links (optional)");

    const message = buildCommitMessage({
        ticket: ticket.trim(),
        breaking,
        subject: subject.trim(),
        body: body.trim(),
        links: links.trim(),
    });

    console.log("");
    console.log("Commit message:");
    console.log(colors.dim("─".repeat(40)));
    console.log(colors.yellow(message));
    console.log(colors.dim("─".repeat(40)));
    console.log("");

    const confirmed = await Confirm.prompt({ message: "Commit?", default: true });
    if (!confirmed) {
        console.log("Commit cancelled.");
        Deno.exit(1);
    }

    await commit(message);
    console.log(colors.green("\nChanges committed successfully!"));
}
