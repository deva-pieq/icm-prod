# QA Knowledge Base

Machine-readable source of truth lives in `knowledge/`. The top-level
markdown files are **generated** — never hand-edit them, or the next
`generate-docs.mjs` run will overwrite your change.

| Path | Owner | Edit by hand? |
|---|---|---|
| `app-profile.json` | grimmjow | yes — it is hand-maintained |
| `knowledge/facts.json` | scouts, explorer, grimmjow | yes |
| `knowledge/modules.json` | app-scout | yes |
| `knowledge/api.json` | api-scout | yes |
| `knowledge/ui-patterns.json` | ui-explorer | yes |
| `knowledge/taxonomy.json` | grimmjow | yes |
| `app-knowledge.md` | generated | no |
| `api-surface.md` | generated | no |
| `test-strategy.md` | test-planner | yes |
| `debug/journal.md` | test-debugger | yes (append) |
| `runs/<date>-<slug>/` | per run | yes |
| `reviews/<date>-release-gate.md` | release-gate | yes |

## Regenerating

```powershell
node ~/.config/opencode/qa-kit/scripts/generate-docs.mjs
```

## Validating

```powershell
node ~/.config/opencode/qa-kit/scripts/validate-qa-dir.mjs
```

## Rules

- A `fact` needs evidence. Anything else is a `hypothesis`.
- Credentials are referenced by NAME. No secret value belongs in this directory.
- `runs/` and `reviews/` are append-only history. Do not rewrite a past run.
