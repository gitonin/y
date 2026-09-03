# -*- coding: utf-8 -*-
"""
Réinjecte dans le site les textes français d'un document Word renvoyé par
l'auteur, en s'appuyant sur les codes entre crochets.

    python3 scripts/importer-textes.py chemin/vers/document.docx [--essai]

Le document de référence (contenu/textes-yunma-fr.md) donne le plan : l'ordre
des chapitres, des sections et des champs, avec la valeur actuelle de chacun.
On s'en sert pour deux choses :

  · retrouver les champs même si l'éditeur de texte a perdu les styles de titre
    (un titre retouché reste reconnaissable à son amorce) ;
  · remplacer chaque ancienne valeur par la nouvelle dans le bon fichier source.

Ce que le script ne fait pas, et qu'il signale : les prix et les coordonnées
(ils vivent ailleurs que dans les dictionnaires), et toute valeur qu'il ne peut
pas situer sans ambiguïté. Les traductions anglaise et chinoise restent à faire
à la main après coup.
"""
import difflib
import io
import os
import re
import sys
import zipfile

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REFERENCE = os.path.join(RACINE, 'contenu', 'textes-yunma-fr.md')

CIBLES = {
    'accueil': 'src/i18n/fr.ts', 'cafes': 'src/i18n/fr.ts', 'origine': 'src/i18n/fr.ts',
    'savoirFaire': 'src/i18n/fr.ts', 'apropos': 'src/i18n/fr.ts', 'pro': 'src/i18n/fr.ts',
    'journal': 'src/i18n/fr.ts', 'contact': 'src/i18n/fr.ts', 'nav': 'src/i18n/fr.ts',
    'pied': 'src/i18n/fr.ts', 'panier': 'src/i18n/fr.ts', 'produitPage': 'src/i18n/fr.ts',
    'faq': 'src/i18n/fr.ts',
    'produit': 'src/data/products.ts',
    'mentions': 'src/data/legal.ts', 'cgv': 'src/data/legal.ts',
}
CLES_PRODUIT = {
    'nom': 'name', 'sousTitre': 'subtitle', 'accroche': 'short', 'description': 'description',
    'histoire': 'story', 'origine': 'origin', 'altitude': 'altitude', 'variete': 'variety',
    'process': 'process', 'notes': 'notes', 'sechage': 'drying', 'recolte': 'harvest',
    'profil': 'roast', 'preparation': 'brew',
    'ferme.nom': 'name', 'ferme.lieu': 'place', 'ferme.texte': 'text',
}
CODE = re.compile(r'^(.*?)\s*\[([A-Za-z0-9._\-]+)\]\s*$')


# ------------------------------------------------------------------ le plan
def plan_du_md(chemin):
    plan, courant = [], None
    for ligne in io.open(chemin, encoding='utf-8').read().split('\n'):
        ligne = ligne.rstrip()
        s = ligne.strip()
        if s.startswith('#') or s.startswith('>'):
            plan.append({'k': 'struct', 't': s.lstrip('#>').strip()}); courant = None; continue
        if s.startswith('_') and s.endswith('_') and courant is None:
            plan.append({'k': 'struct', 't': s.strip('_')}); continue
        m = re.match(r'^\*\*(.+?)\*\*\s+`\[([A-Za-z0-9._\-]+)\]`$', s)
        if m:
            plan.append({'k': 'struct', 't': m.group(1)})
            courant = {'k': 'field', 'code': m.group(2), 'lignes': []}
            plan.append(courant); continue
        if s.startswith('↑'):
            continue
        if courant is not None:
            if s == '':
                if courant['lignes']: courant['lignes'].append('')
                continue
            courant['lignes'].append(ligne)
    for it in plan:
        if it['k'] == 'field':
            it['valeur'] = '\n'.join(it.pop('lignes')).strip('\n')
    return plan


# ------------------------------------------------------- lecture du document
def paragraphes(chemin):
    x = zipfile.ZipFile(chemin).read('word/document.xml').decode('utf-8')
    sortie = []
    for m in re.finditer(r'<w:p[ >].*?</w:p>|<w:p/>', x, re.S):
        p = re.sub(r'<w:br\s*/?>', '\n', m.group(0))
        t = ''.join(re.findall(r'<w:t(?: [^>]*)?>(.*?)</w:t>', p, re.S))
        sortie.append(t.replace('&amp;', '&').replace('&lt;', '<')
                       .replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'"))
    return sortie


def _normalise(s):
    s = s.replace('’', "'").replace('—', '-').replace('–', '-')
    return re.sub(r'[\s.,]+', ' ', s.lower()).strip()


def _est_un_titre(texte, attendus):
    """Un titre de section retouché par l'auteur reste un titre de section."""
    if not texte or not attendus:
        return False
    n = _normalise(texte)
    tete = n.split(' ')[:2]
    for a in attendus:
        m = _normalise(a)
        if difflib.SequenceMatcher(None, n, m).ratio() >= 0.72:
            return True
        if len(tete) == 2 and m.split(' ')[:2] == tete:
            return True
    return False


def relire(docx, plan):
    apres, connus = {}, set()
    for i, it in enumerate(plan):
        if it['k'] != 'field':
            continue
        connus.add(it['code'])
        stop = set()
        for j in range(i + 1, len(plan)):
            if plan[j]['k'] == 'field':
                break
            stop.add(plan[j]['t'])
        apres[it['code']] = stop

    res, code, lignes = {}, None, []
    def fermer():
        if code:
            res[code] = '\n'.join(lignes).strip('\n')
    for t in paragraphes(docx):
        s = t.strip()
        m = CODE.match(s) if s else None
        if m and m.group(2) in connus:
            fermer(); code, lignes = m.group(2), []; continue
        if code is None or s.startswith('↑'):
            continue
        if s in apres[code] or _est_un_titre(s, apres[code]):
            fermer(); code, lignes = None, []; continue
        if s == '' and not lignes:
            continue
        lignes.append(t)
    fermer()
    return res


# ------------------------------------------------------------- réinjection
def litteral(v, q):
    return q + v.replace('\\', '\\\\').replace(q, '\\' + q).replace('\n', '\\n') + q


def remplacer(texte, ancienne, neuve, cle=None):
    for q in ("'", '"'):
        vieux, neuf = litteral(ancienne, q), litteral(neuve, q)
        n = texte.count(vieux)
        if n == 1:
            return texte.replace(vieux, neuf), 'ok'
        if n > 1:
            if cle:
                motif = re.compile(re.escape(cle) + r':\s*(?:\{\s*fr:\s*)?' + re.escape(vieux))
                if len(motif.findall(texte)) == 1:
                    return motif.sub(lambda m: m.group(0).replace(vieux, neuf), texte, count=1), 'ok'
            return texte, '%d occurrences' % n
    return texte, 'valeur introuvable'


def main():
    if len(sys.argv) < 2:
        print(__doc__); return 1
    docx, essai = sys.argv[1], '--essai' in sys.argv
    plan = plan_du_md(REFERENCE)
    ancien = {it['code']: it['valeur'] for it in plan if it['k'] == 'field'}
    nouveau = relire(docx, plan)

    absents = sorted(set(ancien) - set(nouveau))
    if absents:
        print('%d code(s) absent(s) du document : %s' % (len(absents), ', '.join(absents[:8])))

    fichiers, faits, restes = {}, [], []
    for code, avant in ancien.items():
        apres = nouveau.get(code)
        if apres is None or apres == avant:
            continue
        f = CIBLES.get(code.split('.')[0])
        if not f:
            restes.append((code, 'hors dictionnaires (prix, coordonnées…)')); continue
        if f not in fichiers:
            fichiers[f] = io.open(os.path.join(RACINE, f), encoding='utf-8').read()
        champ = code.split('.', 2)[-1] if code.startswith('produit.') else code.split('.')[-1]
        cle = CLES_PRODUIT.get(champ, champ if not champ[0].isdigit() else None)
        fichiers[f], statut = remplacer(fichiers[f], avant, apres, cle)
        (faits if statut == 'ok' else restes).append(code if statut == 'ok' else (code, statut))

    if not essai:
        for f, s in fichiers.items():
            io.open(os.path.join(RACINE, f), 'w', encoding='utf-8').write(s)

    print('%d texte(s) réinjecté(s)%s · %d à traiter à la main'
          % (len(faits), ' (essai, rien écrit)' if essai else '', len(restes)))
    for code, pourquoi in restes:
        print('  -', code, '·', pourquoi)
    print('\nPensez ensuite à : traduire les textes modifiés en anglais et en chinois,')
    print('relancer « node scripts/export-textes.mjs », puis « npm run build ».')
    return 0


if __name__ == '__main__':
    sys.exit(main())
