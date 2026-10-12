/**
 * Relève le relief de la ceinture caféière du Yunnan, une fois pour toutes.
 *
 *   node outils/relever-relief.mjs
 *
 * Ce script a besoin du réseau ; la construction du site, non. C'est pourquoi
 * il est séparé : il écrit `carte/relief.json`, qui est versionné, et que
 * `outils/construire-carte.mjs` se contente ensuite de lire. On ne le relance
 * que pour changer la zone, la finesse ou les paliers.
 *
 * La source est le jeu de tuiles d'altitude « terrarium » (AWS Open Data,
 * dérivé du SRTM et consorts) : l'altitude d'un point y est encodée dans les
 * trois composantes d'un pixel. Attribution obligatoire, portée par la page.
 *
 * Pourquoi la ceinture caféière et non tout le Yunnan : le nord-ouest de la
 * province monte à plus de 6000 m. À l'échelle d'une seule carte, ces sommets
 * écraseraient verticalement la bande 1000–1900 m — celle où pousse le café,
 * et le seul sujet de cette carte.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* La zone : les trois fermes Yunma, et ce qui les relie. */
const ZONE = { ouest: 98.3, est: 101.9, sud: 21.4, nord: 25.7 };
/* Finesse du relevé. 192 × 192 donne environ 2 km par maille : assez fin pour
   que les vallées se lisent, assez grossier pour tenir en quelques Ko et pour
   qu'un téléphone de 2020 construise la géométrie sans y penser. */
const MAILLES = 192;
/* Hauteur d'un palier, en mètres. C'est l'épaisseur d'une couche du gâteau.
   250 m plutôt que 150 : à 150, le relevé se hérissait d'une forêt de petites
   marches isolées — un champ d'aiguilles, pas des couches d'altitude. */
const PALIER = 250;
/* Lissage du relevé avant de le découper en paliers.
   C'est ce qui fait la différence entre une carte en couches et du bruit. Un
   modèle en carton découpé suit des courbes de niveau franches ; le relief
   brut, lui, fait osciller des milliers de mailles d'un palier à l'autre, et
   la découpe rend alors une grêle de marches d'une seule maille. On passe
   donc une moyenne glissante — trois fois, sur deux mailles de rayon — avant
   de découper : les plateaux deviennent larges, et leurs bords nets. */
const LISSAGE_RAYON = 1;
const LISSAGE_PASSES = 2;
/* Zoom des tuiles source : ~280 m par pixel à cette latitude, donc plus fin
   que la maille — on moyenne plusieurs pixels par maille plutôt que d'en
   inventer. */
const ZOOM = 9;

/* Les fermes. Le site donne leur préfecture et leur altitude, jamais leurs
   coordonnées : on ne les invente pas. Le point retenu est la maille la plus
   proche du chef-lieu dont l'altitude relevée tombe dans la fourchette
   annoncée par la fiche produit. C'est donc le bon massif, à la bonne
   hauteur, et non la ville — qui est souvent dans la vallée : Jinghong, le
   chef-lieu du Xishuangbanna, est à 555 m quand Yun Lan cultive à 1700. */
const FERMES = [
  { cle: 'gaosheng',       versCh: [99.17, 25.11], altitude: [1300, 1850] },
  { cle: 'torch-estate',   versCh: [100.97, 22.78], altitude: [1300, 1500] },
  { cle: 'yun-lan-estate', versCh: [100.80, 22.01], altitude: [1600, 1800] },
];

const CACHE = path.join(racine, '.cache', 'relief');
await mkdir(CACHE, { recursive: true });

const n = 2 ** ZOOM;
const tuileX = (lon) => Math.floor(((lon + 180) / 360) * n);
const tuileY = (lat) => Math.floor(((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n);
const pixelX = (lon) => ((lon + 180) / 360) * n * 256;
const pixelY = (lat) => ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n * 256;

const x0 = tuileX(ZONE.ouest), x1 = tuileX(ZONE.est);
const y0 = tuileY(ZONE.nord), y1 = tuileY(ZONE.sud);
const nbTuiles = (x1 - x0 + 1) * (y1 - y0 + 1);
console.log(`zone ${ZONE.ouest}–${ZONE.est}°E, ${ZONE.sud}–${ZONE.nord}°N`);
console.log(`${nbTuiles} tuiles z${ZOOM} à récupérer…`);

/* ------------------------------------------------------------------ *
 * Le relevé brut
 * ------------------------------------------------------------------ */
const largeurPx = (x1 - x0 + 1) * 256;
const hauteurPx = (y1 - y0 + 1) * 256;
const brut = new Float32Array(largeurPx * hauteurPx);
let octets = 0;

for (let ty = y0; ty <= y1; ty++) {
  for (let tx = x0; tx <= x1; tx++) {
    /* Les tuiles sont mises de côté : on règle la zone et les paliers
       plusieurs fois avant d'être content, et retélécharger quatre mégaoctets
       à chaque essai n'apprend rien à personne. Le cache n'est pas versionné. */
    const cache = path.join(CACHE, `${ZOOM}-${tx}-${ty}.png`);
    let buf;
    if (existsSync(cache)) {
      buf = await readFile(cache);
    } else {
      let rep;
      for (let essai = 1; essai <= 4; essai++) {
        try {
          rep = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${ZOOM}/${tx}/${ty}.png`);
          if (rep.ok) break;
        } catch {
          /* réseau capricieux : on repasse */
        }
        await new Promise((r) => setTimeout(r, 400 * essai));
      }
      if (!rep?.ok) throw new Error(`tuile ${ZOOM}/${tx}/${ty} inaccessible`);
      buf = Buffer.from(await rep.arrayBuffer());
      await writeFile(cache, buf);
      octets += buf.length;
    }
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    const decX = (tx - x0) * 256, decY = (ty - y0) * 256;
    for (let py = 0; py < info.height; py++) {
      for (let px = 0; px < info.width; px++) {
        const p = (py * info.width + px) * info.channels;
        const alt = data[p] * 256 + data[p + 1] + data[p + 2] / 256 - 32768;
        brut[(decY + py) * largeurPx + (decX + px)] = alt;
      }
    }
  }
  process.stdout.write(`  rangée ${ty - y0 + 1}/${y1 - y0 + 1}\r`);
}
console.log(`\n${(octets / 1024 / 1024).toFixed(1)} Mo téléchargés${octets ? '' : ' (tout venait du cache)'}`);

/* ------------------------------------------------------------------ *
 * Ramené à la grille de la carte
 * ------------------------------------------------------------------ */
const gauchePx = pixelX(ZONE.ouest) - x0 * 256;
const droitePx = pixelX(ZONE.est) - x0 * 256;
const hautPx = pixelY(ZONE.nord) - y0 * 256;
const basPx = pixelY(ZONE.sud) - y0 * 256;

/** Altitude moyenne de la maille (i, j), en moyennant les pixels couverts. */
const altitudes = new Float32Array(MAILLES * MAILLES);
for (let j = 0; j < MAILLES; j++) {
  const pyA = hautPx + ((basPx - hautPx) * j) / MAILLES;
  const pyB = hautPx + ((basPx - hautPx) * (j + 1)) / MAILLES;
  for (let i = 0; i < MAILLES; i++) {
    const pxA = gauchePx + ((droitePx - gauchePx) * i) / MAILLES;
    const pxB = gauchePx + ((droitePx - gauchePx) * (i + 1)) / MAILLES;
    let somme = 0, nb = 0;
    for (let py = Math.floor(pyA); py < Math.max(Math.ceil(pyB), Math.floor(pyA) + 1); py++) {
      for (let px = Math.floor(pxA); px < Math.max(Math.ceil(pxB), Math.floor(pxA) + 1); px++) {
        if (px < 0 || py < 0 || px >= largeurPx || py >= hauteurPx) continue;
        somme += brut[py * largeurPx + px];
        nb++;
      }
    }
    altitudes[j * MAILLES + i] = nb ? somme / nb : 0;
  }
}

/* ------------------------------------------------------------------ *
 * Le lissage
 * ------------------------------------------------------------------ */
/** Moyenne glissante séparable : une passe en x, une en y. */
function lisser(grille, taille, rayon) {
  const tampon = new Float32Array(grille.length);
  const passe = (src, dst, parLigne) => {
    for (let a = 0; a < taille; a++) {
      for (let b = 0; b < taille; b++) {
        let somme = 0, nb = 0;
        for (let d = -rayon; d <= rayon; d++) {
          const c = b + d;
          if (c < 0 || c >= taille) continue;
          somme += parLigne ? src[a * taille + c] : src[c * taille + a];
          nb++;
        }
        if (parLigne) dst[a * taille + b] = somme / nb;
        else dst[b * taille + a] = somme / nb;
      }
    }
  };
  passe(grille, tampon, true);
  passe(tampon, grille, false);
}
for (let k = 0; k < LISSAGE_PASSES; k++) lisser(altitudes, MAILLES, LISSAGE_RAYON);

/* ------------------------------------------------------------------ *
 * Les paliers
 * ------------------------------------------------------------------ */
let mini = Infinity, maxi = -Infinity;
for (const a of altitudes) { if (a < mini) mini = a; if (a > maxi) maxi = a; }
/* Les paliers partent de zéro, pas du minimum : « 1500 m » doit vouloir dire
   1500 m, pas « le dixième palier au-dessus du fond de la vallée ». */
const paliersMax = Math.ceil(maxi / PALIER);
const niveaux = new Uint8Array(MAILLES * MAILLES);
for (let k = 0; k < altitudes.length; k++) {
  niveaux[k] = Math.min(paliersMax, Math.max(0, Math.round(altitudes[k] / PALIER)));
}
console.log(`altitudes ${Math.round(mini)} – ${Math.round(maxi)} m après lissage, ${paliersMax + 1} paliers de ${PALIER} m`);

/* Combien de mailles diffèrent de leur voisine ? C'est la mesure du grain :
   au-delà d'une sur deux, la carte se hérisse au lieu de s'étager. */
let ruptures = 0, bords = 0;
for (let j = 0; j < MAILLES; j++) {
  for (let i = 0; i + 1 < MAILLES; i++) {
    bords++;
    if (niveaux[j * MAILLES + i] !== niveaux[j * MAILLES + i + 1]) ruptures++;
  }
}
console.log(`${((ruptures / bords) * 100).toFixed(1)} % de ruptures entre mailles voisines`);

/* ------------------------------------------------------------------ *
 * Les fermes, posées sur le relief
 * ------------------------------------------------------------------ */
const versMaille = (lon, lat) => {
  const i = ((lon - ZONE.ouest) / (ZONE.est - ZONE.ouest)) * MAILLES;
  /* `hautPx` et `basPx` sont comptés depuis la première tuile, pas depuis le
     méridien : il faut ramener le point au même repère avant de comparer,
     sans quoi le décalage des tuiles s'ajoute à la latitude. */
  const pyRelatif = pixelY(lat) - y0 * 256;
  const pyZone = (pyRelatif - hautPx) / (basPx - hautPx);
  return [Math.round(i - 0.5), Math.round(pyZone * MAILLES - 0.5)];
};

const fermes = FERMES.map(({ cle, versCh, altitude }) => {
  const [ci, cj] = versMaille(versCh[0], versCh[1]);
  const [bas, haut] = altitude;
  let meilleur = null, meilleureDistance = Infinity;
  for (let j = 0; j < MAILLES; j++) {
    for (let i = 0; i < MAILLES; i++) {
      const a = altitudes[j * MAILLES + i];
      if (a < bas || a > haut) continue;
      const d = (i - ci) ** 2 + (j - cj) ** 2;
      if (d < meilleureDistance) { meilleureDistance = d; meilleur = { i, j, a }; }
    }
  }
  if (!meilleur) throw new Error(`${cle} : aucune maille entre ${bas} et ${haut} m dans la zone`);
  const km = Math.round(Math.sqrt(meilleureDistance) * ((ZONE.est - ZONE.ouest) * 102) / MAILLES);
  console.log(`  ${cle.padEnd(16)} maille ${meilleur.i},${meilleur.j} → ${Math.round(meilleur.a)} m (${km} km du chef-lieu)`);
  return { cle, i: meilleur.i, j: meilleur.j, altitudeRelevee: Math.round(meilleur.a), altitudeAnnoncee: altitude };
});

/* ------------------------------------------------------------------ *
 * Écriture
 * ------------------------------------------------------------------ */
/* Les niveaux partent en base64 : un entier par maille, un octet chacun.
   36 Ko bruts, quelques Ko une fois compressés par le serveur — contre près
   de 200 Ko si on les écrivait en clair dans un tableau JSON. */
await mkdir(path.join(racine, 'carte'), { recursive: true });
await writeFile(
  path.join(racine, 'carte', 'relief.json'),
  JSON.stringify(
    {
      _lisezmoi: [
        'Relief de la ceinture caféière du Yunnan, relevé par outils/relever-relief.mjs.',
        'Ne pas modifier à la main : relancer l’outil pour changer la zone ou les paliers.',
        'Source : tuiles d’altitude terrarium, AWS Open Data (dérivées du SRTM).',
        '« niveaux » : un octet par maille, en base64, lu par rangées du nord au sud.',
        'L’altitude d’une maille vaut niveau × palier, en mètres.',
      ],
      zone: ZONE,
      mailles: MAILLES,
      palier: PALIER,
      paliersMax,
      altitudeMin: Math.round(mini),
      altitudeMax: Math.round(maxi),
      niveaux: Buffer.from(niveaux).toString('base64'),
      fermes,
      source: 'Tuiles d’altitude terrarium — AWS Open Data, dérivées du SRTM (NASA) et de l’ASTER GDEM',
    },
    null,
    1,
  ),
);
console.log(`\ncarte/relief.json écrit`);
