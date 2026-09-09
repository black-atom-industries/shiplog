interface CommitPromptOptions {
    diff: string;
    commitHistory: string;
    summaryLength: number;
    issueId?: string;
}

export function buildCommitPrompt(options: CommitPromptOptions): string {
    const { diff, commitHistory, summaryLength, issueId } = options;

    let prompt = `Generate a commit message for the git diff below.

CRITICAL: Return ONLY the commit message. Do not include explanations, analysis, commentary, or additional text.

Requirements:
- Summary line MUST NOT exceed ${summaryLength} characters
- Use imperative mood and explain why, not just what changed
- Do not use a type(scope): prefix
- Omit brackets when no ticket or issue is provided
- Start breaking changes with BREAKING: after the optional ticket
- Only add a body for large or non-obvious changes
- Bodies use bullets, one per moving part, stating what changed and why
- Wrap body lines at 72 characters

Output format: Just the commit message, nothing more.`;

    if (commitHistory) {
        prompt += `

Previous commits in this feature branch (most recent first):
\`\`\`
${commitHistory}
\`\`\`
Ensure consistency with these commits. Adhere to the ${summaryLength}-character summary rule.`;
    }

    prompt += `

Changes to commit:
\`\`\`
${diff}
\`\`\``;

    if (issueId) {
        prompt += `

Prefix the summary line with this ticket or issue key in square brackets: [${issueId}]
Use this key, not tickets from previous commits. The ${summaryLength}-character limit includes this prefix and the following space.

Example: [${issueId}] add the missing validation`;
    }

    return prompt;
}
