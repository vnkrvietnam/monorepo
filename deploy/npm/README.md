# NPM Registry — VNKR Package Publish Guide

## Packages published to GitHub Packages (`npm.pkg.github.com`)

| Package | Name | Access |
|---|---|---|
| `packages/types` | `@vnkrvietnam/types` | restricted |
| `packages/config` | `@vnkrvietnam/config` | restricted |
| `packages/core-sdk` | `@vnkrvietnam/core-sdk` | restricted |
| `packages/merchant-sdk` | `@vnkrvietnam/merchant-sdk` | restricted |
| `packages/swift-adapter` | `@vnkrvietnam/swift-adapter` | restricted |
| `packages/ui-kit` | `@vnkrvietnam/ui-kit` | restricted |

---

## Recommended workflow: Changesets (automated, CI-driven)

Changesets manages semantic versioning, CHANGELOG generation, and publishing
across the entire monorepo with a single PR-based flow.

### Day-to-day: record a change

After making code changes, run:

```bash
pnpm changeset:add
# → select the affected packages
# → choose bump type: patch | minor | major
# → write a short summary (used in the CHANGELOG)
```

This creates a `.changeset/<random-name>.md` file — commit it alongside your code.

### Check pending changesets

```bash
pnpm changeset:status
```

### CI/CD release pipeline (fully automated)

The workflow in `.github/workflows/changeset-release.yml` runs on every push to `main`:

```
push to main
    │
    ▼
any .changeset/*.md files?
    ├─ YES → opens / updates a "Version Packages" PR
    │         (bumps package.json versions + writes CHANGELOGs)
    │
    └─ NO  → "Version Packages" PR was just merged
              → pnpm build && pnpm test && changeset publish
              → pushes tags, creates GitHub Releases
```

Build order enforced by Turborepo:
```
@vnkrvietnam/types
    └── @vnkrvietnam/config
            └── @vnkrvietnam/core-sdk
            └── @vnkrvietnam/swift-adapter
            └── @vnkrvietnam/merchant-sdk
                    └── @vnkrvietnam/ui-kit
```

### Manual publish (emergency / local)

```bash
# 1. Bump versions according to pending changesets
pnpm changeset:version

# 2. Build → test → publish
pnpm changeset:publish

# 3. Tag the release commit
pnpm changeset:tag
```

---

## Legacy scripts (still available)

These scripts bypass Changesets and publish directly. Use only when Changesets
is not appropriate (e.g. hotfix without a PR).

```bash
# Dry-run (simulate publish — no actual upload)
pnpm publish:dry

# Real publish all packages
pnpm publish:all

# Bump all packages uniformly (no CHANGELOG)
pnpm version:patch
pnpm version:minor
pnpm version:major
```

---

## Prerequisites

### `.npmrc` (root — already configured)

```ini
@vnkrvietnam:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

### Local authentication

```bash
# Authenticate once with a GitHub PAT (scope: read:packages, write:packages)
npm login --scope=@vnkrvietnam --registry=https://npm.pkg.github.com
```

### Required GitHub secrets

| Secret | Description |
|---|---|
| `GITHUB_TOKEN` | Auto-provided by Actions — write:packages permission required |

---

## `.changeset/config.json` reference

```json
{
  "access": "restricted",          // GitHub Packages — restricted scope
  "baseBranch": "main",
  "updateInternalDependencies": "patch",  // workspace:* deps auto-bumped on patch
  "changelog": "@changesets/cli/changelog"
}
```
