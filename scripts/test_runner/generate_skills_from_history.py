#!/usr/bin/env python3
"""
Generate / refresh Test Runner + app-behavior skills from seed behavior + taxonomy.

Usage (from projects/icm):
  python scripts/test_runner/generate_skills_from_history.py
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
PROJECT = _HERE.parent.parent


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


TEST_RUNNER_SKILL = """---
name: test-runner
description: >-
  Orchestrate ICM BDD suite runs via Python test-runner.py (-g like yarn test),
  classify failures, hand off to OpenCode regression-fixer, escalate unresolved
  into results.md. Use when user says Test Runner, run sanity/smoke/regression,
  /test-runner, or asks to collect+fix E2E failures.
---

# Test Runner (collect → classify → fix / escalate)

## Entry CLI (from `projects/icm`)

```powershell
python test-runner.py -g "sanity"
python test-runner.py -g "sanity|regression"
python test-runner.py -g "T001-SMK"
python test-runner.py -g "@agency-dashboard" --fix
python test-runner.py -g "@smoke-prod" --collect-only
```

Aliases: `sanity` → `@sanity-prod`; `smoke` → `@smoke-prod`; `regression` → `@regression-test`; `T001-SMK` → `@TEST-001-smoke-PROD`.
`-g` otherwise passes through like `yarn test -g`.

Entry: project-root `test-runner.py`. Helpers: `scripts/test_runner/`.

Always uses `--retries=0 --reporter=line`. Artifacts under `.generated/test-runner/<run-id>/`:
`suite.log`, `failures.json`, `results.md` (run snapshot may include `app_behavior.json`).
Runner keeps **last 3** timestamped run dirs; older pruned automatically.

## Workflow

1. Run `python test-runner.py -g "…"` (collect + classify). Prefer `--collect-only` first for baseline.
2. Read `failures.json` + `results.md`. Every failure must end Fixed or Escalated.
3. **Bug-vs-test gate** (binding):
   - Read POM `loc` map first.
   - Tier 1 signals → one inline fix → verify once.
   - Else MCP via OpenCode `regression-fixer` before editing.
   - `app_bug` / `data_env` → escalate; never weaken asserts.
4. Max **3** distinct evidenced attempts per tag → escalate.
5. Update `scripts/test_runner/app_behavior.json` only with MCP-proven facts.
6. Finalize Escalated table + recommendations in `results.md`.

## Cursor vs OpenCode

- **Cursor:** run Python collect; Tier-2 → `opencode run --agent regression-fixer --auto "…"`.
- **OpenCode:** may MCP in-process or spawn fixer; orchestrator agent is `test-runner`.

## Taxonomy / behavior

- `scripts/test_runner/taxonomy.json` — Tier 1/2/3 signals
- `scripts/test_runner/app_behavior.json` — canonical living map (+ `app_behavior.seed.json` bootstrap)
- Patterns A–T: `fix-harvested-e2e-tests` skill
- History: `REGRESSION_FIX_PLAN.md`

## Constraints

- No new package.json scripts; invoke Python / yarn directly.
- `yarn bddgen` after Gherkin/step text changes.
- Methods use `this.loc.*` only; MCP `count === 1` before persist.
- Exclude `@slack-reporter-sample|@local-only` on full regression (script auto-invert).
"""


def render_behavior_skill(behavior: dict) -> str:
    lines = [
        "---",
        "name: icm-app-behavior",
        "description: >-",
        "  Proven ICM live-app behavior facts from regression fix campaigns.",
        "  Use when writing or fixing scenarios for agency/ops/agent dashboards,",
        "  edit-transaction, payment-module, product-management — avoid re-asserting",
        "  removed or known-broken product behaviors.",
        "---",
        "",
        "# ICM App Behavior Map",
        "",
        f"Updated: {behavior.get('updated', '')} (version {behavior.get('version', 1)})",
        "",
        "Facts are MCP/fix-history proven. Do not contradict high-confidence entries without new live proof.",
        "",
    ]
    modules = behavior.get("modules") or {}
    for mod, facts in modules.items():
        lines.append(f"## {mod}")
        lines.append("")
        for fact in facts:
            lines.append(f"### `{fact.get('id')}` ({fact.get('confidence', '?')})")
            lines.append(f"- **Fact:** {fact.get('fact')}")
            lines.append(f"- **Implication:** {fact.get('implication')}")
            lines.append(f"- **Source:** {fact.get('source')}")
            lines.append("")
    ui = behavior.get("ui_patterns") or {}
    if ui:
        lines.append("## UI patterns")
        lines.append("")
        for k, v in ui.items():
            lines.append(f"- **{k}:** {v}")
        lines.append("")
    return "\n".join(lines)


def write_skill(rel_cursor: str, rel_opencode: str, body: str) -> None:
    for rel in (rel_cursor, rel_opencode):
        path = PROJECT / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(body, encoding="utf-8")
        print(f"wrote {path}")


def main() -> int:
    behavior_path = _HERE / "app_behavior.json"
    seed = _HERE / "app_behavior.seed.json"
    if behavior_path.exists():
        behavior = _load(behavior_path)
    else:
        behavior = _load(seed)

    write_skill(
        ".cursor/skills/test-runner/SKILL.md",
        ".opencode/skills/test-runner/SKILL.md",
        TEST_RUNNER_SKILL,
    )
    body = render_behavior_skill(behavior)
    write_skill(
        ".cursor/skills/icm-app-behavior/SKILL.md",
        ".opencode/skills/icm-app-behavior/SKILL.md",
        body,
    )
    # Ensure canonical living map exists (seed → app_behavior.json)
    if not behavior_path.exists():
        shutil.copy(seed, behavior_path)
        print(f"seeded {behavior_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
