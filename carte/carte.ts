/**
 * La carte du relief de la ceinture caféière, côté navigateur.
 *
 * Le relief n'est pas envoyé en trois dimensions : la page reçoit une grille
 * de 192 × 192 octets — une altitude par maille, 17 Ko compressés — et
 * fabrique la surface ici. Envoyer un maillage déjà triangulé coûterait cent
 * fois plus pour le même résultat.
 *
 * Le dessin est celui d'une maquette de topographe : une surface presque
 * blanche, et des courbes de niveau. Les courbes ne sont pas de la géométrie —
 * ce serait des dizaines de milliers de segments à calculer et à tenir à jour.
 * Elles sont tracées par le nuanceur, à partir de l'altitude de chaque point :
 * là où l'altitude franchit un multiple de l'équidistance, le pixel s'assombrit.
 * Elles restent donc d'une finesse constante quel que soit le zoom, et changer
 * l'équidistance ne coûte rien.
 *
 * La couleur ne dit rien de l'altitude : ce sont les courbes et l'ombre qui la
 * disent. L'orange de la marque est libre pour une seule chose, désigner — les
 * trois fermes, et la bande où pousse le café.
 */
import {
  BufferAttribute,
  CatmullRomCurve3,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  ShaderMaterial,
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
  pas: number;
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

/* Les teintes, reprises de carte.css. Les deux listes doivent rester
   identiques — la construction échoue sinon. */
const PAPIER = '#efebe2';
const SURFACE = '#fbfaf7';
const OMBRE = '#cfc9bd';
const TRAIT = '#212121';
const ACCENT = '#b95f2c';

/** Équidistance des courbes, en mètres, et la courbe maîtresse tous les N. */
const EQUIDISTANCE = 250;
const MAITRESSE = 4;
/** La bande où pousse le café, en mètres. */
const CEINTURE: [number, number] = [1000, 1900];

const COTE = 100;
/* Le relief réel serait invisible : 2 800 m sur 480 km de large, c'est une
   feuille de papier. L'exagération est assumée, et la page le dit. */
const HAUTEUR = 11;
const SOCLE = -2.6;

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
  const { zone, mailles: M, pas, altitudeMin, altitudeMax } = relief;
  const latMoyenne = ((zone.sud + zone.nord) / 2) * (Math.PI / 180);
  /* Un degré de longitude se raccourcit avec la latitude : sans ce cosinus la
     carte serait étirée d'un bon dixième en largeur. */
  const largeurKm = (zone.est - zone.ouest) * 111.32 * Math.cos(latMoyenne);
  const profondeurKm = (zone.nord - zone.sud) * 110.57;
  const echelle = COTE / Math.max(largeurKm, profondeurKm);
  const L = largeurKm * echelle;
  const P = profondeurKm * echelle;

  const octets = Uint8Array.from(atob(relief.niveaux), (c) => c.charCodeAt(0));
  const metres = (i: number, j: number) => altitudeMin + octets[j * M + i] * pas;
  const etendue = Math.max(1, altitudeMax - altitudeMin);
  const hauteurDe = (m: number) => ((m - altitudeMin) / etendue) * HAUTEUR;

  /* ---------------------------------------------------------------- *
   * La surface : une nappe régulière, lissée
   * ---------------------------------------------------------------- */
  const sommets = M * M;
  const positions = new Float32Array(sommets * 3);
  const normales = new Float32Array(sommets * 3);
  const altitudes = new Float32Array(sommets);

  const xDe = (i: number) => -L / 2 + (i / (M - 1)) * L;
  const zDe = (j: number) => -P / 2 + (j / (M - 1)) * P;
  const dx = L / (M - 1);
  const dz = P / (M - 1);

  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      const k = j * M + i;
      const m = metres(i, j);
      positions[k * 3] = xDe(i);
      positions[k * 3 + 1] = hauteurDe(m);
      positions[k * 3 + 2] = zDe(j);
      altitudes[k] = m;
    }
  }

  /* Les normales se déduisent des voisins : pour une nappe, c'est exact et
     bien plus rapide que de les recalculer face par face. */
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < M; i++) {
      const k = j * M + i;
      const hG = hauteurDe(metres(Math.max(0, i - 1), j));
      const hD = hauteurDe(metres(Math.min(M - 1, i + 1), j));
      const hN = hauteurDe(metres(i, Math.max(0, j - 1)));
      const hS = hauteurDe(metres(i, Math.min(M - 1, j + 1)));
      const nx = (hG - hD) / (2 * dx);
      const nz = (hN - hS) / (2 * dz);
      const n = Math.hypot(nx, 1, nz);
      normales[k * 3] = nx / n;
      normales[k * 3 + 1] = 1 / n;
      normales[k * 3 + 2] = nz / n;
    }
  }

  const indices = new Uint32Array((M - 1) * (M - 1) * 6);
  let t = 0;
  for (let j = 0; j < M - 1; j++) {
    for (let i = 0; i < M - 1; i++) {
      const a = j * M + i, b = a + 1, c = a + M, d = c + 1;
      indices[t++] = a; indices[t++] = c; indices[t++] = b;
      indices[t++] = b; indices[t++] = c; indices[t++] = d;
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('normal', new BufferAttribute(normales, 3));
  geo.setAttribute('altitude', new BufferAttribute(altitudes, 1));
  geo.setIndex(new BufferAttribute(indices, 1));
  geo.computeBoundingSphere();

  /* ---------------------------------------------------------------- *
   * Le nuanceur : l'ombre dit la pente, les courbes disent l'altitude
   * ---------------------------------------------------------------- */
  const matiere = new ShaderMaterial({
    uniforms: {
      uSurface: { value: new Color(SURFACE) },
      uOmbre: { value: new Color(OMBRE) },
      uTrait: { value: new Color(TRAIT) },
      uAccent: { value: new Color(ACCENT) },
      uLumiere: { value: new Vector3(-0.42, 0.86, 0.3).normalize() },
      uEquidistance: { value: EQUIDISTANCE },
      uMaitresse: { value: MAITRESSE },
      uCeinture: { value: new Vector2(CEINTURE[0], CEINTURE[1]) },
      uPapier: { value: new Color(PAPIER) },
      /* La brume : le relief lointain se fond dans le papier. Sans elle, le
         survol est plat — tout est à la même netteté, et l'œil ne sait plus
         ce qui est loin. Elle sert aussi la vue d'ensemble, dont le fond
         s'allège. */
      uBrume: { value: new Vector2(45, 230) },
    },
    vertexShader: /* glsl */ `
      attribute float altitude;
      varying float vAlt;
      varying vec3 vN;
      varying float vDistance;
      void main() {
        vAlt = altitude;
        vN = normalize(normalMatrix * normal);
        vec4 vue = modelViewMatrix * vec4(position, 1.0);
        vDistance = -vue.z;
        gl_Position = projectionMatrix * vue;
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform vec3 uSurface;
      uniform vec3 uOmbre;
      uniform vec3 uTrait;
      uniform vec3 uAccent;
      uniform vec3 uLumiere;
      uniform float uEquidistance;
      uniform float uMaitresse;
      uniform vec2 uCeinture;
      uniform vec3 uPapier;
      uniform vec2 uBrume;
      varying float vAlt;
      varying vec3 vN;
      varying float vDistance;

      /* Une courbe de niveau est un trait là où l'altitude franchit un
         multiple de l'équidistance. En divisant la distance à ce multiple par
         sa dérivée à l'écran (fwidth), on obtient une épaisseur constante en
         pixels : la courbe reste fine de loin comme de près, et ne scintille
         pas. C'est ce qu'un trait fait de géométrie ne sait pas faire. */
      float courbe(float f, float epaisseur) {
        float distance = 0.5 - abs(fract(f) - 0.5);
        float largeur = fwidth(f) * epaisseur;
        return 1.0 - smoothstep(0.0, max(largeur, 1e-5), distance);
      }

      /* Un trait à une altitude donnée, de la même épaisseur constante. */
      float trait(float altitude, float cible, float epaisseur) {
        float largeur = fwidth(altitude) * epaisseur;
        return 1.0 - smoothstep(0.0, max(largeur, 1e-5), abs(altitude - cible));
      }

      void main() {
        float jour = max(dot(normalize(vN), normalize(uLumiere)), 0.0);
        vec3 fond = mix(uOmbre, uSurface, 0.30 + 0.70 * jour);

        /* Traits fins et clairs : la carte se lit au relief, les courbes ne
           font que le chiffrer. Épaisses, elles grisaient toute la surface. */
        float f = vAlt / uEquidistance;
        float fine = courbe(f, 0.8);
        float forte = courbe(f / uMaitresse, 0.95);
        float encre = max(fine * 0.20, forte * 0.38);
        vec3 couleur = mix(fond, uTrait, encre);

        /* La bande où pousse le café est bornée par deux courbes appuyées.
           Essayé d'abord en aplat : entre 1 000 et 1 900 m, c'est la moitié du
           terrain, et teinter la moitié d'une carte n'annote rien, cela la
           colore. Essayé ensuite en orange : les deux altitudes sont franchies
           partout, et l'orange se répandait sur tout le relief au lieu de
           désigner. Il ne reste donc à la couleur de la marque qu'un seul
           emploi, les trois fermes — et les bornes sont les traits les plus
           noirs de la carte. */
        float bornes = max(trait(vAlt, uCeinture.x, 1.1), trait(vAlt, uCeinture.y, 1.1));
        couleur = mix(couleur, uTrait, bornes * 0.55);

        float loin = smoothstep(uBrume.x, uBrume.y, vDistance);
        couleur = mix(couleur, uPapier, loin * 0.78);

        gl_FragColor = vec4(couleur, 1.0);
      }
    `,
  });

  const scene = new Scene();
  const terrain = new Mesh(geo, matiere);
  scene.add(terrain);

  /* ---------------------------------------------------------------- *
   * Le socle : la carte est un objet posé, pas une nappe flottante
   * ---------------------------------------------------------------- */
  const jupe: number[] = [];
  const bord = (i: number, j: number) => [xDe(i), hauteurDe(metres(i, j)), zDe(j)] as const;
  const mur = (a: readonly number[], b: readonly number[], inverse: boolean) => {
    const p1 = [a[0], a[1], a[2]], p2 = [b[0], b[1], b[2]];
    const b1 = [a[0], SOCLE, a[2]], b2 = [b[0], SOCLE, b[2]];
    const suite = inverse ? [b1, b2, p2, b1, p2, p1] : [b2, b1, p1, b2, p1, p2];
    for (const v of suite) jupe.push(v[0], v[1], v[2]);
  };
  for (let i = 0; i < M - 1; i++) {
    mur(bord(i, 0), bord(i + 1, 0), true);
    mur(bord(i, M - 1), bord(i + 1, M - 1), false);
  }
  for (let j = 0; j < M - 1; j++) {
    mur(bord(0, j), bord(0, j + 1), false);
    mur(bord(M - 1, j), bord(M - 1, j + 1), true);
  }
  const geoJupe = new BufferGeometry();
  geoJupe.setAttribute('position', new BufferAttribute(new Float32Array(jupe), 3));
  geoJupe.computeVertexNormals();
  const flanc = new Mesh(
    geoJupe,
    /* Les flancs restent nus : des courbes de niveau sur une paroi verticale
       ne voudraient rien dire. */
    new MeshBasicMaterial({ color: new Color(OMBRE), side: DoubleSide, fog: false }),
  );
  scene.add(flanc);

  /* ---------------------------------------------------------------- *
   * La caméra
   * ---------------------------------------------------------------- */
  const camera = new PerspectiveCamera(38, 1, 0.5, 2000);
  const CIBLE = new Vector3(0, HAUTEUR * 0.3, 0);
  const coins: Vector3[] = [];
  for (const x of [-L / 2, L / 2])
    for (const y of [SOCLE, HAUTEUR])
      for (const z of [-P / 2, P / 2]) coins.push(new Vector3(x, y, z));

  const direction = new Vector3(
    Math.sin(Math.PI * 0.24) * Math.cos(0.72),
    Math.sin(0.72),
    Math.cos(Math.PI * 0.24) * Math.cos(0.72),
  ).normalize();

  /* Le recul n'est pas réglé au jugé : on projette les huit coins du terrain
     et l'on recule jusqu'à ce qu'ils tiennent. Au-delà de 1, les angles du
     socle sortent du cadre — et c'est voulu : vue de biais, la plaque se
     présente en losange, et la caler entièrement laissait l'écran aux trois
     quarts vide. */
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
      d *= debord / 1.16;
    }
    return d;
  };
  const recul = cadrer();

  const controles = new OrbitControls(camera, rendu.domElement);
  controles.enableDamping = true;
  controles.dampingFactor = 0.075;
  controles.target.copy(CIBLE);
  controles.minDistance = COTE * 0.25;
  controles.maxDistance = recul * 2.4;
  /* On ne passe pas sous le relief, et on ne le regarde pas pile du dessus :
     à la verticale, l'ombre disparaît et la carte redevient plate. */
  controles.minPolarAngle = 0.2;
  controles.maxPolarAngle = 1.38;
  controles.enablePan = false;
  controles.update();

  /* ---------------------------------------------------------------- *
   * Les fermes
   * ---------------------------------------------------------------- */
  const repères = new Group();
  scene.add(repères);
  const matAccent = new MeshBasicMaterial({ color: new Color(ACCENT) });
  const matTige = new MeshBasicMaterial({ color: new Color(TRAIT) });
  const matInvisible = new MeshBasicMaterial({ visible: false });
  const geoBille = new SphereGeometry(1.05, 24, 18);
  const geoCible = new SphereGeometry(3.4, 8, 6);

  const posés = relief.fermes
    .filter((f) => fermes[f.cle])
    .map((f) => {
      const x = xDe(f.i);
      const z = zDe(f.j);
      const y = hauteurDe(metres(f.i, f.j));
      const h = HAUTEUR * 0.3;

      const tige = new Mesh(new CylinderGeometry(0.07, 0.07, h, 8), matTige);
      tige.position.set(x, y + h / 2, z);
      repères.add(tige);

      /* L'orange de la marque ne sert qu'à désigner : il n'est nulle part
         ailleurs sur le relief, donc une bille se voit partout. */
      const bille = new Mesh(geoBille, matAccent);
      bille.position.set(x, y + h, z);
      repères.add(bille);

      const cible = new Mesh(geoCible, matInvisible);
      cible.position.copy(bille.position);
      cible.userData.ferme = f;
      repères.add(cible);

      return { f, bille };
    });

  /* ---------------------------------------------------------------- *
   * La fiche
   * ---------------------------------------------------------------- */
  const fiche = racine.querySelector<HTMLElement>('[data-fiche]');
  const champ = (s: string) => racine.querySelector<HTMLElement>(s);

  const cacherFiche = () => {
    if (fiche) fiche.hidden = true;
    for (const { bille } of posés) bille.scale.setScalar(1);
  };

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
    for (const { f, bille } of posés) bille.scale.setScalar(f.cle === cle ? 1.4 : 1);
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
    const touché = rayon.intersectObjects(repères.children, false).find((h) => h.object.userData.ferme);
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
  const poser = (s: string, texte: string) => {
    const el = racine.querySelector<HTMLElement>(s);
    if (el) el.textContent = texte;
  };
  poser('[data-equidistance]', (T.equidistance ?? '').replace('{n}', String(EQUIDISTANCE)));
  poser('[data-ceinture]', (T.ceinture ?? '')
    .replace('{bas}', CEINTURE[0].toLocaleString('fr-FR'))
    .replace('{haut}', CEINTURE[1].toLocaleString('fr-FR')));
  poser('[data-fermes]', T.fermes ?? '');

  /* ---------------------------------------------------------------- *
   * Le survol
   * ---------------------------------------------------------------- *
   * Une caméra qui descend au ras du relief et suit une boucle passant par
   * les trois fermes. Ce n'est pas un mouvement décoratif : le trajet est
   * celui du café, et c'est en rasant les crêtes qu'on comprend ce qu'une
   * vue de dessus ne montre pas — que ces fermes sont dans la montagne.
   */

  /** Altitude du terrain en un point quelconque, entre les mailles. */
  const hauteurEn = (x: number, z: number) => {
    const fi = ((x + L / 2) / L) * (M - 1);
    const fj = ((z + P / 2) / P) * (M - 1);
    const i = Math.max(0, Math.min(M - 2, Math.floor(fi)));
    const j = Math.max(0, Math.min(M - 2, Math.floor(fj)));
    const ti = Math.min(1, Math.max(0, fi - i));
    const tj = Math.min(1, Math.max(0, fj - j));
    const h00 = hauteurDe(metres(i, j));
    const h10 = hauteurDe(metres(i + 1, j));
    const h01 = hauteurDe(metres(i, j + 1));
    const h11 = hauteurDe(metres(i + 1, j + 1));
    return (h00 * (1 - ti) + h10 * ti) * (1 - tj) + (h01 * (1 - ti) + h11 * ti) * tj;
  };

  /* Le trajet : les trois fermes, rangées autour de leur centre, et entre
     chacune un point poussé vers l'extérieur — sans lui, la boucle serait un
     triangle à angles vifs, et la caméra pivoterait sèchement aux sommets. */
  const points = relief.fermes.map((f) => new Vector3(xDe(f.i), 0, zDe(f.j)));
  const centre = points
    .reduce((a, p) => a.add(p), new Vector3())
    .multiplyScalar(1 / Math.max(1, points.length));
  points.sort(
    (a, b) =>
      Math.atan2(a.z - centre.z, a.x - centre.x) - Math.atan2(b.z - centre.z, b.x - centre.x),
  );
  const jalons: Vector3[] = [];
  for (let k = 0; k < points.length; k++) {
    const a = points[k];
    const b = points[(k + 1) % points.length];
    jalons.push(a.clone());
    const milieu = a.clone().add(b).multiplyScalar(0.5);
    jalons.push(milieu.add(milieu.clone().sub(centre).multiplyScalar(0.38)));
  }
  const trajet = new CatmullRomCurve3(jalons, true, 'catmullrom', 0.5);

  /** Garde au-dessus du relief, en unités de la carte. */
  const GARDE = 5.5;
  /** Un tour complet, en secondes. Lent : on voyage, on ne survole pas. */
  const TOUR = 150;

  /* La hauteur ne suit pas le sol sous la caméra mais le plus haut des
     prochains points du trajet : sans cette anticipation, la caméra entre
     dans la crête qu'elle est en train d'aborder. */
  const hauteurVol = (t: number) => {
    let h = -Infinity;
    /* Fenêtre large : on prend le plus haut d'un dixième du trajet devant
       soi. Étroite, la caméra épousait chaque bosse et se retrouvait au
       niveau des crêtes voisines — on rasait une pente sans jamais voir le
       paysage. Large, elle passe au-dessus du massif qu'elle aborde et le
       regard porte. */
    for (let k = 0; k <= 12; k++) {
      const p = trajet.getPointAt((t + k * 0.008) % 1);
      h = Math.max(h, hauteurEn(p.x, p.z));
    }
    return h + GARDE;
  };

  let enVol = false;
  let avancee = 0;
  const regard = new Vector3();
  const bouton = racine.querySelector<HTMLButtonElement>('[data-survol]');

  const majBouton = () => {
    if (!bouton) return;
    bouton.textContent = enVol ? T.arreter ?? '' : T.survoler ?? '';
    bouton.setAttribute('aria-pressed', String(enVol));
  };

  const demarrerVol = () => {
    if (enVol) return;
    enVol = true;
    controles.enabled = false;
    /* On reprend le trajet au point le plus proche de là où l'on regarde :
       le vol commence sous nos yeux, pas à l'autre bout de la carte. */
    let meilleure = Infinity;
    for (let k = 0; k < 200; k++) {
      const t = k / 200;
      const p = trajet.getPointAt(t);
      const d = p.distanceToSquared(controles.target);
      if (d < meilleure) { meilleure = d; avancee = t; }
    }
    regard.copy(trajet.getPointAt((avancee + 0.035) % 1));
    majBouton();
  };

  const arreterVol = () => {
    if (!enVol) return;
    enVol = false;
    /* On rend la main à la souris en gardant ce que l'on regardait, sinon la
       carte saute. */
    controles.target.copy(regard);
    controles.enabled = true;
    controles.update();
    majBouton();
  };

  bouton?.addEventListener('click', () => (enVol ? arreterVol() : demarrerVol()));
  for (const ev of ['pointerdown', 'wheel'] as const) {
    toile.addEventListener(ev, () => arreterVol(), { passive: true });
  }
  majBouton();

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
       cadrage, mais seulement alors — sinon le clavier d'un téléphone, qui
       redimensionne la fenêtre, remettrait la carte dans sa position
       d'ouverture au milieu d'un geste. */
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

  const sobre = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let tourne = !sobre;
  const stop = () => { tourne = false; };
  for (const ev of ['pointerdown', 'wheel', 'keydown'] as const) {
    toile.addEventListener(ev, stop, { once: true, passive: true });
  }

  let dernier = performance.now();
  const boucle = () => {
    const maintenant = performance.now();
    /* Le temps écoulé, borné : revenir sur un onglet laissé de côté ferait
       sinon bondir la caméra de plusieurs minutes de trajet. */
    const dt = Math.min(0.05, (maintenant - dernier) / 1000);
    dernier = maintenant;

    if (enVol) {
      avancee = (avancee + dt / TOUR) % 1;
      const p = trajet.getPointAt(avancee);
      const cible = new Vector3(p.x, hauteurVol(avancee), p.z);
      /* Tout est amorti : la caméra rejoint sa cible au lieu de s'y poser, et
         le relief défile sans à-coups même là où le sol remonte vite. */
      camera.position.lerp(cible, 1 - Math.exp(-dt * 1.6));
      /* On regarde loin devant : de près, la caméra fixait la pente qu'elle
         longeait et l'on ne voyait plus le paysage. */
      const devant = trajet.getPointAt((avancee + 0.05) % 1);
      regard.lerp(
        new Vector3(devant.x, hauteurEn(devant.x, devant.z) + GARDE * 0.3, devant.z),
        1 - Math.exp(-dt * 1.2),
      );
      camera.lookAt(regard);
    } else {
      if (tourne) {
        const a = dt * 0.07;
        const { x, z } = camera.position;
        camera.position.x = x * Math.cos(a) - z * Math.sin(a);
        camera.position.z = x * Math.sin(a) + z * Math.cos(a);
      }
      controles.update();
    }
    rendu.render(scene, camera);
    requestAnimationFrame(boucle);
  };
  boucle();

  racine.dataset.prete = '1';
  racine.dataset.triangles = String((M - 1) * (M - 1) * 2 + jupe.length / 9);
  racine.dataset.papier = PAPIER;
}

lancerCarte();
