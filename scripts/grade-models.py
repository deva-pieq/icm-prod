#!/usr/bin/env python3
"""
Generate steps & pages from a .feature file using multiple models.

Each model works in its own sandbox under test-agents/<model>/.
Credentials loaded from .env. Existing project files are never touched.

Usage:
  python scripts/grade-models.py features/smoke/login.feature
  python scripts/grade-models.py features/smoke/login.feature --models deepseek-v4-flash-free big-pickle
"""

import subprocess, time, sys, os, json, re, shutil
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

PROJECT_DIR = Path(__file__).resolve().parent.parent
AGENTS_DIR  = PROJECT_DIR / "test-agents"
ENV_PATH    = PROJECT_DIR / ".env"

MODELS = [
    ("opencode/deepseek-v4-flash-free", "DeepSeek V4 Flash Free"),
    ("opencode/big-pickle",             "Big Pickle"),
    ("opencode/nemotron-3-super-free",  "Nemotron 3 Super Free"),
]


# ── .env loader (manual, mirrors loadEnv.ts) ──────────────────────────

def load_env(path: Path) -> dict:
    if not path.exists():
        print("  WARN: no .env file found at", path)
        return {}
    env = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip("\"'")
        env[key] = value
    return env


# ── agent sandbox helpers ─────────────────────────────────────────────

@dataclass
class AgentSandbox:
    model_id: str
    label: str
    root: Path       # test-agents/<model>/
    module: str
    feature_name: str

    @property
    def features_dir(self) -> Path: return self.root / "features" / self.module
    @property
    def steps_dir(self) -> Path:    return self.root / "steps" / self.module
    @property
    def pages_dir(self) -> Path:    return self.root / "pages" / self.module


def create_sandbox(model_id: str, label: str, feature_path: Path) -> AgentSandbox:
    """Create test-agents/<model>/ with feature/step/page dirs + copy of feature."""
    model_name = model_id.split("/")[-1]
    root = AGENTS_DIR / model_name

    if root.exists():
        shutil.rmtree(root)

    # Derive module from feature path: features/<module>/<file>.feature
    try:
        rel = feature_path.relative_to(PROJECT_DIR / "features")
    except ValueError:
        print(f"  ERROR: feature must be under features/ dir")
        sys.exit(1)

    module = rel.parts[0]
    feature_name = rel.name

    sandbox = AgentSandbox(model_id, label, root, module, feature_name)
    sandbox.features_dir.mkdir(parents=True, exist_ok=True)
    sandbox.steps_dir.mkdir(parents=True, exist_ok=True)
    sandbox.pages_dir.mkdir(parents=True, exist_ok=True)

    shutil.copy2(feature_path, sandbox.features_dir / feature_name)
    return sandbox


# ── generate via opencode ─────────────────────────────────────────────

def run_generation(sandbox: AgentSandbox, env: dict, timeout_s: int = 600) -> dict:
    """Invoke opencode run to generate steps + pages for the feature."""
    print(f"  Generating with {sandbox.model_id.split('/')[-1]}...", end=" ", flush=True)

    # Write prompt + feature content to a temp file, then pass via Get-Content to avoid cmd.exe length limit
    feature_content = (sandbox.features_dir / sandbox.feature_name).read_text(encoding="utf-8")
    full_prompt = (
        f"Generate step defs and page objects for this Gherkin feature.\n"
        f"- Step defs in: {sandbox.steps_dir}/\n"
        f"- Page objects in: {sandbox.pages_dir}/\n"
        f"- POM standard, data-testid locators\n"
        f"- Login: {env.get('E2E_EMAIL', '')} / from .env\n\n"
        f"FEATURE:\n{feature_content}"
    )

    # Write a PowerShell script using single-quoted here-string (literal, no $expansion)
    tmp_ps = AGENTS_DIR / "logs" / f"{sandbox.model_id.split('/')[-1]}-run.ps1"
    tmp_ps.parent.mkdir(parents=True, exist_ok=True)
    ps_content = (
        "$prompt = @'\n"
        f"{full_prompt}\n"
        "'@\n"
        f"opencode run $prompt --model {sandbox.model_id} --auto --format json\n"
    )
    tmp_ps.write_text(ps_content, encoding="utf-8")

    cmd = f'powershell -ExecutionPolicy Bypass -File "{tmp_ps}"'

    # Log prompt for debugging
    log_dir = AGENTS_DIR / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    (log_dir / f"{sandbox.model_id.split('/')[-1]}-prompt.txt").write_text(full_prompt[:2000], encoding="utf-8")

    start = time.time()
    try:
        result = subprocess.run(
            cmd,
            capture_output=True, text=True, shell=True,
            timeout=timeout_s, cwd=PROJECT_DIR
        )
        elapsed = time.time() - start

        # Check if opencode actually wrote any files (look for "write" tool calls in JSON output)
        wrote_files = '"tool":"write"' in result.stdout
        if wrote_files:
            write_count = result.stdout.count('"tool":"write"')
            print(f"done ({elapsed:.1f}s, {write_count} files written)")
        else:
            print(f"done ({elapsed:.1f}s, no files written)")

        # Save full JSON output for debugging
        (log_dir / f"{sandbox.model_id.split('/')[-1]}.json").write_text(result.stdout, encoding="utf-8")

        return {"time_s": elapsed, "ok": result.returncode == 0, "stdout": result.stdout, "stderr": result.stderr}
    except subprocess.TimeoutExpired:
        elapsed = time.time() - start
        print(f"TIMEOUT ({elapsed:.1f}s)")
        return {"time_s": elapsed, "ok": False, "stdout": "", "stderr": "TIMEOUT"}
    except Exception as e:
        elapsed = time.time() - start
        print(f"ERROR ({elapsed:.1f}s): {e}")
        return {"time_s": elapsed, "ok": False, "stdout": "", "stderr": str(e)}


# ── validation ────────────────────────────────────────────────────────

@dataclass
class ValidationResult:
    files_created: int = 0
    lines_added: int = 0
    steps_defined: int = 0
    steps_missing: int = 0
    has_common_steps: bool = False
    ts_compile_ok: Optional[bool] = None
    ts_compile_error: str = ""
    bddgen_ok: Optional[bool] = None
    bddgen_error: str = ""
    test_pass: int = 0
    test_fail: int = 0
    test_skip: int = 0


def count_generated(sandbox: AgentSandbox) -> tuple:
    features = list(sandbox.features_dir.parent.glob("**/*.feature"))
    steps    = list(sandbox.steps_dir.glob("**/*.ts"))
    pages    = list(sandbox.pages_dir.glob("**/*.ts"))
    return len(features), len(steps), len(pages)


def count_lines(sandbox: AgentSandbox) -> int:
    total = 0
    for path in [sandbox.steps_dir, sandbox.pages_dir]:
        for f in path.rglob("*.ts"):
            total += len(f.read_text(encoding="utf-8").splitlines())
    return total


def check_step_coverage(sandbox: AgentSandbox) -> tuple:
    """Parse .feature for step lines, check how many have defs in steps dir."""
    feature_text = (sandbox.features_dir / sandbox.feature_name).read_text(encoding="utf-8")
    step_keywords = r"(Given|When|Then|And|But)\s+"
    step_lines = re.findall(rf"^\s*{step_keywords}.*", feature_text, re.MULTILINE)

    # Collect step definition patterns from generated .ts files
    def_patterns = []
    for f in sandbox.steps_dir.rglob("*.ts"):
        text = f.read_text(encoding="utf-8")
        def_patterns.extend(re.findall(r"(?:Given|When|Then)\(['\"](.+?)['\"]", text))

    missing = 0
    for step_line in step_lines:
        # Strip keyword and check if any def pattern matches
        step_text = re.sub(rf"^{step_keywords}", "", step_line).strip()
        step_text_noparam = re.sub(r"\{[^}]+\}", "", step_text).strip()
        if not any(step_text in p or step_text_noparam in p for p in def_patterns):
            missing += 1

    return len(step_lines), missing


def check_common_steps(sandbox: AgentSandbox) -> bool:
    return any(f.name == "common.steps.ts" for f in sandbox.steps_dir.rglob("*.ts"))


def validate(sandbox: AgentSandbox) -> ValidationResult:
    """Run checks on generated output."""
    v = ValidationResult()
    features, steps, pages = count_generated(sandbox)
    v.files_created = steps + pages
    v.lines_added = count_lines(sandbox)
    v.steps_defined, v.steps_missing = check_step_coverage(sandbox)
    v.has_common_steps = check_common_steps(sandbox)
    return v


# ── install-to-project: copy generated files into main project ────────

def install_to_project(sandbox: AgentSandbox) -> None:
    """Copy generated steps/pages into the live project for a proper test run."""
    steps_dest = PROJECT_DIR / "steps" / sandbox.module
    pages_dest = PROJECT_DIR / "pages" / sandbox.module
    steps_dest.mkdir(parents=True, exist_ok=True)
    pages_dest.mkdir(parents=True, exist_ok=True)

    for f in sandbox.steps_dir.rglob("*.ts"):
        shutil.copy2(f, steps_dest / f.name)
    for f in sandbox.pages_dir.rglob("*.ts"):
        shutil.copy2(f, pages_dest / f.name)

    # Tag feature for @test-agent
    feat_path = PROJECT_DIR / "features" / sandbox.module / sandbox.feature_name
    if feat_path.exists():
        text = feat_path.read_text(encoding="utf-8")
        if "@test-agent" not in text:
            text = text.replace("Feature:", "@test-agent\nFeature:")
            feat_path.write_text(text, encoding="utf-8")


# ── bddgen + test runner ──────────────────────────────────────────────

def run_bddgen() -> tuple:
    print("    bddgen...", end=" ", flush=True)
    cmd = "node scripts/clean-bdd-gen.mjs && bddgen && node scripts/rename-bdd-gen-to-ts.mjs && node scripts/fix-bdd-gen-spec.mjs"
    r = subprocess.run(cmd, cwd=PROJECT_DIR, capture_output=True, text=True, shell=True, timeout=120)
    ok = r.returncode == 0
    print("OK" if ok else "FAIL")
    return ok, r.stderr[:1500] if not ok else ""


def run_tests() -> tuple:
    print("    playwright test...", end=" ", flush=True)
    cmd = "npx playwright test --grep @test-agent --reporter json"
    r = subprocess.run(cmd, cwd=PROJECT_DIR, capture_output=True, text=True, shell=True, timeout=180)
    stdout = r.stdout.strip()
    if not stdout:
        print(f"NO OUTPUT (rc={r.returncode})")
        return 0, 0, 0, r.stderr[:1000]
    try:
        data = json.loads(stdout)
        stats = data.get("stats", data) or {}
        return stats.get("expected", 0), stats.get("unexpected", 0), stats.get("skipped", 0), ""
    except json.JSONDecodeError:
        print("JSON PARSE FAIL")
        return 0, 0, 0, stdout[:1000]


def restore_project(sandbox: AgentSandbox) -> None:
    """Remove generated files from the live project and restore feature."""
    for d in ["steps", "pages"]:
        src = AGENTS_DIR / sandbox.model_id.split("/")[-1] / d / sandbox.module
        if src.exists():
            for f in src.rglob("*.ts"):
                target = PROJECT_DIR / d / sandbox.module / f.name
                if target.exists():
                    target.unlink()
    # Remove @test-agent tag from feature
    feat_path = PROJECT_DIR / "features" / sandbox.module / sandbox.feature_name
    if feat_path.exists():
        text = feat_path.read_text(encoding="utf-8")
        text = text.replace("@test-agent\n", "").replace("@test-agent ", "")
        feat_path.write_text(text, encoding="utf-8")


# ── main ──────────────────────────────────────────────────────────────

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate steps+pages from a .feature using multiple models")
    parser.add_argument("feature", help="Path to .feature file (under features/)")
    parser.add_argument("--models", "-m", nargs="+", default=[m[0] for m in MODELS],
                        help="Models to test (default: all free)")
    parser.add_argument("--validate", action="store_true", default=True,
                        help="Run bddgen + tests on generated output (default: True)")
    parser.add_argument("--no-validate", action="store_false", dest="validate")
    args = parser.parse_args()

    raw_path = Path(args.feature)
    feature_path = raw_path if raw_path.is_absolute() else (PROJECT_DIR / raw_path)
    if not feature_path.exists():
        print(f"File not found: {feature_path}")
        sys.exit(1)
    if feature_path.suffix != ".feature":
        print(f"Not a .feature file: {feature_path}")
        sys.exit(1)

    env = load_env(ENV_PATH)
    selected_models = [m for m in MODELS if m[0] in args.models]
    if not selected_models:
        print(f"No valid models. Available: {[m[0] for m in MODELS]}")
        sys.exit(1)

    # Ensure .gitignore has test-agents/
    gitignore_path = PROJECT_DIR / ".gitignore"
    gi_text = gitignore_path.read_text(encoding="utf-8") if gitignore_path.exists() else ""
    if "test-agents" not in gi_text:
        gitignore_path.write_text(gi_text.rstrip() + "\ntest-agents/\n", encoding="utf-8")
        print("  Added test-agents/ to .gitignore")

    module = feature_path.relative_to(PROJECT_DIR / "features").parts[0]

    print("\n" + "=" * 72)
    print("  MODEL TEST GENERATOR — step/page generation from .feature")
    print("=" * 72)
    print(f"\n  Feature:  {feature_path}")
    print(f"  Module:   {module}")
    print(f"  Models:   {', '.join(m[1] for m in selected_models)}")
    print()

    results = []

    for model_id, label in selected_models:
        print(f"\n{'-' * 58}")
        print(f"  [{label}]")
        print(f"{'-' * 58}")

        sandbox = create_sandbox(model_id, label, feature_path)

        # Generation
        gen = run_generation(sandbox, env)

        # Validation
        v = validate(sandbox)

        # Optional: install to project, run bddgen + tests
        bddgen_ok = None
        test_pass = test_fail = test_skip = 0
        if args.validate and v.files_created > 0:
            install_to_project(sandbox)
            bddgen_ok, bddgen_err = run_bddgen()
            if bddgen_ok:
                test_pass, test_fail, test_skip, _ = run_tests()
            restore_project(sandbox)
        elif args.validate:
            print("  Skipping bddgen/tests (no files generated).")

        results.append({
            "label": label,
            "model_id": model_id,
            "time_s": gen["time_s"],
            "files": v.files_created,
            "lines": v.lines_added,
            "steps_total": v.steps_defined,
            "steps_missing": v.steps_missing,
            "has_common": v.has_common_steps,
            "bddgen_ok": bddgen_ok,
            "test_pass": test_pass,
            "test_fail": test_fail,
            "test_skip": test_skip,
        })

    # ── Comparison Table ──
    print("\n" + "=" * 72)
    print("  RESULTS COMPARISON")
    print("=" * 72)
    h = f"{'Model':<28} {'Time':>7} {'Files':>5} {'Lines':>5} {'Steps':>5} {'Miss':>5} {'Cmn':>4} {'bddgen':>7} {'Pass':>5} {'Fail':>5}"
    print(h)
    print("-" * 72)
    for r in results:
        b = "PASS" if r["bddgen_ok"] else ("FAIL" if r["bddgen_ok"] is False else "n/a")
        cmn = "Y" if r["has_common"] else "N"
        print(f"{r['label']:<28} {r['time_s']:>6.1f}s {r['files']:>5} {r['lines']:>5} "
              f"{r['steps_total']:>5} {r['steps_missing']:>5} {cmn:>4} {b:>7} "
              f"{r['test_pass']:>5} {r['test_fail']:>5}")
    print("=" * 72)

    fastest = min(results, key=lambda r: r["time_s"])
    best = max(results, key=lambda r: r["test_pass"] if r["bddgen_ok"] else -1)

    print(f"\n  Fastest:     {fastest['label']} ({fastest['time_s']:.1f}s)")
    if best["bddgen_ok"]:
        print(f"  Best tests:  {best['label']} ({best['test_pass']} pass, {best['test_fail']} fail)")
    print(f"\n  Generated outputs in: {AGENTS_DIR}/")
    print()


if __name__ == "__main__":
    main()
