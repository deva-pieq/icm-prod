#!/usr/bin/env python3
"""Deprecated path — forwards to project-root test-runner.py."""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
_ENTRY = _ROOT / "test-runner.py"

if not _ENTRY.is_file():
    sys.stderr.write(f"[test-runner] missing {_ENTRY}\n")
    raise SystemExit(1)

print(
    "[test-runner] note: prefer `python test-runner.py` from projects/icm "
    "(this scripts/ path still works).",
    file=sys.stderr,
)
sys.argv[0] = str(_ENTRY)
runpy.run_path(str(_ENTRY), run_name="__main__")
