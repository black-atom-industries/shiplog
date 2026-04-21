export function sanitizeCommitMessage(raw: string): string {
    return raw
        .replace(/^```[\s\n]*|[\s\n]*```$/gm, "")
        .replace(/^`|`$/gm, "")
        .replace(/^["']|["']$/g, "")
        .replace(/\r/g, "")
        .replace(/^[^A-Za-z0-9]+/, "");
}

export function sanitizeBranchName(raw: string): string {
    return raw
        .replace(/^```[\s\n]*|[\s\n]*```$/gm, "")
        .replace(/^`|`$/gm, "")
        .replace(/^["']|["']$/g, "")
        .replace(/[\n\r]/g, "")
        .replace(/^[^A-Za-z0-9]+/, "");
}
