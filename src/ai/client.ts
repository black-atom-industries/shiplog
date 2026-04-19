import { chat } from "@tanstack/ai";
import { createAdapter, type ModelName, type ProviderName } from "../adapters.ts";

export async function generate(
    prompt: string,
    model: ModelName,
    provider: ProviderName,
): Promise<string> {
    const adapter = createAdapter(provider, model);

    const stream = chat({
        adapter,
        messages: [{ role: "user", content: prompt }],
    });

    let text = "";
    for await (const chunk of stream) {
        if (chunk.type === "RUN_ERROR") {
            throw new Error(chunk.error.message);
        }
        if (chunk.type === "TEXT_MESSAGE_CONTENT") {
            text += chunk.delta;
        }
    }

    return text.trim();
}
