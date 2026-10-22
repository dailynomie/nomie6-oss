#!/usr/bin/env python3
"""Wrap visible text in Lang.t and add the keys to the base file (LANG-01, LANG-04).

Usage:
  python3 docs/guardrails/checks/lang-wrap.py <area> <file.svelte> [<file.svelte> ...]

<area> is the key section the new keys go under (for example settings). Keys are the area plus
a hyphenated slug of the English text. Brand names, URLs and user content are skipped; a file
is only changed when every match is unique, so a mismatch stops the run instead of guessing.
"""
import json, os, re, subprocess, sys

BRANDS = {'DailyNomie.com', 'Daily Nomie 7', '/r/nomie', 'Nomie', 'DailyNomie'}
BASE = 'src/lang/base.ts'

def slug(text):
    s = re.sub(r"[^a-z0-9]+", '-', text.lower()).strip('-')
    return s[:48] or 'text'

def js_string(text):
    # the default is a JS string: use double quotes when the text contains an apostrophe
    if "'" in text:
        return '"' + text.replace('"', '\\"') + '"'
    return "'" + text + "'"

def hits(path):
    out = []
    text = open(path, encoding='utf8').read()
    # strip script and style so only the template is scanned
    scan = re.sub(r'<script[\s\S]*?</script>', lambda m: '\n' * m.group(0).count('\n'), text)
    scan = re.sub(r'<style[\s\S]*?</style>', lambda m: '\n' * m.group(0).count('\n'), scan)
    scan = re.sub(r'<!--[\s\S]*?-->', lambda m: '\n' * m.group(0).count('\n'), scan)
    for m in re.finditer(r'>([^<>{}]*)<', scan):
        t = m.group(1).strip()
        if '\n' in t:
            # a paragraph over several lines is wrapped by hand, so the text match stays exact
            out.append(('manual', ' '.join(t.split())))
            continue
        if re.search(r'[A-Za-z]{2,}', t) and t not in BRANDS:
            out.append(('text', t))
    for m in re.finditer(r'\b(title|description|placeholder|label|aria-label)="([^"{}]*[A-Za-z]{2,}[^"{}]*)"', scan):
        if m.group(2) not in BRANDS:
            out.append(('attr', m.group(1), m.group(2)))
    return out

def existing_value(base, leaf):
    m = re.search(r"\n\s+'?" + re.escape(leaf) + r"'?: *(['\"])((?:(?!\1).)*)\1", base)
    return m.group(2) if m else None

def choose_key(area, text, keys, base):
    # the first free name for this text: the slug, or the slug with a number when the name is taken
    root = slug(text)
    for n in range(1, 50):
        leaf = root if n == 1 else f'{root}-{n}'
        key = f'{area}.{leaf}'
        taken_here = any(k == key and t != text for t, k in keys.items())
        value = existing_value(base, leaf)
        if taken_here or (value is not None and value != text):
            continue
        return key
    raise SystemExit(f'no free key for {text!r}')

def wrap(path, area, keys, base):
    src = open(path, encoding='utf8').read()
    new = src
    for item in hits(path):
        if item[0] == 'manual':
            print(f'manual (multi-line text, wrap by hand): {path}: {item[1][:70]}')
            continue
        if item[0] == 'attr':
            _, attr, t = item
            key = keys[t] = keys.get(t) or choose_key(area, t, keys, base)
            old = f'{attr}="{t}"'
            n = new.count(old)
            if n == 0:
                continue
            new = new.replace(old, f'{attr}={{Lang.t(\'{key}\', {js_string(t)})}}')
        else:
            t = item[1]
            key = keys[t] = keys.get(t) or choose_key(area, t, keys, base)
            # text between tags, on its own or inline
            pat = re.compile(r'(>\s*)' + re.escape(t) + r'(\s*<)')
            new, n1 = pat.subn(lambda m: m.group(1) + '{Lang.t(\'' + key + '\', ' + js_string(t) + ')}' + m.group(2), new)
            pat2 = re.compile(r'(^[ \t]*)' + re.escape(t) + r'([ \t]*$)', re.M)
            new, n2 = pat2.subn(lambda m: m.group(1) + '{Lang.t(\'' + key + '\', ' + js_string(t) + ')}' + m.group(2), new)
    if new != src:
        open(path, 'w', encoding='utf8').write(new)
    return new != src

def base_values():
    # every dotted key in the base file, with its English text (parsed, so sections are exact)
    code = ("const ts=require('typescript'),fs=require('fs');"
            "const js=ts.transpileModule(fs.readFileSync('" + BASE + "','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;"
            "const m={exports:{}};new Function('module','exports',js)(m,m.exports);"
            "const out={};const walk=(o,p)=>{for(const k of Object.keys(o)){const v=o[k];const q=p?p+'.'+k:k;"
            "if(v&&typeof v==='object')walk(v,q);else out[q]=v}};"
            "walk((m.exports.default||m.exports).translation,'');console.log(JSON.stringify(out));")
    return json.loads(subprocess.check_output(['node', '-e', code], text=True))

def add_keys(area, keys):
    base = open(BASE, encoding='utf8').read()
    marker = f'\n    {area}: {{\n'
    create = base.count(marker) == 0
    if base.count(marker) > 1:
        raise SystemExit(f'more than one "{area}" section in {BASE}')
    lines = []
    values = base_values()
    for text, key in sorted(keys.items(), key=lambda kv: kv[1]):
        leaf = key.split('.', 1)[1]
        if key in values:
            if values[key] != text:
                raise SystemExit(f'key {key} already exists with other text: {values[key]!r} != {text!r}')
            continue
        lines.append(f"      '{leaf}': {js_string(text)},\n")
    if create and lines:
        # a new section goes at the end of the translation object
        close = '\n  },\n}'
        if base.count(close) != 1:
            raise SystemExit(f'cannot find the end of the translation object in {BASE}')
        base = base.replace(close, f'\n    {area}: {{\n' + ''.join(lines) + '    },' + close, 1)
    elif lines:
        base = base.replace(marker, marker + ''.join(lines), 1)
    open(BASE, 'w', encoding='utf8').write(base)
    return len(lines)

SCRIPT_CALL = re.compile(r"(Interact\.(?:alert|confirm|prompt|error|success)\(|showToast\(\{\s*message:\s*)([^\n]*)")

def wrap_script(path, area, keys, base):
    """Wrap quoted text in Interact.* dialog calls and toast messages (LANG-03), on one line."""
    src = open(path, encoding='utf8').read()
    changed = [False]
    def fix_call(m):
        head, rest = m.group(1), m.group(2)
        def fix_lit(q):
            text = q.group(2)
            if not re.search(r'[A-Za-z]{2,}', text) or '${' in text:
                return q.group(0)
            key = keys[text] = keys.get(text) or choose_key(area, text, keys, base)
            changed[0] = True
            return "Lang.t('" + key + "', " + js_string(text) + ")"
        # quoted literals up to the end of the call's line; stop at the first ")" that closes the call
        rest2 = re.sub(r"(?<![\w.])(['\"])([^'\"\n]*)\1", fix_lit, rest)
        return head + rest2
    new = SCRIPT_CALL.sub(fix_call, src)
    if changed[0]:
        open(path, 'w', encoding='utf8').write(new)
    return changed[0]

if __name__ == '__main__':
    area, files = sys.argv[1], sys.argv[2:]
    keys = {}
    changed = []
    base = open(BASE, encoding='utf8').read()
    for f in files:
        if wrap(f, area, keys, base):
            changed.append(f)
        if wrap_script(f, area, keys, base):
            changed.append(f)
    added = add_keys(area, keys)
    print(f'wrapped {len(changed)} file(s); added {added} key(s) to {area} in {BASE}')
