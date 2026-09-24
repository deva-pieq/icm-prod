"""Classify failures into Tier 1/2/3 + disposition using taxonomy + app_behavior."""

from __future__ import annotations

import re
from typing import Any


def _match_signals(
    text: str, signals: list[dict[str, Any]]
) -> dict[str, Any] | None:
    for sig in signals:
        pat = sig.get("pattern") or ""
        try:
            if re.search(pat, text, re.IGNORECASE | re.DOTALL):
                return sig
        except re.error:
            if pat.lower() in text.lower():
                return sig
    return None


def _behavior_short_circuit(
    tag: str, snippet: str, behavior: dict[str, Any]
) -> dict[str, Any] | None:
    """If failure matches a high-confidence app_bug fact, escalate immediately."""
    blob = f"{tag} {snippet}".lower()
    modules = behavior.get("modules") or {}
    for module, facts in modules.items():
        if module.replace("-", " ") in blob or module in blob:
            for fact in facts:
                if fact.get("confidence") != "high":
                    continue
                fact_id = (fact.get("id") or "").lower()
                fact_text = (fact.get("fact") or "").lower()
                impl = (fact.get("implication") or "").lower()
                # Keyword hits from known escalations
                keys = [
                    "cors",
                    "app_bug",
                    "exception count",
                    "deselect-all",
                    "not red",
                    "black",
                ]
                hay = f"{fact_id} {fact_text} {impl}"
                if any(k in blob and k in hay for k in ("cors",)):
                    return {
                        "tier": 3,
                        "pattern": None,
                        "disposition": "app_bug",
                        "confidence": "high",
                        "fix_hint": fact.get("implication")
                        or "Escalate — known app behavior",
                        "behavior_id": fact.get("id"),
                    }
                if "cors" in blob and "cors" in hay:
                    return {
                        "tier": 3,
                        "pattern": None,
                        "disposition": "app_bug",
                        "confidence": "high",
                        "fix_hint": fact.get("implication"),
                        "behavior_id": fact.get("id"),
                    }
                if "exception" in blob and "not-red" in fact_id.replace("_", "-"):
                    return {
                        "tier": 3,
                        "pattern": None,
                        "disposition": "app_bug",
                        "confidence": "high",
                        "fix_hint": fact.get("implication"),
                        "behavior_id": fact.get("id"),
                    }
    # Global CORS
    if re.search(r"\bCORS\b|Access-Control", snippet, re.I):
        return {
            "tier": 3,
            "pattern": None,
            "disposition": "app_bug",
            "confidence": "high",
            "fix_hint": "Network/CORS — escalate; do not weaken assert",
            "behavior_id": None,
        }
    return None


def classify_failure(
    failure: dict[str, Any],
    taxonomy: dict[str, Any],
    behavior: dict[str, Any] | None = None,
) -> dict[str, Any]:
    text = " ".join(
        [
            failure.get("tag") or "",
            failure.get("scenario") or "",
            failure.get("error_class") or "",
            failure.get("error_snippet") or "",
        ]
    )

    out = dict(failure)
    out.setdefault("attempts", 0)
    out.setdefault("evidence", [])
    out.setdefault("files_touched", [])
    out.setdefault("next_step", "")

    if behavior:
        hit = _behavior_short_circuit(
            failure.get("tag") or "",
            text,
            behavior,
        )
        if hit:
            out.update(hit)
            out["next_step"] = hit.get("fix_hint") or "Escalate to human"
            return out

    for key in ("tier3_signals", "tier1_signals", "tier2_signals"):
        sig = _match_signals(text, taxonomy.get(key) or [])
        if sig:
            out["tier"] = int(sig.get("tier") or 2)
            out["pattern"] = sig.get("letter")
            out["disposition"] = sig.get("disposition") or "unknown"
            out["confidence"] = "medium"
            out["fix_hint"] = sig.get("fix_hint") or ""
            out["signal_id"] = sig.get("id")
            if out["disposition"] in ("app_bug", "data_env", "intentional_skip", "infra_flake"):
                out["next_step"] = out["fix_hint"] or "Escalate"
            elif out["tier"] == 1:
                out["next_step"] = "Inline Tier-1 fix, then verify once"
            else:
                out["next_step"] = "OpenCode regression-fixer + MCP"
            return out

    # Default: Tier 2 unknown — needs MCP
    out["tier"] = 2
    out["pattern"] = None
    out["disposition"] = "unknown"
    out["confidence"] = "low"
    out["fix_hint"] = "MCP investigate before edit"
    out["next_step"] = "OpenCode regression-fixer; escalate if unproven"
    out["signal_id"] = None
    return out


def classify_all(
    failures: list[dict[str, Any]],
    taxonomy: dict[str, Any],
    behavior: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    return [classify_failure(f, taxonomy, behavior) for f in failures]
