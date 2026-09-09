import type { RepoConfig } from "../config/schema.ts";

export function extractIssueId(
    branch: string,
    { issuePattern: pattern, issuePrefix: prefix }: Pick<
        RepoConfig,
        "issuePattern" | "issuePrefix"
    > = {},
): string | undefined {
    if (pattern === undefined) {
        return branch.match(/(?:^|[/_-])([a-z][a-z0-9]*-\d+)(?=$|[/_-])/i)?.[1].toUpperCase();
    }
    if (!pattern) return undefined;
    const match = branch.match(new RegExp(pattern, "i"));
    if (!match) return undefined;

    if (prefix && match[1]) {
        return `${prefix}${match[1]}`;
    }
    return match[0].toUpperCase();
}
