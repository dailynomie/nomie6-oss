import re,sys,os
# Finds visible text in Svelte templates that is not wrapped in Lang.t
ATTRS = r'(placeholder|title|aria-label|alt|label|description|subtitle|buttonLabel|header|message)'
def strip_script_style(s):
    s=re.sub(r'<script[\s\S]*?</script>', lambda m: '\n'*m.group(0).count('\n'), s)
    s=re.sub(r'<style[\s\S]*?</style>', lambda m: '\n'*m.group(0).count('\n'), s)
    s=re.sub(r'<!--[\s\S]*?-->', lambda m: '\n'*m.group(0).count('\n'), s)
    return s
# text that is not translated: brand names, web addresses and the app's own name
NOT_TEXT = re.compile(r'^(Nomie|DailyNomie|DailyNomie\.com|Daily Nomie 7|/r/nomie|https?://\S+|www\.\S+|\S+\.(com|org|app))$')
def drop_expressions(s):
    # expressions in braces (attribute values, {#if ...}) are code, not text: remove them before matching tags
    prev=None
    while prev!=s:
        prev=s
        s=re.sub(r'\{[^{}]*\}', '', s)
    return s

def text_hits(s):
    hits=[]
    s=drop_expressions(s)
    # text between > and <, not containing { or } expressions, with at least two letters
    for m in re.finditer(r'>([^<>{}]*)<', s):
        t=m.group(1).strip()
        if re.search(r'[A-Za-z]{2,}', t) and not NOT_TEXT.match(t):
            line=s.count('\n',0,m.start())+1
            hits.append((line,t[:70]))
    for m in re.finditer(ATTRS+r'="([^"{}]*[A-Za-z]{2,}[^"{}]*)"', s):
        if NOT_TEXT.match(m.group(2)):
            continue
        line=s.count('\n',0,m.start())+1
        hits.append((line,f'{m.group(1)}="{m.group(2)[:60]}"'))
    return hits
root=sys.argv[1]
mode=sys.argv[2] if len(sys.argv)>2 else 'summary'
given=sys.argv[3:]
def files_to_scan():
    if given:
        for p in given:
            if p.endswith('.svelte') and os.path.isfile(p) and 'n-icons' not in p: yield p
        return
    for dp,dn,fn in os.walk(root):
        if any(x in dp for x in ['vendor','n-icons','/lang','node_modules']): continue
        for f in fn:
            if f.endswith('.svelte'): yield os.path.join(dp,f)
total=0; files=0; per=[]
for p in files_to_scan():
    if True:
        s=strip_script_style(open(p,encoding='utf8').read())
        h=text_hits(s)
        if h:
            files+=1; total+=len(h); per.append((len(h),p))
            if mode=='detail':
                for line,t in h: print(f'{p}:{line}: {t}')
per.sort(reverse=True)
print(f'files with untranslated text: {files}   hits: {total}')
if mode=='summary':
    for n,p in per[:15]: print(f'  {n:4d} {p}')
