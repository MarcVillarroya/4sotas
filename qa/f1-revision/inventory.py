import glob, re

files = sorted(glob.glob("src/content/temas/*.md") + glob.glob("src/content/articulos/*.md") +
               glob.glob("src/content/glosario/*.md") + glob.glob("src/content/herramientas/*.yaml") +
               glob.glob("src/content/videos/*.yaml") + glob.glob("src/content/series/*.yaml"))
for f in files:
    t = open(f).read()
    m = re.match(r"^---\n(.*?)\n---\n", t, re.S)
    fm = m.group(1)
    st = re.search(r"^status:\s*(\S+)", fm, re.M)
    sens = re.search(r"^sensibilidad:\s*(\S+)", fm, re.M)
    seo_blk = re.search(r"^seo:\s*(.*)$", fm, re.M)
    has_desc = bool(re.search(r"^\s+descripcion:", fm, re.M))
    rev = "revisor:" in fm
    print(f"{f:58s} status={st.group(1) if st else '?':9s} sens={sens.group(1) if sens else '?':6s} seo={'{}' if seo_blk and seo_blk.group(1).strip()=='{}' else ('blk' if seo_blk else 'NO')} desc={has_desc} revisor={rev}")
