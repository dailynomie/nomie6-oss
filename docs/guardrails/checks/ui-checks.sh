#!/usr/bin/env bash
# UI guardrail checks for the iOS look and feel.
# The rules are in docs/guardrails/ui-design.md (each check names its rule ID).
#
# Usage (from anywhere):
#   bash docs/guardrails/checks/ui-checks.sh          check files changed on this branch and in the working tree
#   bash docs/guardrails/checks/ui-checks.sh --all    check every source file (shows legacy violations too)
#
# Exit code 1 when a MUST rule fails in the checked files. SHOULD rules only warn.
set -u

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT" || exit 1

EXCLUDE='(vendor/|n-icons/|\.spec\.ts$|\.test\.ts$)'

if [ "${1:-}" = "--all" ]; then
  LIST=$(find src -type f \( -name '*.svelte' -o -name '*.ts' -o -name '*.css' \) | grep -vE "$EXCLUDE")
else
  LIST=$( { git diff --name-only master...HEAD 2>/dev/null; git diff --name-only; git ls-files --others --exclude-standard; } \
    | sort -u | grep -E '^src/.*\.(svelte|ts|css)$' | grep -vE "$EXCLUDE")
fi
FILES=()
while IFS= read -r f; do
  [ -n "$f" ] && [ -f "$f" ] && FILES+=("$f")
done <<< "$LIST"

MUST_FAILS=0
MUST_HITS=0
SHOULD_HITS=0

# check <rule-id> <MUST|SHOULD> <file glob: svelte|code|css> <description> <perl regex>
check() {
  local id="$1" level="$2" scope="$3" desc="$4" re="$5"
  local targets=()
  for f in "${FILES[@]}"; do
    case "$scope" in
      svelte) [[ "$f" == *.svelte ]] && targets+=("$f") ;;
      code)   [[ "$f" == *.svelte || "$f" == *.ts ]] && targets+=("$f") ;;
      css)    [[ "$f" == *.css ]] && targets+=("$f") ;;
      all)    targets+=("$f") ;;
    esac
  done
  [ ${#targets[@]} -eq 0 ] && return
  local out
  # line numbers restart per file; a line marked guardrail-ok is a documented exception
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

echo "UI guardrails: ${#FILES[@]} file(s) checked ($([ "${1:-}" = "--all" ] && echo "all source" || echo "changed on this branch"))"
echo

# UI-01 arbitrary Tailwind values do not work (Tailwind 2.2, no JIT)
check UI-01 MUST code "arbitrary Tailwind value such as bg-[#fff] or rounded-[18px]" '[\s"'\''][a-z0-9:-]+-\[[^\]]+\]'

# UI-02 browser-native controls are replaced by app-native components
# only the native elements: <Input type="date"> is the app's component, which draws the iOS date field
check UI-02 MUST svelte "native select, date, time, range or colour input" '^(?!\s*(<!--|/\*|//)).*(<select[\s>]|<input\b[^>]*\btype=["'\''"]?(date|time|datetime-local|range|color)\b)'

# UI-03 user messages use the app dialogs, never the browser's
check UI-03 MUST code "browser alert, confirm or prompt (use Interact.alert, confirm, prompt)" '^(?!\s*\*)(?!\s*//).*((^|[^.\w$])(alert|confirm|prompt)\((?!\s*\w+\s*:)|window\.(alert|confirm|prompt)\()'

# UI-04 colours come from tokens: no Tailwind palette classes, no white or black surfaces
check UI-04 MUST code "Tailwind palette colour class (use an ios-* token class)" '\b(bg|text|border|ring|from|to|via|fill|stroke|placeholder)-(gray|red|green|blue|yellow|amber|orange|purple|pink|indigo|teal|primary|black|white)(-\d{2,3})?\b'

# UI-05 a click handler is only on a real button or link
check UI-05 MUST svelte "click handler on a div or span (use a button)" '<(div|span)\b[^>]*(\bon:click\b|\bonclick=)'

# UI-06 icon-only buttons need an accessible name
check UI-06 SHOULD svelte "icon-only button without aria-label (single line check)" '<button(?![^>]*aria-label)[^>]*>\s*<IonIcon'

# UI-07 no hard-coded colours in component styles (use the tokens)
check UI-07 SHOULD svelte "hard-coded hex colour in a component style (use a --ios-* token)" '\b(color|background|background-color|border|border-color|fill|stroke)\s*:\s*#[0-9a-fA-F]{3,8}\b'

# UI-08 dark mode needs no dark: variants once the tokens are used
check UI-08 SHOULD code "dark: variant (tokens switch on html.dark, so no variant is needed)" '\bdark:(?=[a-z])'

# UI-09 no pinch zoom: the viewport keeps maximum-scale=1
if grep -q 'maximum-scale=1' index.html; then
  echo "[UI-09 MUST] pinch zoom off: index.html keeps maximum-scale=1 (pass)"
else
  echo "[UI-09 MUST] pinch zoom off: index.html viewport no longer has maximum-scale=1 (FAIL)"
  MUST_FAILS=1
fi

# UI-10 the token set is in place
if grep -q -- '--ios-tint:' src/style/main.css && grep -q "tint: 'var(--ios-tint)'" tailwind.config.js; then
  echo "[UI-10 MUST] tokens: --ios-tint defined in main.css and mapped in tailwind.config.js (pass)"
else
  echo "[UI-10 MUST] tokens: --ios-tint missing from main.css or tailwind.config.js (FAIL)"
  MUST_FAILS=1
fi

# UI-11 SHOULD: a file that gates an entry with a Full-mode feature shows the crown (FeatureBadge)
# The Full-mode features are read from STARTER_HIDDEN in experience.ts, so a profile change is checked too.
STARTER_IDS=$(perl -0ne 'print "$1\n" while /STARTER_HIDDEN[^=]*=\s*\[(.*?)\]/sg' src/domains/preferences/experience.ts | grep -o "'[a-z-]*'" | tr -d "'")
# Each {#if ... FeatureVisible('id') ...} block is checked on its own: the block must hold a FeatureBadge for that id.
for f in "${FILES[@]}"; do
  [[ "$f" == *.svelte ]] || continue
  [ -f "$f" ] || continue
  while IFS= read -r hit; do
    [ -n "$hit" ] || continue
    echo "[UI-11 SHOULD] $hit"
    SHOULD_HITS=$((SHOULD_HITS + 1))
  done < <(python3 - "$f" "$STARTER_IDS" <<'PY'
import re, sys
path, ids = sys.argv[1], sys.argv[2].split()
s = open(path, encoding='utf8').read()
for fid in ids:
    gate = re.compile(r"\{#if[^}]*FeatureVisible\('" + re.escape(fid) + r"'\)[^}]*\}")
    for m in gate.finditer(s):
        # walk to the {/if} that closes this block, counting nested {#if} blocks
        depth, pos = 1, m.end()
        token = re.compile(r"\{#if\b|\{/if\}")
        end = len(s)
        for t in token.finditer(s, pos):
            depth += 1 if t.group(0).startswith('{#if') else -1
            if depth == 0:
                end = t.start()
                break
        block = s[m.end():end]
        # a block whose crown is drawn by another component says so, with a reason, inside the block
        if 'guardrail-ok: UI-11' in block:
            continue
        # one crown per entry: each ListItem in the block needs its own FeatureBadge for this id
        entries = len(re.findall(r"<ListItem\b", block))
        crowns = len(re.findall(r"<FeatureBadge[^>]*\b(?:feature|widgetType)=[\"']" + re.escape(fid) + r"[\"']", block, re.S))
        if crowns < max(entries, 1):
            line = s.count('\n', 0, m.start()) + 1
            print(f"full-mode feature '{fid}' is gated at {path}:{line}: {crowns} crown(s) for {entries} entr(y/ies) in that block")
PY
)
done

# UI-13 MUST: a px font size goes through the text size setting (calc(Npx * var(--text-scale)))
check UI-13 MUST all "bare px font size (wrap it: calc(Npx * var(--text-scale)))" 'font-size\s*:\s*(?!calc\()\d+(\.\d+)?px'

# UI-12 MUST: the icon squares of one list (one file) are shades of one hue, within 30 degrees
for f in "${FILES[@]}"; do
  [[ "$f" == *.svelte ]] || continue
  if ! python3 - "$f" <<'PY'
import colorsys, re, sys
s = open(sys.argv[1], encoding='utf8').read()
hexes = re.findall(r'IconSquare color="#([0-9A-Fa-f]{6})"', s)
hues = []
for h in hexes:
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hh, light, sat = colorsys.rgb_to_hls(r, g, b)
    if sat > 0.2 and 0.05 < light < 0.95:
        hues.append(hh * 360)
sys.exit(1 if hues and max(hues) - min(hues) > 30 else 0)
PY
  then
    echo "[UI-12 MUST] icon squares in this list are not one hue (more than 30 degrees apart): $f"
    MUST_HITS=$((MUST_HITS + 1)); MUST_FAILS=1
  fi
done

echo
echo "MUST violations: $MUST_HITS   SHOULD warnings: $SHOULD_HITS"
if [ $MUST_FAILS -ne 0 ]; then
  echo "Result: FAIL (fix the MUST items above, or record an exception in ui-design.md)"
  exit 1
fi
echo "Result: pass"
exit 0
