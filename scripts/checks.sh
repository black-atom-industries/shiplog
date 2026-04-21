#!/usr/bin/env sh
set -e

deno fmt --check
deno lint
deno task check
deno task test
