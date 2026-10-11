/**
 * Le formulaire de rétractation.
 *
 *   npm run test:retractation
 *
 * Une demande de rétractation ne peut pas se perdre : c'est un droit, pas une
 * commodité. Le contrôle porte donc sur ce qui en décide — que le lien soit
 * là, dans les trois langues, avant la ligne de copyright ; que la fenêtre
 * s'ouvre et se ferme comme une fenêtre ; qu'un champ vide arrête l'envoi ; et
 * surtout que la demande parte vraiment, avec les bonnes valeurs dedans.
 *
 * Deux constructions, parce que le départ se fait de deux façons :
 *
 *   1. sans service configuré — le courriel, qui est le cas d'aujourd'hui ;
 *   2. avec un service — la demande part sans quitter la page.
 *
 * Le service est simulé sur un domaine inexistant : si l'interception tombait
 * en panne, le test échouerait au lieu de réussir en silence.
 */
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { readFileSync, rmSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4404;
const SERVICE = 'https://service-simule.invalid/retractation';
const LANGUES = ['fr', 'en', 'zh'];

const textes = JSON.parse(readFileSync(join(RACINE, 'contenu', 'textes.json'), 'utf8')).site;

let ok = 0;
const echecs = [];
const check = (nom, reel, attendu = true) => {
  if (reel === attendu) { ok++; console.log(`  ok    ${nom}`); }
  else { echecs.push(nom); console.log(`  ÉCHEC ${nom}\n        attendu : ${attendu}\n        obtenu  : ${reel}`); }
};
const titre = (t) => console.log(`\n— ${t}`);

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const construire = (sortie, env = {}) => {
  rmSync(join(RACINE, sortie), { recursive: true, force: true });
  execFileSync('npx', ['astro', 'build', '--outDir', sortie], {
    cwd: RACINE, stdio: 'pipe', env: { ...process.env, ...env },
  });
};

const servir = (dossier) => {
  const s = createServer(async (req, res) => {
    let p = join(RACINE, dossier, decodeURIComponent(req.url.split('?')[0]));
    if (p.endsWith('/')) p += 'index.html';
    try {
      const buf = await readFile(p);
      res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
      res.end(buf);
    } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((r) => s.listen(PORT, () => r(s)));
};

const CLIENT = { numero: '#1042', nom: 'Camille Durand', email: 'camille@example.com' };

const main = async () => {
  let chromium;
  try { ({ chromium } = await import('playwright')); }
  catch { console.log('\nPlaywright est absent — contrôle ignoré.'); return; }

  const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let serveur;

  const remplirEtEnvoyer = async (page) => {
    await page.fill('input[name="numero"]', CLIENT.numero);
    await page.fill('input[name="nom"]', CLIENT.nom);
    await page.fill('input[name="email"]', CLIENT.email);
    await page.click('[data-retract-form] button[type="submit"]');
    await page.waitForTimeout(300);
  };

  try {
    /* ============ 1. Le courriel, sans service ============ */
    console.log('Construction sans service…');
    construire('dist-retract');
    serveur = await servir('dist-retract');

    titre('Le lien est au pied de page, dans les trois langues');
    for (const lang of LANGUES) {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`http://localhost:${PORT}/${lang}/`, { waitUntil: 'networkidle' });
      const r = textes[lang].footer.retractation;

      const lien = page.locator('[data-retract-ouvrir]');
      check(`${lang} — le lien est visible`, await lien.isVisible());
      check(`${lang} — son libellé est traduit`, (await lien.textContent()).trim(), r.lien);

      /* Il doit précéder la ligne de copyright, pas la suivre. */
      const avant = await page.evaluate(() => {
        const l = document.querySelector('[data-retract-ouvrir]');
        const c = [...document.querySelectorAll('.ft__base p')].find((p) => p.textContent.includes('©'));
        return !!l && !!c && (l.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      });
      check(`${lang} — il précède la ligne de copyright`, avant);
      await page.close();
    }

    titre('La fenêtre s’ouvre et se ferme comme une fenêtre');
    {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`http://localhost:${PORT}/fr/`, { waitUntil: 'networkidle' });
      const boite = page.locator('[data-retract]');
      check('fermée au chargement', await boite.isVisible(), false);
      await page.click('[data-retract-ouvrir]'); await page.waitForTimeout(250);
      check('ouverte au clic', await boite.isVisible());
      check('le focus est retenu dedans', await page.evaluate(() =>
        document.querySelector('[data-retract]').contains(document.activeElement)));
      await page.keyboard.press('Escape'); await page.waitForTimeout(250);
      check('refermée par Échap', await boite.isVisible(), false);

      await page.click('[data-retract-ouvrir]'); await page.waitForTimeout(250);
      await page.mouse.click(8, 8); await page.waitForTimeout(250);
      check('refermée par un clic sur le voile', await boite.isVisible(), false);
      await page.close();
    }

    titre('Un champ vide arrête l’envoi');
    {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`http://localhost:${PORT}/fr/`, { waitUntil: 'networkidle' });
      await page.click('[data-retract-ouvrir]'); await page.waitForTimeout(250);
      await page.fill('input[name="numero"]', CLIENT.numero);
      await page.click('[data-retract-form] button[type="submit"]'); await page.waitForTimeout(250);
      check('aucun courriel préparé', await page.getAttribute('[data-retract-mail]', 'href'), '#');
      check('la fenêtre reste ouverte', await page.locator('[data-retract]').isVisible());
      await page.close();
    }

    titre('La demande part, avec les bonnes valeurs');
    for (const lang of LANGUES) {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`http://localhost:${PORT}/${lang}/`, { waitUntil: 'networkidle' });
      await page.click('[data-retract-ouvrir]'); await page.waitForTimeout(250);
      await remplirEtEnvoyer(page);

      const href = decodeURIComponent(await page.getAttribute('[data-retract-mail]', 'href'));
      const r = textes[lang].footer.retractation;
      check(`${lang} — le courriel vise la boutique`, href.startsWith('mailto:'));
      check(`${lang} — l’objet porte le numéro`, href.includes(r.objet.replace('{numero}', CLIENT.numero)));
      for (const [quoi, valeur] of Object.entries(CLIENT)) {
        check(`${lang} — le corps porte ${quoi}`, href.includes(valeur));
      }
      /* Rien n'est enregistré tant que le client n'a pas appuyé sur envoyer :
         le message ne doit pas le lui laisser croire. */
      const dit = (await page.locator('[data-retract-reponse]').textContent()).trim();
      check(`${lang} — le message dit ce qu’il reste à faire`, dit, r.ouvrirCourriel);
      check(`${lang} — il ne prétend pas la demande enregistrée`, dit === r.confirmation, false);
      await page.close();
    }

    serveur.close();
    rmSync(join(RACINE, 'dist-retract'), { recursive: true, force: true });

    /* ============ 2. Avec un service configuré ============ */
    console.log('\nConstruction avec un service…');
    construire('dist-retract', { PUBLIC_RETRACTATION_URL: SERVICE });
    serveur = await servir('dist-retract');

    titre('Avec un service, la demande part sans quitter la page');
    {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      let recu = null;
      await page.route(`${SERVICE}**`, async (route) => {
        recu = JSON.parse(route.request().postData() ?? '{}');
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
      });
      await page.goto(`http://localhost:${PORT}/fr/`, { waitUntil: 'networkidle' });
      await page.click('[data-retract-ouvrir]'); await page.waitForTimeout(250);
      await remplirEtEnvoyer(page);

      const r = textes.fr.footer.retractation;
      check('le service a reçu la demande', !!recu);
      check('avec le numéro', recu?.numero, CLIENT.numero);
      check('avec le nom', recu?.nom, CLIENT.nom);
      check('avec l’adresse', recu?.email, CLIENT.email);
      check('la confirmation s’affiche', (await page.locator('[data-retract-reponse]').textContent()).trim(), r.confirmation);
      check('aucun courriel n’a été préparé', await page.getAttribute('[data-retract-mail]', 'href'), '#');
      await page.close();
    }

    titre('Si le service tombe, le client n’est pas laissé sans recours');
    {
      const page = await nav.newPage({ viewport: { width: 1280, height: 900 } });
      await page.route(`${SERVICE}**`, (route) => route.abort('failed'));
      await page.goto(`http://localhost:${PORT}/fr/`, { waitUntil: 'networkidle' });
      await page.click('[data-retract-ouvrir]'); await page.waitForTimeout(250);
      await remplirEtEnvoyer(page);
      const dit = (await page.locator('[data-retract-reponse]').textContent()).trim();
      check('l’erreur est annoncée', dit.length > 0);
      check('et donne une adresse où écrire', dit.includes('@'));
      await page.close();
    }
  } finally {
    await nav.close();
    serveur?.close();
    rmSync(join(RACINE, 'dist-retract'), { recursive: true, force: true });
  }

  console.log(`\n${ok} vérifications passées, ${echecs.length} en échec`);
  process.exit(echecs.length ? 1 : 0);
};

main();
