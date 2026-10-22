import importlib.util, os, re, subprocess, sys, json
# Wraps the display text that lang-script-scan.py finds in Lang.t, adds the keys to the base file, and
# skips text that the code compares (a comparison would stop matching once the text is translated).
HERE = os.path.dirname(os.path.abspath(__file__))
def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + '.py'))
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod); return mod
scan_mod = load('lang-script-scan')
lw = load('lang-wrap')
AREA = {'settings': 'settings', 'dashboard2': 'dashboard', 'goals': 'goals', 'experiments': 'experiments', 'ai': 'ai',
        'plugins': 'plugins', 'stats2': 'stats', 'stats': 'stats', 'analytics': 'analytics', 'uom': 'uom',
        'trackable': 'trackable', 'templates': 'templates', 'afternomie': 'afternomie', 'storage': 'storage',
        'board': 'board', 'search': 'search', 'timeline': 'timeline', 'usage': 'usage', 'import': 'import',
        'writing-prompts': 'writing', 'awards': 'awards', 'ledger': 'ledger', 'steak': 'steak', 'context': 'context',
        'trending': 'trending', 'layout': 'layout', 'pointers': 'pointers', 'positivity': 'positivity',
        'log-cache': 'logcache', 'map': 'map', 'library': 'library', 'capture': 'capture', 'calendar-view': 'calendar',
        'uom-editor': 'uom', 'whats-new': 'whatsnew', 'on-this-day': 'onthisday', 'related': 'related',
        'tracker': 'tracker', 'pivot': 'analytics', 'csv-import': 'import', 'import-export': 'import'}
def area_for(path):
    parts = path.split('/')
    if 'domains' in parts:
        i = parts.index('domains')
        if i + 1 < len(parts):
            name = parts[i + 1]
            return AREA.get(name, 'ui')
    if 'routes' in parts: return 'routes'
    return 'ui'

def compared(text):
    q = re.escape(text)
    pat = r"(===?|!==?|\bcase)\s*['\"`]" + q + r"['\"`]|['\"`]" + q + r"['\"`]\s*(===?|!==?)"
    out = subprocess.run(['grep', '-rlE', pat, 'src'], capture_output=True, text=True).stdout
    return bool(out.strip())

def main(apply):
    base = lw.base_values()
    files = [l.strip() for l in sys.argv[2:]]
    plan = {}
    skipped = {'interpolated': [], 'compared': []}
    for f in files:
        for n, text in scan_mod.scan(f):
            if '${' in text or '`' in text:
                skipped['interpolated'].append(f'{f}:{n}: {text}'); continue
            if compared(text):
                skipped['compared'].append(f'{f}:{n}: {text}'); continue
            plan.setdefault(f, []).append((n, text))
    total = sum(len(v) for v in plan.values())
    print(f'would wrap {total} literals in {len(plan)} files')
    print(f'skipped interpolated {len(skipped["interpolated"])}, compared {len(skipped["compared"])}')
    for k in skipped: 
        for s in skipped[k]: print(f'  {k}: {s}')
    if not apply: return
    keys_by_area = {}
    used = {}
    for f, items in plan.items():
        area = area_for(f)
        lines = open(f, encoding='utf8').read().split('\n')
        for n, text in items:
            full = base.get(area + '.' + lw.slug(text))
            key = None
            for cand in [lw.slug(text)] + [lw.slug(text) + '-' + str(i) for i in range(2, 20)]:
                k = area + '.' + cand
                existing = base.get(k, used.get(k))
                if existing is None or existing == text:
                    key = k; break
            used[key] = text
            keys_by_area.setdefault(area, {})[text] = key.split('.', 1)[1] and key
            wrapped = f"Lang.t('{key}', {lw.js_string(text)})"
            line = lines[n - 1]
            changed = False
            for q in ["'", '"']:
                lit = q + text + q
                if lit in line:
                    line = line.replace(lit, wrapped); changed = True; break
            if not changed:
                print('NOT FOUND', f, n, text); continue
            lines[n - 1] = line
        open(f, 'w', encoding='utf8').write('\n'.join(lines))
        lw.ensure_import(os.path.abspath(f))
    for area, keys in keys_by_area.items():
        # add_keys takes text -> key without the area prefix in the leaf
        lw.add_keys(area, {t: k for t, k in keys.items()})
    print('wrapped', total)

if __name__ == '__main__':
    apply = sys.argv[1] == '--apply'
    main(apply)
