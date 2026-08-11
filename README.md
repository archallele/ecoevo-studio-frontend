# EcoEvo Studio Frontend

Next.js frontend for **EcoEvo Studio** — ecosystem services for the built environment. Consumes the shared Agent Ecology backend (see `repos/nuluca-platform-v2/`) as a separate Railway instance.

## Git Hooks (One-Time Setup Per Clone/Worktree)

Tracked hooks live in `.githooks/` (not `.git/hooks/`) so they survive across clones and worktrees. After a fresh clone or `git worktree add`, run:

```bash
./.githooks/install.sh
```

This sets `core.hooksPath=.githooks` for that checkout. The pre-commit hook rejects any staged path under a package-manager install tree (`node_modules/`, `.next/`, `.pnpm/`, etc. — **including renamed variants** like `.node_modules_store/`) and any single file > 10 MB. See `.githooks/pre-commit` for details.

## Getting Started

```bash
npm install
npm run dev
```

Environment variables: copy `.env.example` → `.env.local` and point at the backend (`NEXT_PUBLIC_AGENT_ECOLOGY_API_URL`) plus the EcoEvo Clerk keys.

## Deployment

Railway project: `agent-ecology-production`, service `ecoevo-studio-frontend`.
