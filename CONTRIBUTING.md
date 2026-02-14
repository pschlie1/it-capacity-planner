# Contributing — GitHub Flow

All development follows **GitHub Flow**. No direct pushes to `main`.

## Process

1. **Create a feature branch** from `main`
   ```bash
   git checkout main && git pull
   git checkout -b feature/your-feature-name
   ```

2. **Make changes, commit often**
   ```bash
   git add -A && git commit -m "feat: description of change"
   ```

3. **Push branch and open a PR**
   ```bash
   git push -u origin feature/your-feature-name
   gh pr create --title "feat: description" --body "What and why"
   ```

4. **CI runs automatically** (lint, typecheck, tests)

5. **Review and merge** via GitHub (squash merge preferred)

6. **Vercel auto-deploys** from `main` after merge

## Branch naming

- `feature/` — new functionality
- `fix/` — bug fixes
- `refactor/` — code improvements
- `docs/` — documentation only
- `chore/` — CI, deps, config

## Commit messages

Follow conventional commits:
- `feat:` new feature
- `fix:` bug fix
- `refactor:` code change (no new feature or fix)
- `docs:` documentation
- `chore:` maintenance
- `test:` adding or updating tests

## Requirements before merge

- TypeScript compiles (`tsc --noEmit`)
- Tests pass (`pnpm test`)
- No new `any` types without justification
- PR description explains what and why
