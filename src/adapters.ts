import { ANTHROPIC_MODELS, type AnthropicChatModel, anthropicText } from "@tanstack/ai-anthropic";
import { openRouterText } from "@tanstack/ai-openrouter";

export { ANTHROPIC_MODELS };

type OpenRouterModel = Parameters<typeof openRouterText>[0];

export const PROVIDER_NAMES = ["anthropic", "openrouter"] as const;

export type ProviderName = (typeof PROVIDER_NAMES)[number];

export type ModelName = AnthropicChatModel | OpenRouterModel | string;

export const OPENROUTER_DEFAULT_MODELS = [
    "google/gemma-3-27b-it",
    "google/gemma-3-12b-it",
    "nvidia/nemotron-nano-9b-v2",
] as const;

export function createAdapter(provider: ProviderName, model: ModelName) {
    switch (provider) {
        case "anthropic":
            return anthropicText(model as AnthropicChatModel);
        case "openrouter":
            return openRouterText(model as OpenRouterModel);
        default: {
            const _exhaustive: never = provider;
            throw new Error(`Unknown provider: ${_exhaustive}`);
        }
    }
}
