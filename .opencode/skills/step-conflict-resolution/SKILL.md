---
name: step-conflict-resolution
description: When writing new Gherkin scenarios, check for step definition conflicts and add page-name suffix if needed.
---

# Step Definition Conflict Resolution

## Why conflicts happen

`playwright-bdd` loads all `steps/**/*.ts` files globally. If two step definition files register the same Gherkin text, the runner throws:

```
Error: Multiple definitions matched scenario step.
```

## Workflow

### 1. Before writing a new scenario

Search existing step definitions in `steps/` for any step text you plan to write:

```bash
rg "Then\('the viewing period" steps/ --include '*.ts'
```

If an **exact match** exists, your new step MUST use a **page-name suffix** to differentiate it.

### 2. Adding the page-name suffix

Modify both the `.feature` file AND the step definition to append ` {page-name}`:

**Feature file:**
```gherkin
Then the viewing period shows last month's date range on agency dashboard
```

**Step definition:**
```typescript
Then('the viewing period shows last month\'s date range on agency dashboard', async ({ agencyOwnerDashboardPage }) => { ... });
```

### 3. Page-name suffix conventions

| Page | Suffix |
|---|---|
| Agency Owner Dashboard | `on agency dashboard` |
| Ops Manager Dashboard | `on ops manager dashboard` |
| User Management | `in user management` |
| Product Management | `in products` |
| Statement Upload | `on statement upload` |
| Commission Split | `in commission split` |
| Transfer Sheet | `on transfer sheet` |

For pages not listed, use the module directory name (e.g. `in carriers`).

### 4. Validation

```bash
npx bddgen
```

If bddgen exits with `Error: Multiple definitions matched scenario step`, add more context to the suffix.

## When NOT to add a suffix

- The step text is already unique
- The step is a generic, shared action (e.g. login, logout)
- The step uses `{word}` or `{string}` parameters and is designed for reuse

## Checklist

- [ ] Searched `steps/` for matching step text before writing
- [ ] If duplicate found: added `on {page name}` suffix to both feature and step definition
- [ ] Ran `npx bddgen` and verified zero "Multiple definitions matched" errors
