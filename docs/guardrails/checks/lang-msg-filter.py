import re,sys
# Keeps a toast or dialog hit only when its string literals contain words.
# A template string that holds only an expression, such as `${e.message}`, is a pass-through and has no text to translate.
STRING = re.compile(r"'([^'\n]*)'|`([^`\n]*)`|\"([^\"\n]*)\"")
EXPR = re.compile(r'\$\{[^{}]*\}')
for line in sys.stdin:
    parts = line.rstrip('\n').split(':', 2)
    code = parts[2] if len(parts) == 3 else line
    for m in STRING.finditer(code):
        literal = next(g for g in m.groups() if g is not None)
        if re.search(r'[A-Za-z]{2,}', EXPR.sub('', literal)):
            print(line, end='')
            break
