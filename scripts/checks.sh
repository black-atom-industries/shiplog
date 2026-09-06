#!/usr/bin/env sh
set -e

deno fmt --check
deno lint
deno task schema:check
deno task check
deno task test
