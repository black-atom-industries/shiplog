# Shiplog

AI-powered git CLI tool — generates commit messages and branch names via LLM providers.

## What This Is

Shiplog is a Deno 2.x TypeScript CLI that wraps git operations (commit, branch) with AI-generated
suggestions. It's a re-invention of the `repo` bash script from
[dots](https://github.com/nikbrunner/dots) (`common/.local/bin/repo`), rebuilt as a proper CLI with
typed config, provider abstraction, and extensibility.

## Architecture

```
src/
  commands/     → CLI command definitions (Cliffy)
  ai/           → LLM client + prompt templates
  providers/    → Provider adapters (currently: Anthropic via TanStack AI)
  config/       → TOML config loading + Zod schema validation
  git/          → Git operations (diff, exec, operations)
  ui/           → Interactive prompts (Cliffy)
```

## Key Design Decisions

- **TanStack AI** as the abstraction layer over providers — not raw SDK calls
- **Zod v4** for config schema validation (global `~/.config/black-atom/shiplog/config.toml` +
  per-repo `.shiplog.toml`)
- **Provider pattern** — designed for multi-provider support, currently Anthropic-only
- Config merges: global defaults → global config → repo config

## Documentation

Before implementing or modifying TanStack AI patterns, verify against current docs using
`tanstack docs @tanstack/ai` (or `@tanstack/ai-anthropic`). Do not rely on training data — these
packages are new and evolving.

## Conventions

- Commit messages use `[TICKET-123] summary` when tied to a ticket or issue, otherwise `summary`;
  breaking changes start with `BREAKING:`
- `archive/v1-bash` branch contains the original bash implementation (deprecated)
