# Start here (human)

1. `git init && git add -A && git commit -m "chore: initial spec"`
2. Create a Google OAuth client; copy `.env.example` to `.env` and fill it; start Postgres.
3. Open this folder in OpenCode and run:
   - `/bootstrap`    → scaffolds the project (Phase 0)
   - `/phase 1` … `/phase 9` → one phase at a time
   - `/audit-check`  → after any phase that touches server actions

## Plugins (auto-configured)
`opencode.json` installs **superpowers** and **ponytail**, and enables **context7** + **playwright** MCP. UI/UX Pro Max skills are already in `.opencode/skills/` (needs Python 3).
Restart OpenCode once, then run `/design-system` before `/phase 1`.
Built for OpenCode 2 (`plugins` for ponytail). If superpowers doesn't load, move its line from `plugin` into `plugins`.
