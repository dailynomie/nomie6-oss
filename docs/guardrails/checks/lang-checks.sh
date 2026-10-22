#!/usr/bin/env bash
# Language guardrail checks (LANG-). Rules in docs/guardrails/language.md.
#   bash docs/guardrails/checks/lang-checks.sh          files changed in the working tree (the rule applies as files are touched)
#   bash docs/guardrails/checks/lang-checks.sh --all    every source file (the full baseline)
set -u
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT" || exit 1
EXCLUDE='(vendor/|n-icons/|/lang/|\.spec\.ts$|\.test\.ts$)'
if [ "${1:-}" = "--all" ]; then
  LIST=$(find src -type f \( -name '*.svelte' -o -name '*.ts' \) | grep -vE "$EXCLUDE")
else
  # the working tree only: a file is brought up to the rule when it is touched
  LIST=$( { git diff --name-only; git ls-files --others --exclude-standard; } | sort -u | grep -E '^src/.*\.(svelte|ts)$' | grep -vE "$EXCLUDE")
fi
MUST_FAILS=0; HITS=0
# LANG-02 every key the code asks for exists in the base language file
node -e "
const ts=require('typescript'),fs=require('fs');
const src=fs.readFileSync('src/lang/base.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const m={exports:{}};new Function('module','exports',js)(m,m.exports);
const keys=new Set();const walk=(o,p)=>{for(const k of Object.keys(o)){const v=o[k];const q=p?p+'.'+k:k;if(v&&typeof v==='object')walk(v,q);else keys.add(q)}};
walk((m.exports.default||m.exports).translation,'');
fs.writeFileSync('/tmp/lang-keys.json',JSON.stringify([...keys]));" 2>/dev/null
MISSING=$(python3 - <<'PY' $LIST
import json,re,sys
keys=set(json.load(open('/tmp/lang-keys.json')))
out=[]
for f in sys.argv[1:]:
    try: s=open(f,encoding='utf8').read()
    except Exception: continue
    for m in re.finditer(r"Lang\.t\(\s*['\"]([a-z0-9_.-]+)['\"]", s):
        if m.group(1) not in keys and not m.group(1).startswith('theme.'):
            line=s.count('\n',0,m.start())+1
            out.append(f"{f}:{line}: {m.group(1)}")
print("\n".join(out))
PY
)
if [ -n "$MISSING" ]; then
  n=$(printf '%s\n' "$MISSING" | wc -l | tr -d ' ')
  echo "[LANG-02 MUST] Lang.t key is not in src/lang/base.ts ($n)"; printf '%s\n' "$MISSING" | sed 's/^/    /' | head -n 25
  MUST_FAILS=1; HITS=$((HITS+n))
else
  echo "[LANG-02 MUST] every Lang.t key used exists in the base file (pass)"
fi
# LANG-01 visible text in templates is wrapped
SVELTE=$(printf '%s\n' $LIST | grep '\.svelte$' || true)
TEXT=""
if [ -n "$SVELTE" ]; then
  TEXT=$(python3 docs/guardrails/checks/lang-text-scan.py src detail $SVELTE 2>/dev/null | grep -v "^files with" || true)
fi
if [ -n "$TEXT" ]; then
  n=$(printf '%s\n' "$TEXT" | wc -l | tr -d ' ')
  echo "[LANG-01 MUST] visible text not wrapped in Lang.t ($n)"; printf '%s\n' "$TEXT" | sed 's/^/    /' | head -n 25
  MUST_FAILS=1; HITS=$((HITS+n))
else
  echo "[LANG-01 MUST] visible text in changed templates is wrapped (pass)"
fi
# LANG-03 toast and dialog messages are wrapped
MSG=""
if [ -n "$LIST" ]; then
MSG=$(grep -nE "showToast\(\{ *message: *['\"\`][^'\"\`{]*[A-Za-z]|Interact\.(alert|confirm|prompt|error|success)\(\s*['\"\`][^'\"\`]*[A-Za-z]" $(printf '%s\n' $LIST) 2>/dev/null | grep -v "Lang\.t" || true)
fi
if [ -n "$MSG" ]; then
  n=$(printf '%s\n' "$MSG" | wc -l | tr -d ' ')
  echo "[LANG-03 MUST] toast or dialog text not wrapped in Lang.t ($n)"; printf '%s\n' "$MSG" | sed 's/^/    /' | head -n 25
  MUST_FAILS=1; HITS=$((HITS+n))
else
  echo "[LANG-03 MUST] toast and dialog text in changed files is wrapped (pass)"
fi
# LANG-09 a file that calls Lang.t imports Lang (a missing import compiles, then fails when the text is shown)
NOIMPORT=""
for f in $(printf '%s\n' $LIST); do
  [ -f "$f" ] || continue
  if grep -qE "^[^/]*Lang\.t\(" "$f" && ! grep -qE "import[^;]*\bLang\b[^;]*from" "$f"; then NOIMPORT="$NOIMPORT$f\n"; fi
done
if [ -n "$NOIMPORT" ]; then
  n=$(printf "$NOIMPORT" | grep -c .)
  echo "[LANG-09 MUST] file calls Lang.t without importing Lang ($n)"; printf "$NOIMPORT" | sed 's/^/    /' | head -n 25
  MUST_FAILS=1; HITS=$((HITS+n))
else
  echo "[LANG-09 MUST] every file that calls Lang.t imports Lang (pass)"
fi
echo; echo "LANG violations: $HITS"
if [ $MUST_FAILS -ne 0 ]; then echo "Result: FAIL"; exit 1; fi
echo "Result: pass"; exit 0
