/**
 * La carte du relief de la ceinture caféière, côté navigateur.
 *
 * Le relief n'est pas envoyé en trois dimensions : la page reçoit une grille
 * de 192 × 192 entiers — un palier d'altitude par maille, un octet chacun,
 * 17 Ko compressés — et fabrique la géométrie ici. Envoyer un maillage déjà
 * triangulé coûterait cent fois plus pour le même résultat.
 *
 * La forme en terrasses n'est pas un effet : c'est le dessin demandé, des
 * couches empilées par tranche de 150 m. Elle est aussi la plus simple à
 * fabriquer — un dessus horizontal par maille, et un mur vertical partout où
 * la maille voisine est plus basse. Aucun tracé de courbe de niveau, aucune
 * triangulation de polygone à trous.
 *
 * L'altitude se lit sur une seule teinte qui s'assombrit (voir carte.css). Le
 * relief des terrasses vient de la lumière, pas d'une couleur par palier : les
 * dessus prennent le jour, les murs restent dans l'ombre. La couleur dit donc
 * l'altitude et rien d'autre, ce qui est la seule façon de la lire dans
 * l'ordre.
 */
import {
  AmbientLight,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  CylinderGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Relief {
  zone: { ouest: number; est: number; sud: number; nord: number };
  mailles: number;
  palier: number;
  paliersMax: number;
  altitudeMin: number;
  altitudeMax: number;
  niveaux: string;
  fermes: { cle: string; i: number; j: number; altitudeRelevee: number; altitudeAnnoncee: [number, number] }[];
}

interface Ferme {
  nom: string;
  lieu: string;
  altitude: string;
  texte: string;
  cafes: string[];
}

type Textes = Record<string, string>;

/* La rampe d'altitude, reprise de carte.css : une seule teinte, clarté
   décroissante, validée. Les deux listes doivent rester identiques. */
const RAMPE = ['#c2a191', '#ca7549', '#b15824', '#953e00', '#752800', '#402719'];

/* Le plus grand côté de la carte vaut cent unités ; tout le reste en découle. */
const COTE = 100;
/* Hauteur du plus haut palier, en unités. Le relief réel serait invisible à
   cette échelle — 3 000 m sur 480 km de large, c'est une feuille de papier.
   L'exagération est assumée, et la légende donne les mètres.
   Le réglage se juge sur un rapport : la hauteur d'une marche contre la
   largeur d'une maille. Au-delà de un, la carte se hérisse d'aiguilles ; vers
   0,7, elle s'étage en terrasses, ce qui est le dessin voulu. */
const HAUTEUR = 5.5;
/* Le socle : la carte est un objet posé, pas une nappe flottante. */
const SOCLE = -1.1;
/* La ceinture caféière, en mètres. Annotée sur la légende, jamais colorée à
   part : ce serait rompre la rampe. */
const CEINTURE: [number, number] = [1000, 1900];

const lire = <T,>(selecteur: string): T | null => {
  const el = document.querySelector<HTMLElement>(selecteur);
  return el?.textContent ? (JSON.parse(el.textContent) as T) : null;
};

export function lancerCarte(): void {
  const racine = document.querySelector<HTMLElement>('[data-carte]');
  if (!racine) return;
  const toile = racine.querySelector<HTMLCanvasElement>('[data-toile]');
  const relief = lire<Relief>('[data-carte-relief]');
  const fermes = lire<Record<string, Ferme>>('[data-carte-fermes]');
  const T = lire<Textes>('[data-carte-textes]') ?? {};
  if (!toile || !relief || !fermes) return;

  const panne = (raison: string) => {
    const el = racine.querySelector<HTMLElement>('[data-panne]');
    if (el) el.hidden = false;
    toile.hidden = true;
    racine.querySelector<HTMLElement>('[data-legende]')?.setAttribute('hidden', '');
    console.warn('carte :', raison);
  };

  let rendu: WebGLRenderer;
  try {
    rendu = new WebGLRenderer({ canvas: toile, antialias: true, alpha: true });
  } catch (e) {
    panne(String(e));
    return;
  }
  rendu.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  /* ---------------------------------------------------------------- *
   * Les proportions réelles du terrain
   * ---------------------------------------------------------------- */
  const { zone, mailles: M, palier, paliersMax } = relief;
  const latMoyenne = ((zone.sud + zone.nord) / 2) * (Math.PI / 180);
  /* Un degré de longitude se raccourcit avec la latitude : sans ce cosinus la
     carte serait étirée d'un bon dixième en largeur. */
  const largeurKm = (zone.est - zone.ouest) * 111.32 * Math.cos(latMoyenne);
  const profondeurKm = (zone.nord - zone.sud) * 110.57;
  const echelle = COTE / Math.max(largeurKm, profondeurKm);
  const L = largeurKm * echelle;
  const P = profondeurKm * echelle;
  const cw = L / M;
  const cp = P / M;
  const hauteurDe = (niveau: number) => (niveau / paliersMax) * HAUTEUR;

  const niveaux = Uint8Array.from(atob(relief.niveaux), (c) => c.charCodeAt(0));
  const niveau = (i: number, j: number) => niveaux[j * M + i];

  /* ---------------------------------------------------------------- *
   * La couleur d'un palier
   * ---------------------------------------------------------------- */
  const teintes = RAMPE.map((h) => new Color(h));
  /* La teinte se prend sur l'altitude réelle rapportée aux altitudes de la
     zone, et non sur le rang du palier dans un barème qui part de zéro. Sans
     cela, un terrain qui va de 500 à 3 300 m n'occupe que le milieu de la
     rampe : tout sort de la même couleur, et la carte cesse de se lire.
     C'est aussi ce que montre la légende, qui est graduée en mètres. */
  const etendue = Math.max(1, relief.altitudeMax - relief.altitudeMin);
  const couleurDe = (niveauMaille: number) => {
    const t = Math.min(1, Math.max(0, (niveauMaille * palier - relief.altitudeMin) / etendue));
    const x = t * (teintes.length - 1);
    const k = Math.min(teintes.length - 2, Math.floor(x));
    return teintes[k].clone().lerp(teintes[k + 1], x - k);
  };
  const palette = Array.from({ length: paliersMax + 1 }, (_, n) => couleurDe(n));

  /* ---------------------------------------------------------------- *
   * La géométrie : un dessus par maille, un mur à chaque dénivelé
   * ---------------------------------------------------------------- */
  /* On compte avant d'allouer : 192 × 192 mailles donnent de l'ordre de
     150 000 triangles, et laisser grandir des tableaux ordinaires coûterait
     plus cher que ce deuxième passage. */
  let quads = 0;
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      quads++; // le dessus
      const n = niveau(i, j);
      if (i + 1 >= M || niveau(i + 1, j) < n) quads++;
      if (i - 1 < 0 || niveau(i - 1, j) < n) quads++;
      if (j + 1 >= M || niveau(i, j + 1) < n) quads++;
      if (j - 1 < 0 || niveau(i, j - 1) < n) quads++;
    }
  }

  const sommets = quads * 6;
  const positions = new Float32Array(sommets * 3);
  /* Les normales sont toutes sur un axe : des entiers signés suffisent, et
     l'attribut pèse le quart d'un Float32. Idem pour les couleurs. */
  const normales = new Int8Array(sommets * 3);
  const couleurs = new Uint8Array(sommets * 3);
  let p = 0;

  const poser = (
    a: Vector3, b: Vector3, c: Vector3, d: Vector3,
    nx: number, ny: number, nz: number,
    teinte: Color,
  ) => {
    const r = Math.round(teinte.r * 255), g = Math.round(teinte.g * 255), bl = Math.round(teinte.b * 255);
    for (const v of [a, b, c, a, c, d]) {
      positions[p * 3] = v.x; positions[p * 3 + 1] = v.y; positions[p * 3 + 2] = v.z;
      normales[p * 3] = nx * 127; normales[p * 3 + 1] = ny * 127; normales[p * 3 + 2] = nz * 127;
      couleurs[p * 3] = r; couleurs[p * 3 + 1] = g; couleurs[p * 3 + 2] = bl;
      p++;
    }
  };

  const V = (x: number, y: number, z: number) => new Vector3(x, y, z);

  for (let j = 0; j < M; j++) {
    const z0 = -P / 2 + j * cp;
    const z1 = z0 + cp;
    for (let i = 0; i < M; i++) {
      const x0 = -L / 2 + i * cw;
      const x1 = x0 + cw;
      const n = niveau(i, j);
      const y = hauteurDe(n);
      const teinte = palette[n];

      /* Le dessus, horizontal : c'est lui qui prend la lumière, donc lui qui
         porte la lecture de l'altitude. */
      poser(V(x0, y, z1), V(x1, y, z1), V(x1, y, z0), V(x0, y, z0), 0, 1, 0, teinte);

      /* Les quatre murs. Au bord de la carte, le mur descend jusqu'au socle :
         un relief qu'on voit par-dessous n'est pas un objet. */
      const voisin = (vi: number, vj: number) =>
        vi < 0 || vj < 0 || vi >= M || vj >= M ? null : niveau(vi, vj);

      const vE = voisin(i + 1, j);
      if (vE === null || vE < n) {
        const yb = vE === null ? SOCLE : hauteurDe(vE);
        poser(V(x1, yb, z1), V(x1, yb, z0), V(x1, y, z0), V(x1, y, z1), 1, 0, 0, teinte);
      }
      const vO = voisin(i - 1, j);
      if (vO === null || vO < n) {
        const yb = vO === null ? SOCLE : hauteurDe(vO);
        poser(V(x0, yb, z0), V(x0, yb, z1), V(x0, y, z1), V(x0, y, z0), -1, 0, 0, teinte);
      }
      const vS = voisin(i, j + 1);
      if (vS === null || vS < n) {
        const yb = vS === null ? SOCLE : hauteurDe(vS);
        poser(V(x0, yb, z1), V(x1, yb, z1), V(x1, y, z1), V(x0, y, z1), 0, 0, 1, teinte);
      }
      const vN = voisin(i, j - 1);
      if (vN === null || vN < n) {
        const yb = vN === null ? SOCLE : hauteurDe(vN);
        poser(V(x1, yb, z0), V(x0, yb, z0), V(x0, y, z0), V(x1, y, z0), 0, 0, -1, teinte);
      }
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('normal', new BufferAttribute(normales, 3, true));
  geo.setAttribute('color', new BufferAttribute(couleurs, 3, true));
  geo.computeBoundingSphere();

  /* ---------------------------------------------------------------- *
   * La scène
   * ---------------------------------------------------------------- */
  const scene = new Scene();
  const terrain = new Mesh(geo, new MeshLambertMaterial({ vertexColors: true }));
  scene.add(terrain);

  /* Le jour vient du sud-ouest et de haut : les dessus s'éclairent, les murs
     restent dans l'ombre, et chaque terrasse se détache de la suivante. */
  const jour = new DirectionalLight(0xfff6ea, 2.1);
  jour.position.set(-0.45, 1, 0.55);
  scene.add(jour);
  scene.add(new AmbientLight(0xefebe2, 1.25));

  const camera = new PerspectiveCamera(40, 1, 0.5, 2000);

  /* Le recul n'est pas réglé au jugé : on projette les huit coins du terrain
     et l'on recule jusqu'à ce qu'ils tiennent dans le cadre.
     Les approximations essayées avant — la diagonale, puis la diagonale
     corrigée du rapport de la fenêtre — débordaient en paysage ou laissaient
     la moitié de l'écran vide en portrait, parce qu'une plaque vue de biais
     occupe bien moins que sa diagonale. Trois tours suffisent à converger. */
  const CIBLE = new Vector3(0, HAUTEUR * 0.35, 0);
  const coins: Vector3[] = [];
  for (const x of [-L / 2, L / 2])
    for (const y of [SOCLE, HAUTEUR])
      for (const z of [-P / 2, P / 2]) coins.push(new Vector3(x, y, z));

  const AZIMUT = Math.PI * 0.26;
  const ELEVATION = 0.82;
  const direction = new Vector3(
    Math.sin(AZIMUT) * Math.cos(ELEVATION),
    Math.sin(ELEVATION),
    Math.cos(AZIMUT) * Math.cos(ELEVATION),
  ).normalize();

  const cadrer = () => {
    let d = Math.hypot(L, P);
    for (let tour = 0; tour < 3; tour++) {
      camera.position.copy(direction).multiplyScalar(d).add(CIBLE);
      camera.lookAt(CIBLE);
      camera.updateMatrixWorld(true);
      camera.updateProjectionMatrix();
      let debord = 0;
      for (const c of coins) {
        const v = c.clone().project(camera);
        debord = Math.max(debord, Math.abs(v.x), Math.abs(v.y));
      }
      /* Au-delà de 1, les coins de la plaque sortent du cadre — et c'est
         voulu. Vue de biais, elle se présente en losange : la caler
         entièrement dans la fenêtre laissait les quatre coins de l'écran
         vides et le relief au tiers de la place, mesuré à 22 % des pixels.
         Ce qui déborde ici, ce sont les angles du socle, la seule part qui
         n'apprend rien. */
      d *= debord / 1.16;
    }
    return d;
  };
  const recul = cadrer();

  const controles = new OrbitControls(camera, rendu.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.075;
  controles.target.copy(CIBLE);
  controles.minDistance = COTE * 0.28;
  controles.maxDistance = recul * 2.4;
  /* On ne passe pas sous le relief, et on ne le regarde pas pile du dessus :
     à la verticale, les terrasses disparaissent et la carte redevient plate. */
  controles.minPolarAngle = 0.22;
  controles.maxPolarAngle = 1.36;
  controles.enablePan = false;
  controles.update();

  /* ---------------------------------------------------------------- *
   * Les fermes
   * ---------------------------------------------------------------- */
  /* Les repères ne peuvent pas porter l'orange de la marque : c'est la teinte
     de la rampe d'altitude, et une bille orange posée sur un relief orange
     disparaît — deux des trois fermes étaient invisibles. Une couleur qui
     désigne ne doit pas être une couleur qui mesure. Le blanc de la charte,
     absent de la rampe, est resté libre pour cet usage. */
  const billeCouleur = new Color('#fbfaf7');
  const encre = new Color('#212121');
  const repères = new Group();
  scene.add(repères);

  const matBille = new MeshBasicMaterial({ color: billeCouleur });
  /* Le liseré : une sphère à peine plus grande dont on ne dessine que les
     faces arrière. Dessinée normalement, elle recouvrait entièrement la bille
     — les repères devenaient trois points noirs. En n'en gardant que
     l'intérieur, il n'en reste qu'un cerne, et la bille blanche ressort sur
     une terrasse claire comme sur une sombre. */
  const matCercle = new MeshBasicMaterial({ color: encre, side: BackSide });
  const matTige = new MeshBasicMaterial({ color: encre });
  const geoBille = new SphereGeometry(1.25, 22, 16);
  const geoCible = new SphereGeometry(3.2, 8, 6);
  const matInvisible = new MeshBasicMaterial({ visible: false });

  const posés = relief.fermes
    .filter((f) => fermes[f.cle])
    .map((f) => {
      const x = -L / 2 + (f.i + 0.5) * cw;
      const z = -P / 2 + (f.j + 0.5) * cp;
      const yTerrain = hauteurDe(niveau(f.i, f.j));
      /* La tige sort nettement du relief : posée dessus, la bille se confond
         avec une terrasse dès qu'on incline la carte. */
      const h = HAUTEUR * 0.62;

      const tige = new Mesh(new CylinderGeometry(0.14, 0.14, h, 8), matTige);
      tige.position.set(x, yTerrain + h / 2, z);
      repères.add(tige);

      const bille = new Mesh(geoBille, matBille);
      bille.position.set(x, yTerrain + h, z);
      repères.add(bille);

      const liseré = new Mesh(new SphereGeometry(1.45, 22, 16), matCercle);
      liseré.position.copy(bille.position);
      liseré.renderOrder = -1;
      repères.add(liseré);

      /* Une bille de moins d'un millimètre à l'écran ne s'attrape pas au
         doigt : la cible du pointage est bien plus large qu'elle, et
         invisible. */
      const cible = new Mesh(geoCible, matInvisible);
      cible.position.copy(bille.position);
      cible.userData.ferme = f;
      repères.add(cible);

      return { f, cible, bille };
    });

  /* ---------------------------------------------------------------- *
   * La fiche
   * ---------------------------------------------------------------- */
  const fiche = racine.querySelector<HTMLElement>('[data-fiche]');
  const champ = (s: string) => racine.querySelector<HTMLElement>(s);

  const montrerFiche = (cle: string, altitudeRelevee: number) => {
    const d = fermes[cle];
    if (!d || !fiche) return;
    const mettre = (s: string, v: string) => { const el = champ(s); if (el) el.textContent = v; };
    mettre('[data-fiche-lieu]', d.lieu);
    mettre('[data-fiche-nom]', d.nom);
    mettre('[data-fiche-alt]', d.altitude);
    mettre('[data-fiche-texte]', d.texte);
    const liste = champ('[data-fiche-cafes]');
    if (liste) {
      liste.textContent = '';
      for (const nom of d.cafes) {
        const li = document.createElement('li');
        li.textContent = nom;
        liste.appendChild(li);
      }
      const note = document.createElement('li');
      note.className = 'muted';
      /* On ne laisse pas croire à une précision qu'on n'a pas : le site donne
         la préfecture et l'altitude, jamais les coordonnées de la parcelle. */
      note.textContent = (T.approche ?? '').replace('{alt}', String(altitudeRelevee));
      liste.appendChild(note);
    }
    fiche.hidden = false;
    /* La ferme choisie grossit un peu : sans ce retour, on ne sait pas laquelle
       des trois billes a répondu au doigt. */
    for (const { f, bille } of posés) {
      const g = f.cle === cle ? 1.45 : 1;
      bille.scale.setScalar(g);
    }
  };

  const cacherFiche = () => {
    if (fiche) fiche.hidden = true;
    for (const { bille } of posés) bille.scale.setScalar(1);
  };
  champ('[data-fermer]')?.addEventListener('click', cacherFiche);

  /* ---------------------------------------------------------------- *
   * Le pointage : distinguer un tap d'une rotation
   * ---------------------------------------------------------------- */
  const rayon = new Raycaster();
  const souris = new Vector2();
  let départ: { x: number; y: number; t: number } | null = null;

  toile.addEventListener('pointerdown', (e) => {
    départ = { x: e.clientX, y: e.clientY, t: performance.now() };
  });

  toile.addEventListener('pointerup', (e) => {
    if (!départ) return;
    const bougé = Math.hypot(e.clientX - départ.x, e.clientY - départ.y);
    const durée = performance.now() - départ.t;
    départ = null;
    /* Au-delà de douze pixels ou d'une demi-seconde, l'intention était de
       tourner la carte, pas de désigner un point. */
    if (bougé > 12 || durée > 600) return;

    const r = toile.getBoundingClientRect();
    souris.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    souris.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    rayon.setFromCamera(souris, camera);
    const touché = rayon.intersectObjects(repères.children, false)
      .find((h) => h.object.userData.ferme);
    if (touché) {
      const f = touché.object.userData.ferme as Relief['fermes'][number];
      montrerFiche(f.cle, f.altitudeRelevee);
    } else {
      cacherFiche();
    }
  });

  /* ---------------------------------------------------------------- *
   * La légende
   * ---------------------------------------------------------------- */
  const crans = racine.querySelector<HTMLElement>('[data-crans]');
  if (crans) {
    const { altitudeMin: bas, altitudeMax: haut } = relief;
    const part = (m: number) => ((m - bas) / (haut - bas)) * 100;
    crans.textContent = '';
    for (let m = 500; m <= haut; m += 500) {
      if (part(m) < 2 || part(m) > 98) continue;
      const el = document.createElement('span');
      el.className = 'carte__cran';
      el.style.bottom = `${part(m)}%`;
      el.textContent = `${m.toLocaleString('fr-FR')} m`;
      crans.appendChild(el);
    }
    const [cb, ch] = CEINTURE;
    const barre = document.createElement('span');
    barre.className = 'carte__ceinture';
    barre.style.bottom = `${part(cb)}%`;
    barre.style.height = `${part(ch) - part(cb)}%`;
    crans.appendChild(barre);
    const texte = document.createElement('span');
    texte.className = 'carte__ceinture-texte';
    texte.style.bottom = `${(part(cb) + part(ch)) / 2}%`;
    texte.style.left = '5.4rem';
    texte.textContent = T.ceinture ?? '';
    crans.appendChild(texte);
  }

  /* ---------------------------------------------------------------- *
   * La boucle
   * ---------------------------------------------------------------- */
  let cadre = { w: 0, h: 0 };
  const redimensionner = () => {
    const { clientWidth: w, clientHeight: h } = racine;
    rendu.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
    /* Passer du paysage au portrait change l'axe qui contraint : on refait le
       cadrage, mais seulement si l'orientation a changé — sinon le clavier
       d'un téléphone, qui redimensionne la fenêtre, remettrait la carte dans
       sa position d'ouverture au milieu d'un geste. */
    const avant = cadre.w >= cadre.h;
    const apres = w >= h;
    if (cadre.w === 0 || avant !== apres) {
      cadrer();
      controles.update();
    }
    cadre = { w, h };
  };
  redimensionner();
  window.addEventListener('resize', redimensionner);

  /* Une lente rotation d'ouverture : elle dit que la carte se manipule, et
     s'arrête au premier geste. Pas de mouvement si l'on en a demandé moins. */
  const sobre = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tourne = !sobre;
  const stop = () => { tourne = false; };
  for (const ev of ['pointerdown', 'wheel', 'keydown'] as const) {
    toile.addEventListener(ev, stop, { once: true, passive: true });
  }

  const boucle = () => {
    if (tourne) {
      const a = 0.0012;
      const { x, z } = camera.position;
      camera.position.x = x * Math.cos(a) - z * Math.sin(a);
      camera.position.z = x * Math.sin(a) + z * Math.cos(a);
    }
    controles.update();
    rendu.render(scene, camera);
    requestAnimationFrame(boucle);
  };
  boucle();

  racine.dataset.prete = '1';
  racine.dataset.triangles = String(quads * 2);
}

lancerCarte();
