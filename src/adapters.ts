import {
    ANTHROPIC_MODELS,
    type AnthropicChatModel,
    anthropicText,
    createAnthropicChat,
} from "@tanstack/ai-anthropic";
import { createOpenRouterText, openRouterText } from "@tanstack/ai-openrouter";

export { ANTHROPIC_MODELS };

type OpenRouterModel = Parameters<typeof openRouterText>[0];

export const PROVIDER_NAMES = ["anthropic", "openrouter"] as const;

export type ProviderName = (typeof PROVIDER_NAMES)[number];

export type ModelName = AnthropicChatModel | OpenRouterModel | string;

export const OPENROUTER_DEFAULT_MODELS = [
    "google/gemma-4-26b-a4b-it",
    "google/gemma-4-31b-it",
    "deepseek/deepseek-v4-flash",
    "claude-sonnet-4-6",
    "claude-haiku-4-6",
] as const;

export function createAdapter(
    provider: ProviderName,
    model: ModelName,
    options: { anthropicApiKey?: string; openRouterApiKey?: string } = {},
) {
    switch (provider) {
        case "anthropic":
            return options.anthropicApiKey
                ? createAnthropicChat(model as AnthropicChatModel, options.anthropicApiKey)
                : anthropicText(model as AnthropicChatModel);
        case "openrouter":
            return options.openRouterApiKey
                ? createOpenRouterText(model as OpenRouterModel, options.openRouterApiKey)
                : openRouterText(model as OpenRouterModel);
        default: {
            const _exhaustive: never = provider;
            throw new Error(`Unknown provider: ${_exhaustive}`);
        }
    }
}
