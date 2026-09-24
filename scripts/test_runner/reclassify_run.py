"""One-shot: reclassify an existing test-runner suite.log into failures.json + results.md."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts" / "test_runner"))

from classify import classify_all  # noqa: E402
from parse_results import parse_suite_log  # noqa: E402
from write_report import write_failures_json, write_results_md  # noqa: E402


def main() -> int:
    run_id = sys.argv[1] if len(sys.argv) > 1 else "20260908T052755Z-sanity"
    run = ROOT / ".generated" / "test-runner" / run_id
    log_path = run / "suite.log"
    if not log_path.is_file():
        print(f"missing {log_path}", file=sys.stderr)
        return 1

    taxonomy = json.loads(
        (ROOT / "scripts" / "test_runner" / "taxonomy.json").read_text(encoding="utf-8")
    )
    behavior = json.loads(
        (ROOT / "scripts" / "test_runner" / "app_behavior.json").read_text(encoding="utf-8")
    )
    parsed = parse_suite_log(
        log_path.read_text(encoding="utf-8", errors="replace"), ROOT
    )
    classified = classify_all(parsed["failures"], taxonomy, behavior)

    print(
        f"passed={parsed['passed']} failed={parsed['failed']} classified={len(classified)}"
    )
    for f in classified:
        snip = (f.get("error_snippet") or "")[:80]
        print(
            f"  {f['tag']} tier={f.get('tier')} disp={f.get('disposition')} snip={snip}"
        )

    old = json.loads((run / "failures.json").read_text(encoding="utf-8"))
    payload = {
        **old,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "passed": parsed["passed"],
        "failed": parsed["failed"],
        "skipped": parsed["skipped"],
        "failures": classified,
        "reclassified": True,
    }
    write_failures_json(run / "failures.json", payload)
    write_results_md(run / "results.md", payload)
    print(f"rewrote {run / 'failures.json'}")
    print(f"rewrote {run / 'results.md'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
