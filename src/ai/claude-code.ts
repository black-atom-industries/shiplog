const SYSTEM_PROMPT = "Output only the requested text.";

/**
 * Runs the prompt through the Claude Code CLI so it bills against the logged-in Claude
 * subscription. ANTHROPIC_API_KEY is removed from the child env because the CLI prefers it
 * over the subscription login.
 */
export async function generateWithClaudeCode(prompt: string, model: string): Promise<string> {
    const env = Deno.env.toObject();
    delete env.ANTHROPIC_API_KEY;

    const child = new Deno.Command("claude", {
        args: [
            "-p",
            "--model",
            model,
            "--system-prompt",
            SYSTEM_PROMPT,
            "--tools",
            "",
            "--setting-sources",
            "",
            "--strict-mcp-config",
            "--no-session-persistence",
        ],
        env,
        clearEnv: true,
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
    }).spawn();

    const writer = child.stdin.getWriter();
    await writer.write(new TextEncoder().encode(prompt));
    await writer.close();

    const { code, stdout, stderr } = await child.output();
    const decoder = new TextDecoder();
    const out = decoder.decode(stdout).trim();

    if (code !== 0) {
        throw new Error(out || decoder.decode(stderr).trim() || `claude exited with code ${code}`);
    }

    return out;
}
