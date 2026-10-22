#!/usr/bin/env bash
# Code guardrail checks: storage, domain, component and architecture rules.
# The rules are in docs/guardrails/{storage,domain,components,architecture}.md (each check names its rule ID).
#
# Usage (from anywhere):
#   bash docs/guardrails/checks/code-checks.sh          check files changed on this branch and in the working tree
#   bash docs/guardrails/checks/code-checks.sh --all    check every source file (shows legacy violations too)
#
# Exit code 1 when a MUST rule fails in the checked files. SHOULD rules only warn.
set -u

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT" || exit 1

EXCLUDE='(vendor/|n-icons/|\.spec\.ts$|\.test\.ts$)'

if [ "${1:-}" = "--all" ]; then
  LIST=$(find src -type f \( -name '*.svelte' -o -name '*.ts' \) | grep -vE "$EXCLUDE")
else
  LIST=$( { git diff --name-only master...HEAD 2>/dev/null; git diff --name-only; git ls-files --others --exclude-standard; } \
    | sort -u | grep -E '^src/.*\.(svelte|ts)$' | grep -vE "$EXCLUDE")
fi
FILES=()
while IFS= read -r f; do
  [ -n "$f" ] && [ -f "$f" ] && FILES+=("$f")
done <<< "$LIST"

MUST_FAILS=0
MUST_HITS=0
SHOULD_HITS=0

# check <rule-id> <MUST|SHOULD> <scope> <description> <perl regex>
#   scope: svelte = .svelte files; ts = .ts files; code = both
#   a line marked guardrail-ok is a documented exception and is skipped
check() {
  local id="$1" level="$2" scope="$3" desc="$4" re="$5"
  local targets=()
  for f in "${FILES[@]}"; do
    case "$scope" in
      svelte) [[ "$f" == *.svelte ]] && targets+=("$f") ;;
      ts)     [[ "$f" == *.ts ]] && targets+=("$f") ;;
      code)   targets+=("$f") ;;
    esac
  done
  [ ${#targets[@]} -eq 0 ] && return
  local out
  out=$(RULE_RE="$re" perl -ne 'BEGIN { $re = $ENV{RULE_RE} } print "$ARGV:$.: $_" if /$re/ && !/guardrail-ok/; close ARGV if eof' "${targets[@]}" 2>/dev/null)
  [ -z "$out" ] && return
  local count
  count=$(printf '%s\n' "$out" | wc -l | tr -d ' ')
  echo "[$id $level] $desc ($count)"
  printf '%s\n' "$out" | sed 's/^/    /' | head -n 25
  if [ "$level" = "MUST" ]; then
    MUST_HITS=$((MUST_HITS + count)); MUST_FAILS=1
  else
    SHOULD_HITS=$((SHOULD_HITS + count))
  fi
}

echo "Code guardrails: ${#FILES[@]} file(s) checked ($([ "${1:-}" = "--all" ] && echo "all source" || echo "changed on this branch"))"
echo

# STO-01 persistence goes through the storage facade and the stores; components and widgets never call it
check STO-01 MUST svelte "Storage call in a component (persist through a store instead)" '\bStorage\.(put|get|getStrict|list|delete|putBinary)\('

# STO-02 file names come from paths.ts (NPaths), not from string literals in a store
check STO-02 MUST ts "literal file name in a Storage call (use NPaths.storage.*)" '\bStorage\.(put|get|getStrict|delete)\(\s*[\x27"`][^\x27"`]*\.json[\x27"`]'

# STO-04 engine writes are awaited, so a failure reaches the caller's catch
check STO-04 MUST ts "engine write returned without await inside try (a rejection skips the catch)" '^\s*return this\.db\.put\('

# STO-06 device settings use SideStore or LSStore, not raw localStorage (SHOULD)
check STO-06 SHOULD code "raw localStorage use (use SideStore for device settings)" '\blocalStorage\.'

# CMP-01 every Svelte file uses runes; no legacy props or reactive statements
NO_RUNES=()
for f in "${FILES[@]}"; do
  [[ "$f" == *.svelte ]] && ! grep -q 'runes={true}' "$f" && NO_RUNES+=("$f")
done
if [ ${#NO_RUNES[@]} -gt 0 ]; then
  echo "[CMP-01 MUST] Svelte file without <svelte:options runes={true} /> (${#NO_RUNES[@]})"
  printf '%s\n' "${NO_RUNES[@]}" | sed 's/^/    /' | head -n 25
  MUST_HITS=$((MUST_HITS + ${#NO_RUNES[@]})); MUST_FAILS=1
fi
check CMP-02 MUST svelte "legacy export let or \$: reactive statement (use \$props and \$derived)" '^\s*export let |^\s*\$:'

# CMP-08 components do not import from domains (pure helpers are a documented exception)
check CMP-08 MUST svelte "component imports from domains/ (move the data to props, or add guardrail-ok)" "^\\s*import .* from ['\"](\\.\\./)+domains/"

# ARC-01 domains never import routes; routes depend on domains, not the reverse
check ARC-01 MUST code "domain imports from routes/" "from ['\"](\\.\\./)+routes/"

# ARC-04 a store is not read from storage at import time (the boot order owns initialisation)
check ARC-04 MUST ts "store reads storage at import time (initialise in BootStore or the owning route)" '^(const|export const) \w+ = (await )?Storage\.(get|getStrict)\('

# ARC-06 the Svelte version stays pinned exactly
if grep -q '"svelte": "5.22.0"' package.json; then
  echo "[ARC-06 MUST] svelte pinned at 5.22.0 (pass)"
else
  echo "[ARC-06 MUST] svelte is not pinned at exactly 5.22.0 in package.json (FAIL)"
  MUST_FAILS=1
fi

# ARC-18 logging: console.log is not left in code (warn, error and info are allowed)
check ARC-18 SHOULD code "console.log left in code (use console.warn, error or info)" '\bconsole\.log\('

echo
echo "MUST violations: $MUST_HITS   SHOULD warnings: $SHOULD_HITS"
if [ $MUST_FAILS -ne 0 ]; then
  echo "Result: FAIL (fix the MUST items above, or record an exception in the rule's document)"
  exit 1
fi
echo "Result: pass"
exit 0
