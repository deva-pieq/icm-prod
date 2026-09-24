"""Write failures.json + results.md handoff report."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def write_failures_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def write_results_md(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tag = payload.get("suite_grep") or payload.get("suite_tag") or "?"
    when = payload.get("generated") or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    passed = payload.get("passed", 0)
    failed = payload.get("failed", 0)
    skipped = payload.get("skipped", 0)
    failures = payload.get("failures") or []

    fixed = [f for f in failures if f.get("disposition") == "fixed"]
    escalated = [
        f
        for f in failures
        if f.get("disposition")
        in ("app_bug", "data_env", "unknown", "infra_flake", "intentional_skip")
        or (f.get("tier") == 3)
        or (
            f.get("disposition") == "test_defect"
            and int(f.get("attempts") or 0) >= 3
        )
    ]
    # All unresolved (not fixed) go to Escalated for human visibility
    unresolved = [f for f in failures if f.get("disposition") != "fixed"]
    # Prefer showing all unresolved in Escalated section
    escalated_rows = unresolved

    lines: list[str] = []
    lines.append(f"## Test Runner — `{tag}` — {when}")
    lines.append("")
    lines.append("### Summary")
    lines.append(f"- Ran: `{payload.get('command', '')}`")
    lines.append(
        f"- Passed: {passed} | Failed: {failed} | Skipped: {skipped} | "
        f"Classified failures: {len(failures)} | Fixed this run: {len(fixed)} | "
        f"Escalated: {len(escalated_rows)}"
    )
    lines.append(
        f"- Artifacts: `failures.json` | `suite.log` | behavior=`scripts/test_runner/app_behavior.json`"
    )
    lines.append(f"- Yarn exit code: {payload.get('yarn_exit_code', '?')}")
    lines.append("")

    lines.append("### Fixed (with evidence)")
    lines.append("| Tag | Pattern | Disposition | Files | Verify cmd | Result |")
    lines.append("|-----|---------|-------------|-------|------------|--------|")
    if not fixed:
        lines.append("| — | — | — | — | — | none this collect pass |")
    else:
        for f in fixed:
            lines.append(
                f"| {f.get('tag','')} | {f.get('pattern') or '—'} | "
                f"{f.get('disposition')} | {', '.join(f.get('files_touched') or []) or '—'} | "
                f"`yarn test -g \"{f.get('tag')}\" --retries=0` | pass |"
            )
    lines.append("")

    lines.append("### Escalated (needs human) — ALL unresolved failures")
    lines.append(
        "| Tag | Tier | Disposition | Error snippet | Evidence / hint | Attempts | Next step |"
    )
    lines.append(
        "|-----|------|-------------|-----------------|-----------------|----------|-----------|"
    )
    if not escalated_rows:
        lines.append("| — | — | — | — | — | — | none |")
    else:
        for f in escalated_rows:
            snip = (f.get("error_snippet") or "").replace("|", "/")[:120]
            hint = (f.get("fix_hint") or f.get("next_step") or "").replace("|", "/")[:100]
            evid = "; ".join(f.get("evidence") or []) or hint
            lines.append(
                f"| {f.get('tag','')} | {f.get('tier','')} | {f.get('disposition','')} | "
                f"{snip} | {evid[:100]} | {f.get('attempts', 0)} | "
                f"{(f.get('next_step') or '').replace('|', '/')[:80]} |"
            )
    lines.append("")

    lines.append("### Intentional skips")
    lines.append(
        "- Exclude from full runs: `@slack-reporter-sample`, `@local-only`, known `@bug`"
    )
    lines.append("")

    lines.append("### Recommendations")
    lines.append("1. Fix cascade-first: first failing tag in a serial `.feature` before siblings.")
    lines.append(
        "2. HI-P product missing → `hail-intelligence` (create product + commission template)."
    )
    lines.append(
        "3. HI-C config missing → mirror transfer-sheet / smoke; Tier 1 wiring; Tier 2 → "
        "`opencode run --agent regression-fixer --auto \"TAG=… Attempt N/3. MCP before edit.\"`"
    )
    lines.append(
        "4. Tier 3 / app_bug / unreseedable data_env → do **not** weaken assertions; use `@bug` + evidence if product confirms."
    )
    lines.append("5. Max **3** distinct evidenced fix attempts per tag, then escalate.")
    lines.append("6. Re-run after fixes:")
    lines.append(f"   `yarn test -g \"{tag}\" --retries=0 --reporter=line`")
    lines.append("")

    lines.append("### OpenCode handoff command")
    run_id = payload.get("run_id", "")
    lines.append("```powershell")
    lines.append(
        f'opencode run --agent test-runner --auto '
        f'"Read .generated/test-runner/{run_id}/failures.json and results.md. '
        f'Load hail-intelligence + app_behavior + taxonomy. '
        f'GREEN if failed==0; else FIX (default). HI-P/HI-C first. '
        f'Max 3 attempts/tag then escalate. Never weaken asserts."'
    )
    lines.append("```")
    lines.append("")

    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def ensure_app_behavior(run_dir: Path, seed_path: Path, shared_path: Path) -> Path:
    """Ensure scripts/test_runner/app_behavior.json exists (seed if missing); snapshot into run_dir."""
    shared_path.parent.mkdir(parents=True, exist_ok=True)
    if not shared_path.exists():
        shared_path.write_text(seed_path.read_text(encoding="utf-8"), encoding="utf-8")
    data = shared_path.read_text(encoding="utf-8")
    dest = run_dir / "app_behavior.json"
    dest.write_text(data, encoding="utf-8")
    return dest
