#!/usr/bin/env python3
"""
ICM Test Runner — collect suite results via yarn subprocess, classify, hand off to OpenCode.

Default: collect → classify → fix (OpenCode). No failures → green exit (no OpenCode).
Disable fix with --no-fix / --collect-only.

Usage (from projects/icm):
  python test-runner.py -g "sanity"
  python test-runner.py -g "sanity|regression"
  python test-runner.py -g "T001-SMK"
  python test-runner.py -g "@agency-dashboard" --no-fix
  python test-runner.py -g "@smoke-prod" --no-bddgen --collect-only

Helpers live in scripts/test_runner/. -g works like yarn test -g after alias mapping
(sanity=@sanity-prod, smoke=@smoke-prod, regression=@regression-test, T001-SMK=@TEST-001-smoke-PROD).
Canonical app behavior: scripts/test_runner/app_behavior.json.
Run artifacts under .generated/test-runner/<run-id>/; only last 3 runs retained.
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
LIB_DIR = PROJECT_ROOT / "scripts" / "test_runner"
if str(LIB_DIR) not in sys.path:
    sys.path.insert(0, str(LIB_DIR))

from classify import classify_all  # noqa: E402
from grep_map import map_grep  # noqa: E402
from parse_results import parse_suite_log  # noqa: E402
from write_report import (  # noqa: E402
    ensure_app_behavior,
    write_failures_json,
    write_results_md,
)

GENERATED = PROJECT_ROOT / ".generated" / "test-runner"
TAXONOMY_PATH = LIB_DIR / "taxonomy.json"
BEHAVIOR_SEED = LIB_DIR / "app_behavior.seed.json"
# Canonical living map (committed) — not under .generated
SHARED_BEHAVIOR = LIB_DIR / "app_behavior.json"
KEEP_RUNS = 3


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _yarn_cmd() -> list[str]:
    yarn = shutil.which("yarn") or shutil.which("yarn.cmd")
    if yarn:
        return [yarn]
    return ["yarn"]


def _is_run_dir(path: Path) -> bool:
    """True for UTC run folders like 20260908T041721Z-smoke (not _selftest / latest)."""
    name = path.name
    if not path.is_dir() or name.startswith("_") or name == "latest":
        return False
    # YYYYMMDDTHHMMSSZ-…
    if len(name) < 17 or name[8] != "T" or "Z" not in name[:18]:
        return False
    stamp = name.split("-", 1)[0]
    return len(stamp) == 16 and stamp.endswith("Z") and stamp[:8].isdigit()


def _prune_old_runs(generated: Path, keep: int = KEEP_RUNS) -> list[str]:
    """Delete oldest run dirs under .generated/test-runner; keep newest `keep`."""
    if keep < 1 or not generated.is_dir():
        return []
    runs = sorted(
        (p for p in generated.iterdir() if _is_run_dir(p)),
        key=lambda p: p.name,
        reverse=True,
    )
    pruned: list[str] = []
    for old in runs[keep:]:
        try:
            shutil.rmtree(old)
            pruned.append(old.name)
            print(f"[test-runner] pruned old run {old.name}")
        except OSError as exc:
            print(f"[test-runner] prune failed {old.name}: {exc}", file=sys.stderr)
    return pruned


def _run(cmd: list[str], cwd: Path, log_fp) -> int:
    log_fp.write(f"\n$ {' '.join(cmd)}\n")
    log_fp.flush()
    env = os.environ.copy()
    env.setdefault("PYTHONIOENCODING", "utf-8")
    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd),
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        shell=False,
    )
    assert proc.stdout is not None
    for line in proc.stdout:
        sys.stdout.write(line)
        log_fp.write(line)
    return proc.wait()


def _build_test_argv(
    grep: str,
    invert: str | None,
    extra: list[str],
) -> list[str]:
    cmd = _yarn_cmd() + [
        "test",
        "-g",
        grep,
        "--retries=0",
        "--reporter=line",
    ]
    if invert:
        cmd.extend(["--grep-invert", invert])
    if extra:
        cmd.extend(extra)
    return cmd


def _invoke_opencode(run_dir: Path, grep: str) -> int:
    """Spawn OpenCode test-runner agent with artifact paths."""
    oc = shutil.which("opencode") or shutil.which("opencode.cmd") or shutil.which("oc")
    if not oc:
        print(
            "[test-runner] OpenCode binary not found (opencode/oc). "
            "Fix loop skipped; run handoff from results.md manually.",
            file=sys.stderr,
        )
        return 1

    failures = run_dir / "failures.json"
    results = run_dir / "results.md"
    prompt = (
        f"SUITE_GREP={grep}. "
        f"Read {failures} and {results}. "
        "Load skills: test-runner, hail-intelligence, icm-app-behavior, fix-harvested-e2e-tests. "
        "Internal loop: failed==0 → report GREEN and exit; else FIX (default). "
        "Use taxonomy + scripts/test_runner/app_behavior.json. "
        "Bug-vs-test gate with Playwright MCP. "
        "Product missing → hail-intelligence: create product + commission template "
        "(match Excel product name alias). Config missing → mirror transfer-sheet / smoke. "
        "Purged product-team data (e.g. e2e-commission-statements) → reseed simple E2E data; "
        "validate flow; escalate only what cannot be resewn. "
        "Fix test_defect Tier 1/2 up to 3 attempts each (delegate regression-fixer for MCP). "
        "After 3 failed attempts → escalate. Escalate ALL unresolved into results.md. "
        "Never weaken assertions."
    )
    cmd = [
        oc,
        "run",
        "--agent",
        "test-runner",
        "--auto",
        prompt,
        "-f",
        str(results),
        "-f",
        str(failures),
    ]
    print(f"[test-runner] Invoking: {' '.join(cmd)}")
    return subprocess.call(cmd, cwd=str(PROJECT_ROOT))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Run ICM BDD suite via yarn subprocess, classify failures, "
            "then OpenCode fix loop by default (green if no failures)."
        ),
    )
    parser.add_argument(
        "-g",
        "--grep",
        required=True,
        help="Playwright grep expr (aliases: sanity=@sanity-prod, smoke=@smoke-prod, regression=@regression-test, T001-SMK=@TEST-001-smoke-PROD)",
    )
    parser.add_argument(
        "--invert",
        default=None,
        help="Passed to yarn --grep-invert (default for regression alias: slack/local-only)",
    )
    parser.add_argument(
        "--no-default-invert",
        action="store_true",
        help="Do not auto-apply default invert when grep includes regression",
    )
    parser.add_argument(
        "--out",
        default=None,
        help="Output dir (default .generated/test-runner/<run-id>)",
    )
    parser.add_argument(
        "--no-bddgen",
        action="store_true",
        help="Skip yarn bddgen before test",
    )
    parser.add_argument(
        "--collect-only",
        action="store_true",
        help="Collect + classify only (same as --no-fix)",
    )
    parser.add_argument(
        "--fix",
        dest="fix",
        action="store_true",
        default=True,
        help="After collect, invoke OpenCode fix loop (DEFAULT ON)",
    )
    parser.add_argument(
        "--no-fix",
        dest="fix",
        action="store_false",
        help="Disable OpenCode fix loop (collect + classify only)",
    )
    parser.add_argument(
        "extra",
        nargs="*",
        help="Extra args appended to yarn test (after --)",
    )
    args = parser.parse_args(argv)

    taxonomy = _load_json(TAXONOMY_PATH)
    mapped = map_grep(args.grep, taxonomy)

    invert = args.invert
    if (
        invert is None
        and not args.no_default_invert
        and ("regression-test" in mapped or "regression" in args.grep.lower())
    ):
        invert = taxonomy.get("default_invert") or "@slack-reporter-sample|@local-only"

    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + (
        args.grep.replace("|", "_").replace("@", "")[:40] or "suite"
    )
    run_dir = Path(args.out) if args.out else GENERATED / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    ensure_app_behavior(run_dir, BEHAVIOR_SEED, SHARED_BEHAVIOR)
    behavior = _load_json(SHARED_BEHAVIOR)

    suite_log = run_dir / "suite.log"
    test_cmd = _build_test_argv(mapped, invert, args.extra)
    command_str = " ".join(test_cmd)

    want_fix = bool(args.fix) and not bool(args.collect_only)

    print(f"[test-runner] project={PROJECT_ROOT}")
    print(f"[test-runner] -g mapped: {args.grep!r} -> {mapped!r}")
    print(f"[test-runner] out={run_dir}")
    print(f"[test-runner] fix={'ON (default)' if want_fix else 'OFF (--no-fix/--collect-only)'}")
    print(f"[test-runner] cmd={command_str}")

    yarn_exit = 0
    with suite_log.open("w", encoding="utf-8") as log_fp:
        log_fp.write(f"run_id={run_id}\n")
        log_fp.write(f"user_grep={args.grep}\nmapped_grep={mapped}\n")
        if not args.no_bddgen:
            yarn_exit = _run(_yarn_cmd() + ["bddgen"], PROJECT_ROOT, log_fp)
            if yarn_exit != 0:
                print(f"[test-runner] bddgen exit {yarn_exit}", file=sys.stderr)
        yarn_exit = _run(test_cmd, PROJECT_ROOT, log_fp)

    log_text = suite_log.read_text(encoding="utf-8", errors="replace")
    parsed = parse_suite_log(log_text, PROJECT_ROOT)
    classified = classify_all(parsed["failures"], taxonomy, behavior)

    payload = {
        "run_id": run_id,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "suite_tag": mapped,
        "suite_grep": mapped,
        "user_grep": args.grep,
        "command": command_str,
        "yarn_exit_code": yarn_exit,
        "passed": parsed["passed"],
        "failed": parsed["failed"],
        "skipped": parsed["skipped"],
        "failures": classified,
    }

    write_failures_json(run_dir / "failures.json", payload)
    write_results_md(run_dir / "results.md", payload)

    latest = GENERATED / "latest"
    try:
        if latest.exists() or latest.is_symlink():
            if latest.is_dir() and not latest.is_symlink():
                shutil.rmtree(latest)
            else:
                latest.unlink()
        (GENERATED / "LATEST_RUN.txt").write_text(str(run_dir), encoding="utf-8")
    except OSError:
        (GENERATED / "LATEST_RUN.txt").write_text(str(run_dir), encoding="utf-8")

    # Teardown: keep only newest KEEP_RUNS timestamped run dirs
    if not args.out:
        _prune_old_runs(GENERATED, KEEP_RUNS)

    print(f"[test-runner] wrote {run_dir / 'failures.json'}")
    print(f"[test-runner] wrote {run_dir / 'results.md'}")
    print(f"[test-runner] behavior={SHARED_BEHAVIOR}")
    print(
        f"[test-runner] summary passed={payload['passed']} failed={payload['failed']} "
        f"classified={len(classified)} yarn_exit={yarn_exit}"
    )

    if payload["failed"] > 0 and not classified:
        print(
            "[test-runner] WARN: summary reports failures but classified=0 — "
            "parser missed line-reporter headers; check suite.log / parse_results.py",
            file=sys.stderr,
        )

    # Internal loop: no failures → GREEN (skip OpenCode). Else fix (default on).
    if payload["failed"] == 0 and not classified:
        print("[test-runner] GREEN — no failures; skip OpenCode fix loop")
        return 0 if yarn_exit == 0 else yarn_exit

    if want_fix:
        if not classified and payload["failed"] > 0:
            print(
                "[test-runner] skip OpenCode fix: empty classified list "
                "(nothing to hand off). Fix parser then re-run or reclassify.",
                file=sys.stderr,
            )
            return 1
        print(
            f"[test-runner] FIX — {len(classified)} classified failure(s); "
            "spawning OpenCode (max 3 attempts/tag → escalate)"
        )
        oc_exit = _invoke_opencode(run_dir, mapped)
        return 0 if yarn_exit == 0 and oc_exit == 0 else 1

    print(
        "[test-runner] collect-only complete. OpenCode NOT invoked "
        "(fix is off via --no-fix/--collect-only; handoff in results.md)."
    )
    return 0 if yarn_exit == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
