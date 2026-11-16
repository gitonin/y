/**
 * Le relevé du Yunnan, et ce qu'on en fait pour une page.
 *
 * `carte/relief.json` est un relevé fait une fois pour la carte du relief,
 * à partir des tuiles d'altitude terrarium, et versionné depuis. Deux
 * expériences s'en servent maintenant — l'atlas des variétés et l'arbre à
 * souhaits — et chacune le veut à sa finesse : l'atlas en fait le sol qu'on
 * survole, l'arbre à souhaits n'en fait qu'un horizon.
 *
 * Plutôt que deux copies du même décodage, les trois opérations communes
 * vivent ici : lire le relevé, le ramener à la finesse voulue, et le
 * réécrire en une ligne de page. Les outils qui s'en servent ne gardent que
 * ce qui leur est propre : la finesse, et où poser la ligne.
 *
 * Rien n'est demandé au réseau.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const dans = (...p) => path.join(racine, ...p);

/** Le relevé, décodé : une altitude en mètres par maille. */
export function lireReleve(relief) {
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
export function reduire(src, M, N) {
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

/** Un noyau 1-2-1 en croix, passé `passes` fois : doux, et sans direction. */
export function lisser(h, N, passes) {
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

/**
 * La ligne `const RELIEF={…};` telle qu'elle est posée dans une page.
 *
 * Le même tour que pour la carte du relief : on ne garde que l'écart à la
 * moyenne du voisin de gauche et de celui du dessus. Un relief est lisse,
 * donc ces écarts sont petits, et le base64 fond d'un bon tiers.
 */
export async function ligneRelief({ sortie, passes = 2, nom = 'RELIEF' }) {
  const relief = JSON.parse(await readFile(dans('carte', 'relief.json'), 'utf8'));
  const { M, metres } = lireReleve(relief);
  const reduit = lisser(reduire(metres, M, sortie), sortie, passes);

  let min = Infinity, max = -Infinity;
  for (const v of reduit) { if (v < min) min = v; if (v > max) max = v; }
  const octets = new Uint8Array(sortie * sortie);
  for (let k = 0; k < octets.length; k++) octets[k] = Math.round(((reduit[k] - min) / (max - min)) * 255);

  const code = new Uint8Array(octets.length);
  for (let j = 0; j < sortie; j++) {
    for (let i = 0; i < sortie; i++) {
      const k = j * sortie + i;
      const gauche = i ? octets[k - 1] : 0;
      const dessus = j ? octets[k - sortie] : 0;
      code[k] = (octets[k] - ((gauche + dessus) >> 1)) & 255;
    }
  }
  const ligne = `const ${nom}={m:${sortie},o:${relief.zone.ouest},e:${relief.zone.est},s:${relief.zone.sud},n:${relief.zone.nord},`
    + `min:${min.toFixed(1)},max:${max.toFixed(1)},c:'moyenne',d:'${Buffer.from(code).toString('base64')}'};`;
  return { ligne, min, max, sortie };
}

/** Ce qu'on affiche après avoir posé une ligne : sa taille, brute et compressée. */
export async function direTaille(ligne, min, max, sortie) {
  const { gzipSync } = await import('node:zlib');
  return `relief ${sortie}×${sortie}, ${min.toFixed(0)}–${max.toFixed(0)} m, `
    + `${Math.round(ligne.length / 1024)} Ko de base64, ${Math.round(gzipSync(Buffer.from(ligne)).length / 1024)} Ko compressés`;
}
