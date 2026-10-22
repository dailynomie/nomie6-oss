import re, sys, os
# Finds text that a person reads, written as a literal in script code: a display property of an object
# (label, title, description, ...) or a branch of a ternary. Template text is checked by lang-text-scan.py.
DISPLAY_KEYS = r'(label|title|description|placeholder|message|header|subtitle|buttonLabel|hint|tooltip|caption|emptyText|prompt)'
PROP = re.compile(r"\b" + DISPLAY_KEYS + r"\s*:\s*(['\"`])([^'\"`\n]*)\2")
TERNARY = re.compile(r"[?:]\s*(['\"`])([^'\"`\n]*)\1\s*(?=[:)}\]]|$)")
WORDS = re.compile(r'[A-Za-z]{2,}')
# a value that is code, a class name, an identifier or a path is not text
CODE_LIKE = re.compile(r'^[a-z0-9_.:/#@+\-]+$')
SKIP_PARTS = ('vendor', 'n-icons', '/lang', 'node_modules', '.spec.', '.test.', 'emoji-light', 'routes/api', 'ai/profiles', 'prompts')
# brand and product names are not translated (LANG-06)
BRANDS = {'Nomie', 'DailyNomie', 'Daily Nomie', 'AfterNomie', 'DailyNomie-AfterNomie', 'Claude', 'OpenRouter', 'Blockly', 'LinkedIn', 'Facebook', 'Twitter', 'Reddit', 'CouchDB', 'Nomie Blockly'}

CLASS_TOKEN = re.compile(r'^[a-z0-9:\-\[\]/.%!]+$')
DATE_FORMAT = re.compile(r'(YYYY|MMM|ddd|DD|HH|mm|Do\b)')
EXPRESSION = re.compile(r'\$\{[^{}]*\}')

def is_text(v):
    v = v.strip()
    if v in BRANDS:
        return False
    # identifiers (isOpen, pvtData, CSVTemplate), date patterns (M/D/YY) and colours or selectors (color:#FFF) are code
    if ' ' not in v and (re.match(r'^[a-z]+[A-Z][A-Za-z0-9]*$', v) or re.match(r'^[A-Z]{2,}[a-z]+[A-Za-z]*$', v)
                          or re.match(r'^[DMYHhms/]+$', v) or re.search(r'[:#]', v)):
        return False
    plain = EXPRESSION.sub('', v).strip()
    if not WORDS.search(plain) or CODE_LIKE.match(v):
        return False
    if v.startswith(('http', 'www.', '/', '#', '.', 'text-', 'bg-', 'ios-')):
        return False
    # class names: every word is lower case with digits, dashes or colons
    if all(CLASS_TOKEN.match(t) for t in v.split()):
        return False
    if DATE_FORMAT.search(v) or re.search(r'[;{}()=<>\\]', v):
        return False
    return True

def scan(path):
    hits = []
    for n, line in enumerate(open(path, encoding='utf8').read().split('\n'), 1):
        code = line.strip()
        if code.startswith(('//', '*', '/*', '<!--')) or 'Lang.t' in line or 'lang-ok' in line:
            continue
        seen = set()
        for m in PROP.finditer(line):
            if is_text(m.group(3)):
                hits.append((n, m.group(3))); seen.add(m.start(3))
        for m in TERNARY.finditer(line):
            if m.start(2) not in seen and is_text(m.group(2)):
                hits.append((n, m.group(2)))
    return hits

if __name__ == '__main__':
    files = sys.argv[1:]
    total = 0
    for f in files:
        if any(x in f for x in SKIP_PARTS) or not f.endswith(('.svelte', '.ts')):
            continue
        for n, t in scan(f):
            print(f'{f}:{n}: {t}')
            total += 1
    print(f'script text: {total}', file=sys.stderr)
