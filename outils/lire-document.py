# -*- coding: utf-8 -*-
"""
Sort en JSON les paragraphes d'un document Word, dans l'ordre, avec leur style.

    python3 outils/lire-document.py chemin/vers/document.docx

C'est volontairement bête : le découpage en textes est fait ensuite, par
`scripts/importer-contenu.mjs`, qui sait quels titres attendre. Un document
passé par Word ou Pages renomme et réapplique les styles à sa guise — on ne
peut donc pas s'y fier pour reconnaître un titre.
"""
import json
import re
import sys
import zipfile

# <w:t> ou <w:t ...> — surtout pas <w:top .../>, qui vit dans les bordures.
TEXTE = re.compile(r'<w:t(?:\s[^>]*)?>(.*?)</w:t>|<w:br\s*/>|<w:tab\s*/>', re.S)
PARA = re.compile(r'<w:p(?:\s[^>]*)?>.*?</w:p>|<w:p(?:\s[^>]*)?/>', re.S)
STYLE = re.compile(r'<w:pStyle w:val="([^"]+)"')
ENTITES = [('&lt;', '<'), ('&gt;', '>'), ('&quot;', '"'), ('&#39;', "'"), ('&amp;', '&')]


def paragraphes(chemin):
    with zipfile.ZipFile(chemin) as z:
        xml = z.read('word/document.xml').decode('utf-8')
    sortie = []
    for bloc in PARA.findall(xml):
        texte = ''.join(m.group(1) if m.group(1) is not None else '\n' for m in TEXTE.finditer(bloc))
        for avant, apres in ENTITES:
            texte = texte.replace(avant, apres)
        style = STYLE.search(bloc)
        sortie.append({'style': style.group(1) if style else '', 'texte': texte})
    return sortie


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    print(json.dumps(paragraphes(sys.argv[1]), ensure_ascii=False))
