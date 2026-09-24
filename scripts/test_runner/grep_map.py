"""Map friendly -g aliases to Playwright grep expressions."""

from __future__ import annotations

import re
from typing import Any

# Bare scenario id → smoke PROD tag, e.g. T001-SMK / T001-smoke → @TEST-001-smoke-PROD
_SMOKE_ID = re.compile(
    r"^T0*(?P<n>\d+)[-_]?(?:SMK|SMOKE|smoke)$",
    re.IGNORECASE,
)
_TEST_SMOKE = re.compile(
    r"^@?TEST-0*(?P<n>\d+)[-_]?smoke$",
    re.IGNORECASE,
)


def load_aliases(taxonomy: dict[str, Any]) -> dict[str, str]:
    raw = taxonomy.get("aliases") or {}
    return {str(k).lower(): str(v) for k, v in raw.items()}


def _map_token(token: str, aliases: dict[str, str]) -> str:
    t = token.strip()
    if not t:
        return t

    # Already a regex fragment with @ or complex pattern — leave mostly alone
    lower = t.lower()
    if lower in aliases:
        return aliases[lower]

    m = _SMOKE_ID.match(t) or _TEST_SMOKE.match(t)
    if m:
        return f"@TEST-{int(m.group('n')):03d}-smoke-PROD"

    # Bare module-ish word without @ → add @
    if t[0] not in "@.^$*+?[{\\|(" and "|" not in t and ".*" not in t:
        if re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", t):
            return f"@{t}"

    return t


def map_grep(expr: str, taxonomy: dict[str, Any]) -> str:
    """
    Transform user -g input into yarn test -g argument.

    Examples:
      sanity              → @sanity-prod
      sanity|regression   → @sanity-prod|@regression-test
      T001-SMK            → @TEST-001-smoke-PROD
      @agency-dashboard   → @agency-dashboard (unchanged)
    """
    aliases = load_aliases(taxonomy)
    expr = (expr or "").strip()
    if not expr:
        return aliases.get("sanity", "@sanity-prod")

    # Split on | but keep empty parts out
    parts = [p for p in expr.split("|")]
    mapped = [_map_token(p, aliases) for p in parts]
    return "|".join(mapped)
