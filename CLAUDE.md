# CLAUDE.md - EcoEvo Studio Frontend

**For full workspace context, read the workspace root CLAUDE.md:**

```
/Users/nate/_agent_ecology/CLAUDE.md
```

This repo is the **EcoEvo Studio product frontend** — ecosystem services for built environment. The shared backend lives in `repos/nuluca-platform-v2/` (same codebase serves Agent Ecology, nuLUCA, Terradigm, and EcoEvo Studio as separate Railway instances).

For EcoEvo Studio-specific context, use the `/ecoevo-studio` skill.

---

## Git Hooks (One-Time Setup Per Clone/Worktree)

Tracked hooks live in `.githooks/` (not `.git/hooks/`) so they survive across clones and worktrees. After a fresh clone or `git worktree add`, run:

```bash
./.githooks/install.sh
```

This sets `core.hooksPath=.githooks` for that checkout. The pre-commit hook rejects any staged path under a package-manager install tree (`node_modules/`, `.next/`, `.pnpm/`, etc. — **including renamed variants** like `.node_modules_store/`, `_node_modules/`) and any single file > 10 MB. This is the physical guard against the 2026-04-20 vendor-tree incident — see `/Users/nate/_agent_ecology/planning/postmortems/2026-04-20-feat-568-codex-workarounds.md`.
