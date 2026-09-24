"""Parse Playwright line-reporter output + optional test-results error-context."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

# Line reporter (retries=0) prints numbered failure blocks, not ✘ rows:
#   1) [chromium] › path.spec.ts:10:7 › Suite › T001 — title @mod @sanity @TEST-001
# Older / other reporters may still use ✘ / ×.
_ANSI = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
_FAIL_NUMBERED = re.compile(r"^\s*(\d+)\)\s+(.+)$")
_FAIL_MARK = re.compile(
    r"(?:✘|×)\s+\d+\s+(.+)$",
)
_TAG = re.compile(r"@([\w.-]+)")
_ERROR_SNIP = re.compile(
    r"(?:Error:|TimeoutError:|expect\().{0,400}",
    re.MULTILINE,
)

# Suite / meta tags — never treat as the scenario id
_SKIP_TAGS = frozenset(
    {
        "smoke",
        "sanity",
        "e2e",
        "regression-test",
        "icm",
        "chromium",
        "positive",
        "negative",
        "create",
        "upload",
        "local-only",
        "slack-reporter-sample",
    }
)


def _strip_ansi(text: str) -> str:
    return _ANSI.sub("", text)


def _pick_tag(line: str) -> str | None:
    """Prefer @TEST-* / scenario ids over module meta-tags."""
    tags = [f"@{m.group(1)}" for m in _TAG.finditer(line)]
    if not tags:
        return None
    for t in tags:
        if t.upper().startswith("@TEST-") or "-TEST-" in t.upper():
            return t
    for t in tags:
        if t.lstrip("@").lower() not in _SKIP_TAGS:
            return t
    return None


def _scenario_from_title(line: str) -> str:
    # Split on › or > (encoding-safe)
    parts = re.split(r"\s*[›>]\s*", line)
    if len(parts) >= 2:
        return parts[-1].strip()[:200]
    return line.strip()[:200]


def _find_error_contexts(test_results: Path, limit: int = 40) -> list[Path]:
    if not test_results.is_dir():
        return []
    found: list[Path] = []
    for p in test_results.rglob("error-context.md"):
        found.append(p)
        if len(found) >= limit:
            break
    return found


def _parse_failure_headers(clean: str) -> list[dict[str, Any]]:
    """Collect unique failures from numbered / mark lines."""
    failures: list[dict[str, Any]] = []
    seen: set[str] = set()

    for raw in clean.splitlines():
        line = raw.rstrip()
        body = None
        m_num = _FAIL_NUMBERED.match(line)
        if m_num:
            body = m_num.group(2)
        else:
            m_mark = _FAIL_MARK.match(line)
            if m_mark:
                body = m_mark.group(1)
        if not body:
            continue

        tag = _pick_tag(body)
        if not tag:
            # Fall back to feature path stem so we still classify something
            path_m = re.search(r"features[/\\]([^\s:]+)", body)
            tag = f"@path-{path_m.group(1)}" if path_m else f"@fail-{len(failures)+1}"

        if tag in seen:
            continue
        seen.add(tag)

        feature = ""
        path_m = re.search(r"(\.features-gen[/\\]features[/\\][^\s:]+)", body)
        if path_m:
            feature = path_m.group(1).replace("\\", "/")

        failures.append(
            {
                "tag": tag,
                "scenario": _scenario_from_title(body),
                "feature": feature,
                "error_class": "",
                "error_snippet": "",
                "error_context_path": "",
            }
        )
    return failures


def _attach_error_snippets(clean: str, failures: list[dict[str, Any]]) -> None:
    """Map Error:/TimeoutError: blocks onto failures in order (best-effort)."""
    # Split on numbered headers to scope snippets per failure
    blocks = re.split(r"(?m)^\s*\d+\)\s+", clean)
    # blocks[0] = preamble; blocks[1..] align with numbered failures in log order
    numbered_snips: list[str] = []
    for block in blocks[1:]:
        m = _ERROR_SNIP.search(block)
        if m:
            numbered_snips.append(m.group(0)[:500].replace("\n", " "))
        else:
            numbered_snips.append("")

    if numbered_snips and len(numbered_snips) >= len(failures):
        # Re-walk headers to align tag order with block order
        header_tags: list[str] = []
        for raw in clean.splitlines():
            m_num = _FAIL_NUMBERED.match(raw.rstrip())
            if not m_num:
                continue
            tag = _pick_tag(m_num.group(2))
            if tag and (not header_tags or header_tags[-1] != tag):
                header_tags.append(tag)
        by_tag = {f["tag"]: f for f in failures}
        for i, tag in enumerate(header_tags):
            if i >= len(numbered_snips) or tag not in by_tag:
                continue
            snip = numbered_snips[i]
            if not snip:
                continue
            fail = by_tag[tag]
            fail["error_snippet"] = snip
            if "Timeout" in snip:
                fail["error_class"] = "TimeoutError"
            elif "expect(" in snip:
                fail["error_class"] = "AssertionError"
            else:
                fail["error_class"] = "Error"
        return

    # Fallback: global list order
    errors = _ERROR_SNIP.findall(clean)
    for i, fail in enumerate(failures):
        if i < len(errors):
            fail["error_snippet"] = errors[i][:500].replace("\n", " ")
            if "Timeout" in fail["error_snippet"]:
                fail["error_class"] = "TimeoutError"
            elif "expect(" in fail["error_snippet"]:
                fail["error_class"] = "AssertionError"
            else:
                fail["error_class"] = "Error"


def parse_suite_log(log_text: str, project_root: Path) -> dict[str, Any]:
    """Extract failure tags, snippets, and summary counts from suite.log."""
    clean = _strip_ansi(log_text)
    failures = _parse_failure_headers(clean)
    _attach_error_snippets(clean, failures)

    passed = failed = skipped = 0
    tail = "\n".join(clean.splitlines()[-80:])
    m_fail = re.search(r"(\d+)\s+failed", tail, re.I)
    m_pass = re.search(r"(\d+)\s+passed", tail, re.I)
    m_skip = re.search(r"(\d+)\s+skipped", tail, re.I)
    if m_fail:
        failed = int(m_fail.group(1))
    if m_pass:
        passed = int(m_pass.group(1))
    if m_skip:
        skipped = int(m_skip.group(1))

    if failures and failed == 0:
        failed = len(failures)

    contexts = _find_error_contexts(project_root / "test-results")
    for fail in failures:
        tag_key = (fail.get("tag") or "").lstrip("@").lower()
        if not tag_key:
            continue
        compact = tag_key.replace("-", "").replace("_", "")
        for ctx in contexts:
            path_l = str(ctx).lower().replace("\\", "/")
            if tag_key in path_l or compact[:12] in path_l.replace("-", "").replace("_", ""):
                try:
                    fail["error_context_path"] = str(
                        ctx.relative_to(project_root)
                    ).replace("\\", "/")
                except ValueError:
                    fail["error_context_path"] = str(ctx)
                break

    return {
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
        "failures": failures,
    }
