---
name: about:shiplog
description: Shiplog project context — architecture, history, and the original repo script it replaces
user-invocable: false
---

# Shiplog — Project Context

## What It Is

Shiplog is an AI-powered git CLI tool built with Deno 2.x and TypeScript. It generates commit
messages and branch names via LLM providers (Anthropic, OpenRouter).

## Origin

Shiplog is a re-invention of the `repo` bash script from
[nikbrunner/dots](https://github.com/nikbrunner/dots) at `common/.local/bin/repo`. The bash script
provided AI-powered commit and branch operations using direct `curl` calls to the Anthropic API or
Claude Code CLI. Shiplog replaces this with a typed, extensible Deno CLI.

Key differences from the original `repo` script:

- Typed config with Zod validation instead of hardcoded bash variables
- Provider abstraction via TanStack AI instead of raw curl/CLI calls
- Proper CLI framework (Cliffy) instead of manual arg parsing
- TOML config files (global + per-repo) instead of in-script constants
- Extensible provider pattern (designed for multi-provider support)

## Archived Code

The `archive/v1-bash` branch contains the original bash implementation that was the first version of
shiplog. This code is deprecated and preserved for reference only.

## Architecture

```
src/
  main.ts           → Entry point, Cliffy command registration
  commands/          → commit.ts, branch.ts — CLI command definitions
  ai/                → client.ts (LLM interaction), prompts.ts (prompt templates)
  adapters.ts        → Provider factory (Anthropic, OpenRouter), model type definitions
  config/            → schema.ts (Zod), loader.ts (TOML)
  git/               → diff.ts, exec.ts, operations.ts
  ui/                → prompts.ts (interactive user prompts via Cliffy)
```

## Config

- Global: `~/.config/black-atom/shiplog/config.toml`
- Per-repo: `.shiplog.toml` in repo root
- Schema: `src/config/schema.ts` — validates with Zod v4
- Merge order: defaults → global → repo
