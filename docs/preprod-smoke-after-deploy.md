# Preprod Smoke — After Deploy

Smoke runs **after** `icm-host-spa` finishes deploying to preprod. Not a deploy blocker.

| Repo | Role |
| --- | --- |
| [pieq-ai/icm-host-spa](https://github.com/pieq-ai/icm-host-spa) | `Preprod-AWS-Service` deploys, then triggers smoke |
| [pieq-ai/pieq-test-automation](https://github.com/pieq-ai/pieq-test-automation) | Owns `smoke-on-merge.yml` + `@smoke` suite |

**SPA workflow:** `.github/workflows/…` → `name: Preprod-AWS-Service`  
**Test workflow:** `.github/workflows/smoke-on-merge.yml`  
**Event:** `repository_dispatch` · `event_type: preprod-deployed`

```
Preprod-AWS-Service
  → Deploy to preprod
  → Disable maintenance mode (success)
  → Trigger ICM smoke          ← add this step
       │
       ▼  repository_dispatch
smoke-on-merge.yml  →  yarn test -g "@smoke"  →  Slack (+ OpenCode on fail)
```

---

## SPA change — add one step at end of `deploy` job

Insert **after** `Disable maintenance mode`, still under `jobs.deploy.steps`.

Reuse existing PAT (`PAT_ACCESS_TOKEN` / `REPO_ACCESS_TOKEN`) **only if** that token can dispatch Actions on `pieq-test-automation`. Prefer a dedicated secret `TEST_AUTOMATION_DISPATCH_TOKEN` (Actions: write on test repo) if the deploy PAT is clone/tag-only.

```yaml
      - name: Disable maintenance mode
        if: success()
        run: |
          node scripts/publish-maintenance-config.js \
            --env preprod \
            --disable \
            --bucket ${{ inputs.preprod_s3_bucket }} \
            --distribution ${{ inputs.preprod_cf_distribution }}

      # --- add below ---
      - name: Trigger ICM smoke on preprod
        if: success()
        env:
          GH_TOKEN: ${{ secrets.TEST_AUTOMATION_DISPATCH_TOKEN || secrets.PAT_ACCESS_TOKEN || secrets.REPO_ACCESS_TOKEN }}
        run: |
          if [ -z "$GH_TOKEN" ]; then
            echo "::error::No token to dispatch smoke. Set TEST_AUTOMATION_DISPATCH_TOKEN (preferred) or ensure PAT_ACCESS_TOKEN can Actions:write on pieq-test-automation."
            exit 1
          fi
          gh api repos/pieq-ai/pieq-test-automation/dispatches \
            -f event_type='preprod-deployed' \
            -f client_payload[spa_sha]='${{ github.sha }}' \
            -f client_payload[release_tag]='${{ env.RELEASE_TAG }}'
```

Notes:

- Required to start smoke: `event_type` only.
- Kept payloads: `spa_sha` (deploy commit), `release_tag` (from earlier tag step / env).
- `if: success()` — skip smoke if deploy/maintenance disable failed.
- SPA does **not** wait for smoke. Failures go to Slack from test-repo CI.

---

## Token checklist (SPA secrets)

| Secret | Use |
| --- | --- |
| `PAT_ACCESS_TOKEN` / `REPO_ACCESS_TOKEN` | Already used for clone + tags |
| `TEST_AUTOMATION_DISPATCH_TOKEN` (recommended) | Fine-grained PAT → only `pieq-test-automation` → **Actions: Read and write** |

If you reuse the deploy PAT, it must also have permission to create `repository_dispatch` on `pieq-ai/pieq-test-automation`.

---

## Prerequisites (test repo)

1. Merge branch with `repository_dispatch: [preprod-deployed]` on `smoke-on-merge.yml`.
2. Secrets on test repo: preprod `BASE_URL` / `ENV_FILE` + Slack (same as existing smoke CI).

---

## Dry-run (no SPA deploy)

```powershell
gh api repos/pieq-ai/pieq-test-automation/dispatches `
  -f event_type='preprod-deployed' `
  -f client_payload[spa_ref]='manual-dry-run'
```

Actions → **Smoke Test on Schedule, Push, PR Merge, or Preprod Deploy**.

---

## Removed (old before-deploy gate)

- `.github/workflows/smoke-preprod-deploy-gate.yml`
- `projects/icm/scripts/ci-evaluate-smoke-gate.mjs`
- old before-deploy gate docs
