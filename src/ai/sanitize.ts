export function sanitizeCommitMessage(raw: string, issueId?: string): string {
    let message = raw
        .replace(/^```[\s\n]*|[\s\n]*```$/gm, "")
        .replace(/^`|`$/gm, "")
        .replace(/^["']|["']$/g, "")
        .replace(/\r/g, "")
        .replace(/^[^\[A-Za-z0-9]+/, "");

    if (!issueId) return message;

    const prefix = `[${issueId}]`;
    // Strip only leading ticket prefixes, never body references or other bracketed text.
    while (true) {
        if (message.slice(0, prefix.length).toLowerCase() === prefix.toLowerCase()) {
            message = message.slice(prefix.length).replace(/^[ \t]*/, "");
            continue;
        }
        const match = message.match(/^\[[a-z][a-z0-9]*-\d+\][ \t]*/i);
        if (!match) break;
        message = message.slice(match[0].length);
    }
    return `${prefix} ${message}`;
}

export function sanitizeBranchName(raw: string): string {
    return raw
        .replace(/^```[\s\n]*|[\s\n]*```$/gm, "")
        .replace(/^`|`$/gm, "")
        .replace(/^["']|["']$/g, "")
        .replace(/[\n\r]/g, "")
        .replace(/^[^A-Za-z0-9]+/, "");
}
