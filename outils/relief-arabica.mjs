/**
 * Pose le vrai relief du Yunnan dans l'atlas.
 *
 *   node outils/relief-arabica.mjs
 *
 * La source est `carte/relief.json` — le relevé fait une fois pour la carte
 * du relief, à partir des tuiles d'altitude terrarium, et versionné depuis.
 * Rien n'est demandé au réseau ici.
 *
 * Le relevé fait 380 × 380, ce qui est plus fin que la maille de rendu de
 * l'atlas (250). Le garder entier n'apporterait donc aucun détail visible, et
 * coûterait 190 Ko de base64 dans une page qui doit rester un seul fichier.
 * On le ramène à 256 × 256 par moyenne de surface — ce qui est déjà un
 * lissage —, puis on passe un noyau gaussien : les montagnes doivent être
 * douces, pas hérissées.
 *
 * Le résultat est écrit dans `arabica/index.html`, à la place de la ligne
 * `const RELIEF=…`. C'est une donnée, pas une sortie de construction : elle
 * est versionnée, et la page reste ouvrable seule.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dans = (...p) => path.join(racine, ...p);

const SORTIE = 380;      /* le relevé entier : la maille de rendu le vaut */
const PASSES = 2;        /* passes de lissage gaussien */

/** Le relevé, décodé : une altitude en mètres par maille. */
function lireReleve(relief) {
  const M = relief.mailles;
  const octets = Uint8Array.from(Buffer.from(relief.niveaux, 'base64'));
  if (octets.length !== M * M) throw new Error(`relevé : ${octets.length} octets pour ${M}×${M}`);
  /* Le relevé est stocké en différences à la moyenne du voisin de gauche et
     de celui du dessus — c'est ce qui le fait tenir en 87 Ko compressés. */
  if (relief.codage === 'moyenne') {
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < M; i++) {
        const k = j * M + i;
        const gauche = i ? octets[k - 1] : 0;
        const dessus = j ? octets[k - M] : 0;
        octets[k] = (octets[k] + ((gauche + dessus) >> 1)) & 255;
      }
    }
  } else if (relief.codage) {
    throw new Error(`codage inconnu : ${relief.codage}`);
  }
  const metres = new Float32Array(M * M);
  for (let k = 0; k < M * M; k++) metres[k] = relief.altitudeMin + octets[k] * relief.pas;
  return { M, metres };
}

/** Moyenne de surface : chaque maille de sortie prend tout ce qu'elle couvre. */
function reduire(src, M, N) {
  const out = new Float32Array(N * N);
  const f = M / N;
  for (let j = 0; j < N; j++) {
    const j0 = Math.floor(j * f), j1 = Math.min(M, Math.max(j0 + 1, Math.ceil((j + 1) * f)));
    for (let i = 0; i < N; i++) {
      const i0 = Math.floor(i * f), i1 = Math.min(M, Math.max(i0 + 1, Math.ceil((i + 1) * f)));
      let s = 0, n = 0;
      for (let b = j0; b < j1; b++) for (let a = i0; a < i1; a++) { s += src[b * M + a]; n++; }
      out[j * N + i] = s / n;
    }
  }
  return out;
}

/** Un noyau 1-2-1 en croix, passé deux fois : doux, et sans direction. */
function lisser(h, N, passes) {
  let a = h;
  for (let p = 0; p < passes; p++) {
    const b = new Float32Array(N * N);
    const v = (i, j) => a[Math.min(N - 1, Math.max(0, j)) * N + Math.min(N - 1, Math.max(0, i))];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      b[j * N + i] = (4 * v(i, j) + 2 * (v(i - 1, j) + v(i + 1, j) + v(i, j - 1) + v(i, j + 1))
        + v(i - 1, j - 1) + v(i + 1, j - 1) + v(i - 1, j + 1) + v(i + 1, j + 1)) / 16;
    }
    a = b;
  }
  return a;
}

const relief = JSON.parse(await readFile(dans('carte', 'relief.json'), 'utf8'));
const { M, metres } = lireReleve(relief);
const reduit = lisser(reduire(metres, M, SORTIE), SORTIE, PASSES);

let min = Infinity, max = -Infinity;
for (const v of reduit) { if (v < min) min = v; if (v > max) max = v; }
const octets = new Uint8Array(SORTIE * SORTIE);
for (let k = 0; k < octets.length; k++) octets[k] = Math.round(((reduit[k] - min) / (max - min)) * 255);

/* Le même tour que pour la carte du relief : on ne garde que l'écart à la
   moyenne du voisin de gauche et de celui du dessus. Un relief est lisse,
   donc ces écarts sont petits, et le base64 fond d'un bon tiers. */
const code = new Uint8Array(octets.length);
for (let j = 0; j < SORTIE; j++) {
  for (let i = 0; i < SORTIE; i++) {
    const k = j * SORTIE + i;
    const gauche = i ? octets[k - 1] : 0;
    const dessus = j ? octets[k - SORTIE] : 0;
    code[k] = (octets[k] - ((gauche + dessus) >> 1)) & 255;
  }
}
const ligne = `const RELIEF={m:${SORTIE},o:${relief.zone.ouest},e:${relief.zone.est},s:${relief.zone.sud},n:${relief.zone.nord},`
  + `min:${min.toFixed(1)},max:${max.toFixed(1)},c:'moyenne',d:'${Buffer.from(code).toString('base64')}'};`;

const page = dans('arabica', 'index.html');
let html = await readFile(page, 'utf8');
const marque = /const RELIEF=\{[^\n]*\};/;
if (marque.test(html)) {
  html = html.replace(marque, ligne);
} else {
  const ancre = 'const GL3={ok:false};';
  if (!html.includes(ancre)) throw new Error('impossible de placer le relief : « const GL3 » introuvable');
  html = html.replace(ancre,
    '/* Relief du Yunnan — relevé réel, lissé, fabriqué par\n'
    + '   outils/relief-arabica.mjs depuis carte/relief.json. Une altitude par\n'
    + '   maille, de `min` à `max` mètres, du coin sud-ouest au coin nord-est.\n'
    + '   Donnée versionnée : ne pas la modifier à la main. */\n'
    + ligne + '\n' + ancre);
}
await writeFile(page, html);
const { gzipSync } = await import('node:zlib');
console.log(`  relief ${SORTIE}×${SORTIE}, ${min.toFixed(0)}–${max.toFixed(0)} m, `
  + `${Math.round(ligne.length / 1024)} Ko de base64, ${Math.round(gzipSync(Buffer.from(ligne)).length / 1024)} Ko compressés`);
