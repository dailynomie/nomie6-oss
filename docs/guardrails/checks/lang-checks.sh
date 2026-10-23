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
KEYS_JSON="$(mktemp)"; trap 'rm -f "$KEYS_JSON"' EXIT
# LANG-02 every key the code asks for exists in the base language file
node -e "
const ts=require('typescript'),fs=require('fs');
const src=fs.readFileSync('src/lang/base.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const m={exports:{}};new Function('module','exports',js)(m,m.exports);
const keys=new Set();const walk=(o,p)=>{for(const k of Object.keys(o)){const v=o[k];const q=p?p+'.'+k:k;if(v&&typeof v==='object')walk(v,q);else keys.add(q)}};
walk((m.exports.default||m.exports).translation,'');
fs.writeFileSync(process.env.KEYS_JSON,JSON.stringify([...keys]));" 2>/dev/null
MISSING=$(KEYS_JSON="$KEYS_JSON" python3 - <<'PY' $LIST
import json,re,sys
import os
keys=set(json.load(open(os.environ['KEYS_JSON'])))
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
MSG=$(grep -nE "showToast\(\{ *message: *['\"\`][^'\"\`{]*[A-Za-z]|Interact\.(alert|confirm|prompt|error|success)\(\s*['\"\`][^'\"\`]*[A-Za-z]" $(printf '%s\n' $LIST) 2>/dev/null | grep -v "Lang\.t" | python3 docs/guardrails/checks/lang-msg-filter.py || true)
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
  if grep -qE "^[^/]*Lang\.t\(" "$f" && ! python3 -c "
import re,sys
s=open(sys.argv[1],encoding='utf8').read()
blocks=re.findall(r'<script\\b[^>]*>([\\s\\S]*?)</script>', s)
if sys.argv[1].endswith('.ts'):
    blocks=[s]
ok=any(re.search(r'import\s*\{[^}]*\bLang\b[^}]*\}\s*from', b) for b in blocks)
sys.exit(0 if ok else 1)" "$f"; then NOIMPORT="$NOIMPORT$f\n"; fi
done
if [ -n "$NOIMPORT" ]; then
  n=$(printf "$NOIMPORT" | grep -c .)
  echo "[LANG-09 MUST] file calls Lang.t without importing Lang ($n)"; printf "$NOIMPORT" | sed 's/^/    /' | head -n 25
  MUST_FAILS=1; HITS=$((HITS+n))
else
  echo "[LANG-09 MUST] every file that calls Lang.t imports Lang (pass)"
fi
# LANG-11 text in script code (labels, titles, messages and ternary branches) is wrapped in Lang.t
SCRIPT_TEXT=""
SCRIPTFILES=$(printf '%s\n' $LIST | grep -E '\.(svelte|ts)$' || true)
if [ -n "$SCRIPTFILES" ]; then
  SCRIPT_TEXT=$(python3 docs/guardrails/checks/lang-script-scan.py $SCRIPTFILES 2>/dev/null | grep -v "^script text" || true)
fi
if [ -n "$SCRIPT_TEXT" ]; then
  n=$(printf '%s\n' "$SCRIPT_TEXT" | wc -l | tr -d ' ')
  echo "[LANG-11 MUST] text in script code is not wrapped in Lang.t ($n)"; printf '%s\n' "$SCRIPT_TEXT" | sed 's/^/    /' | head -n 25
  MUST_FAILS=1; HITS=$((HITS+n))
else
  echo "[LANG-11 MUST] text in script code is wrapped (pass)"
fi
# LANG-07 every language file has every base key with the same placeholders. The languages in ENFORCED must be complete; the others are reported until they are translated.
ENFORCED="nl de"
COVER=$(node -e "
const ts=require('typescript'),fs=require('fs'),path=require('path');
const load=(f)=>{const js=ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const m={exports:{}};new Function('module','exports',js)(m,m.exports);return (m.exports.default||m.exports).translation;};
const flat=(t,p,o)=>{for(const k of Object.keys(t)){const v=t[k];const q=p?p+'.'+k:k;if(v&&typeof v==='object')flat(v,q,o);else o[q]=String(v)}return o};
const ph=(s)=>[...s.matchAll(/\{\{(\w+)\}\}/g)].map(m=>m[1]).sort().join(',');
const base=flat(load('src/lang/base.ts'),'',{});
for(const f of fs.readdirSync('src/lang')){
  // en.ts is an old generated stub that nothing imports; the English language is base.ts
  if(!/\.ts$/.test(f)||['base.ts','lang.ts','en.ts'].includes(f)) continue;
  const lang=path.basename(f,'.ts');
  const t=flat(load('src/lang/'+f),'',{});
  const missing=Object.keys(base).filter(k=>!(k in t));
  const bad=Object.keys(base).filter(k=>k in t && ph(base[k])!==ph(t[k]));
  console.log(JSON.stringify({lang, total:Object.keys(base).length, missing, bad}));
}" 2>/dev/null)
LANG07_FAILS=0
while IFS= read -r line; do
  [ -n "$line" ] || continue
  lang=$(printf '%s' "$line" | python3 -c "import json,sys;print(json.load(sys.stdin)['lang'])")
  summary=$(printf '%s' "$line" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(f\"{len(d['missing'])} missing, {len(d['bad'])} placeholder mismatch, of {d['total']} keys\")")
  case " $ENFORCED " in
    *" $lang "*)
      if printf '%s' "$line" | python3 -c "import json,sys;d=json.load(sys.stdin);sys.exit(0 if not d['missing'] and not d['bad'] else 1)"; then
        echo "[LANG-07 MUST] $lang has every base key with its placeholders ($summary) (pass)"
      else
        echo "[LANG-07 MUST] $lang is not complete: $summary"
        printf '%s' "$line" | python3 -c "import json,sys;d=json.load(sys.stdin);print('\n'.join('    missing '+k for k in d['missing'][:25]+d['bad'][:25]))"
        LANG07_FAILS=$((LANG07_FAILS+1)); HITS=$((HITS+1))
      fi ;;
    *) echo "[LANG-07 info] $lang is not enforced yet: $summary" ;;
  esac
done <<< "$COVER"
[ $LANG07_FAILS -ne 0 ] && MUST_FAILS=1
echo; echo "LANG violations: $HITS"
if [ $MUST_FAILS -ne 0 ]; then echo "Result: FAIL"; exit 1; fi
echo "Result: pass"; exit 0
