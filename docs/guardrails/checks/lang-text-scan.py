import re,sys,os
# Finds visible text in Svelte templates that is not wrapped in Lang.t
ATTRS = r'(placeholder|title|aria-label|alt|label|description|subtitle|buttonLabel|header|message)'
def strip_script_style(s):
    s=re.sub(r'<script[\s\S]*?</script>', lambda m: '\n'*m.group(0).count('\n'), s)
    s=re.sub(r'<style[\s\S]*?</style>', lambda m: '\n'*m.group(0).count('\n'), s)
    s=re.sub(r'<!--[\s\S]*?-->', lambda m: '\n'*m.group(0).count('\n'), s)
    return s
def text_hits(s):
    hits=[]
    # text between > and <, not containing { or } expressions, with at least two letters
    for m in re.finditer(r'>([^<>{}]*)<', s):
        t=m.group(1).strip()
        if re.search(r'[A-Za-z]{2,}', t):
            line=s.count('\n',0,m.start())+1
            hits.append((line,t[:70]))
    for m in re.finditer(ATTRS+r'="([^"{}]*[A-Za-z]{2,}[^"{}]*)"', s):
        line=s.count('\n',0,m.start())+1
        hits.append((line,f'{m.group(1)}="{m.group(2)[:60]}"'))
    return hits
root=sys.argv[1]
mode=sys.argv[2] if len(sys.argv)>2 else 'summary'
total=0; files=0; per=[]
for dp,dn,fn in os.walk(root):
    if any(x in dp for x in ['vendor','n-icons','/lang','node_modules']): continue
    for f in fn:
        if not f.endswith('.svelte'): continue
        p=os.path.join(dp,f)
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
